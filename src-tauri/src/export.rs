use std::{fs, path::Path, process::Command};

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FfmpegHealth {
    pub available: bool,
    pub version: Option<String>,
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FfmpegExportOptions {
    pub input_path: String,
    pub output_path: String,
    pub format: String,
    pub codec: String,
    pub resolution: String,
    pub aspect_ratio: String,
    pub quality: String,
    pub voice_path: Option<String>,
    pub subtitle_content: Option<String>,
    pub preserve_original_audio: Option<bool>,
}

#[tauri::command]
pub fn check_ffmpeg_health() -> FfmpegHealth {
    match Command::new("ffmpeg").arg("-version").output() {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let version = stdout.lines().next().map(|line| line.to_string());

            FfmpegHealth {
                available: true,
                version,
                message: "FFmpeg is available.".to_string(),
            }
        }
        Ok(output) => FfmpegHealth {
            available: false,
            version: None,
            message: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        },
        Err(error) => FfmpegHealth {
            available: false,
            version: None,
            message: format!("FFmpeg is unavailable: {error}"),
        },
    }
}

#[tauri::command]
pub fn run_ffmpeg_export(options: FfmpegExportOptions) -> Result<String, String> {
    if options.input_path.trim().is_empty() || options.output_path.trim().is_empty() {
        return Err("Input and output paths are required for export.".to_string());
    }
    if !Path::new(&options.input_path).is_file() {
        return Err(format!("Input video does not exist: {}", options.input_path));
    }
    if let Some(parent) = Path::new(&options.output_path).parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }
    }

    let voice_path = options
        .voice_path
        .as_deref()
        .filter(|path| !path.trim().is_empty() && Path::new(path).is_file());

    let subtitle_path = write_subtitle_sidecar(&options)?;
    let mut args = vec!["-y".to_string(), "-i".to_string(), options.input_path.clone()];
    if let Some(path) = voice_path {
        args.extend(["-i".to_string(), path.to_string()]);
    }

    if let Some(path) = subtitle_path.as_deref() {
        args.extend([
            "-vf".to_string(),
            format!(
                "{},subtitles='{}':charenc=UTF-8",
                base_video_filter(&options.resolution, &options.aspect_ratio),
                escape_filter_path(path)
            ),
        ]);
    } else {
        args.extend(video_filter_args(&options.resolution, &options.aspect_ratio));
    }

    if voice_path.is_some() {
        if options.preserve_original_audio.unwrap_or(false) {
            args.extend([
                "-filter_complex".to_string(),
                "[0:a][1:a]amix=inputs=2:duration=first:weights='0.28 1.0'[mix]".to_string(),
                "-map".to_string(),
                "0:v:0".to_string(),
                "-map".to_string(),
                "[mix]".to_string(),
            ]);
        } else {
            args.extend([
                "-map".to_string(),
                "0:v:0".to_string(),
                "-map".to_string(),
                "1:a:0".to_string(),
                "-shortest".to_string(),
            ]);
        }
    } else {
        args.extend([
            "-map".to_string(),
            "0:v:0".to_string(),
            "-map".to_string(),
            "0:a?".to_string(),
        ]);
    }

    args.extend(codec_args(&options.codec, &options.quality));
    args.push(options.output_path.clone());

    let output = Command::new("ffmpeg")
        .args(&args)
        .output()
        .map_err(|error| error.to_string())?;

    if let Some(path) = subtitle_path {
        let _ = fs::remove_file(path);
    }

    if output.status.success() {
        Ok(options.output_path)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let tail = stderr.lines().rev().take(12).collect::<Vec<_>>().into_iter().rev().collect::<Vec<_>>().join("\n");
        Err(format!("FFmpeg export failed for {}.\n{}", options.format, tail))
    }
}

fn codec_args(codec: &str, quality: &str) -> Vec<String> {
    if codec == "copy" {
        return vec!["-c".to_string(), "copy".to_string()];
    }

    let crf = match quality {
        "Cao" => "18",
        "Trung bình" => "23",
        "Nhẹ" => "28",
        _ => "23",
    };
    let encoder = match codec {
        "h265" => "libx265",
        _ => "libx264",
    };

    vec![
        "-c:v".to_string(),
        encoder.to_string(),
        "-preset".to_string(),
        "medium".to_string(),
        "-crf".to_string(),
        crf.to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-b:a".to_string(),
        "192k".to_string(),
    ]
}

fn video_filter_args(resolution: &str, aspect_ratio: &str) -> Vec<String> {
    let target = match (resolution, aspect_ratio) {
        (value, "9:16") if value.contains("1920") || value.contains("1080") => Some("1080:1920"),
        (value, "1:1") if value.contains("1920") || value.contains("1080") => Some("1080:1080"),
        (value, _) if value.contains("1280") || value.contains("720") => Some("1280:720"),
        (value, _) if value.contains("3840") || value.contains("4K") => Some("3840:2160"),
        (value, _) if value.contains("1920") || value.contains("1080") => Some("1920:1080"),
        _ => None,
    };

    match target {
        Some(size) => vec![
            "-vf".to_string(),
            format!("scale={size}:force_original_aspect_ratio=decrease,pad={size}:(ow-iw)/2:(oh-ih)/2"),
        ],
        None => Vec::new(),
    }
}


fn write_subtitle_sidecar(options: &FfmpegExportOptions) -> Result<Option<String>, String> {
    let Some(content) = options.subtitle_content.as_deref().filter(|value| !value.trim().is_empty()) else {
        return Ok(None);
    };
    let path = format!("{}.remixai.srt", options.output_path);
    fs::write(&path, content.as_bytes()).map_err(|error| error.to_string())?;
    Ok(Some(path))
}

fn escape_filter_path(path: &str) -> String {
    path.replace('\\', "/").replace(':', "\\:").replace('\'', "\\'")
}

fn base_video_filter(resolution: &str, aspect_ratio: &str) -> String {
    let target = match (resolution, aspect_ratio) {
        (value, "9:16") if value.contains("1920") || value.contains("1080") => "1080:1920",
        (value, "1:1") if value.contains("1920") || value.contains("1080") => "1080:1080",
        (value, _) if value.contains("1280") || value.contains("720") => "1280:720",
        (value, _) if value.contains("3840") || value.contains("4K") => "3840:2160",
        _ => "1920:1080",
    };
    format!("scale={target}:force_original_aspect_ratio=decrease,pad={target}:(ow-iw)/2:(oh-ih)/2")
}
