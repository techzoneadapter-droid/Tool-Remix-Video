import { useEffect } from "react";
import { CircleHelp, Folder, History, Home, Info, LayoutTemplate, Settings, Sparkles, Wand2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { appConfig } from "@/config/appConfig";
import { useAppStore } from "@/stores/AppStore";
import { useCommercialStore } from "@/stores/CommercialStore";
import type { AppRoute } from "@/types/Navigation";

const navigation: Array<{ label: string; icon: typeof Home; route: AppRoute }> = [
  { label: "Trang chủ", icon: Home, route: "home" }, { label: "Dự án của tôi", icon: Folder, route: "projects" }, { label: "Lịch sử xử lý", icon: History, route: "history" }, { label: "Mẫu (Templates)", icon: LayoutTemplate, route: "templates" }, { label: "Công cụ AI", icon: Wand2, route: "tools" }, { label: "Cài đặt & API", icon: Settings, route: "settings" }, { label: "Hướng dẫn", icon: CircleHelp, route: "help" }, { label: "Giới thiệu", icon: Info, route: "about" }
];

export function Sidebar() {
  const route = useAppStore((state) => state.route); const setRoute = useAppStore((state) => state.setRoute); const commercial = useCommercialStore((store) => store.state); const loaded = useCommercialStore((store) => store.loaded); const load = useCommercialStore((store) => store.load);
  useEffect(() => { if (!loaded) void load(); }, [load, loaded]);
  const proActive = commercial.license.tier === "pro" && commercial.license.status === "active";
  return (<aside className="flex h-full w-[246px] shrink-0 flex-col border-r border-white/[0.04] bg-[#070b14]/95 px-4 py-6"><Logo /><nav className="mt-8 flex flex-1 flex-col gap-2">{navigation.map((item) => { const Icon=item.icon; return <button key={item.label} className={`nav-item ${route === item.route ? "nav-item-active" : ""}`} onClick={() => setRoute(item.route)}><Icon size={20} /><span>{item.label}</span></button>; })}</nav><button className="rounded-[20px] border border-purple-400/20 bg-gradient-to-b from-[#261445] to-[#101425] p-5 text-center shadow-glow transition hover:-translate-y-0.5" onClick={() => setRoute("settings")}><div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-purple-500/10 text-4xl"><Sparkles className="text-[#d65cff]" size={34} /></div><div className="font-bold text-white">{proActive ? "Pro đang hoạt động" : "Nâng cấp Pro"}</div><p className="mt-2 text-sm leading-5 text-app-muted">{commercial.license.message}</p><div className="mt-4 h-11 w-full rounded-[14px] bg-gradient-to-r from-[#6d35ff] to-[#c238d5] pt-3 text-sm font-bold text-white">{proActive ? "Quản lý license" : "Nâng cấp ngay"}</div></button><div className="mt-7 text-xs text-app-muted">{appConfig.version}</div></aside>);
}
