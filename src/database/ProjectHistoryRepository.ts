import { tauriDatabaseClient, type TauriDatabaseClient } from "@/database/TauriDatabaseClient";
import type { RecentProject } from "@/types/Dashboard";

export class ProjectHistoryRepository {
  constructor(private readonly database = tauriDatabaseClient) {}

  async list(limit = 50): Promise<RecentProject[]> {
    return this.database.execute<RecentProject[]>("list_project_history", { limit });
  }

  async save(record: RecentProject): Promise<void> {
    await this.database.execute("save_project_history", { record });
  }
}

export const projectHistoryRepository = new ProjectHistoryRepository();
