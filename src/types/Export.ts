import type { ToolRoute } from "@/types/Navigation";

export type ExportJobStatus = "queued" | "running" | "paused" | "completed" | "cancelled" | "blocked" | "failed";

export interface FfmpegHealth {
  available: boolean;
  version?: string;
  message: string;
}

export interface ExportOptions {
  workflowRoute: ToolRoute;
  inputPath: string;
  outputPath: string;
  format: string;
  codec: "h264" | "h265" | "copy";
  resolution: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
  quality: "Cao" | "Trung bình" | "Nhẹ";
  voicePath?: string;
  subtitleContent?: string;
  preserveOriginalAudio?: boolean;
}

export interface ExportJob {
  id: string;
  options: ExportOptions;
  status: ExportJobStatus;
  progress: number;
  message: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  outputPath?: string;
}
