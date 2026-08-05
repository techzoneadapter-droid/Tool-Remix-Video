import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import type { AiProvider, ProviderCapability, ProviderConfigReader, ProviderHealth } from "@/providers/Provider";
import { createProviderHealth } from "@/providers/createProviderHealth";

export class ConfiguredProvider implements AiProvider {
  constructor(
    readonly id: ProviderId,
    readonly name: string,
    readonly capabilities: ProviderCapability[],
    private readonly config: ProviderConfigReader
  ) {}

  getHealth(): ProviderHealth {
    const key = getProviderEnvKey(this.id);
    const configured = this.config.has(key);

    return createProviderHealth({
      id: this.id,
      name: this.name,
      capabilities: this.capabilities,
      configured,
      missingConfigKeys: [key]
    });
  }
}
