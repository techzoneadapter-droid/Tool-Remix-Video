import type { ProviderCapability, ProviderHealth } from "@/providers/Provider";

interface ProviderHealthInput {
  id: string;
  name: string;
  capabilities: ProviderCapability[];
  configured: boolean;
  missingConfigKeys?: string[];
  blockedReason?: string;
}

export function createProviderHealth({
  id,
  name,
  capabilities,
  configured,
  missingConfigKeys = [],
  blockedReason
}: ProviderHealthInput): ProviderHealth {
  return {
    id,
    name,
    status: configured ? "ready" : "blocked",
    configured,
    capabilities,
    missingConfigKeys: configured ? [] : missingConfigKeys,
    message: configured ? `${name} is ready.` : blockedReason ?? `${name} is blocked by missing configuration.`
  };
}
