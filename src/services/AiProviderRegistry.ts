import { EnvironmentProviderConfig } from "@/config/providerConfig";
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

  constructor() {
    const config = new EnvironmentProviderConfig();

    this.providers = [
      new GeminiProvider(config),
      new OpenAIProvider(config),
      new ConfiguredProvider("anthropic", "Anthropic Claude", ["llm"], config),
      new ConfiguredProvider("openRouter", "OpenRouter", ["llm"], config),
      new DeepgramProvider(config),
      new ElevenLabsProvider(config),
      new GoogleVeoProvider(config),
      new ConfiguredProvider("kling", "Kling", ["video"], config),
      new ConfiguredProvider("runway", "Runway", ["video"], config),
      new FluxProvider(config),
      new ConfiguredProvider("replicate", "Replicate", ["image", "video"], config),
      new ConfiguredProvider("fal", "fal.ai", ["image", "video"], config),
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

  firstConfigured(capability: ProviderCapability, preferredIds: string[] = []): AiProvider | undefined {
    const configured = this.configuredByCapability(capability);
    const preferred = preferredIds.map((id) => configured.find((provider) => provider.id === id)).find((provider): provider is AiProvider => Boolean(provider));
    return preferred ?? configured[0];
  }
}

export const aiProviderRegistry = new AiProviderRegistry();
