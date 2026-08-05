import { useEffect } from "react";
import { useWorkflowStore } from "@/stores/WorkflowStore";
import type { ToolRoute } from "@/types/Navigation";

export function useWorkflowController(route: ToolRoute) {
  const jobs = useWorkflowStore((state) => state.jobs);
  const activeJobId = useWorkflowStore((state) => state.activeJobId);
  const start = useWorkflowStore((state) => state.start);
  const advanceActive = useWorkflowStore((state) => state.advanceActive);
  const pauseActive = useWorkflowStore((state) => state.pauseActive);
  const resumeActive = useWorkflowStore((state) => state.resumeActive);
  const cancelActive = useWorkflowStore((state) => state.cancelActive);
  const activeJob = jobs.find((job) => job.id === activeJobId && job.route === route) ?? null;

  useEffect(() => {
    if (!activeJob || activeJob.status !== "running") return;

    const timer = window.setInterval(advanceActive, 1400);
    return () => window.clearInterval(timer);
  }, [activeJob, advanceActive]);

  return {
    activeJob,
    queue: jobs,
    start: () => start(route),
    pause: pauseActive,
    resume: resumeActive,
    cancel: cancelActive
  };
}
