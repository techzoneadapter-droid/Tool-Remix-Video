import { createProviderHealth } from "@/providers/createProviderHealth";
import { aiGatewayClient } from "@/tauri/AiGatewayClient";
import type {
  ProviderCapability,
  ProviderHealth,
  VoiceGenerationRequest,
  VoiceGenerationResult,
  VoiceProvider
} from "@/providers/Provider";

export class LocalTtsProvider implements VoiceProvider {
  readonly capabilities: ProviderCapability[] = ["voice"];

  constructor(
    readonly id: string,
    readonly name: string
  ) {}

  getHealth(): ProviderHealth {
    return createProviderHealth({
      id: this.id,
      name: this.name,
      capabilities: this.capabilities,
      configured: true
    });
  }

  generateVoice(request: VoiceGenerationRequest): Promise<VoiceGenerationResult> {
    return aiGatewayClient.execute({
      providerId: this.id,
      operation: "generate-voice",
      payload: request
    });
  }
}
