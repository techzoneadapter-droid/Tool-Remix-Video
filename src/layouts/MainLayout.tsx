import type { PropsWithChildren } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <div className="h-screen overflow-hidden bg-app-bg text-white">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(82,108,255,0.14),transparent_38%),radial-gradient(circle_at_90%_0%,rgba(143,62,255,0.16),transparent_30%)]" />
      <div className="relative flex h-full">
        <Sidebar />
        <TopBar />
        <main className="min-w-0 flex-1 overflow-y-auto px-6 py-14">
          <div className="min-h-full rounded-[28px] border border-white/[0.06] bg-[#0d1220]/78 p-6 shadow-panel backdrop-blur-xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
