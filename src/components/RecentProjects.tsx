import { useEffect, useState } from "react";
import { CheckCircle2, FolderOpen, MoreHorizontal, Play } from "lucide-react";
import { recentProjects } from "@/constants/dashboardData";
import { projectHistoryService } from "@/services/ProjectHistoryService";
import type { FeatureMode } from "@/types/Dashboard";

const modeClass: Record<FeatureMode, string> = {
  "Auto Remix": "tag-remix",
  "Auto Dịch": "tag-translate",
  "Auto Magic": "tag-magic"
};

export function RecentProjects() {
  const [projects, setProjects] = useState(recentProjects);

  useEffect(() => {
    let active = true;

    void projectHistoryService.list(3).then((records) => {
      if (active) setProjects(records);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-[24px] border border-white/10 bg-[#111827]/70 p-5 shadow-panel">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Dự án gần đây</h2>
        <button className="text-sm text-app-muted">Xem tất cả ›</button>
      </div>
      <div className="overflow-hidden rounded-[14px] border border-white/[0.06]">
        {projects.map((project) => (
          <div
            key={project.id}
            className="grid grid-cols-[minmax(330px,1fr)_90px_100px_190px_150px_170px] items-center gap-4 border-b border-white/[0.06] bg-white/[0.025] px-4 py-3 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div className={`project-thumb ${project.thumbnail}`} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{project.name}</div>
                <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-xs ${modeClass[project.mode]}`}>
                  {project.mode}
                </span>
              </div>
            </div>
            <div className="text-sm text-white/90">{project.aspect}</div>
            <div className="text-sm text-white/90">{project.duration}</div>
            <div className="text-sm text-white/90">{project.date}</div>
            <div className="flex items-center gap-2 text-sm text-[#45d876]">
              <CheckCircle2 size={17} />
              {project.status}
            </div>
            <div className="flex justify-end gap-3">
              <button className="mini-action" aria-label="Play project">
                <Play size={16} />
              </button>
              <button className="mini-action" aria-label="Open project">
                <FolderOpen size={16} />
              </button>
              <button className="mini-action border-transparent bg-transparent" aria-label="More actions">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
