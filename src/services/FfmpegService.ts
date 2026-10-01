import { tauriDatabaseClient } from "@/database/TauriDatabaseClient";
import type { ExportOptions, FfmpegHealth } from "@/types/Export";

export class FfmpegService {
  async health(): Promise<FfmpegHealth> {
    try {
      return await tauriDatabaseClient.execute<FfmpegHealth>("check_ffmpeg_health");
    } catch {
      return {
        available: false,
        message: "FFmpeg health is available only in the desktop runtime."
      };
    }
  }

  async export(options: ExportOptions): Promise<string> {
    return tauriDatabaseClient.execute<string>("run_ffmpeg_export", {
      options: {
        inputPath: options.inputPath,
        outputPath: options.outputPath,
        format: options.format,
        codec: options.codec,
        resolution: options.resolution,
        aspectRatio: options.aspectRatio,
        quality: options.quality,
        voicePath: options.voicePath,
        subtitleContent: options.subtitleContent,
        preserveOriginalAudio: options.preserveOriginalAudio ?? false
      }
    });
  }
}

export const ffmpegService = new FfmpegService();
