import { BookOpen, CircleHelp, Download, Play, Settings, UploadCloud, Wand2 } from "lucide-react";

const steps = [
  ["Bước 1: Nhập video", "Kéo & thả video vào khu vực nhập hoặc chọn từ máy tính.", UploadCloud],
  ["Bước 2: Chọn chức năng", "Chọn một trong ba chức năng Auto Remix, Auto Dịch hoặc Auto Magic.", Wand2],
  ["Bước 3: Tùy chỉnh cài đặt", "Điều chỉnh các tùy chọn phù hợp với nhu cầu của bạn.", Settings],
  ["Bước 4: Bắt đầu xử lý", "Nhấn nút bắt đầu và chờ AI xử lý video.", Play],
  ["Bước 5: Xuất video", "Xem trước kết quả và xuất video với chất lượng cao.", Download]
];

export function HelpPage() {
  return (
    <section className="screen-page help-screen">
      <header className="mb-5">
        <h1 className="text-[28px] font-extrabold text-white">Hướng dẫn</h1>
        <p className="mt-2 text-sm text-app-muted">Hướng dẫn sử dụng RemixAI Pro.</p>
      </header>
      <div className="help-layout">
        <nav className="settings-tabs">
          {["Bắt đầu nhanh", "Auto Remix", "Auto Dịch", "Auto Magic", "Quản lý dự án", "Xuất video", "Mẹo & thủ thuật", "Câu hỏi thường gặp"].map((tab, index) => (
            <button key={tab} className={index === 0 ? "selected" : ""}>
              <BookOpen size={16} />
              {tab}
            </button>
          ))}
        </nav>
        <section className="help-steps">
          <h2>1. Bắt đầu nhanh</h2>
          {steps.map(([title, body, Icon]) => (
            <div key={title as string} className="help-step">
              <div><Icon size={18} /></div>
              <strong>{title as string}</strong>
              <p>{body as string}</p>
            </div>
          ))}
        </section>
        <aside className="help-card">
          <div className="video-help-art"><Play size={42} fill="currentColor" /></div>
          <div className="support-box">
            <h2>Cần hỗ trợ thêm?</h2>
            <p>Nếu bạn cần hỗ trợ, vui lòng liên hệ chúng tôi.</p>
            <button>Xem FAQ</button>
            <button className="dialog-save">Liên hệ hỗ trợ</button>
          </div>
        </aside>
      </div>
      <button className="fixed bottom-6 right-7 flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-[#5b22d6] to-[#6d2bd8] px-7 text-base font-bold text-white shadow-glow">
        <CircleHelp size={22} />
        Trợ giúp
      </button>
    </section>
  );
}
