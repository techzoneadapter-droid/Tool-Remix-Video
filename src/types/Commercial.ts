export type LicenseTier = "free" | "pro";
export type LicenseStatus = "missing" | "active" | "expired";
export type UpdaterStatus = "idle" | "checking" | "available" | "current" | "error";

export interface LicenseState {
  tier: LicenseTier;
  status: LicenseStatus;
  keyLast4?: string;
  message: string;
}

export interface CreditState {
  balance: number;
  reserved: number;
  lastUpdatedAt: string;
}

export interface UpdaterState {
  status: UpdaterStatus;
  currentVersion: string;
  latestVersion?: string;
  message: string;
}

export interface InstallerState {
  msiReady: boolean;
  nsisReady: boolean;
  message: string;
}

export interface CommercialState {
  credits: CreditState;
  license: LicenseState;
  updater: UpdaterState;
  installer: InstallerState;
}

export interface CreditCharge {
  amount: number;
  reason: string;
}
