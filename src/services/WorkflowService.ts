import { aiProviderRegistry } from "@/services/AiProviderRegistry";
import { projectHistoryService } from "@/services/ProjectHistoryService";
import type { ProviderCapability } from "@/providers/Provider";
import type { ToolRoute } from "@/types/Navigation";
import type { WorkflowJob, WorkflowStep } from "@/types/WorkflowJob";

const workflowSteps: Record<ToolRoute, WorkflowStep[]> = {
  "auto-remix": [
    { id: "analysis", label: "Phân tích nội dung & mục tiêu", progressWeight: 10, requiredCapabilities: ["llm"], optionalCapabilities: ["object-detection", "face-analysis"] },
    { id: "scene", label: "Nhận diện cảnh", progressWeight: 8, requiredCapabilities: ["scene-detection"] },
    { id: "speech", label: "Chuyển giọng nói thành văn bản", progressWeight: 9, requiredCapabilities: ["speech"] },
    { id: "ocr", label: "OCR nội dung trong hình", progressWeight: 6, requiredCapabilities: ["ocr"] },
    { id: "rewrite", label: "Viết lại kịch bản & CTA", progressWeight: 12, requiredCapabilities: ["llm"] },
    { id: "visual", label: "Tạo ảnh/B-roll khớp lời thoại", progressWeight: 12, requiredCapabilities: [], optionalCapabilities: ["image", "video"] },
    { id: "voice", label: "Tạo/thay giọng đọc", progressWeight: 9, requiredCapabilities: [], optionalCapabilities: ["voice"] },
    { id: "caption", label: "Tạo phụ đề thông minh", progressWeight: 9, requiredCapabilities: ["subtitle"] },
    { id: "music", label: "Trộn nhạc nền", progressWeight: 6, requiredCapabilities: [] },
    { id: "enhance", label: "Tối ưu hình ảnh & nhịp dựng", progressWeight: 7, requiredCapabilities: [] },
    { id: "export", label: "Kiểm tra chất lượng & xuất video", progressWeight: 12, requiredCapabilities: [] }
  ],
  "auto-translate": [
    { id: "speech", label: "Chuyển giọng nói thành văn bản", progressWeight: 20, requiredCapabilities: ["speech"] },
    { id: "translate", label: "Dịch theo ngữ cảnh", progressWeight: 18, requiredCapabilities: ["llm"] },
    { id: "voice", label: "Tạo thuyết minh AI", progressWeight: 22, requiredCapabilities: ["voice"] },
    { id: "subtitle", label: "Tạo & đồng bộ phụ đề", progressWeight: 18, requiredCapabilities: ["subtitle"] },
    { id: "mix", label: "Đồng bộ thời lượng & trộn âm thanh", progressWeight: 10, requiredCapabilities: [] },
    { id: "export", label: "Kiểm tra chất lượng & xuất video", progressWeight: 12, requiredCapabilities: [] }
  ],
  "auto-magic": [
    { id: "idea", label: "Phân tích video hoặc ý tưởng đầu vào", progressWeight: 12, requiredCapabilities: ["llm"] },
    { id: "script", label: "Tạo kịch bản & storyboard", progressWeight: 14, requiredCapabilities: ["llm"] },
    { id: "character", label: "Thiết kế nhân vật & bối cảnh", progressWeight: 12, requiredCapabilities: ["llm"], optionalCapabilities: ["image"] },
    { id: "prompt", label: "Tạo prompt nhất quán theo scene", progressWeight: 12, requiredCapabilities: ["llm"] },
    { id: "visual", label: "Tạo keyframe / ảnh tham chiếu", progressWeight: 12, requiredCapabilities: [], optionalCapabilities: ["image"] },
    { id: "video", label: "Tạo các scene video", progressWeight: 24, requiredCapabilities: ["video"] },
    { id: "audio", label: "Voice & subtitle tự động", progressWeight: 7, requiredCapabilities: [], optionalCapabilities: ["voice", "subtitle"] },
    { id: "export", label: "Ghép scene & xuất video", progressWeight: 7, requiredCapabilities: [] }
  ]
};

const workflowNames: Record<ToolRoute, string> = { "auto-remix": "Auto Remix", "auto-translate": "Auto Dịch", "auto-magic": "Auto Magic" };

export class WorkflowService {
  createJob(route: ToolRoute): WorkflowJob {
    const steps = workflowSteps[route];
    const missingCapabilities = this.getMissingCapabilities(route);
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const blocked = missingCapabilities.length > 0;
    return { id: `${route}-${Date.now()}`, route, title: workflowNames[route], status: blocked ? "blocked" : "running", progress: blocked ? 0 : Math.min(8, steps[0]?.progressWeight ?? 0), currentStep: blocked ? "Cần cấu hình AI Providers" : steps[0].label, createdAt: now, logs: [{ time: now, message: blocked ? `Thiếu capability: ${missingCapabilities.join(", ")}` : `Bắt đầu ${workflowNames[route]}` }] };
  }

  advance(job: WorkflowJob): WorkflowJob {
    if (job.status !== "running") return job;
    const steps = workflowSteps[job.route];
    const nextProgress = Math.min(100, job.progress + 18);
    const cumulative = steps.reduce<Array<{ label: string; threshold: number }>>((items, step) => {
      const previous = items.length > 0 ? items[items.length - 1].threshold : 0;
      return [...items, { label: step.label, threshold: previous + step.progressWeight }];
    }, []);
    const current = cumulative.find((step) => nextProgress <= step.threshold)?.label ?? "Hoàn tất kiểm tra chất lượng";
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const nextJob: WorkflowJob = { ...job, status: nextProgress >= 100 ? "completed" : "running", progress: nextProgress, currentStep: nextProgress >= 100 ? "Hoàn thành" : current, logs: [...job.logs, { time: now, message: nextProgress >= 100 ? "Hoàn thành và sẵn sàng xuất video" : current }] };
    if (nextJob.status === "completed") void projectHistoryService.saveWorkflowJob(nextJob);
    return nextJob;
  }

  getSteps(route: ToolRoute): WorkflowStep[] { return workflowSteps[route]; }

  getMissingCapabilities(route: ToolRoute): ProviderCapability[] {
    const requiredCapabilities = Array.from(new Set(workflowSteps[route].flatMap((step) => step.requiredCapabilities)));
    return requiredCapabilities.filter((capability) => aiProviderRegistry.findByCapability(capability).every((provider) => !provider.getHealth().configured));
  }

  getOptionalCapabilities(route: ToolRoute): ProviderCapability[] {
    return Array.from(new Set(workflowSteps[route].flatMap((step) => step.optionalCapabilities ?? [])));
  }
}

export const workflowService = new WorkflowService();
