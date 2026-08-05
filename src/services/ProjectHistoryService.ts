import { historyProjects } from "@/constants/dashboardData";
import { projectHistoryRepository, type ProjectHistoryRepository } from "@/database/ProjectHistoryRepository";
import type { RecentProject } from "@/types/Dashboard";
import type { WorkflowJob } from "@/types/WorkflowJob";

const routeMode: Record<WorkflowJob["route"], RecentProject["mode"]> = {
  "auto-remix": historyProjects[0].mode,
  "auto-translate": historyProjects[1].mode,
  "auto-magic": historyProjects[2].mode
};

const completedStatus = historyProjects[0].status;
const runningStatus = historyProjects[3].status;
const errorStatus = historyProjects.find((project) => project.status !== completedStatus && project.status !== runningStatus)?.status ?? completedStatus;

export class ProjectHistoryService {
  constructor(private readonly repository: ProjectHistoryRepository = projectHistoryRepository) {}

  async list(limit = 50): Promise<RecentProject[]> {
    try {
      const records = await this.repository.list(limit);
      return records.length > 0 ? records : historyProjects.slice(0, limit);
    } catch {
      return historyProjects.slice(0, limit);
    }
  }

  async save(record: RecentProject): Promise<void> {
    try {
      await this.repository.save(record);
    } catch {
      // Web preview runs without Tauri. Persistence resumes in the desktop runtime.
    }
  }

  async saveWorkflowJob(job: WorkflowJob): Promise<void> {
    await this.save({
      id: job.id,
      name: job.title,
      mode: routeMode[job.route],
      aspect: "16:9",
      duration: "09:16",
      date: job.createdAt,
      status: job.status === "completed" ? completedStatus : job.status === "cancelled" ? errorStatus : runningStatus,
      thumbnail: job.route === "auto-magic" ? "magic" : job.route === "auto-translate" ? "history" : "space"
    });
  }
}

export const projectHistoryService = new ProjectHistoryService();
