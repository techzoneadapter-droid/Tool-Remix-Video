use std::{fs, path::PathBuf, process::Command};

use serde::Serialize;
use tauri::{AppHandle, Manager};

const PROVIDERS: &[&str] = &[
    "gemini",
    "openAI",
    "anthropic",
    "openRouter",
    "deepgram",
    "elevenLabs",
    "googleVeo",
    "kling",
    "runway",
    "flux",
    "replicate",
    "fal",
];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiSecretStatus {
    pub provider_id: String,
    pub configured: bool,
    pub storage: String,
}

fn validate_provider(provider_id: &str) -> Result<(), String> {
    if PROVIDERS.contains(&provider_id) {
        Ok(())
    } else {
        Err(format!("Unsupported AI provider: {provider_id}"))
    }
}

fn secret_path(app: &AppHandle, provider_id: &str) -> Result<PathBuf, String> {
    validate_provider(provider_id)?;
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?
        .join("ai-secrets");
    fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    Ok(directory.join(format!("{provider_id}.dpapi")))
}

#[cfg(target_os = "windows")]
fn protect_secret(secret: &str) -> Result<String, String> {
    let script = r#"$bytes = [System.Text.Encoding]::UTF8.GetBytes($env:REMIXAI_SECRET);
$protected = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser);
[Console]::Out.Write([Convert]::ToBase64String($protected))"#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .env("REMIXAI_SECRET", secret)
        .output()
        .map_err(|error| format!("Unable to start Windows DPAPI helper: {error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let encrypted = String::from_utf8(output.stdout).map_err(|error| error.to_string())?;
    let encrypted = encrypted.trim().to_string();
    if encrypted.is_empty() {
        Err("Windows DPAPI returned an empty encrypted value.".to_string())
    } else {
        Ok(encrypted)
    }
}

#[cfg(target_os = "windows")]
fn unprotect_secret(encrypted: &str) -> Result<String, String> {
    let script = r#"$protected = [Convert]::FromBase64String($env:REMIXAI_BLOB);
$bytes = [System.Security.Cryptography.ProtectedData]::Unprotect($protected, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser);
[Console]::Out.Write([System.Text.Encoding]::UTF8.GetString($bytes))"#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .env("REMIXAI_BLOB", encrypted)
        .output()
        .map_err(|error| format!("Unable to start Windows DPAPI helper: {error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    String::from_utf8(output.stdout).map_err(|error| error.to_string())
}

#[cfg(not(target_os = "windows"))]
fn protect_secret(_secret: &str) -> Result<String, String> {
    Err("Native secure AI key storage is currently enabled for the Windows desktop build. Use environment variables for this platform.".to_string())
}

#[cfg(not(target_os = "windows"))]
fn unprotect_secret(_encrypted: &str) -> Result<String, String> {
    Err("Native secure AI key storage is currently enabled for the Windows desktop build. Use environment variables for this platform.".to_string())
}

pub(crate) fn read_ai_secret(app: &AppHandle, provider_id: &str) -> Result<String, String> {
    let path = secret_path(app, provider_id)?;
    let encrypted = fs::read_to_string(&path)
        .map_err(|_| format!("No native API key is stored for {provider_id}."))?;
    unprotect_secret(encrypted.trim())
}

#[tauri::command]
pub fn list_ai_secret_status(app: AppHandle, provider_ids: Vec<String>) -> Result<Vec<AiSecretStatus>, String> {
    provider_ids
        .into_iter()
        .map(|provider_id| {
            let path = secret_path(&app, &provider_id)?;
            Ok(AiSecretStatus {
                provider_id,
                configured: path.exists(),
                storage: "windows-dpapi".to_string(),
            })
        })
        .collect()
}

#[tauri::command]
pub fn save_ai_secret(app: AppHandle, provider_id: String, secret: String) -> Result<AiSecretStatus, String> {
    let secret = secret.trim();
    if secret.is_empty() {
        return Err("API key cannot be empty.".to_string());
    }

    let path = secret_path(&app, &provider_id)?;
    let encrypted = protect_secret(secret)?;
    fs::write(&path, encrypted).map_err(|error| error.to_string())?;

    Ok(AiSecretStatus {
        provider_id,
        configured: true,
        storage: "windows-dpapi".to_string(),
    })
}

#[tauri::command]
pub fn delete_ai_secret(app: AppHandle, provider_id: String) -> Result<AiSecretStatus, String> {
    let path = secret_path(&app, &provider_id)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }

    Ok(AiSecretStatus {
        provider_id,
        configured: false,
        storage: "windows-dpapi".to_string(),
    })
}
