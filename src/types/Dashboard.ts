import type { LucideIcon } from "lucide-react";

export type FeatureMode = "Auto Remix" | "Auto Dịch" | "Auto Magic";

export type FeatureTheme = "remix" | "translate" | "magic";

export interface FeatureCard {
  id: "auto-remix" | "auto-translate" | "auto-magic";
  step: number;
  title: FeatureMode;
  badge: string;
  description: string;
  buttonLabel: string;
  theme: FeatureTheme;
  highlights: Array<{
    label: string;
    icon: LucideIcon;
  }>;
  footer?: string;
}

export interface RecentProject {
  id: string;
  name: string;
  mode: FeatureMode;
  aspect: string;
  duration: string;
  date: string;
  status: "Hoàn thành" | "Đang xử lý" | "Lỗi";
  thumbnail: string;
}

export interface DashboardStat {
  label: string;
  value: string;
  icon: LucideIcon;
}

export interface ModuleSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface ModeSettings {
  mode: FeatureMode;
  modules: ModuleSetting[];
}
