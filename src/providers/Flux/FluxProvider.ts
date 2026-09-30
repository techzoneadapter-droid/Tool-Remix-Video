import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import { createProviderHealth } from "@/providers/createProviderHealth";
import type {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderCapability,
  ProviderConfigReader,
  ProviderHealth
} from "@/providers/Provider";
import { aiGatewayClient } from "@/tauri/AiGatewayClient";

export class FluxProvider implements ImageGenerationProvider {
  readonly id: ProviderId = "flux";
  readonly name = "FLUX Kontext";
  readonly capabilities: ProviderCapability[] = ["image"];

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

  generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const health = this.getHealth();
    if (!health.configured) throw new Error(`${this.name} requires ${health.missingConfigKeys.join(", ")}.`);

    return aiGatewayClient.execute({ providerId: this.id, operation: "generate-image", payload: request });
  }
}
