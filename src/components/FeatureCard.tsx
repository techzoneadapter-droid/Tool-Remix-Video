import { Settings } from "lucide-react";
import { motion } from "framer-motion";
import { FeatureArtwork } from "@/components/FeatureArtwork";
import type { FeatureCard as FeatureCardType } from "@/types/Dashboard";
import type { ToolRoute } from "@/types/Navigation";

interface FeatureCardProps {
  feature: FeatureCardType;
  onStart: (tool: ToolRoute) => void;
  onSettings: (feature: FeatureCardType) => void;
}

export function FeatureCard({ feature, onStart, onSettings }: FeatureCardProps) {
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ duration: 0.18 }} className={`feature-card ${feature.theme}`}>
      <FeatureArtwork theme={feature.theme} />
      <div className="flex items-center gap-3">
        <div className="step-badge">{feature.step}</div>
        <h2 className="text-[30px] font-extrabold leading-none text-white">{feature.title}</h2>
        <span className="ml-auto rounded-full border border-current/30 px-3 py-1 text-xs font-bold">{feature.badge}</span>
      </div>
      <p className="mt-4 min-h-[78px] text-[15px] leading-7 text-app-muted">{feature.description}</p>
      <div className="mt-5 flex items-center gap-3">
        <button className="primary-action flex-1" onClick={() => onStart(feature.id)}>
          {feature.buttonLabel}
        </button>
        <button className="settings-action" onClick={() => onSettings(feature)} aria-label={`${feature.title} settings`}>
          <Settings size={22} />
        </button>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs text-app-muted">
        {feature.highlights.map((highlight) => {
          const Icon = highlight.icon;
          return (
            <div key={highlight.label} className="min-w-0">
              <Icon className="mx-auto mb-2 text-white/80" size={18} />
              <div className="truncate">{highlight.label}</div>
            </div>
          );
        })}
      </div>
      {feature.footer ? <div className="mt-3 text-center text-sm text-app-muted">{feature.footer}</div> : null}
    </motion.article>
  );
}
