import { appConfig } from "@/config/appConfig";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-gradient-to-br from-[#a855f7] to-[#5b2dff] text-3xl font-black shadow-glow">
        R
      </div>
      <div>
        <div className="text-lg font-bold leading-5 text-white">{appConfig.name}</div>
        <div className="text-xs text-app-muted">{appConfig.subtitle}</div>
      </div>
    </div>
  );
}
