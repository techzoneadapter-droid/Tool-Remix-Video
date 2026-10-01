import { create } from "zustand";
import { aiProviderRegistry } from "@/services/AiProviderRegistry";
import { projectHistoryService } from "@/services/ProjectHistoryService";
import { workflowExecutionService } from "@/services/WorkflowExecutionService";
import { workflowService } from "@/services/WorkflowService";
import type { ToolRoute } from "@/types/Navigation";
import type { WorkflowExecutionInput, WorkflowJob } from "@/types/WorkflowJob";

interface WorkflowState {
  jobs: WorkflowJob[];
  activeJobId: string | null;
  start: (route: ToolRoute, input?: WorkflowExecutionInput) => Promise<WorkflowJob>;
  pauseActive: () => void;
  resumeActive: () => void;
  cancelActive: () => void;
}

function updateActiveJob(state: WorkflowState, updater: (job: WorkflowJob) => WorkflowJob): Pick<WorkflowState, "jobs"> {
  return { jobs: state.jobs.map((job) => (job.id === state.activeJobId ? updater(job) : job)) };
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  start: async (route, input = {}) => {
    await aiProviderRegistry.refreshConfig();
    const job = workflowService.createJob(route);
    set((state) => ({ jobs: [job, ...state.jobs], activeJobId: job.id }));

    if (job.status === "running") {
      void workflowExecutionService.execute(job, input, {
        getStatus: () => get().jobs.find((item) => item.id === job.id)?.status,
        getJob: () => get().jobs.find((item) => item.id === job.id),
        update: (updater) => set((state) => ({ jobs: state.jobs.map((item) => (item.id === job.id ? updater(item) : item)) }))
      }).finally(() => {
        const finished = get().jobs.find((item) => item.id === job.id);
        if (finished) void projectHistoryService.saveWorkflowJob(finished);
      });
    }
    return job;
  },
  pauseActive: () => set((state) => updateActiveJob(state, (job) => ({ ...job, status: job.status === "running" ? "paused" : job.status }))),
  resumeActive: () => set((state) => updateActiveJob(state, (job) => ({ ...job, status: job.status === "paused" ? "running" : job.status }))),
  cancelActive: () => set((state) => updateActiveJob(state, (job) => ({
    ...job,
    status: job.status === "running" || job.status === "paused" ? "cancelled" : job.status,
    currentStep: job.status === "running" || job.status === "paused" ? "Đã hủy" : job.currentStep
  })))
}));

export function getActiveWorkflowJob() {
  const state = useWorkflowStore.getState();
  return state.jobs.find((job) => job.id === state.activeJobId) ?? null;
}
