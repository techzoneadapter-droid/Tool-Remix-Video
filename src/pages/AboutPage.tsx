import { useEffect } from "react";
import { BrainCircuit, Gauge, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
import { appConfig } from "@/config/appConfig";
import { useCommercialStore } from "@/stores/CommercialStore";

export function AboutPage() {
  const commercial = useCommercialStore((store) => store.state);
  const loaded = useCommercialStore((store) => store.loaded);
  const load = useCommercialStore((store) => store.load);

  useEffect(() => {
    if (!loaded) void load();
  }, [load, loaded]);

  return (
    <section className="screen-page about-screen">
      <div className="about-card">
        <Logo />
        <p className="mt-5 text-sm text-app-muted">Phiên bản {appConfig.version.replace(/^v/, "")}</p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-app-muted">
          RemixAI Pro là ứng dụng AI mạnh mẽ giúp bạn tự động phân tích, dịch thuật, và biến đổi video một cách thông minh và nhanh chóng.
        </p>
        <div className="about-features">
          <AboutFeature icon={BrainCircuit} title="AI Powered" text="Công nghệ AI tiên tiến" />
          <AboutFeature icon={Gauge} title="Nhanh chóng" text="Xử lý video siêu tốc" />
          <AboutFeature icon={Sparkles} title="Dễ sử dụng" text="Giao diện thân thiện" />
          <AboutFeature icon={ShieldCheck} title="Bảo mật" text="Dữ liệu an toàn" />
        </div>
        <div className="about-info">
          <span>Phiên bản</span><strong>{appConfig.version.replace(/^v/, "")}</strong>
          <span>License</span><strong>{commercial.license.message}</strong>
          <span>Credits</span><strong>{new Intl.NumberFormat("en-US").format(commercial.credits.balance)}</strong>
          <span>Updater</span><strong>{commercial.updater.message}</strong>
          <span>Installer</span><strong>{commercial.installer.message}</strong>
          <span>Trang web</span><strong>https://remixai.pro</strong>
          <span>Email hỗ trợ</span><strong>support@remixai.pro</strong>
          <span>Bản quyền</span><strong>© 2025 RemixAI Pro. All rights reserved.</strong>
        </div>
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white">
          Cảm ơn bạn đã sử dụng RemixAI Pro! <Heart size={16} fill="#ef476f" className="text-[#ef476f]" />
        </div>
      </div>
    </section>
  );
}

function AboutFeature({ icon: Icon, title, text }: { icon: typeof BrainCircuit; title: string; text: string }) {
  return (
    <div>
      <Icon size={22} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
