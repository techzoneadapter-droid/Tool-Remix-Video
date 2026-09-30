import type { ProviderConfigReader } from "@/providers/Provider";

export const providerEnvKeys = {
  gemini: "VITE_GEMINI_API_KEY",
  openAI: "VITE_OPENAI_API_KEY",
  anthropic: "VITE_ANTHROPIC_API_KEY",
  openRouter: "VITE_OPENROUTER_API_KEY",
  deepgram: "VITE_DEEPGRAM_API_KEY",
  elevenLabs: "VITE_ELEVENLABS_API_KEY",
  googleVeo: "VITE_GOOGLE_VEO_API_KEY",
  kling: "VITE_KLING_API_KEY",
  runway: "VITE_RUNWAY_API_KEY",
  flux: "VITE_FLUX_API_KEY",
  replicate: "VITE_REPLICATE_API_KEY",
  fal: "VITE_FAL_API_KEY"
} as const;

export type ProviderId = keyof typeof providerEnvKeys;

export class EnvironmentProviderConfig implements ProviderConfigReader {
  has(key: string): boolean {
    return Boolean(import.meta.env[key]?.trim());
  }
}

export function getProviderEnvKey(providerId: ProviderId) {
  return providerEnvKeys[providerId];
}
