import { create } from "zustand";
import { defaultModeSettings } from "@/constants/dashboardData";
import { settingsService } from "@/services/SettingsService";
import type { FeatureCard, ModeSettings } from "@/types/Dashboard";

interface SettingsState {
  modeSettings: Record<FeatureCard["id"], ModeSettings>;
  toggleModule: (modeId: FeatureCard["id"], moduleId: string) => void;
  resetMode: (modeId: FeatureCard["id"]) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  modeSettings: defaultModeSettings,
  toggleModule: (modeId, moduleId) =>
    set((state) => ({
      modeSettings: {
        ...state.modeSettings,
        [modeId]: {
          ...state.modeSettings[modeId],
          modules: state.modeSettings[modeId].modules.map((module) =>
            module.id === moduleId ? { ...module, enabled: !module.enabled } : module
          )
        }
      }
    })),
  resetMode: (modeId) =>
    set((state) => ({
      modeSettings: {
        ...state.modeSettings,
        [modeId]: defaultModeSettings[modeId]
      }
    }))
}));

useSettingsStore.subscribe((state) => {
  void settingsService.save("modeSettings", state.modeSettings);
});
