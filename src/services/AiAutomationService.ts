import { aiAutomationDefinitions } from "@/constants/aiAutomationData";
import { aiProviderRegistry } from "@/services/AiProviderRegistry";
import type { ProviderCapability } from "@/providers/Provider";
import type { AiAutomationId, AiAutomationReadiness } from "@/types/AiAutomation";

export class AiAutomationService {
  listReadiness(): AiAutomationReadiness[] {
    const health = aiProviderRegistry.health();
    return aiAutomationDefinitions.map((definition) => {
      const readyCapabilities = definition.requiredCapabilities.filter((capability) => health.some((provider) => provider.configured && provider.capabilities.includes(capability)));
      const missingCapabilities = definition.requiredCapabilities.filter((capability) => !readyCapabilities.includes(capability));
      const relevantCapabilities = new Set<ProviderCapability>([...definition.requiredCapabilities, ...definition.optionalCapabilities]);
      const configuredProviders = health.filter((provider) => provider.configured && provider.capabilities.some((capability) => relevantCapabilities.has(capability))).map((provider) => provider.name);
      return { definition, ready: missingCapabilities.length === 0, readyCapabilities, missingCapabilities, configuredProviders };
    });
  }

  getReadiness(id: AiAutomationId): AiAutomationReadiness | undefined {
    return this.listReadiness().find((item) => item.definition.id === id);
  }

  providerCoverage(): { ready: number; total: number } {
    const providers = aiProviderRegistry.health().filter((provider) => provider.capabilities.some((capability) => ["llm", "speech", "subtitle", "voice", "image", "video"].includes(capability)));
    return { ready: providers.filter((provider) => provider.configured).length, total: providers.length };
  }
}

export const aiAutomationService = new AiAutomationService();
