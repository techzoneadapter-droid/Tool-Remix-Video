import type { AiProvider, ProviderCapability, ProviderHealth } from "@/providers/Provider";
import { createProviderHealth } from "@/providers/createProviderHealth";

export class LocalToolProvider implements AiProvider {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly capabilities: ProviderCapability[]
  ) {}

  getHealth(): ProviderHealth {
    return createProviderHealth({
      id: this.id,
      name: this.name,
      capabilities: this.capabilities,
      configured: true
    });
  }
}
