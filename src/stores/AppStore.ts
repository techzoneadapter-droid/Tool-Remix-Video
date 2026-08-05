import { create } from "zustand";
import type { AppRoute, ToolRoute } from "@/types/Navigation";

interface AppState {
  route: AppRoute;
  activeTool: ToolRoute;
  setRoute: (route: AppRoute) => void;
  openTool: (tool: ToolRoute) => void;
}

export const useAppStore = create<AppState>((set) => ({
  route: "home",
  activeTool: "auto-remix",
  setRoute: (route) => set({ route }),
  openTool: (tool) => set({ route: "tools", activeTool: tool })
}));
