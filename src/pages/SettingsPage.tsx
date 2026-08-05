import { useEffect } from "react";
import { BrainCircuit, Cpu, Database, Globe2, HardDrive, KeyRound, Palette, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useCommercialStore } from "@/stores/CommercialStore";

const tabs = ["Tổng quan", "AI Providers", "Chất lượng", "Thư mục", "Xuất bản", "Giao diện", "Phím tắt", "Tài khoản", "Giới thiệu"];

export function SettingsPage() {
  const commercial = useCommercialStore((store) => store.state);
  const loaded = useCommercialStore((store) => store.loaded);
  const load = useCommercialStore((store) => store.load);

  useEffect(() => {
    if (!loaded) void load();
  }, [load, loaded]);

  return (
    <section className="screen-page settings-screen">
      <header className="mb-5">
        <h1 className="text-[28px] font-extrabold text-white">Cài đặt</h1>
        <p className="mt-2 text-sm text-app-muted">Tùy chỉnh ứng dụng theo nhu cầu của bạn.</p>
      </header>
      <div className="settings-layout">
        <nav className="settings-tabs">
          {tabs.map((tab, index) => (
            <button key={tab} className={index === 0 ? "selected" : ""}>
              <SlidersHorizontal size={16} />
              {tab}
            </button>
          ))}
        </nav>
        <div className="settings-content">
          <Panel title="Tổng quan" icon={Globe2}>
            <SettingLine label="Ngôn ngữ" value="Tiếng Việt" />
            <SettingLine label="Chủ đề" value="Tối" />
            <ToggleLine label="Tự động lưu dự án" enabled />
            <ToggleLine label="Kiểm tra cập nhật" enabled={commercial.updater.status !== "error"} />
            <ToggleLine label="Gửi báo cáo ẩn danh" />
            <SettingLine label="License" value={`${commercial.license.tier.toUpperCase()} · ${commercial.license.status}`} />
            <SettingLine label="Credits" value={new Intl.NumberFormat("en-US").format(commercial.credits.balance)} />
          </Panel>
          <Panel title="Bộ nhớ & Tài nguyên" icon={HardDrive}>
            <div className="resource-meter"><span style={{ width: "62%" }} /></div>
            <SettingLine label="Sử dụng RAM tối đa" value="12 GB / 16 GB" />
            <SettingLine label="Số luồng xử lý" value="8" />
            <ToggleLine label="Tăng tốc GPU" enabled />
          </Panel>
        </div>
        <aside className="system-card">
          <h2>Thông tin hệ thống</h2>
          <SystemItem icon={Cpu} label="CPU" value="Intel Core i7-12700H" />
          <SystemItem icon={BrainCircuit} label="GPU" value="NVIDIA GeForce RTX 3060" />
          <SystemItem icon={Database} label="RAM" value="16 GB" />
          <SystemItem icon={ShieldCheck} label="Bảo mật" value="Local encrypted storage" />
          <SystemItem icon={KeyRound} label="License" value={commercial.license.message} />
          <SystemItem icon={Database} label="Installer" value={commercial.installer.message} />
          <SystemItem icon={Globe2} label="Updater" value={commercial.updater.message} />
          <SystemItem icon={Palette} label="Theme" value="Dark only" />
        </aside>
      </div>
      <footer className="screen-footer-actions">
        <button className="secondary-button">Đặt lại</button>
        <div className="ml-auto flex gap-3">
          <button className="secondary-button">Hủy</button>
          <button className="dialog-save">Lưu cài đặt</button>
        </div>
      </footer>
    </section>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Globe2; children: React.ReactNode }) {
  return (
    <section className="settings-panel">
      <h2><Icon size={17} />{title}</h2>
      {children}
    </section>
  );
}

function SettingLine({ label, value }: { label: string; value: string }) {
  return <div className="setting-line"><span>{label}</span><button>{value}</button></div>;
}

function ToggleLine({ label, enabled = false }: { label: string; enabled?: boolean }) {
  return <div className="setting-line"><span>{label}</span><span className={`toggle ${enabled ? "toggle-on" : ""}`}><span /></span></div>;
}

function SystemItem({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return <div className="system-item"><Icon size={16} /><span>{label}</span><strong>{value}</strong></div>;
}
