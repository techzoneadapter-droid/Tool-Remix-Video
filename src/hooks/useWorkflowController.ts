import { useWorkflowStore } from "@/stores/WorkflowStore";
import type { ToolRoute } from "@/types/Navigation";
import type { WorkflowExecutionInput } from "@/types/WorkflowJob";

export function useWorkflowController(route: ToolRoute) {
  const jobs = useWorkflowStore((state) => state.jobs);
  const activeJobId = useWorkflowStore((state) => state.activeJobId);
  const start = useWorkflowStore((state) => state.start);
  const pauseActive = useWorkflowStore((state) => state.pauseActive);
  const resumeActive = useWorkflowStore((state) => state.resumeActive);
  const cancelActive = useWorkflowStore((state) => state.cancelActive);
  const activeJob = jobs.find((job) => job.id === activeJobId && job.route === route) ?? null;

  return {
    activeJob,
    queue: jobs,
    start: (input?: WorkflowExecutionInput) => start(route, input),
    pause: pauseActive,
    resume: resumeActive,
    cancel: cancelActive
  };
}
