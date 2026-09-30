import type { ProviderCapability } from "@/providers/Provider";
import type { ToolRoute } from "@/types/Navigation";

export type AiAutomationId =
  | "speech-to-text"
  | "translate-dub"
  | "smart-subtitle"
  | "voice-to-visual"
  | "idea-to-video"
  | "auto-remix-pipeline";

export interface AiAutomationDefinition {
  id: AiAutomationId;
  title: string;
  shortTitle: string;
  description: string;
  mode: ToolRoute;
  requiredCapabilities: ProviderCapability[];
  optionalCapabilities: ProviderCapability[];
  pipeline: string[];
}

export interface AiAutomationReadiness {
  definition: AiAutomationDefinition;
  ready: boolean;
  readyCapabilities: ProviderCapability[];
  missingCapabilities: ProviderCapability[];
  configuredProviders: string[];
}
