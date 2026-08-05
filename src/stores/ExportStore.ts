import { create } from "zustand";
import { exportQueueService } from "@/services/ExportQueueService";
import { settingsService } from "@/services/SettingsService";
import type { ExportJob, ExportOptions } from "@/types/Export";

interface ExportState {
  jobs: ExportJob[];
  activeJobId: string | null;
  enqueue: (options: ExportOptions) => Promise<ExportJob>;
  runNext: () => Promise<void>;
  pauseActive: () => void;
  resumeActive: () => void;
  cancelActive: () => void;
}

const persistedQueueKey = "export.queue";

function persistJobs(jobs: ExportJob[]) {
  void settingsService.save(persistedQueueKey, jobs.slice(-20));
}

function updateJob(state: ExportState, jobId: string, updater: (job: ExportJob) => ExportJob): Pick<ExportState, "jobs"> {
  return {
    jobs: state.jobs.map((job) => (job.id === jobId ? updater(job) : job))
  };
}

export const useExportStore = create<ExportState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  enqueue: async (options) => {
    const job = await exportQueueService.createJob(options);
    set((state) => {
      const jobs = [...state.jobs, job];
      persistJobs(jobs);
      return { jobs, activeJobId: state.activeJobId ?? (job.status === "queued" ? job.id : state.activeJobId) };
    });
    void get().runNext();
    return get().jobs.find((item) => item.id === job.id) ?? job;
  },
  runNext: async () => {
    const state = get();
    if (state.jobs.some((job) => job.status === "running")) return;

    const next = state.jobs.find((job) => job.status === "queued");
    if (!next) return;

    set((current) => {
      const jobs = updateJob(current, next.id, exportQueueService.start).jobs;
      persistJobs(jobs);
      return { jobs, activeJobId: next.id };
    });

    window.setTimeout(() => {
      set((current) => {
        const jobs = updateJob(current, next.id, (job) => exportQueueService.markProgress(job, 35, "Preparing export container.")).jobs;
        persistJobs(jobs);
        return { jobs };
      });
    }, 250);

    const runningJob = get().jobs.find((job) => job.id === next.id);
    if (!runningJob) return;

    const finishedJob = await exportQueueService.run(runningJob);
    set((current) => {
      const jobs = updateJob(current, next.id, (job) => (job.status === "cancelled" ? job : finishedJob)).jobs;
      persistJobs(jobs);
      return {
        jobs,
        activeJobId: jobs.find((job) => job.status === "queued")?.id ?? next.id
      };
    });
    void get().runNext();
  },
  pauseActive: () =>
    set((state) => {
      if (!state.activeJobId) return state;
      const jobs = updateJob(state, state.activeJobId, exportQueueService.pause).jobs;
      persistJobs(jobs);
      return { jobs };
    }),
  resumeActive: () => {
    set((state) => {
      if (!state.activeJobId) return state;
      const jobs = updateJob(state, state.activeJobId, exportQueueService.resume).jobs;
      persistJobs(jobs);
      return { jobs };
    });
    void get().runNext();
  },
  cancelActive: () =>
    set((state) => {
      if (!state.activeJobId) return state;
      const jobs = updateJob(state, state.activeJobId, exportQueueService.cancel).jobs;
      persistJobs(jobs);
      return {
        jobs,
        activeJobId: jobs.find((job) => job.status === "queued" || job.status === "running")?.id ?? state.activeJobId
      };
    })
}));
