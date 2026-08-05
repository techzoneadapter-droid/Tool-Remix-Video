import { aiProviderRegistry } from "@/services/AiProviderRegistry";
import { projectHistoryService } from "@/services/ProjectHistoryService";
import type { ToolRoute } from "@/types/Navigation";
import type { WorkflowJob, WorkflowStep } from "@/types/WorkflowJob";

const workflowSteps: Record<ToolRoute, WorkflowStep[]> = {
  "auto-remix": [
    { id: "analysis", label: "Phân tích video", progressWeight: 12, requiredCapabilities: ["llm"] },
    { id: "scene", label: "Nhận diện cảnh", progressWeight: 12, requiredCapabilities: ["scene-detection"] },
    { id: "speech", label: "Nhận diện giọng nói", progressWeight: 10, requiredCapabilities: ["speech"] },
    { id: "ocr", label: "OCR nội dung trong hình", progressWeight: 8, requiredCapabilities: ["ocr"] },
    { id: "rewrite", label: "Viết lại kịch bản", progressWeight: 14, requiredCapabilities: ["llm"] },
    { id: "caption", label: "Tạo phụ đề", progressWeight: 10, requiredCapabilities: ["subtitle"] },
    { id: "music", label: "Trộn nhạc nền", progressWeight: 8, requiredCapabilities: [] },
    { id: "enhance", label: "Tối ưu hình ảnh", progressWeight: 12, requiredCapabilities: [] },
    { id: "export", label: "Xuất video", progressWeight: 14, requiredCapabilities: [] }
  ],
  "auto-translate": [
    { id: "speech", label: "Nhận diện giọng nói", progressWeight: 22, requiredCapabilities: ["speech"] },
    { id: "translate", label: "Dịch kịch bản", progressWeight: 18, requiredCapabilities: ["llm"] },
    { id: "voice", label: "Tạo giọng đọc mới", progressWeight: 22, requiredCapabilities: ["voice"] },
    { id: "subtitle", label: "Tạo phụ đề", progressWeight: 18, requiredCapabilities: ["subtitle"] },
    { id: "mix", label: "Trộn âm thanh", progressWeight: 10, requiredCapabilities: [] },
    { id: "export", label: "Xuất video", progressWeight: 10, requiredCapabilities: [] }
  ],
  "auto-magic": [
    { id: "analysis", label: "Phân tích câu chuyện", progressWeight: 16, requiredCapabilities: ["llm"] },
    { id: "character", label: "Viết lại nhân vật", progressWeight: 14, requiredCapabilities: ["llm"] },
    { id: "environment", label: "Viết lại bối cảnh", progressWeight: 14, requiredCapabilities: ["llm"] },
    { id: "prompt", label: "Tạo prompt nhất quán", progressWeight: 16, requiredCapabilities: ["llm"] },
    { id: "video", label: "Tạo video mới", progressWeight: 28, requiredCapabilities: ["video"] },
    { id: "export", label: "Xuất video", progressWeight: 12, requiredCapabilities: [] }
  ]
};

const workflowNames: Record<ToolRoute, string> = {
  "auto-remix": "Auto Remix",
  "auto-translate": "Auto Dịch",
  "auto-magic": "Auto Magic"
};

export class WorkflowService {
  createJob(route: ToolRoute): WorkflowJob {
    const steps = workflowSteps[route];
    const missingCapabilities = this.getMissingCapabilities(route);
    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const blocked = missingCapabilities.length > 0;

    return {
      id: `${route}-${Date.now()}`,
      route,
      title: workflowNames[route],
      status: blocked ? "blocked" : "running",
      progress: blocked ? 0 : Math.min(8, steps[0]?.progressWeight ?? 0),
      currentStep: blocked ? "Cần cấu hình AI Providers" : steps[0].label,
      createdAt: now,
      logs: [{ time: now, message: blocked ? `Thiếu provider: ${missingCapabilities.join(", ")}` : `Bắt đầu ${workflowNames[route]}` }]
    };
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

    const nextJob: WorkflowJob = {
      ...job,
      status: nextProgress >= 100 ? "completed" : "running",
      progress: nextProgress,
      currentStep: nextProgress >= 100 ? "Hoàn thành" : current,
      logs: [...job.logs, { time: now, message: nextProgress >= 100 ? "Hoàn thành và sẵn sàng xuất video" : current }]
    };

    if (nextJob.status === "completed") {
      void projectHistoryService.saveWorkflowJob(nextJob);
    }

    return nextJob;
  }

  getSteps(route: ToolRoute): WorkflowStep[] {
    return workflowSteps[route];
  }

  getMissingCapabilities(route: ToolRoute): string[] {
    const steps = workflowSteps[route];
    const requiredCapabilities = Array.from(new Set(steps.flatMap((step) => step.requiredCapabilities)));

    return requiredCapabilities.filter((capability) => aiProviderRegistry.findByCapability(capability).every((provider) => !provider.getHealth().configured));
  }
}

export const workflowService = new WorkflowService();
