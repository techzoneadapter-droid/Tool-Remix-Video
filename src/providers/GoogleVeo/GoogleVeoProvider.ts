import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import type {
  ProviderCapability,
  ProviderConfigReader,
  ProviderHealth,
  VideoGenerationProvider,
  VideoGenerationRequest,
  VideoGenerationResult
} from "@/providers/Provider";
import { createProviderHealth } from "@/providers/createProviderHealth";

export class GoogleVeoProvider implements VideoGenerationProvider {
  readonly id: ProviderId = "googleVeo";
  readonly name = "Google Veo";
  readonly capabilities: ProviderCapability[] = ["video"];

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

  async generateVideo(_request: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const health = this.getHealth();

    if (!health.configured) {
      throw new Error(`${this.name} requires ${health.missingConfigKeys.join(", ")}.`);
    }

    throw new Error(`${this.name} video transport is available only after native API transport is configured.`);
  }
}
