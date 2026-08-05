import { useExportStore } from "@/stores/ExportStore";
import type { ExportOptions } from "@/types/Export";

export function useExportController() {
  const jobs = useExportStore((state) => state.jobs);
  const activeJobId = useExportStore((state) => state.activeJobId);
  const enqueue = useExportStore((state) => state.enqueue);
  const pauseActive = useExportStore((state) => state.pauseActive);
  const resumeActive = useExportStore((state) => state.resumeActive);
  const cancelActive = useExportStore((state) => state.cancelActive);
  const activeJob = jobs.find((job) => job.id === activeJobId) ?? null;

  return {
    activeJob,
    queue: jobs,
    enqueue: (options: ExportOptions) => enqueue(options),
    pause: pauseActive,
    resume: resumeActive,
    cancel: cancelActive
  };
}
