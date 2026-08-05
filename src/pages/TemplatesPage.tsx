import { Eye, Search } from "lucide-react";
import { templates } from "@/constants/dashboardData";

export function TemplatesPage() {
  return (
    <section className="screen-page template-screen">
      <header className="mb-5">
        <h1 className="text-[28px] font-extrabold text-white">Mẫu (Templates)</h1>
        <p className="mt-2 text-sm text-app-muted">Sử dụng mẫu có sẵn để tạo video nhanh chóng.</p>
      </header>
      <div className="screen-toolbar">
        <button className="selected">Tất cả</button>
        <button>YouTube</button>
        <button>TikTok</button>
        <button>Shorts</button>
        <button>Marketing</button>
        <button>Giáo dục</button>
        <div className="toolbar-search">
          <Search size={16} />
          Tìm mẫu...
        </div>
      </div>
      <div className="template-grid">
        {templates.map((template) => (
          <article key={template.name} className="template-card">
            <div className={`template-thumb ${template.thumbnail}`}>
              <span>{template.aspect}</span>
            </div>
            <h3>{template.name}</h3>
            <p>
              <Eye size={14} />
              {template.views}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
