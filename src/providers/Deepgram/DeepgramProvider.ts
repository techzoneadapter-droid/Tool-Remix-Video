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

  async transcribe(_request: SpeechTranscriptionRequest): Promise<SpeechTranscriptionResult> {
    this.assertConfigured();
    throw new Error(`${this.name} speech transport is available only after native API transport is configured.`);
  }

  async generateSubtitles(_request: SubtitleGenerationRequest): Promise<SubtitleGenerationResult> {
    this.assertConfigured();
    throw new Error(`${this.name} subtitle transport is available only after native API transport is configured.`);
  }

  private assertConfigured() {
    const health = this.getHealth();

    if (!health.configured) {
      throw new Error(`${this.name} requires ${health.missingConfigKeys.join(", ")}.`);
    }
  }
}
