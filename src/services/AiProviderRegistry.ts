import { ConfiguredProvider } from "@/providers/ConfiguredProvider";
import { DeepgramProvider } from "@/providers/Deepgram/DeepgramProvider";
import { ElevenLabsProvider } from "@/providers/ElevenLabs/ElevenLabsProvider";
import { GeminiProvider } from "@/providers/Gemini/GeminiProvider";
import { GoogleVeoProvider } from "@/providers/GoogleVeo/GoogleVeoProvider";
import { LocalToolProvider } from "@/providers/LocalToolProvider";
import type { AiProvider, ProviderCapability, ProviderHealth } from "@/providers/Provider";
import { EnvironmentProviderConfig } from "@/config/providerConfig";

export class AiProviderRegistry {
  private readonly providers: AiProvider[];

  constructor() {
    const config = new EnvironmentProviderConfig();

    this.providers = [
      new GeminiProvider(config),
      new DeepgramProvider(config),
      new ElevenLabsProvider(config),
      new GoogleVeoProvider(config),
      new ConfiguredProvider("kling", "Kling", ["video"], config),
      new ConfiguredProvider("runway", "Runway", ["video"], config),
      new ConfiguredProvider("flux", "FLUX Kontext", ["image"], config),
      new LocalToolProvider("pyscenedetect", "PySceneDetect", ["scene-detection"]),
      new LocalToolProvider("paddleocr", "PaddleOCR", ["ocr"]),
      new LocalToolProvider("yolo11", "YOLO11", ["object-detection"]),
      new LocalToolProvider("insightface", "InsightFace", ["face-analysis"])
    ];
  }

  list(): AiProvider[] {
    return this.providers;
  }

  health(): ProviderHealth[] {
    return this.providers.map((provider) => provider.getHealth());
  }

  findByCapability(capability: ProviderCapability): AiProvider[] {
    return this.providers.filter((provider) => provider.capabilities.includes(capability));
  }
}

export const aiProviderRegistry = new AiProviderRegistry();
