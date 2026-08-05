import { settingsRepository, type AppSettingRecord, type SettingsRepository } from "@/database/SettingsRepository";

export class SettingsService {
  constructor(private readonly repository: SettingsRepository = settingsRepository) {}

  async list(): Promise<AppSettingRecord[]> {
    try {
      return await this.repository.list();
    } catch {
      return [];
    }
  }

  async save<T>(key: string, value: T): Promise<void> {
    try {
      await this.repository.save(key, value);
    } catch {
      // The web preview runs without Tauri. Persistence resumes in the desktop runtime.
    }
  }
}

export const settingsService = new SettingsService();
