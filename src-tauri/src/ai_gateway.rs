use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::AppHandle;

use crate::secret_store::read_ai_secret;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiGatewayRequest {
    pub provider_id: String,
    pub operation: String,
    pub payload: Value,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiGatewayHealth {
    pub status: String,
    pub transport: String,
    pub supported_operations: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TextGenerationPayload {
    prompt: String,
    system_instruction: Option<String>,
    model: Option<String>,
}

#[tauri::command]
pub fn ai_gateway_health() -> AiGatewayHealth {
    AiGatewayHealth {
        status: "ready".to_string(),
        transport: "tauri-native-http".to_string(),
        supported_operations: vec![
            "generate-text".to_string(),
            "transcribe".to_string(),
            "generate-subtitle".to_string(),
            "generate-voice".to_string(),
            "generate-image".to_string(),
            "generate-video".to_string(),
        ],
    }
}

#[tauri::command]
pub async fn ai_gateway_request(app: AppHandle, request: AiGatewayRequest) -> Result<Value, String> {
    match request.operation.as_str() {
        "generate-text" => generate_text(&app, &request.provider_id, request.payload).await,
        _ => Err(format!(
            "Operation '{}' is registered but its native adapter is not connected yet for provider '{}'.",
            request.operation, request.provider_id
        )),
    }
}

async fn generate_text(app: &AppHandle, provider_id: &str, payload: Value) -> Result<Value, String> {
    let payload: TextGenerationPayload =
        serde_json::from_value(payload).map_err(|error| format!("Invalid text generation payload: {error}"))?;

    if payload.prompt.trim().is_empty() {
        return Err("Prompt cannot be empty.".to_string());
    }

    let api_key = read_ai_secret(app, provider_id)?;
    let client = Client::builder()
        .user_agent("RemixAI-Pro/1.0")
        .build()
        .map_err(|error| error.to_string())?;

    match provider_id {
        "openAI" => generate_openai_text(&client, &api_key, payload).await,
        "gemini" => generate_gemini_text(&client, &api_key, payload).await,
        _ => Err(format!(
            "Text generation adapter for provider '{provider_id}' is not connected yet."
        )),
    }
}

async fn generate_openai_text(
    client: &Client,
    api_key: &str,
    payload: TextGenerationPayload,
) -> Result<Value, String> {
    let model = payload
        .model
        .unwrap_or_else(|| "gpt-5.6-luna".to_string());

    let mut body = json!({
        "model": model,
        "input": payload.prompt,
        "store": false
    });

    if let Some(instruction) = payload.system_instruction.filter(|value| !value.trim().is_empty()) {
        body["instructions"] = Value::String(instruction);
    }

    let response = client
        .post("https://api.openai.com/v1/responses")
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("OpenAI request failed: {error}"))?;

    let status = response.status();
    let raw = response
        .text()
        .await
        .map_err(|error| format!("OpenAI response read failed: {error}"))?;

    if !status.is_success() {
        return Err(format!("OpenAI returned HTTP {}: {}", status.as_u16(), compact_error(&raw)));
    }

    let value: Value =
        serde_json::from_str(&raw).map_err(|error| format!("OpenAI returned invalid JSON: {error}"))?;
    let text = extract_openai_text(&value)
        .ok_or_else(|| "OpenAI response did not contain output text.".to_string())?;

    Ok(json!({
        "text": text,
        "model": value.get("model").and_then(Value::as_str).unwrap_or(&model)
    }))
}

async fn generate_gemini_text(
    client: &Client,
    api_key: &str,
    payload: TextGenerationPayload,
) -> Result<Value, String> {
    let model = payload
        .model
        .unwrap_or_else(|| "gemini-3.8-flash".to_string());

    let body = json!({
        "model": model,
        "input": payload.prompt,
        "system_instruction": payload.system_instruction
    });

    let response = client
        .post("https://generativelanguage.googleapis.com/v1beta/interactions")
        .header("x-goog-api-key", api_key)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("Gemini request failed: {error}"))?;

    let status = response.status();
    let raw = response
        .text()
        .await
        .map_err(|error| format!("Gemini response read failed: {error}"))?;

    if !status.is_success() {
        return Err(format!("Gemini returned HTTP {}: {}", status.as_u16(), compact_error(&raw)));
    }

    let value: Value =
        serde_json::from_str(&raw).map_err(|error| format!("Gemini returned invalid JSON: {error}"))?;
    let text = extract_gemini_text(&value)
        .ok_or_else(|| "Gemini interaction did not contain model output text.".to_string())?;

    Ok(json!({
        "text": text,
        "model": value.get("model").and_then(Value::as_str).unwrap_or(&model)
    }))
}

fn extract_openai_text(value: &Value) -> Option<String> {
    let parts = value
        .get("output")?
        .as_array()?
        .iter()
        .filter_map(|item| item.get("content").and_then(Value::as_array))
        .flat_map(|content| content.iter())
        .filter(|part| part.get("type").and_then(Value::as_str) == Some("output_text"))
        .filter_map(|part| part.get("text").and_then(Value::as_str))
        .collect::<Vec<_>>();

    if parts.is_empty() {
        None
    } else {
        Some(parts.join(""))
    }
}

fn extract_gemini_text(value: &Value) -> Option<String> {
    let parts = value
        .get("steps")?
        .as_array()?
        .iter()
        .filter(|step| step.get("type").and_then(Value::as_str) == Some("model_output"))
        .filter_map(|step| step.get("content").and_then(Value::as_array))
        .flat_map(|content| content.iter())
        .filter(|part| part.get("type").and_then(Value::as_str) == Some("text"))
        .filter_map(|part| part.get("text").and_then(Value::as_str))
        .collect::<Vec<_>>();

    if parts.is_empty() {
        None
    } else {
        Some(parts.join(""))
    }
}

fn compact_error(raw: &str) -> String {
    let sanitized = raw.replace('\r', " ").replace('\n', " ");
    if sanitized.chars().count() > 500 {
        sanitized.chars().take(500).collect::<String>() + "…"
    } else {
        sanitized
    }
}

#[cfg(test)]
mod tests {
    use super::{extract_gemini_text, extract_openai_text};
    use serde_json::json;

    #[test]
    fn extracts_openai_response_text() {
        let value = json!({
            "output": [{
                "type": "message",
                "content": [{"type": "output_text", "text": "hello"}]
            }]
        });
        assert_eq!(extract_openai_text(&value).as_deref(), Some("hello"));
    }

    #[test]
    fn extracts_gemini_interaction_text() {
        let value = json!({
            "steps": [{
                "type": "model_output",
                "content": [{"type": "text", "text": "xin chào"}]
            }]
        });
        assert_eq!(extract_gemini_text(&value).as_deref(), Some("xin chào"));
    }
}
