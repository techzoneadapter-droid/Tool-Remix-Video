use std::process::Command;

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

    let mut args = vec!["-y".to_string(), "-i".to_string(), options.input_path.clone()];
    args.extend(codec_args(&options.codec, &options.quality));
    args.extend(video_filter_args(&options.resolution, &options.aspect_ratio));
    args.push(options.output_path.clone());

    let status = Command::new("ffmpeg")
        .args(args)
        .status()
        .map_err(|error| error.to_string())?;

    if status.success() {
        Ok(options.output_path)
    } else {
        Err(format!("FFmpeg export failed for {}.", options.format))
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
