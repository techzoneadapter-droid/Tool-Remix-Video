import { providerConfig, type ProviderId } from "@/config/providerConfig";
import { ConfiguredProvider } from "@/providers/ConfiguredProvider";
import { DeepgramProvider } from "@/providers/Deepgram/DeepgramProvider";
import { ElevenLabsProvider } from "@/providers/ElevenLabs/ElevenLabsProvider";
import { FluxProvider } from "@/providers/Flux/FluxProvider";
import { GeminiProvider } from "@/providers/Gemini/GeminiProvider";
import { GoogleVeoProvider } from "@/providers/GoogleVeo/GoogleVeoProvider";
import { LocalToolProvider } from "@/providers/LocalToolProvider";
import { OpenAIProvider } from "@/providers/OpenAI/OpenAIProvider";
import type { AiProvider, ProviderCapability, ProviderHealth } from "@/providers/Provider";

export class AiProviderRegistry {
  private readonly providers: AiProvider[];

  constructor(private readonly config = providerConfig) {
    const configReader = this.config;

    this.providers = [
      new GeminiProvider(configReader),
      new OpenAIProvider(configReader),
      new ConfiguredProvider("anthropic", "Anthropic Claude", ["llm"], configReader),
      new ConfiguredProvider("openRouter", "OpenRouter", ["llm"], configReader),
      new DeepgramProvider(configReader),
      new ElevenLabsProvider(configReader),
      new GoogleVeoProvider(configReader),
      new ConfiguredProvider("kling", "Kling", ["video"], configReader),
      new ConfiguredProvider("runway", "Runway", ["video"], configReader),
      new FluxProvider(configReader),
      new ConfiguredProvider("replicate", "Replicate", ["image", "video"], configReader),
      new ConfiguredProvider("fal", "fal.ai", ["image", "video"], configReader),
      new LocalToolProvider("pyscenedetect", "PySceneDetect", ["scene-detection"]),
      new LocalToolProvider("paddleocr", "PaddleOCR", ["ocr"]),
      new LocalToolProvider("yolo11", "YOLO11", ["object-detection"]),
      new LocalToolProvider("insightface", "InsightFace", ["face-analysis"])
    ];
  }

  list(): AiProvider[] { return this.providers; }
  health(): ProviderHealth[] { return this.providers.map((provider) => provider.getHealth()); }
  findByCapability(capability: ProviderCapability): AiProvider[] { return this.providers.filter((provider) => provider.capabilities.includes(capability)); }
  configuredByCapability(capability: ProviderCapability): AiProvider[] { return this.findByCapability(capability).filter((provider) => provider.getHealth().configured); }
  runnableByCapability(capability: ProviderCapability): AiProvider[] {
    return this.configuredByCapability(capability).filter((provider) => this.canExecute(provider, capability));
  }

  async refreshConfig(): Promise<void> { await this.config.refresh(); }
  async saveProviderSecret(providerId: ProviderId, secret: string): Promise<void> { await this.config.save(providerId, secret); }
  async removeProviderSecret(providerId: ProviderId): Promise<void> { await this.config.remove(providerId); }

  firstConfigured(capability: ProviderCapability, preferredIds: string[] = []): AiProvider | undefined {
    const configured = this.configuredByCapability(capability);
    const preferred = preferredIds.map((id) => configured.find((provider) => provider.id === id)).find((provider): provider is AiProvider => Boolean(provider));
    return preferred ?? configured[0];
  }

  firstRunnable(capability: ProviderCapability, preferredIds: string[] = []): AiProvider | undefined {
    const runnable = this.runnableByCapability(capability);
    const preferred = preferredIds.map((id) => runnable.find((provider) => provider.id === id)).find((provider): provider is AiProvider => Boolean(provider));
    return preferred ?? runnable[0];
  }

  private canExecute(provider: AiProvider, capability: ProviderCapability): boolean {
    const candidate = provider as unknown as Record<string, unknown>;
    const methodByCapability: Partial<Record<ProviderCapability, string>> = {
      llm: "generateText",
      speech: "transcribe",
      subtitle: "generateSubtitles",
      voice: "generateVoice",
      image: "generateImage",
      video: "generateVideo"
    };
    const method = methodByCapability[capability];
    return Boolean(method && typeof candidate[method] === "function");
  }
}

export const aiProviderRegistry = new AiProviderRegistry();
