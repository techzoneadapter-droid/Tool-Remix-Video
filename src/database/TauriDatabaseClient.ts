import { invoke } from "@tauri-apps/api/core";

export class TauriDatabaseClient {
  async execute<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    return invoke<T>(command, args);
  }
}

export const tauriDatabaseClient = new TauriDatabaseClient();
