import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import { createProviderHealth } from "@/providers/createProviderHealth";
import type {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderCapability,
  ProviderConfigReader,
  ProviderHealth,
  SpeechProvider,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
  SubtitleGenerationRequest,
  SubtitleGenerationResult,
  SubtitleProvider,
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResult,
  VoiceGenerationRequest,
  VoiceGenerationResult,
  VoiceProvider
} from "@/providers/Provider";
import { aiGatewayClient } from "@/tauri/AiGatewayClient";

export class OpenAIProvider implements TextGenerationProvider, SpeechProvider, SubtitleProvider, VoiceProvider, ImageGenerationProvider {
  readonly id: ProviderId = "openAI";
  readonly name = "OpenAI";
  readonly capabilities: ProviderCapability[] = ["llm", "speech", "subtitle", "voice", "image"];

  constructor(private readonly config: ProviderConfigReader) {}

  getHealth(): ProviderHealth {
    const key = getProviderEnvKey(this.id);
    const configured = this.config.has(key);

    return createProviderHealth({
      id: this.id,
      name: this.name,
      configured,
      capabilities: this.capabilities,
      missingConfigKeys: [key]
    });
  }

  generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    this.assertConfigured();
    return aiGatewayClient.execute({ providerId: this.id, operation: "generate-text", payload: request });
  }

  transcribe(request: SpeechTranscriptionRequest): Promise<SpeechTranscriptionResult> {
    this.assertConfigured();
    return aiGatewayClient.execute({ providerId: this.id, operation: "transcribe", payload: request });
  }

  generateSubtitles(request: SubtitleGenerationRequest): Promise<SubtitleGenerationResult> {
    this.assertConfigured();
    return aiGatewayClient.execute({ providerId: this.id, operation: "generate-subtitle", payload: request });
  }

  generateVoice(request: VoiceGenerationRequest): Promise<VoiceGenerationResult> {
    this.assertConfigured();
    return aiGatewayClient.execute({ providerId: this.id, operation: "generate-voice", payload: request });
  }

  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    this.assertConfigured();
    return aiGatewayClient.execute({ providerId: this.id, operation: "generate-image", payload: request });
  }

  private assertConfigured() {
    const health = this.getHealth();
    if (!health.configured) throw new Error(`${this.name} requires ${health.missingConfigKeys.join(", ")}.`);
  }
}
