import { useState } from "react";
import { CircleHelp, Plus } from "lucide-react";
import { BottomStats } from "@/components/BottomStats";
import { FeatureCard } from "@/components/FeatureCard";
import { RecentProjects } from "@/components/RecentProjects";
import { SettingsDialog } from "@/components/SettingsDialog";
import { featureCards } from "@/constants/dashboardData";
import { useAppStore } from "@/stores/AppStore";
import type { FeatureCard as FeatureCardType } from "@/types/Dashboard";

export function HomePage() {
  const [settingsFeature, setSettingsFeature] = useState<FeatureCardType | null>(null);
  const openTool = useAppStore((state) => state.openTool);

  return (
    <>
      <div className="mb-7 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[30px] font-extrabold leading-tight text-white">Xin chào! 👋</h1>
          <p className="mt-3 text-base text-app-muted">Chọn một chức năng để bắt đầu tạo ra những video viral ấn tượng.</p>
        </div>
        <button className="new-project-button">
          <Plus size={20} />
          Dự án mới
        </button>
      </div>
      <section className="grid grid-cols-3 gap-4">
        {featureCards.map((feature) => (
          <FeatureCard key={feature.id} feature={feature} onStart={openTool} onSettings={setSettingsFeature} />
        ))}
      </section>
      <div className="mt-5">
        <RecentProjects />
      </div>
      <BottomStats />
      <button className="fixed bottom-6 right-7 flex h-14 items-center gap-3 rounded-full bg-gradient-to-r from-[#5b22d6] to-[#6d2bd8] px-7 text-base font-bold text-white shadow-glow">
        <CircleHelp size={22} />
        Trợ giúp
      </button>
      <SettingsDialog feature={settingsFeature} onClose={() => setSettingsFeature(null)} />
    </>
  );
}
