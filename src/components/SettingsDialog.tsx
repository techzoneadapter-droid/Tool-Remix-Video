import { Search, X } from "lucide-react";
import { useSettingsStore } from "@/stores/SettingsStore";
import type { FeatureCard } from "@/types/Dashboard";

interface SettingsDialogProps {
  feature: FeatureCard | null;
  onClose: () => void;
}

export function SettingsDialog({ feature, onClose }: SettingsDialogProps) {
  const modeSettings = useSettingsStore((state) => (feature ? state.modeSettings[feature.id] : null));
  const toggleModule = useSettingsStore((state) => state.toggleModule);
  const resetMode = useSettingsStore((state) => state.resetMode);

  if (!feature || !modeSettings) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-6 backdrop-blur-md">
      <section className="w-full max-w-3xl rounded-[22px] border border-white/10 bg-[#111725]/95 p-6 shadow-panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{modeSettings.mode} Settings</h2>
            <p className="mt-1 text-sm text-app-muted">
              Bật hoặc tắt các mô-đun nội bộ. Các lựa chọn này sẽ được dùng khi bắt đầu xử lý.
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 flex h-12 items-center gap-3 rounded-[14px] border border-white/10 bg-black/20 px-4 text-app-muted">
          <Search size={18} />
          <span className="text-sm">Tìm cài đặt...</span>
        </div>
        <div className="mt-5 grid max-h-[470px] gap-3 overflow-y-auto pr-1">
          {modeSettings.modules.map((module) => (
            <button key={module.id} className="setting-row" onClick={() => toggleModule(feature.id, module.id)}>
              <span className="text-left">
                <span className="block font-semibold text-white">{module.label}</span>
                <span className="mt-1 block text-sm text-app-muted">{module.description}</span>
              </span>
              <span className={`toggle ${module.enabled ? "toggle-on" : ""}`}>
                <span />
              </span>
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="secondary-button" onClick={() => resetMode(feature.id)}>
            Đặt lại
          </button>
          <button className="secondary-button" onClick={onClose}>
            Hủy
          </button>
          <button className="dialog-save" onClick={onClose}>
            Lưu cài đặt
          </button>
        </div>
      </section>
    </div>
  );
}
