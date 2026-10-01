import { AlertTriangle, CheckCircle2, CircleDot, Settings2 } from "lucide-react";
import { aiProviderRegistry } from "@/services/AiProviderRegistry";
import { workflowService } from "@/services/WorkflowService";
import { useAppStore } from "@/stores/AppStore";
import type { ToolRoute } from "@/types/Navigation";

const capabilityLabels: Record<string, string> = { llm: "LLM", speech: "STT", subtitle: "Subtitle", voice: "Voice", image: "Image", video: "Video", ocr: "OCR", "scene-detection": "Scene", "object-detection": "Object", "face-analysis": "Face" };

export function WorkflowAiPipeline({ route }: { route: ToolRoute }) {
  const setRoute = useAppStore((state) => state.setRoute);
  const steps = workflowService.getSteps(route);
  const aiSteps = steps.filter((step) => step.requiredCapabilities.length || step.optionalCapabilities?.length);
  const missing = new Set(workflowService.getMissingCapabilities(route));
  const optional = new Set(workflowService.getOptionalCapabilities(route));

  return (
    <section className="mb-4 rounded-[20px] border border-white/[0.07] bg-black/15 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="mr-1"><div className="text-xs font-extrabold uppercase tracking-[0.16em] text-purple-300/80">AI Pipeline</div><div className="mt-1 text-[11px] text-white/35">Capability routing · tự chọn provider đã cấu hình</div></div>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {aiSteps.map((step, index) => {
            const capabilities = [...step.requiredCapabilities, ...(step.optionalCapabilities ?? [])];
            const blocked = step.requiredCapabilities.some((capability) => missing.has(capability));
            return (
              <div key={step.id} className="flex items-center gap-2">
                <div className={`rounded-xl border px-2.5 py-2 ${blocked ? "border-amber-400/20 bg-amber-400/[0.05]" : "border-white/[0.07] bg-white/[0.025]"}`}>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/70">{blocked ? <AlertTriangle size={12} className="text-amber-300" /> : <CheckCircle2 size={12} className="text-emerald-300" />}{step.label}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {capabilities.map((capability) => {
                      const configured = aiProviderRegistry.runnableByCapability(capability).length > 0;
                      const isOptional = optional.has(capability) && !step.requiredCapabilities.includes(capability);
                      return <span key={`${step.id}-${capability}`} className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${configured ? "bg-emerald-400/10 text-emerald-300" : isOptional ? "bg-white/[0.05] text-white/35" : "bg-amber-400/10 text-amber-300"}`}>{capabilityLabels[capability] ?? capability}{isOptional ? " · opt" : ""}</span>;
                    })}
                  </div>
                </div>
                {index < aiSteps.length - 1 ? <CircleDot size={10} className="text-white/15" /> : null}
              </div>
            );
          })}
        </div>
        <button className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 text-xs font-bold text-white/65 hover:text-white" onClick={() => setRoute("settings")}><Settings2 size={14} />API</button>
      </div>
    </section>
  );
}
