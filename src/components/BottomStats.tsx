import { dashboardStats } from "@/constants/dashboardData";

export function BottomStats() {
  return (
    <section className="mx-auto mt-5 grid max-w-4xl grid-cols-5 gap-4 rounded-[24px] border border-white/[0.06] bg-[#0b101b]/80 p-4">
      {dashboardStats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-app-muted">
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm text-app-muted">{stat.label}</div>
              <div className="text-lg font-semibold text-white">{stat.value}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
