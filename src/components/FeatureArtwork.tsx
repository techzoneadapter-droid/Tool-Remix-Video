import type { FeatureTheme } from "@/types/Dashboard";

interface FeatureArtworkProps {
  theme: FeatureTheme;
}

export function FeatureArtwork({ theme }: FeatureArtworkProps) {
  if (theme === "translate") {
    return (
      <div className="artwork translate-art">
        <div className="globe" />
        <span className="bubble left">EN</span>
        <span className="bubble right">中文</span>
        <span className="bubble bottom">VI</span>
        <div className="wave" />
      </div>
    );
  }

  if (theme === "magic") {
    return (
      <div className="artwork magic-art">
        <div className="portrait before" />
        <div className="arrow-glow">→</div>
        <div className="portrait after" />
      </div>
    );
  }

  return (
    <div className="artwork remix-art">
      <div className="orbit" />
      <div className="film-strip">
        <span />
        <span />
        <span />
      </div>
      <div className="ai-core">AI</div>
    </div>
  );
}
