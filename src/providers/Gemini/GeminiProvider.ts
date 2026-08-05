import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import type { ProviderCapability, ProviderConfigReader, ProviderHealth, TextGenerationProvider, TextGenerationRequest, TextGenerationResult } from "@/providers/Provider";
import { createProviderHealth } from "@/providers/createProviderHealth";

export class GeminiProvider implements TextGenerationProvider {
  readonly id: ProviderId = "gemini";
  readonly name = "Gemini 2.5 Flash";
  readonly capabilities: ProviderCapability[] = ["llm"];

  constructor(private readonly config: ProviderConfigReader) {}

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

  async generateText(_request: TextGenerationRequest): Promise<TextGenerationResult> {
    const health = this.getHealth();

    if (!health.configured) {
      throw new Error(`${this.name} requires ${health.missingConfigKeys.join(", ")}.`);
    }

    throw new Error(`${this.name} network execution is available only after backend API transport is configured.`);
  }
}
