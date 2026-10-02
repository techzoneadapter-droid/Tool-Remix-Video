import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Folder,
  Maximize,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Trash2,
  UploadCloud,
  Volume2,
  X
} from "lucide-react";
import { WorkflowAiPipeline } from "@/components/WorkflowAiPipeline";
import { useExportController } from "@/hooks/useExportController";
import { useWorkflowController } from "@/hooks/useWorkflowController";
import { useCommercialStore } from "@/stores/CommercialStore";
import { aiProviderRegistry } from "@/services/AiProviderRegistry";
import { workflowService } from "@/services/WorkflowService";
import { nativeMediaClient } from "@/tauri/NativeMediaClient";
import type { ExportJob, ExportOptions } from "@/types/Export";
import type { SceneItem, ToggleSetting, WorkflowDefinition } from "@/types/Workflow";
import type { WorkflowExecutionInput, WorkflowJob, WorkflowJobStatus } from "@/types/WorkflowJob";

interface WorkflowPageProps {
  workflow: WorkflowDefinition;
}

interface ImportedVideo {
  file?: File;
  nativePath?: string;
  url?: string;
  name: string;
  sizeBytes: number;
}

interface TranslateSettingsState {
  language: string;
  voiceGender: string;
  voiceName: string;
  voiceStyle: string;
  subtitleStyle: string;
  subtitlePosition: string;
  subtitleAnimation: string;
  preserveOriginalAudio: boolean;
  syncSubtitle: boolean;
}

interface MagicSettingsState {
  characterStyle: string;
  environmentMode: string;
  backgroundPrompt: string;
  creativity: number;
  consistency: number;
  preserveContent: boolean;
  preserveDialogue: boolean;
  preserveDuration: boolean;
}

const sampleVideo = {
  name: "Khoa_hoc_vu_tru_remix.mp4",
  meta: "MP4 • 1920x1080 • 16:9 • 09:16",
  size: "128.6 MB",
  format: "MP4 (H.264)",
  resolution: "1920x1080",
  aspectRatio: "16:9",
  duration: "09:16",
  fps: "30 FPS",
  audio: "AAC Stereo"
};

const languages = [
  { id: "en", flag: "🇬🇧", title: "English", subtitle: "Tiếng Anh", tab: "EN English" },
  { id: "zh", flag: "🇨🇳", title: "中文", subtitle: "Tiếng Trung", tab: "中文 Chinese" },
  { id: "vi", flag: "🇻🇳", title: "Việt Nam", subtitle: "Tiếng Việt", tab: "VI Tiếng Việt" }
];

const localVoiceOptions = [
  "Ngọc Huyền · VieNeu local",
  "Ngọc Huyền · KorvaTTS local",
  "Bảo Kim · KorvaTTS local",
  "Khánh Vy · KorvaTTS local",
  "Phương Linh · KorvaTTS local",
  "Quỳnh Như · KorvaTTS local",
  "Marin · cloud fallback"
];

const localVoiceIds: Record<string, string> = {
  "Ngọc Huyền · VieNeu local": "Ngọc Huyền",
  "Ngọc Huyền · KorvaTTS local": "ngoc_huyen",
  "Bảo Kim · KorvaTTS local": "bao_kim",
  "Khánh Vy · KorvaTTS local": "khanh_vy",
  "Phương Linh · KorvaTTS local": "phuong_linh",
  "Quỳnh Như · KorvaTTS local": "quynh_nhu"
};

const defaultTranslateSettings: TranslateSettingsState = {
  language: "vi",
  voiceGender: "Giọng nữ",
  voiceName: "Ngọc Huyền · VieNeu local",
  voiceStyle: "Tự nhiên",
  subtitleStyle: "TikTok (2 dòng)",
  subtitlePosition: "Dưới cùng (Bottom)",
  subtitleAnimation: "Fade nhẹ",
  preserveOriginalAudio: false,
  syncSubtitle: true
};

const magicStyles = ["Realistic", "Cinematic", "Anime", "3D Cartoon", "Cyberpunk", "Fantasy"];

const workflowCreditCost: Record<WorkflowDefinition["route"], number> = {
  "auto-remix": 120,
  "auto-translate": 90,
  "auto-magic": 180
};

const exportCreditCost = 25;

const defaultMagicSettings: MagicSettingsState = {
  characterStyle: "Realistic",
  environmentMode: "Tự động",
  backgroundPrompt: "",
  creativity: 52,
  consistency: 84,
  preserveContent: true,
  preserveDialogue: true,
  preserveDuration: true
};

export function WorkflowPage({ workflow }: WorkflowPageProps) {
  const workflowController = useWorkflowController(workflow.route);
  const exportController = useExportController();
  const spendCredits = useCommercialStore((store) => store.spendCredits);
  const inputRef = useRef<HTMLInputElement>(null);
  const [importedVideo, setImportedVideo] = useState<ImportedVideo | null>(null);
  const [settings, setSettings] = useState(workflow.settings);
  const [draftSettings, setDraftSettings] = useState(workflow.settings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [translateSettings, setTranslateSettings] = useState(defaultTranslateSettings);
  const [magicSettings, setMagicSettings] = useState(defaultMagicSettings);
  const [subtitleRows, setSubtitleRows] = useState<SceneItem[]>(workflow.scenes);

  useEffect(() => {
    setSettings(workflow.settings);
    setDraftSettings(workflow.settings);
    setSubtitleRows(workflow.scenes);
    setSettingsOpen(false);
    setSearch("");
    if (workflow.route === "auto-translate") setTranslateSettings(defaultTranslateSettings);
    if (workflow.route === "auto-magic") setMagicSettings(defaultMagicSettings);
  }, [workflow]);

  useEffect(() => {
    return () => {
      if (importedVideo?.url) URL.revokeObjectURL(importedVideo.url);
    };
  }, [importedVideo]);

  const canExport = workflowController.activeJob?.status === "completed";
  const filteredSettings = useMemo(
    () => draftSettings.filter((setting) => setting.label.toLowerCase().includes(search.trim().toLowerCase())),
    [draftSettings, search]
  );

  function handleFile(file: File) {
    setImportedVideo((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return { file, url: URL.createObjectURL(file), name: file.name, sizeBytes: file.size };
    });
  }

  async function pickVideoFromMachine() {
    try {
      const selection = await nativeMediaClient.pickVideo();
      if (!selection) return;
      setImportedVideo((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return {
          nativePath: selection.path,
          name: selection.name,
          sizeBytes: selection.sizeBytes
        };
      });
    } catch {
      inputRef.current?.click();
    }
  }

  function resetImport() {
    setImportedVideo((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  function updateSetting(label: string, enabled: boolean, target: "saved" | "draft" = "saved") {
    const updater = (items: ToggleSetting[]) => items.map((item) => (item.label === label ? { ...item, enabled } : item));
    if (target === "draft") setDraftSettings(updater);
    else setSettings(updater);
  }

  function openSettings() {
    setDraftSettings(settings);
    setSearch("");
    setSettingsOpen(true);
  }

  function saveSettings() {
    setSettings(draftSettings);
    setSettingsOpen(false);
  }

  function resetSettings() {
    setDraftSettings(workflow.settings);
  }

  async function startWorkflow() {
    if (workflow.route !== "auto-magic" && !importedVideo?.nativePath) {
      await pickVideoFromMachine();
      return;
    }

    const targetLanguage = (["en", "zh", "vi"].includes(translateSettings.language) ? translateSettings.language : "vi") as "en" | "zh" | "vi";
    const selectedVoiceId = targetLanguage !== "vi"
      ? "marin"
      : localVoiceIds[translateSettings.voiceName] ?? "Ngọc Huyền";
    const input: WorkflowExecutionInput = {
      mediaPath: importedVideo?.nativePath,
      mediaName: importedVideo?.name,
      targetLanguage,
      voiceId: selectedVoiceId,
      voiceStyle: translateSettings.voiceStyle,
      idea: magicSettings.backgroundPrompt.trim() || undefined,
      visualStyle: magicSettings.characterStyle,
      aspectRatio: "16:9"
    };

    await aiProviderRegistry.refreshConfig();
    const missing = workflowService.getMissingCapabilities(workflow.route);
    if (missing.length > 0) {
      await workflowController.start(input);
      return;
    }

    const approved = await spendCredits({ amount: workflowCreditCost[workflow.route], reason: workflow.title });
    if (!approved) return;
    await workflowController.start(input);
  }

  function resetWorkflowView() {
    setSettings(workflow.settings);
    setDraftSettings(workflow.settings);
    setSubtitleRows(workflow.scenes);
    setTranslateSettings(defaultTranslateSettings);
    setMagicSettings(defaultMagicSettings);
  }

  function getExportOptions(): ExportOptions {
    const artifacts = workflowController.activeJob?.artifacts;
    const generatedVideo = artifacts?.video?.videoPath;
    return {
      workflowRoute: workflow.route,
      inputPath: generatedVideo ?? importedVideo?.nativePath ?? importedVideo?.file?.name ?? sampleVideo.name,
      outputPath: `D:\\RemixAI\\Exports\\${workflow.route}-${Date.now()}.mp4`,
      format: sampleVideo.format,
      codec: "h264",
      resolution: sampleVideo.resolution,
      aspectRatio: "16:9",
      quality: "Cao",
      voicePath: generatedVideo ? undefined : artifacts?.voice?.audioPath,
      subtitleContent: artifacts?.subtitles?.content,
      preserveOriginalAudio: workflow.route === "auto-translate" ? translateSettings.preserveOriginalAudio : false
    };
  }

  function startExport() {
    if (!canExport) return;
    void spendCredits({ amount: exportCreditCost, reason: `${workflow.title} export` }).then((approved) => {
      if (approved) void exportController.enqueue(getExportOptions());
    });
  }

  return (
    <motion.div className="workflow-shell" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
      <div className="mb-5 flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-extrabold text-white">{workflow.title}</h1>
            <span className={`mode-pill ${workflow.theme}`}>{workflow.badge}</span>
          </div>
          <p className="mt-2 max-w-4xl text-sm text-app-muted">{workflow.description}</p>
        </div>
        <div className="flex gap-3">
          {workflow.actions.map((action) => {
            const Icon = action.icon;
            const actionHandler =
              action.intent === "start" || action.intent === "regenerate"
                ? startWorkflow
                : action.intent === "export"
                  ? startExport
                : action.intent === "settings"
                  ? resetWorkflowView
                  : undefined;
            return (
              <button
                key={action.label}
                className={action.primary ? "workflow-action-primary" : "workflow-action"}
                disabled={action.intent === "export" && !canExport}
                onClick={actionHandler}
              >
                <Icon size={17} />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>

      <WorkflowAiPipeline route={workflow.route} />

      <div className="workflow-workspace-grid">
        <aside className="space-y-4">
          <WorkflowPanel step="1" title="Nhập video">
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept="video/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <div
              className="upload-box"
              onClick={() => void pickVideoFromMachine()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file?.type.startsWith("video/")) handleFile(file);
              }}
            >
              <UploadCloud size={42} />
              <span>Kéo & thả video vào đây</span>
              <small>hoặc</small>
              <button type="button" onClick={(event) => { event.stopPropagation(); void pickVideoFromMachine(); }}>Chọn video từ máy</button>
            </div>
            <SelectedFile importedVideo={importedVideo} onRemove={resetImport} />
            <VideoInfoPanel importedVideo={importedVideo} />
          </WorkflowPanel>

          <WorkflowPanel step="2" title={`Cài đặt ${workflow.title}`}>
            <div className="workflow-panel-header-action">
              <span>{workflow.route === "auto-translate" ? "Chọn ngôn ngữ, giọng đọc và phụ đề" : "Kích hoạt các tính năng AI"}</span>
              <button onClick={openSettings}>
                Cài đặt nâng cao
                <SlidersHorizontal size={14} />
              </button>
            </div>
            {workflow.route === "auto-magic" ? <MagicWorkspaceSettings value={magicSettings} onChange={setMagicSettings} /> : null}
            {workflow.route === "auto-translate" ? (
              <TranslateWorkspaceSettings value={translateSettings} onChange={setTranslateSettings} />
            ) : null}
            <div className="mt-4 space-y-3">
              {settings.map((setting) => (
                <ToggleRow key={`${workflow.route}-${setting.label}`} setting={setting} onChange={(enabled) => updateSetting(setting.label, enabled)} />
              ))}
            </div>
            <button className={`workflow-start ${workflow.theme}`} onClick={startWorkflow}>
              <Play size={16} />
              {workflow.primaryLabel}
            </button>
          </WorkflowPanel>
        </aside>

        <section className="min-w-0 space-y-4">
          <WorkflowStatusPanel
            status={workflowController.activeJob?.status ?? "queued"}
            progress={workflowController.activeJob?.progress ?? 0}
            currentStep={workflowController.activeJob?.currentStep ?? "Sẵn sàng xử lý"}
            logs={workflowController.activeJob?.logs ?? []}
            queueCount={workflowController.queue.length}
            onPause={workflowController.pause}
            onResume={workflowController.resume}
            onCancel={workflowController.cancel}
          />
          <WorkflowArtifactsPanel job={workflowController.activeJob} />
          <WorkflowPanel step="3" title={workflow.previewTitle}>
            <VideoPreview importedVideo={importedVideo} variant={workflow.previewVariant} translate={workflow.route === "auto-translate"} />
          </WorkflowPanel>
          <WorkflowPanel step="4" title={workflow.timelineTitle} compact>
            {workflow.route === "auto-translate" ? (
              <SubtitleEditor rows={subtitleRows} settings={translateSettings} onRowsChange={setSubtitleRows} />
            ) : (
              <SceneTimeline workflow={workflow} />
            )}
          </WorkflowPanel>
          <WorkflowPanel step="5" title={workflow.route === "auto-remix" ? "Xuất nhanh" : "Xuất & Lưu"} compact>
            <ExportBar canExport={canExport} activeJob={exportController.activeJob} queueCount={exportController.queue.length} onExport={startExport} />
          </WorkflowPanel>
        </section>
      </div>

      <AnimatePresence>
        {settingsOpen ? (
          <SettingsDrawer
            workflow={workflow}
            search={search}
            onSearch={setSearch}
            settings={filteredSettings}
            onChange={(label, enabled) => updateSetting(label, enabled, "draft")}
            onSave={saveSettings}
            onCancel={() => setSettingsOpen(false)}
            onReset={resetSettings}
          />
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function SelectedFile({ importedVideo, onRemove }: { importedVideo: ImportedVideo | null; onRemove: () => void }) {
  const fileSize = importedVideo ? `${(importedVideo.sizeBytes / 1024 / 1024).toFixed(1)} MB` : sampleVideo.size;
  const fileName = importedVideo?.name ?? sampleVideo.name;

  return (
    <div className="selected-file">
      <div className="project-thumb space" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{fileName}</div>
        <div className="mt-1 text-xs text-app-muted">{sampleVideo.meta}</div>
        <div className="mt-1 text-xs text-app-muted">09:16 &nbsp;&nbsp; {fileSize}</div>
        {importedVideo?.nativePath ? <div className="mt-1 truncate text-[10px] text-emerald-300/65" title={importedVideo.nativePath}>{importedVideo.nativePath}</div> : null}
      </div>
      <button className="icon-clear" aria-label="Remove selected video" onClick={onRemove}>
        <X size={18} />
      </button>
    </div>
  );
}

function VideoInfoPanel({ importedVideo }: { importedVideo: ImportedVideo | null }) {
  const details = [
    ["Định dạng", sampleVideo.format],
    ["Độ phân giải", sampleVideo.resolution],
    ["Tỷ lệ", sampleVideo.aspectRatio],
    ["Thời lượng", sampleVideo.duration],
    ["Khung hình", sampleVideo.fps],
    ["Âm thanh", sampleVideo.audio],
    ["Dung lượng", importedVideo ? `${(importedVideo.sizeBytes / 1024 / 1024).toFixed(1)} MB` : sampleVideo.size],
    ["Đường dẫn native", importedVideo?.nativePath ? "Đã nhận" : "Chưa có"],
    ["Trạng thái", importedVideo ? (importedVideo.nativePath ? "Sẵn sàng cho AI/FFmpeg" : "Web preview") : "Video mẫu"]
  ];

  return (
    <div className="video-info-panel">
      <div className="video-info-title">
        <span>Thông tin video</span>
        <strong>{importedVideo ? "Imported" : "Demo"}</strong>
      </div>
      <div className="video-info-grid">
        {details.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}


function WorkflowArtifactsPanel({ job }: { job: WorkflowJob | null }) {
  if (!job?.artifacts && !job?.error) return null;
  const artifacts = job.artifacts;
  const rows: Array<{ label: string; value: string }> = [];

  if (artifacts?.transcript?.transcript) rows.push({ label: "Transcript", value: artifacts.transcript.transcript });
  if (artifacts?.translatedTranscript?.transcript) rows.push({ label: "Bản dịch", value: artifacts.translatedTranscript.transcript });
  if (artifacts?.analysis) rows.push({ label: "AI Analysis", value: artifacts.analysis });
  if (artifacts?.script) rows.push({ label: "Kịch bản", value: artifacts.script });
  if (artifacts?.visualPrompt) rows.push({ label: "Visual Prompt", value: artifacts.visualPrompt });
  if (artifacts?.narration) rows.push({ label: "Narration", value: artifacts.narration });
  if (artifacts?.voice?.audioPath) rows.push({ label: "Voice file", value: artifacts.voice.audioPath });
  if (artifacts?.subtitles?.content) rows.push({ label: "Subtitle", value: `${artifacts.subtitles.format.toUpperCase()} · ${artifacts.subtitles.content.split("\n").filter(Boolean).length} dòng dữ liệu` });
  if (artifacts?.images?.imagePaths.length) rows.push({ label: "Ảnh AI", value: `${artifacts.images.imagePaths.length} file · ${artifacts.images.imagePaths[0]}` });
  if (artifacts?.video?.videoPath) rows.push({ label: "Video AI", value: artifacts.video.videoPath });
  if (job.error) rows.push({ label: "Lỗi", value: job.error });

  if (rows.length === 0) return null;

  return (
    <motion.section className="rounded-[18px] border border-white/[0.07] bg-black/15 p-4" layout transition={{ duration: 0.18 }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-purple-300/80">AI Output</div>
          <div className="mt-1 text-[11px] text-white/35">Kết quả thật được cập nhật sau từng bước pipeline.</div>
        </div>
        <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[10px] font-bold text-white/45">{job.progress}%</span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {rows.map((row) => (
          <article key={row.label} className="min-w-0 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">{row.label}</div>
            <div className={`mt-1.5 max-h-24 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 ${row.label === "Lỗi" ? "text-red-200" : "text-white/65"}`}>{row.value}</div>
          </article>
        ))}
      </div>
    </motion.section>
  );
}

function WorkflowStatusPanel({
  status,
  progress,
  currentStep,
  logs,
  queueCount,
  onPause,
  onResume,
  onCancel
}: {
  status: WorkflowJobStatus;
  progress: number;
  currentStep: string;
  logs: Array<{ time: string; message: string }>;
  queueCount: number;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}) {
  const statusLabel: Record<WorkflowJobStatus, string> = {
    queued: "Sẵn sàng",
    running: "Đang xử lý",
    paused: "Tạm dừng",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    blocked: "Cần API / adapter",
    failed: "Lỗi xử lý"
  };

  return (
    <motion.section className="workflow-status-panel" layout transition={{ duration: 0.18 }}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className={`status-dot ${status}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h2>{statusLabel[status]}</h2>
            <span>{queueCount} trong hàng đợi</span>
          </div>
          <p>{currentStep}</p>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="workflow-controls">
        <button onClick={onPause} disabled={status !== "running"}>
          <Pause size={15} />
          Tạm dừng
        </button>
        <button onClick={onResume} disabled={status !== "paused"}>
          <Play size={15} />
          Tiếp tục
        </button>
        <button onClick={onCancel} disabled={status !== "running" && status !== "paused"}>
          <X size={15} />
          Hủy
        </button>
      </div>
      <div className="workflow-log">
        {(logs.length > 0 ? logs.slice(-3) : [{ time: "--:--:--", message: "Chưa có tác vụ đang chạy." }]).map((log) => (
          <div key={`${log.time}-${log.message}`}>
            <span>{log.time}</span>
            {log.message}
          </div>
        ))}
      </div>
    </motion.section>
  );
}

function WorkflowPanel({ step, title, children, compact = false }: { step: string; title: string; children: ReactNode; compact?: boolean }) {
  return (
    <motion.section className={`workflow-panel ${compact ? "workflow-panel-compact" : ""}`} layout transition={{ duration: 0.18 }}>
      <h2>
        <span>{step}</span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function VideoPreview({ importedVideo, variant, translate }: { importedVideo: ImportedVideo | null; variant: WorkflowDefinition["previewVariant"]; translate: boolean }) {
  return (
    <div className="video-preview">
      <div className={`preview-art ${variant}`}>
        {importedVideo?.url ? <video src={importedVideo.url} controls={false} muted /> : null}
        {importedVideo?.nativePath && !importedVideo.url ? (
          <div className="grid h-full min-h-[260px] place-items-center px-8 text-center">
            <div>
              <div className="text-sm font-bold text-white/80">Video native đã sẵn sàng</div>
              <div className="mt-2 text-xs text-white/40">AI, STT và FFmpeg sẽ dùng đường dẫn tệp thật. Preview native sẽ được nối ở bước media engine tiếp theo.</div>
            </div>
          </div>
        ) : null}
        {!importedVideo && translate ? (
          <div className="subtitle-preview">
            Vũ trụ là một nơi vô tận
            <br />
            đầy bí ẩn và kỳ diệu.
          </div>
        ) : null}
      </div>
      <div className="video-controls">
        <Play size={17} />
        <SkipBack size={17} />
        <SkipForward size={17} />
        <Volume2 size={17} />
        <span>00:00:00 / 00:09:16</span>
        <div className="ml-auto flex gap-2">
          <button className="selected">16:9</button>
          <button>9:16</button>
          <button>1:1</button>
          <button aria-label="Fullscreen">
            <Maximize size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

function SceneTimeline({ workflow }: { workflow: WorkflowDefinition }) {
  return (
    <>
      <div className="timeline-meta">
        <span>Tổng cảnh: 12</span>
        <span>Thời lượng: 09:16</span>
        <span>Tỷ lệ giữ nội dung: 98%</span>
      </div>
      <div className="scene-strip">
        {workflow.scenes.map((scene) => (
          <article key={scene.id} className="scene-card">
            <div className="flex justify-between text-sm font-semibold text-white">
              <span>{scene.id}</span>
              <span className="text-xs text-app-muted">{scene.time}</span>
            </div>
            <div className={`scene-thumb ${workflow.previewVariant}`} />
            <div className="mt-3 text-sm font-semibold text-white">{scene.title}</div>
            <p className="mt-1 truncate text-xs text-app-muted">{scene.description}</p>
            <span className={`scene-tag ${workflow.theme}`}>{scene.tag}</span>
            <button aria-label="Scene actions" className="scene-more">
              <MoreHorizontal size={15} />
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function SubtitleEditor({
  rows,
  settings,
  onRowsChange
}: {
  rows: SceneItem[];
  settings: TranslateSettingsState;
  onRowsChange: (rows: SceneItem[]) => void;
}) {
  const selectedLanguage = languages.find((language) => language.id === settings.language) ?? languages[0];
  const [editingId, setEditingId] = useState<string | null>(null);

  function updateSubtitle(id: string, title: string) {
    onRowsChange(rows.map((row) => (row.id === id ? { ...row, title } : row)));
  }

  function deleteSubtitle(id: string) {
    if (rows.length > 1) onRowsChange(rows.filter((row) => row.id !== id));
  }

  function addSubtitle() {
    const nextIndex = rows.length + 1;
    onRowsChange([
      ...rows,
      {
        id: String(nextIndex).padStart(2, "0"),
        time: `00:00:${String(nextIndex * 4).padStart(2, "0")} - 00:00:${String(nextIndex * 4 + 4).padStart(2, "0")}`,
        title: "New translated subtitle line.",
        description: "Manually added subtitle row.",
        tag: selectedLanguage.id.toUpperCase()
      }
    ]);
  }

  return (
    <div className="subtitle-layout">
      <div className="subtitle-table">
        <div className="subtitle-toolbar">
          <button onClick={() => onRowsChange(rows.map((row) => ({ ...row, tag: selectedLanguage.id.toUpperCase() })))}>
            <RefreshCw size={15} />
            Dịch lại
          </button>
          <button onClick={() => onRowsChange(rows.map((row, index) => ({ ...row, time: `00:00:${String(index * 4).padStart(2, "0")} - 00:00:${String(index * 4 + 4).padStart(2, "0")}` })))}>
            <SlidersHorizontal size={15} />
            Tự động căn thời gian
          </button>
        </div>
        <div className="subtitle-tabs">
          {languages.map((language) => (
            <button key={language.id} className={language.id === settings.language ? "selected" : ""}>
              {language.tab}
            </button>
          ))}
          <button aria-label="Add subtitle language" onClick={addSubtitle}>
            <Plus size={16} />
          </button>
        </div>
        {rows.map((row) => (
          <div key={row.id} className="subtitle-row">
            <button className="mini-action" aria-label={`Preview subtitle ${row.id}`}>
              <Play size={14} />
            </button>
            <span>{row.id}</span>
            <span>{row.time}</span>
            {editingId === row.id ? (
              <input className="subtitle-input" value={row.title} onChange={(event) => updateSubtitle(row.id, event.target.value)} onBlur={() => setEditingId(null)} autoFocus />
            ) : (
              <strong>{row.title}</strong>
            )}
            <button className="mini-action" aria-label={`Edit subtitle ${row.id}`} onClick={() => setEditingId(row.id)}>
              <Pencil size={14} />
            </button>
            <button className="mini-action" aria-label={`Delete subtitle ${row.id}`} onClick={() => deleteSubtitle(row.id)}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="subtitle-style">
        <div className="font-semibold text-white">Xem trước kiểu phụ đề</div>
        <div className="subtitle-style-image">
          <div className="subtitle-style-preview">{rows[0]?.title ?? "The universe is an infinite place full of mysteries."}</div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-app-muted">
          <span>Font: Inter</span>
          <span>Kiểu: {settings.subtitleStyle}</span>
          <span>Vị trí: {settings.subtitlePosition}</span>
          <span>Giọng: {settings.voiceName}</span>
          <span>Style: {settings.voiceStyle}</span>
          <span>Animation: {settings.subtitleAnimation}</span>
        </div>
      </div>
    </div>
  );
}

function TranslateWorkspaceSettings({
  value,
  onChange
}: {
  value: TranslateSettingsState;
  onChange: (value: TranslateSettingsState) => void;
}) {
  function patch(partial: Partial<TranslateSettingsState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="translate-settings-block">
      <div>
        <span>Chọn ngôn ngữ đích</span>
        <div className="language-picker">
          {languages.map((language) => (
            <button key={language.id} className={value.language === language.id ? "selected" : ""} onClick={() => patch({ language: language.id })}>
              <span>{language.flag}</span>
              <span>{language.title}</span>
              <span>{language.subtitle}</span>
            </button>
          ))}
          <button aria-label="Add language">
            <span>+</span>
            <span>Thêm</span>
            <span>ngôn ngữ</span>
          </button>
        </div>
      </div>
      <div>
        <span>Giọng đọc AI</span>
        <div className="translate-control-grid">
          <button onClick={() => patch({ voiceGender: value.voiceGender === "Giọng nữ" ? "Giọng nam" : "Giọng nữ" })}>{value.voiceGender}</button>
          <button
            onClick={() => {
              const currentIndex = localVoiceOptions.indexOf(value.voiceName);
              const nextVoice = localVoiceOptions[(currentIndex + 1) % localVoiceOptions.length];
              patch({ voiceName: nextVoice });
            }}
          >
            {value.voiceName}
          </button>
          <button className="listen-button" onClick={() => patch({ voiceStyle: value.voiceStyle === "Tự nhiên" ? "Truyền cảm" : "Tự nhiên" })}>
            <Play size={14} />
            {value.voiceStyle}
          </button>
        </div>
      </div>
      <div>
        <span>Tùy chọn phụ đề</span>
        <div className="translate-control-grid">
          <button onClick={() => patch({ subtitleStyle: value.subtitleStyle === "TikTok (2 dòng)" ? "YouTube Clean" : "TikTok (2 dòng)" })}>{value.subtitleStyle}</button>
          <button onClick={() => patch({ subtitlePosition: value.subtitlePosition === "Dưới cùng (Bottom)" ? "Giữa màn hình" : "Dưới cùng (Bottom)" })}>{value.subtitlePosition}</button>
          <button onClick={() => patch({ subtitleAnimation: value.subtitleAnimation === "Fade nhẹ" ? "Pop mềm" : "Fade nhẹ" })}>{value.subtitleAnimation}</button>
        </div>
      </div>
      <div className="space-y-3">
        <TranslateSwitch label="Giữ nguyên âm thanh gốc" checked={value.preserveOriginalAudio} onChange={(checked) => patch({ preserveOriginalAudio: checked })} />
        <TranslateSwitch label="Tự động đồng bộ phụ đề" checked={value.syncSubtitle} onChange={(checked) => patch({ syncSubtitle: checked })} />
      </div>
    </div>
  );
}

function TranslateSwitch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button className="workflow-toggle-row" onClick={() => onChange(!checked)}>
      <div className="text-sm font-semibold text-white">{label}</div>
      <span className={`toggle ${checked ? "toggle-on" : ""}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function ExportBar({
  canExport,
  activeJob,
  queueCount,
  onExport
}: {
  canExport: boolean;
  activeJob: ExportJob | null;
  queueCount: number;
  onExport: () => void;
}) {
  const options = [
    ["Định dạng", "MP4 (H.264)"],
    ["Độ phân giải", "1920x1080 (Full HD)"],
    ["Tỷ lệ khung hình", "16:9"],
    ["Chất lượng", "Cao"],
    ["Thư mục lưu", "D:\\RemixAI\\Exports"]
  ];

  return (
    <div className="export-bar">
      {options.map(([label, option]) => (
        <label key={label}>
          <span>{label}</span>
          <button>{option}</button>
        </label>
      ))}
      <button className="folder-button" aria-label="Choose export folder">
        <Folder size={16} />
      </button>
      <button className="export-button" disabled={!canExport} onClick={onExport}>
        <Download size={17} />
        Xuất ngay
      </button>
      {activeJob ? (
        <div className="export-job-status">
          <span>{activeJob.message}</span>
          <strong>{activeJob.status === "running" ? `${activeJob.progress}%` : activeJob.status}</strong>
          {queueCount > 1 ? <small>{queueCount} jobs</small> : null}
        </div>
      ) : null}
    </div>
  );
}

function ToggleRow({ setting, onChange }: { setting: ToggleSetting; onChange: (enabled: boolean) => void }) {
  return (
    <button className="workflow-toggle-row" onClick={() => onChange(!setting.enabled)}>
      <div>
        <div className="text-sm font-semibold text-white">{setting.label}</div>
        {setting.description ? <div className="mt-1 text-xs text-app-muted">{setting.description}</div> : null}
      </div>
      <span className={`toggle ${setting.enabled ? "toggle-on" : ""}`} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}

function SettingsDrawer({
  workflow,
  search,
  onSearch,
  settings,
  onChange,
  onSave,
  onCancel,
  onReset
}: {
  workflow: WorkflowDefinition;
  search: string;
  onSearch: (search: string) => void;
  settings: ToggleSetting[];
  onChange: (label: string, enabled: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  return (
    <motion.div
      className="settings-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <motion.section
        className="settings-drawer"
        initial={{ opacity: 0, x: 28 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 28 }}
        transition={{ duration: 0.2 }}
      >
        <div className="settings-drawer-title">
          <div>
            <span className={`mode-pill ${workflow.theme}`}>{workflow.badge}</span>
            <h2>Cài đặt nâng cao</h2>
            <p>{workflow.title} sẽ chỉ chạy các module đang bật.</p>
          </div>
          <button className="icon-clear" onClick={onCancel} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        <label className="settings-search">
          <Search size={17} />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Tìm module hoặc tùy chọn" />
        </label>

        <div className="settings-group">
          <h3>Module tự động</h3>
          <div className="space-y-3">
            {settings.map((setting) => (
              <ToggleRow key={`drawer-${setting.label}`} setting={setting} onChange={(enabled) => onChange(setting.label, enabled)} />
            ))}
          </div>
        </div>

        <div className="settings-drawer-actions">
          <button className="secondary-button" onClick={onReset}>
            <RotateCcw size={16} />
            Reset
          </button>
          <button className="secondary-button" onClick={onCancel}>
            Hủy
          </button>
          <button className="dialog-save" onClick={onSave}>
            <Save size={16} />
            Lưu cài đặt
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

function MagicWorkspaceSettings({
  value,
  onChange
}: {
  value: MagicSettingsState;
  onChange: (value: MagicSettingsState) => void;
}) {
  function patch(partial: Partial<MagicSettingsState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="magic-detail-settings">
      <div>
        <span>Phong cách video</span>
        <div className="magic-style-picker">
          {magicStyles.map((style) => (
            <button key={style} className={value.characterStyle === style ? "selected" : ""} onClick={() => patch({ characterStyle: style })}>
              <span className={`style-swatch style-${style.toLowerCase().replace(/\s+/g, "-")}`} />
              {style}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span>Bối cảnh mới</span>
        <div className="magic-segmented">
          {["Tự động", "Ngẫu nhiên", "Tùy chỉnh mô tả"].map((mode) => (
            <button key={mode} className={value.environmentMode === mode ? "selected" : ""} onClick={() => patch({ environmentMode: mode })}>
              {mode}
            </button>
          ))}
        </div>
        <label className="magic-prompt-box">
          <textarea
            maxLength={500}
            value={value.backgroundPrompt}
            onChange={(event) => patch({ backgroundPrompt: event.target.value })}
            placeholder="Mô tả bối cảnh bạn muốn tạo (ví dụ: thành phố tương lai, rừng nhiệt đới, sa mạc, không gian...)"
          />
          <span>{value.backgroundPrompt.length}/500</span>
        </label>
      </div>
      <div>
        <span>Mức độ sáng tạo</span>
        <div className="magic-slider">
          <input type="range" min="0" max="100" value={value.creativity} onChange={(event) => patch({ creativity: Number(event.target.value) })} />
          <div>
            <span>Thấp</span>
            <span>Trung bình</span>
            <span>Cao</span>
          </div>
        </div>
      </div>
      <div>
        <span>Mức độ nhất quán</span>
        <div className="magic-slider">
          <input type="range" min="0" max="100" value={value.consistency} onChange={(event) => patch({ consistency: Number(event.target.value) })} />
          <div>
            <span>Linh hoạt</span>
            <span>Cân bằng</span>
            <span>Ổn định</span>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <TranslateSwitch label="Giữ nguyên nội dung & ý nghĩa" checked={value.preserveContent} onChange={(checked) => patch({ preserveContent: checked })} />
        <TranslateSwitch label="Giữ nguyên lời thoại & giọng nói" checked={value.preserveDialogue} onChange={(checked) => patch({ preserveDialogue: checked })} />
        <TranslateSwitch label="Giữ nhịp độ & thời lượng" checked={value.preserveDuration} onChange={(checked) => patch({ preserveDuration: checked })} />
      </div>
    </div>
  );
}
