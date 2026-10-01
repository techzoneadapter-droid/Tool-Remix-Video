use std::{fs, path::PathBuf, process::Command};

use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeMediaSelection {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
}

fn build_selection(path: &str) -> Result<NativeMediaSelection, String> {
    let canonical = fs::canonicalize(path).map_err(|error| format!("Không thể đọc video đã chọn: {error}"))?;
    let metadata = fs::metadata(&canonical).map_err(|error| error.to_string())?;
    if !metadata.is_file() {
        return Err("Đường dẫn đã chọn không phải là tệp video.".to_string());
    }

    let name = canonical
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Tên tệp video không hợp lệ.".to_string())?
        .to_string();

    Ok(NativeMediaSelection {
        path: canonical.to_string_lossy().to_string(),
        name,
        size_bytes: metadata.len(),
    })
}

#[cfg(target_os = "windows")]
#[tauri::command]
pub fn pick_video_file() -> Result<Option<NativeMediaSelection>, String> {
    let script = r#"Add-Type -AssemblyName System.Windows.Forms;
$dialog = New-Object System.Windows.Forms.OpenFileDialog;
$dialog.Title = 'Chọn video nguồn';
$dialog.Filter = 'Video files|*.mp4;*.mov;*.mkv;*.avi;*.webm;*.m4v|All files|*.*';
$dialog.Multiselect = $false;
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($dialog.FileName)
}"#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-STA", "-Command", script])
        .output()
        .map_err(|error| format!("Không thể mở trình chọn video Windows: {error}"))?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
    }

    let path = String::from_utf8(output.stdout)
        .map_err(|error| error.to_string())?
        .trim()
        .to_string();

    if path.is_empty() {
        return Ok(None);
    }

    build_selection(&path).map(Some)
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
pub fn pick_video_file() -> Result<Option<NativeMediaSelection>, String> {
    Err("Trình chọn video native hiện được tối ưu cho bản Windows.".to_string())
}

#[tauri::command]
pub fn inspect_video_file(path: String) -> Result<NativeMediaSelection, String> {
    let normalized = PathBuf::from(path);
    build_selection(&normalized.to_string_lossy())
}
