import { invoke } from "@tauri-apps/api/core";
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

interface NativeAiSecretStatus {
  providerId: string;
  configured: boolean;
  storage: string;
}

export class EnvironmentProviderConfig implements ProviderConfigReader {
  private readonly nativeConfiguredKeys = new Set<string>();

  has(key: string): boolean {
    return Boolean(import.meta.env[key]?.trim()) || this.nativeConfiguredKeys.has(key);
  }

  async refresh(): Promise<void> {
    const providerIds = Object.keys(providerEnvKeys) as ProviderId[];
    try {
      const statuses = await invoke<NativeAiSecretStatus[]>("list_ai_secret_status", { providerIds });
      for (const providerId of providerIds) {
        const envKey = providerEnvKeys[providerId];
        const nativeReady = statuses.some((item) => item.providerId === providerId && item.configured);
        if (nativeReady) this.nativeConfiguredKeys.add(envKey);
        else this.nativeConfiguredKeys.delete(envKey);
      }
    } catch {
      // Browser/Vite preview has no native Tauri runtime. Environment variables remain usable for development.
    }
  }

  async save(providerId: ProviderId, secret: string): Promise<void> {
    await invoke("save_ai_secret", { providerId, secret });
    this.nativeConfiguredKeys.add(providerEnvKeys[providerId]);
  }

  async remove(providerId: ProviderId): Promise<void> {
    await invoke("delete_ai_secret", { providerId });
    this.nativeConfiguredKeys.delete(providerEnvKeys[providerId]);
  }
}

export const providerConfig = new EnvironmentProviderConfig();

export function getProviderEnvKey(providerId: ProviderId) {
  return providerEnvKeys[providerId];
}
