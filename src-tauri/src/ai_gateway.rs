use std::{fs, path::Path, time::{SystemTime, UNIX_EPOCH}};

use reqwest::{multipart, Client, Url};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

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

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SpeechTranscriptionPayload {
    media_path: String,
    language: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VoiceGenerationPayload {
    text: String,
    voice_id: String,
    language: String,
    style: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SubtitleGenerationPayload {
    transcript: SpeechTranscriptPayload,
    target_language: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SpeechTranscriptPayload {
    transcript: String,
    language: String,
    confidence: f64,
    segments: Vec<SpeechSegment>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct SpeechSegment {
    start: f64,
    end: f64,
    text: String,
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
        "transcribe" => transcribe(&app, &request.provider_id, request.payload).await,
        "generate-subtitle" => generate_subtitle(request.payload),
        "generate-voice" => generate_voice(&app, &request.provider_id, request.payload).await,
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
    let client = http_client()?;

    match provider_id {
        "openAI" => generate_openai_text(&client, &api_key, payload).await,
        "gemini" => generate_gemini_text(&client, &api_key, payload).await,
        _ => Err(format!(
            "Text generation adapter for provider '{provider_id}' is not connected yet."
        )),
    }
}

async fn transcribe(app: &AppHandle, provider_id: &str, payload: Value) -> Result<Value, String> {
    let payload: SpeechTranscriptionPayload =
        serde_json::from_value(payload).map_err(|error| format!("Invalid transcription payload: {error}"))?;

    let media_path = Path::new(payload.media_path.trim());
    if payload.media_path.trim().is_empty() || !media_path.is_file() {
        return Err("A valid local media path is required for transcription.".to_string());
    }

    let api_key = read_ai_secret(app, provider_id)?;
    let client = http_client()?;

    match provider_id {
        "openAI" => transcribe_openai(&client, &api_key, payload).await,
        "deepgram" => transcribe_deepgram(&client, &api_key, payload).await,
        _ => Err(format!(
            "Speech transcription adapter for provider '{provider_id}' is not connected yet."
        )),
    }
}

fn generate_subtitle(payload: Value) -> Result<Value, String> {
    let payload: SubtitleGenerationPayload =
        serde_json::from_value(payload).map_err(|error| format!("Invalid subtitle payload: {error}"))?;
    let _target_language = payload.target_language;
    let _source_language = payload.transcript.language;
    let _confidence = payload.transcript.confidence;

    let mut segments = payload.transcript.segments;
    if segments.is_empty() && !payload.transcript.transcript.trim().is_empty() {
        segments.push(SpeechSegment {
            start: 0.0,
            end: 4.0,
            text: payload.transcript.transcript,
        });
    }

    let content = segments
        .iter()
        .enumerate()
        .map(|(index, segment)| {
            let start = segment.start.max(0.0);
            let end = if segment.end > start { segment.end } else { start + 4.0 };
            format!(
                "{}\n{} --> {}\n{}\n",
                index + 1,
                srt_timestamp(start),
                srt_timestamp(end),
                segment.text.trim()
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    Ok(json!({
        "format": "srt",
        "content": content
    }))
}

async fn generate_voice(app: &AppHandle, provider_id: &str, payload: Value) -> Result<Value, String> {
    let payload: VoiceGenerationPayload =
        serde_json::from_value(payload).map_err(|error| format!("Invalid voice payload: {error}"))?;

    if payload.text.trim().is_empty() {
        return Err("Voice text cannot be empty.".to_string());
    }

    let api_key = read_ai_secret(app, provider_id)?;
    let client = http_client()?;

    match provider_id {
        "openAI" => generate_openai_voice(app, &client, &api_key, payload).await,
        "elevenLabs" => generate_elevenlabs_voice(app, &client, &api_key, payload).await,
        _ => Err(format!(
            "Voice generation adapter for provider '{provider_id}' is not connected yet."
        )),
    }
}

fn http_client() -> Result<Client, String> {
    Client::builder()
        .user_agent("RemixAI-Pro/1.0")
        .build()
        .map_err(|error| error.to_string())
}

async fn generate_openai_text(
    client: &Client,
    api_key: &str,
    payload: TextGenerationPayload,
) -> Result<Value, String> {
    let model = payload.model.unwrap_or_else(|| "gpt-5.6-luna".to_string());

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
    let model = payload.model.unwrap_or_else(|| "gemini-3.8-flash".to_string());

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

async fn transcribe_openai(
    client: &Client,
    api_key: &str,
    payload: SpeechTranscriptionPayload,
) -> Result<Value, String> {
    let bytes = fs::read(&payload.media_path)
        .map_err(|error| format!("Unable to read media for OpenAI transcription: {error}"))?;
    let file_name = Path::new(&payload.media_path)
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("media.mp4")
        .to_string();
    let mime = media_mime(&payload.media_path);
    let part = multipart::Part::bytes(bytes)
        .file_name(file_name)
        .mime_str(mime)
        .map_err(|error| error.to_string())?;

    let mut form = multipart::Form::new()
        .part("file", part)
        .text("model", "gpt-4o-transcribe")
        .text("response_format", "json");

    if let Some(language) = payload.language.as_deref().filter(|value| *value != "auto") {
        form = form.text("language", language.to_string());
    }

    let response = client
        .post("https://api.openai.com/v1/audio/transcriptions")
        .bearer_auth(api_key)
        .multipart(form)
        .send()
        .await
        .map_err(|error| format!("OpenAI transcription failed: {error}"))?;

    let status = response.status();
    let raw = response.text().await.map_err(|error| error.to_string())?;
    if !status.is_success() {
        return Err(format!(
            "OpenAI transcription returned HTTP {}: {}",
            status.as_u16(),
            compact_error(&raw)
        ));
    }

    let value: Value = serde_json::from_str(&raw)
        .map_err(|error| format!("OpenAI transcription returned invalid JSON: {error}"))?;
    let transcript = value
        .get("text")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .trim()
        .to_string();
    let language = payload.language.unwrap_or_else(|| "auto".to_string());

    Ok(json!({
        "transcript": transcript,
        "language": language,
        "confidence": 1.0,
        "segments": if transcript.is_empty() {
            Vec::<SpeechSegment>::new()
        } else {
            vec![SpeechSegment { start: 0.0, end: 0.0, text: transcript }]
        }
    }))
}

async fn transcribe_deepgram(
    client: &Client,
    api_key: &str,
    payload: SpeechTranscriptionPayload,
) -> Result<Value, String> {
    let bytes = fs::read(&payload.media_path)
        .map_err(|error| format!("Unable to read media for Deepgram transcription: {error}"))?;

    let mut url = Url::parse("https://api.deepgram.com/v1/listen")
        .map_err(|error| error.to_string())?;
    {
        let mut query = url.query_pairs_mut();
        query.append_pair("model", "nova-3");
        query.append_pair("smart_format", "true");
        query.append_pair("punctuate", "true");
        query.append_pair("utterances", "true");
        match payload.language.as_deref() {
            Some(language) if language != "auto" => {
                query.append_pair("language", language);
            }
            _ => {
                query.append_pair("detect_language", "true");
            }
        }
    }

    let response = client
        .post(url)
        .header("Authorization", format!("Token {api_key}"))
        .header("Content-Type", media_mime(&payload.media_path))
        .body(bytes)
        .send()
        .await
        .map_err(|error| format!("Deepgram transcription failed: {error}"))?;

    let status = response.status();
    let raw = response.text().await.map_err(|error| error.to_string())?;
    if !status.is_success() {
        return Err(format!(
            "Deepgram returned HTTP {}: {}",
            status.as_u16(),
            compact_error(&raw)
        ));
    }

    let value: Value =
        serde_json::from_str(&raw).map_err(|error| format!("Deepgram returned invalid JSON: {error}"))?;
    let alternative = value
        .pointer("/results/channels/0/alternatives/0")
        .ok_or_else(|| "Deepgram response did not contain a transcription alternative.".to_string())?;
    let transcript = alternative
        .get("transcript")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string();
    let confidence = alternative
        .get("confidence")
        .and_then(Value::as_f64)
        .unwrap_or(0.0);
    let segments = extract_deepgram_segments(&value, alternative);
    let detected_language = value
        .pointer("/results/channels/0/detected_language")
        .and_then(Value::as_str)
        .or_else(|| value.pointer("/metadata/detected_language").and_then(Value::as_str))
        .map(str::to_string)
        .unwrap_or_else(|| payload.language.unwrap_or_else(|| "auto".to_string()));

    Ok(json!({
        "transcript": transcript,
        "language": detected_language,
        "confidence": confidence,
        "segments": segments
    }))
}

fn extract_deepgram_segments(value: &Value, alternative: &Value) -> Vec<SpeechSegment> {
    if let Some(utterances) = value.pointer("/results/utterances").and_then(Value::as_array) {
        let segments = utterances
            .iter()
            .filter_map(|utterance| {
                let text = utterance.get("transcript")?.as_str()?.trim().to_string();
                if text.is_empty() {
                    return None;
                }
                Some(SpeechSegment {
                    start: utterance.get("start").and_then(Value::as_f64).unwrap_or(0.0),
                    end: utterance.get("end").and_then(Value::as_f64).unwrap_or(0.0),
                    text,
                })
            })
            .collect::<Vec<_>>();
        if !segments.is_empty() {
            return segments;
        }
    }

    alternative
        .get("words")
        .and_then(Value::as_array)
        .map(|words| {
            words
                .chunks(8)
                .filter_map(|chunk| {
                    let first = chunk.first()?;
                    let last = chunk.last()?;
                    let text = chunk
                        .iter()
                        .filter_map(|word| {
                            word.get("punctuated_word")
                                .and_then(Value::as_str)
                                .or_else(|| word.get("word").and_then(Value::as_str))
                        })
                        .collect::<Vec<_>>()
                        .join(" ");
                    if text.trim().is_empty() {
                        return None;
                    }
                    Some(SpeechSegment {
                        start: first.get("start").and_then(Value::as_f64).unwrap_or(0.0),
                        end: last.get("end").and_then(Value::as_f64).unwrap_or(0.0),
                        text,
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}

async fn generate_openai_voice(
    app: &AppHandle,
    client: &Client,
    api_key: &str,
    payload: VoiceGenerationPayload,
) -> Result<Value, String> {
    let voice = openai_voice_value(&payload.voice_id);
    let mut body = json!({
        "model": "gpt-4o-mini-tts",
        "input": payload.text,
        "voice": voice,
        "response_format": "mp3"
    });

    let instruction = payload
        .style
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| format!("Speak naturally in language {}.", payload.language));
    body["instructions"] = Value::String(instruction);

    let response = client
        .post("https://api.openai.com/v1/audio/speech")
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("OpenAI voice generation failed: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        let raw = response.text().await.map_err(|error| error.to_string())?;
        return Err(format!(
            "OpenAI voice returned HTTP {}: {}",
            status.as_u16(),
            compact_error(&raw)
        ));
    }

    let bytes = response.bytes().await.map_err(|error| error.to_string())?;
    let path = generated_media_path(app, "voice-openai", "mp3")?;
    fs::write(&path, &bytes).map_err(|error| error.to_string())?;

    Ok(json!({
        "audioPath": path.to_string_lossy(),
        "durationSeconds": estimate_speech_duration(&payload.text)
    }))
}

async fn generate_elevenlabs_voice(
    app: &AppHandle,
    client: &Client,
    api_key: &str,
    payload: VoiceGenerationPayload,
) -> Result<Value, String> {
    let voice_id = payload.voice_id.trim();
    if voice_id.is_empty() || voice_id.contains(char::is_whitespace) {
        return Err("ElevenLabs requires a real voice ID from the provider voice list.".to_string());
    }

    let response = client
        .post(format!(
            "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"
        ))
        .header("xi-api-key", api_key)
        .json(&json!({
            "text": payload.text,
            "model_id": "eleven_multilingual_v2"
        }))
        .send()
        .await
        .map_err(|error| format!("ElevenLabs voice generation failed: {error}"))?;

    let status = response.status();
    if !status.is_success() {
        let raw = response.text().await.map_err(|error| error.to_string())?;
        return Err(format!(
            "ElevenLabs returned HTTP {}: {}",
            status.as_u16(),
            compact_error(&raw)
        ));
    }

    let bytes = response.bytes().await.map_err(|error| error.to_string())?;
    let path = generated_media_path(app, "voice-elevenlabs", "mp3")?;
    fs::write(&path, &bytes).map_err(|error| error.to_string())?;

    Ok(json!({
        "audioPath": path.to_string_lossy(),
        "durationSeconds": estimate_speech_duration(&payload.text)
    }))
}

fn openai_voice_value(requested: &str) -> Value {
    let normalized = requested.trim().to_ascii_lowercase();
    let built_in = [
        "alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer",
        "verse", "marin", "cedar",
    ];

    if built_in.contains(&normalized.as_str()) {
        Value::String(normalized)
    } else if requested.trim().starts_with("voice_") {
        json!({ "id": requested.trim() })
    } else {
        Value::String("marin".to_string())
    }
}

fn generated_media_path(app: &AppHandle, prefix: &str, extension: &str) -> Result<std::path::PathBuf, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("generated");
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    Ok(directory.join(format!("{prefix}-{timestamp}.{extension}")))
}

fn estimate_speech_duration(text: &str) -> f64 {
    let words = text.split_whitespace().count() as f64;
    (words / 2.5).max(0.5)
}

fn media_mime(path: &str) -> &'static str {
    match Path::new(path)
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
        .as_str()
    {
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "m4a" => "audio/mp4",
        "ogg" => "audio/ogg",
        "webm" => "audio/webm",
        "mov" => "video/quicktime",
        "mkv" => "video/x-matroska",
        "avi" => "video/x-msvideo",
        _ => "video/mp4",
    }
}

fn srt_timestamp(seconds: f64) -> String {
    let total_ms = (seconds.max(0.0) * 1000.0).round() as u64;
    let hours = total_ms / 3_600_000;
    let minutes = (total_ms % 3_600_000) / 60_000;
    let secs = (total_ms % 60_000) / 1_000;
    let millis = total_ms % 1_000;
    format!("{hours:02}:{minutes:02}:{secs:02},{millis:03}")
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
    use super::{extract_gemini_text, extract_openai_text, srt_timestamp};
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

    #[test]
    fn formats_srt_time() {
        assert_eq!(srt_timestamp(65.321), "00:01:05,321");
    }
}
