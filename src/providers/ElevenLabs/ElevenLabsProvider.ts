import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import type {
  ProviderCapability,
  ProviderConfigReader,
  ProviderHealth,
  VoiceGenerationRequest,
  VoiceGenerationResult,
  VoiceProvider
} from "@/providers/Provider";
import { createProviderHealth } from "@/providers/createProviderHealth";
import { aiGatewayClient } from "@/tauri/AiGatewayClient";

export class ElevenLabsProvider implements VoiceProvider {
  readonly id: ProviderId = "elevenLabs";
  readonly name = "ElevenLabs";
  readonly capabilities: ProviderCapability[] = ["voice"];

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

  async generateVoice(request: VoiceGenerationRequest): Promise<VoiceGenerationResult> {
    const health = this.getHealth();
    if (!health.configured) throw new Error(`${this.name} requires ${health.missingConfigKeys.join(", ")}.`);

    return aiGatewayClient.execute<VoiceGenerationRequest, VoiceGenerationResult>({
      providerId: this.id,
      operation: "generate-voice",
      payload: request
    });
  }
}
