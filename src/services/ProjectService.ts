import type { RecentProject } from "@/types/Dashboard";
import { recentProjects } from "@/constants/dashboardData";

export class ProjectService {
  listRecentProjects(): RecentProject[] {
    return recentProjects;
  }
}
