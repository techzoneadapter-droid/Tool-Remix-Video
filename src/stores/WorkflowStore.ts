import { create } from "zustand";
import { workflowService } from "@/services/WorkflowService";
import type { ToolRoute } from "@/types/Navigation";
import type { WorkflowJob } from "@/types/WorkflowJob";

interface WorkflowState {
  jobs: WorkflowJob[];
  activeJobId: string | null;
  start: (route: ToolRoute) => WorkflowJob;
  advanceActive: () => void;
  pauseActive: () => void;
  resumeActive: () => void;
  cancelActive: () => void;
}

function updateActiveJob(state: WorkflowState, updater: (job: WorkflowJob) => WorkflowJob): Pick<WorkflowState, "jobs"> {
  return {
    jobs: state.jobs.map((job) => (job.id === state.activeJobId ? updater(job) : job))
  };
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  jobs: [],
  activeJobId: null,
  start: (route) => {
    const job = workflowService.createJob(route);
    set((state) => ({ jobs: [job, ...state.jobs], activeJobId: job.id }));
    return job;
  },
  advanceActive: () => set((state) => updateActiveJob(state, workflowService.advance)),
  pauseActive: () =>
    set((state) =>
      updateActiveJob(state, (job) => ({
        ...job,
        status: job.status === "running" ? "paused" : job.status,
        currentStep: job.status === "running" ? "Tạm dừng" : job.currentStep
      }))
    ),
  resumeActive: () =>
    set((state) =>
      updateActiveJob(state, (job) => ({
        ...job,
        status: job.status === "paused" ? "running" : job.status,
        currentStep: job.status === "paused" ? "Tiếp tục xử lý" : job.currentStep
      }))
    ),
  cancelActive: () =>
    set((state) =>
      updateActiveJob(state, (job) => ({
        ...job,
        status: job.status === "running" || job.status === "paused" ? "cancelled" : job.status,
        currentStep: job.status === "running" || job.status === "paused" ? "Đã hủy" : job.currentStep
      }))
    )
}));

export function getActiveWorkflowJob() {
  const state = useWorkflowStore.getState();
  return state.jobs.find((job) => job.id === state.activeJobId) ?? null;
}
