import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import type { ProviderCapability, ProviderConfigReader, ProviderHealth, TextGenerationProvider, TextGenerationRequest, TextGenerationResult } from "@/providers/Provider";
import { createProviderHealth } from "@/providers/createProviderHealth";
import { aiGatewayClient } from "@/tauri/AiGatewayClient";

export class GeminiProvider implements TextGenerationProvider {
  readonly id: ProviderId = "gemini";
  readonly name = "Gemini";
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

  async generateText(request: TextGenerationRequest): Promise<TextGenerationResult> {
    this.assertConfigured();
    return aiGatewayClient.execute<TextGenerationRequest, TextGenerationResult>({
      providerId: this.id,
      operation: "generate-text",
      payload: request
    });
  }

  private assertConfigured() {
    const health = this.getHealth();
    if (!health.configured) throw new Error(`${this.name} requires ${health.missingConfigKeys.join(", ")}.`);
  }
}
