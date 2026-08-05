import { appConfig } from "@/config/appConfig";
import { settingsService, type SettingsService } from "@/services/SettingsService";
import type { CommercialState, CreditCharge } from "@/types/Commercial";

const commercialSettingsKey = "commercial.state";

function nowIso() {
  return new Date().toISOString();
}

export const defaultCommercialState: CommercialState = {
  credits: {
    balance: 12450,
    reserved: 0,
    lastUpdatedAt: nowIso()
  },
  license: {
    tier: "pro",
    status: "active",
    keyLast4: "DEMO",
    message: "Pro license active."
  },
  updater: {
    status: "current",
    currentVersion: appConfig.version,
    latestVersion: appConfig.version,
    message: "Application is up to date."
  },
  installer: {
    msiReady: true,
    nsisReady: true,
    message: "Windows MSI and NSIS installers are configured."
  }
};

export class CommercialService {
  constructor(private readonly settings: SettingsService = settingsService) {}

  async load(): Promise<CommercialState> {
    const records = await this.settings.list();
    const record = records.find((item) => item.key === commercialSettingsKey);
    return this.normalize(record?.value);
  }

  async save(state: CommercialState): Promise<CommercialState> {
    const normalized = this.normalize(state);
    await this.settings.save(commercialSettingsKey, normalized);
    return normalized;
  }

  async consumeCredits(state: CommercialState, charge: CreditCharge): Promise<CommercialState> {
    if (charge.amount <= 0) return this.save(state);
    if (state.credits.balance < charge.amount) {
      return this.save({
        ...state,
        license: {
          ...state.license,
          message: `Not enough credits for ${charge.reason}.`
        }
      });
    }

    return this.save({
      ...state,
      credits: {
        ...state.credits,
        balance: state.credits.balance - charge.amount,
        lastUpdatedAt: nowIso()
      }
    });
  }

  canSpend(state: CommercialState, amount: number): boolean {
    return state.credits.balance >= amount && state.license.status !== "expired";
  }

  normalize(value: unknown): CommercialState {
    if (!value || typeof value !== "object") return defaultCommercialState;
    const partial = value as Partial<CommercialState>;

    return {
      credits: {
        ...defaultCommercialState.credits,
        ...partial.credits
      },
      license: {
        ...defaultCommercialState.license,
        ...partial.license
      },
      updater: {
        ...defaultCommercialState.updater,
        ...partial.updater
      },
      installer: {
        ...defaultCommercialState.installer,
        ...partial.installer
      }
    };
  }
}

export const commercialService = new CommercialService();
