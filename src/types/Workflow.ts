import type { LucideIcon } from "lucide-react";
import type { ToolRoute } from "@/types/Navigation";

export interface ToggleSetting {
  label: string;
  description?: string;
  enabled: boolean;
}

export interface SceneItem {
  id: string;
  time: string;
  title: string;
  description: string;
  tag: string;
}

export interface ExportOption {
  label: string;
  value: string;
}

export interface ToolAction {
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  intent?: "start" | "regenerate" | "edit" | "export" | "settings";
}

export interface WorkflowDefinition {
  route: ToolRoute;
  title: string;
  badge: string;
  theme: "remix" | "translate" | "magic";
  description: string;
  primaryLabel: string;
  previewTitle: string;
  timelineTitle: string;
  previewVariant: "space-blue" | "space-orange" | "magic-world";
  actions: ToolAction[];
  settings: ToggleSetting[];
  scenes: SceneItem[];
}
