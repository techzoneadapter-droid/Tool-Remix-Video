import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import type {
  ProviderCapability,
  ProviderConfigReader,
  ProviderHealth,
  SpeechProvider,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
  SubtitleGenerationRequest,
  SubtitleGenerationResult,
  SubtitleProvider
} from "@/providers/Provider";
import { createProviderHealth } from "@/providers/createProviderHealth";
import { aiGatewayClient } from "@/tauri/AiGatewayClient";

export class DeepgramProvider implements SpeechProvider, SubtitleProvider {
  readonly id: ProviderId = "deepgram";
  readonly name = "Deepgram Nova";
  readonly capabilities: ProviderCapability[] = ["speech", "subtitle"];

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

  async transcribe(request: SpeechTranscriptionRequest): Promise<SpeechTranscriptionResult> {
    this.assertConfigured();
    return aiGatewayClient.execute<SpeechTranscriptionRequest, SpeechTranscriptionResult>({
      providerId: this.id,
      operation: "transcribe",
      payload: request
    });
  }

  async generateSubtitles(request: SubtitleGenerationRequest): Promise<SubtitleGenerationResult> {
    this.assertConfigured();
    return aiGatewayClient.execute<SubtitleGenerationRequest, SubtitleGenerationResult>({
      providerId: this.id,
      operation: "generate-subtitle",
      payload: request
    });
  }

  private assertConfigured() {
    const health = this.getHealth();
    if (!health.configured) throw new Error(`${this.name} requires ${health.missingConfigKeys.join(", ")}.`);
  }
}
