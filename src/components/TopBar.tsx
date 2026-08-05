import { useEffect } from "react";
import { Bell, CircleHelp, Crown, Diamond, Minus, Square, X } from "lucide-react";
import { useCommercialStore } from "@/stores/CommercialStore";

function formatCredits(balance: number) {
  return `${new Intl.NumberFormat("en-US").format(balance)} Credits`;
}

export function TopBar() {
  const commercial = useCommercialStore((store) => store.state);
  const loaded = useCommercialStore((store) => store.loaded);
  const load = useCommercialStore((store) => store.load);

  useEffect(() => {
    if (!loaded) void load();
  }, [load, loaded]);

  const licenseLabel = commercial.license.tier === "pro" && commercial.license.status === "active" ? "Pro" : "Free";

  return (
    <header className="absolute right-7 top-3 z-20 flex items-center gap-3">
      <div className="flex h-11 items-center gap-2 rounded-2xl border border-app-line bg-white/[0.04] px-5 text-sm font-semibold text-[#f8c65c]">
        <Crown size={17} fill="currentColor" />
        {licenseLabel}
      </div>
      <div className="flex h-11 items-center gap-2 rounded-2xl border border-app-line bg-white/[0.04] px-5 text-sm font-semibold text-white">
        <Diamond size={18} className="text-[#b25cff]" fill="currentColor" />
        {formatCredits(commercial.credits.balance)}
      </div>
      <button className="icon-button" aria-label="Notifications">
        <Bell size={18} />
      </button>
      <button className="icon-button" aria-label="Help">
        <CircleHelp size={18} />
      </button>
      <div className="ml-3 h-7 w-px bg-white/10" />
      <button className="window-button" aria-label="Minimize">
        <Minus size={18} />
      </button>
      <button className="window-button" aria-label="Maximize">
        <Square size={15} />
      </button>
      <button className="window-button" aria-label="Close">
        <X size={18} />
      </button>
    </header>
  );
}
