import { FolderOpen, MoreHorizontal, Play, Search } from "lucide-react";
import { recentProjects } from "@/constants/dashboardData";

export function ProjectsPage() {
  return (
    <section className="screen-page">
      <ScreenHeader title="Dự án của tôi" subtitle="Quản lý các video và phiên bản đã lưu." />
      <div className="screen-toolbar">
        <button className="selected">Tất cả</button>
        <button>Auto Remix</button>
        <button>Auto Dịch</button>
        <button>Auto Magic</button>
        <div className="toolbar-search">
          <Search size={16} />
          Tìm dự án...
        </div>
      </div>
      <div className="project-grid">
        {recentProjects.map((project) => (
          <article key={project.id} className="template-card">
            <div className={`template-thumb ${project.thumbnail}`}>
              <span>{project.aspect}</span>
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h3>{project.name}</h3>
                <p>{project.mode} • {project.duration}</p>
              </div>
              <button className="mini-action">
                <MoreHorizontal size={16} />
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="small-primary">
                <Play size={15} />
                Mở
              </button>
              <button className="small-secondary">
                <FolderOpen size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ScreenHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-[28px] font-extrabold text-white">{title}</h1>
      <p className="mt-2 text-sm text-app-muted">{subtitle}</p>
    </header>
  );
}
