import type {
  ImageGenerationResult,
  ProviderCapability,
  SpeechTranscriptionResult,
  SubtitleGenerationResult,
  VideoGenerationResult,
  VoiceGenerationResult
} from "@/providers/Provider";
import type { ToolRoute } from "@/types/Navigation";

export type WorkflowJobStatus = "queued" | "running" | "paused" | "completed" | "cancelled" | "blocked" | "failed";

export interface WorkflowStep {
  id: string;
  label: string;
  progressWeight: number;
  requiredCapabilities: ProviderCapability[];
  optionalCapabilities?: ProviderCapability[];
}

export interface WorkflowLogEntry {
  time: string;
  message: string;
}

export interface WorkflowExecutionInput {
  mediaPath?: string;
  mediaName?: string;
  targetLanguage?: "en" | "zh" | "vi";
  voiceId?: string;
  voiceStyle?: string;
  idea?: string;
  visualStyle?: string;
  aspectRatio?: "16:9" | "9:16" | "1:1";
}

export interface WorkflowArtifacts {
  analysis?: string;
  script?: string;
  narration?: string;
  visualPrompt?: string;
  transcript?: SpeechTranscriptionResult;
  translatedTranscript?: SpeechTranscriptionResult;
  subtitles?: SubtitleGenerationResult;
  voice?: VoiceGenerationResult;
  images?: ImageGenerationResult;
  video?: VideoGenerationResult;
  notes?: string[];
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
  artifacts?: WorkflowArtifacts;
  error?: string;
}
