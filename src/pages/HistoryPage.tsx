import { useEffect, useState } from "react";
import { CheckCircle2, Download, MoreHorizontal, Play, Search } from "lucide-react";
import { historyProjects } from "@/constants/dashboardData";
import { projectHistoryService } from "@/services/ProjectHistoryService";
import type { FeatureMode } from "@/types/Dashboard";

const modeClass: Record<FeatureMode, string> = {
  "Auto Remix": "tag-remix",
  "Auto Dịch": "tag-translate",
  "Auto Magic": "tag-magic"
};

export function HistoryPage() {
  const [projects, setProjects] = useState(historyProjects);

  useEffect(() => {
    let active = true;

    void projectHistoryService.list().then((records) => {
      if (active) setProjects(records);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="screen-page narrow-screen">
      <header className="mb-5">
        <h1 className="text-[28px] font-extrabold text-white">Lịch sử xử lý</h1>
        <p className="mt-2 text-sm text-app-muted">Quản lý tất cả dự án đã xử lý.</p>
      </header>
      <div className="screen-toolbar">
        <button className="selected">Tất cả</button>
        <button>Auto Remix</button>
        <button>Auto Dịch</button>
        <button>Auto Magic</button>
        <div className="toolbar-search">
          <Search size={16} />
          Tìm kiếm dự án...
        </div>
      </div>
      <div className="history-table">
        <div className="history-head">
          <span>Dự án</span>
          <span>Chức năng</span>
          <span>Thời gian</span>
          <span>Tỷ lệ</span>
          <span>Trạng thái</span>
          <span>Thao tác</span>
        </div>
        {projects.map((project) => (
          <div key={project.id} className="history-row">
            <div className="flex min-w-0 items-center gap-3">
              <div className={`project-thumb ${project.thumbnail}`} />
              <span className="truncate">{project.name}</span>
            </div>
            <span className={`mode-tag ${modeClass[project.mode]}`}>{project.mode}</span>
            <span>{project.date}</span>
            <span>{project.aspect}</span>
            <span className={project.status === "Đang xử lý" ? "text-[#f5aa42]" : "text-[#45d876]"}>
              <CheckCircle2 size={15} />
              {project.status}
            </span>
            <span className="flex gap-2">
              <button className="mini-action"><Play size={14} /></button>
              <button className="mini-action"><Download size={14} /></button>
              <button className="mini-action border-transparent bg-transparent"><MoreHorizontal size={15} /></button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
