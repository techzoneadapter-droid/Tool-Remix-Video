import { ffmpegService, type FfmpegService } from "@/services/FfmpegService";
import type { ExportJob, ExportOptions } from "@/types/Export";

function timestamp() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export class ExportQueueService {
  constructor(private readonly ffmpeg: FfmpegService = ffmpegService) {}

  async createJob(options: ExportOptions): Promise<ExportJob> {
    const health = await this.ffmpeg.health();
    const missingPath = options.inputPath.trim().length === 0 || options.outputPath.trim().length === 0;

    return {
      id: `export-${Date.now()}`,
      options,
      status: health.available && !missingPath ? "queued" : "blocked",
      progress: 0,
      message: missingPath ? "Input and output paths are required for export." : health.available ? "Export queued." : health.message,
      createdAt: timestamp()
    };
  }

  start(job: ExportJob): ExportJob {
    if (job.status !== "queued" && job.status !== "paused") return job;
    return { ...job, status: "running", progress: Math.max(job.progress, 8), message: "Encoding video with FFmpeg.", startedAt: timestamp() };
  }

  markProgress(job: ExportJob, progress: number, message = "Encoding video."): ExportJob {
    if (job.status !== "running") return job;
    return { ...job, progress: Math.min(95, Math.max(job.progress, progress)), message };
  }

  complete(job: ExportJob, outputPath: string): ExportJob {
    return {
      ...job,
      status: "completed",
      progress: 100,
      message: "Export ready.",
      completedAt: timestamp(),
      outputPath
    };
  }

  fail(job: ExportJob, error: string): ExportJob {
    return {
      ...job,
      status: "failed",
      message: "Export failed.",
      completedAt: timestamp(),
      error
    };
  }

  pause(job: ExportJob): ExportJob {
    return job.status === "running" ? { ...job, status: "paused", message: "Export paused." } : job;
  }

  resume(job: ExportJob): ExportJob {
    return job.status === "paused" ? this.start(job) : job;
  }

  cancel(job: ExportJob): ExportJob {
    return job.status === "running" || job.status === "paused" || job.status === "queued"
      ? { ...job, status: "cancelled", message: "Export cancelled." }
      : job;
  }

  async run(job: ExportJob): Promise<ExportJob> {
    if (job.status !== "running") return job;

    try {
      const outputPath = await this.ffmpeg.export(job.options);
      return this.complete(job, outputPath);
    } catch (error) {
      return this.fail(job, error instanceof Error ? error.message : String(error));
    }
  }
}

export const exportQueueService = new ExportQueueService();
