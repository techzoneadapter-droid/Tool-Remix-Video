import type { ToolRoute } from "@/types/Navigation";
import type { ProviderCapability } from "@/providers/Provider";

export type WorkflowJobStatus = "queued" | "running" | "paused" | "completed" | "cancelled" | "blocked";

export interface WorkflowStep {
  id: string;
  label: string;
  progressWeight: number;
  requiredCapabilities: ProviderCapability[];
}

export interface WorkflowLogEntry {
  time: string;
  message: string;
}

export interface WorkflowJob {
  id: string;
  route: ToolRoute;
  title: string;
  status: WorkflowJobStatus;
  progress: number;
  currentStep: string;
  createdAt: string;
  logs: WorkflowLogEntry[];
}
