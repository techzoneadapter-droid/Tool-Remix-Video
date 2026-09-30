use serde::{Deserialize, Serialize};
use serde_json::Value;

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

#[tauri::command]
pub fn ai_gateway_health() -> AiGatewayHealth {
    AiGatewayHealth {
        status: "ready-for-adapter".to_string(),
        transport: "tauri-native".to_string(),
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
pub async fn ai_gateway_request(request: AiGatewayRequest) -> Result<Value, String> {
    let _payload = request.payload;

    Err(format!(
        "AI transport adapter for provider '{}' and operation '{}' is not connected yet. The native gateway is ready; attach the provider-specific HTTP adapter here.",
        request.provider_id, request.operation
    ))
}
