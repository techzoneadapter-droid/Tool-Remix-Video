import { tauriDatabaseClient, type TauriDatabaseClient } from "@/database/TauriDatabaseClient";

export interface AppSettingRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: string;
}

export class SettingsRepository {
  constructor(private readonly database = tauriDatabaseClient) {}

  async list(): Promise<AppSettingRecord[]> {
    return this.database.execute<AppSettingRecord[]>("list_app_settings");
  }

  async save<T>(key: string, value: T): Promise<void> {
    await this.database.execute("save_app_setting", {
      record: {
        key,
        value,
        updatedAt: new Date().toISOString()
      }
    });
  }
}

export const settingsRepository = new SettingsRepository();
