import { aiProviderRegistry } from "@/services/AiProviderRegistry";
import { workflowService } from "@/services/WorkflowService";
import type {
  AiProvider,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
  ProviderCapability,
  SpeechProvider,
  SpeechTranscriptionRequest,
  SpeechTranscriptionResult,
  SubtitleProvider,
  SubtitleGenerationRequest,
  SubtitleGenerationResult,
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResult,
  VideoGenerationProvider,
  VideoGenerationRequest,
  VideoGenerationResult,
  VoiceProvider,
  VoiceGenerationRequest,
  VoiceGenerationResult
} from "@/providers/Provider";
import type { WorkflowArtifacts, WorkflowExecutionInput, WorkflowJob, WorkflowJobStatus } from "@/types/WorkflowJob";

type JobUpdater = (job: WorkflowJob) => WorkflowJob;

export interface WorkflowExecutionControls {
  update: (updater: JobUpdater) => void;
  getStatus: () => WorkflowJobStatus | undefined;
  getJob: () => WorkflowJob | undefined;
}

type StepRunner = (stepId: string, action: () => Promise<void> | void) => Promise<void>;

class WorkflowCancelledError extends Error {
  constructor() {
    super("Workflow cancelled");
  }
}

function now() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isTextProvider(provider: AiProvider): provider is TextGenerationProvider {
  return typeof (provider as unknown as { generateText?: unknown }).generateText === "function";
}
function isSpeechProvider(provider: AiProvider): provider is SpeechProvider {
  return typeof (provider as unknown as { transcribe?: unknown }).transcribe === "function";
}
function isSubtitleProvider(provider: AiProvider): provider is SubtitleProvider {
  return typeof (provider as unknown as { generateSubtitles?: unknown }).generateSubtitles === "function";
}
function isVoiceProvider(provider: AiProvider): provider is VoiceProvider {
  return typeof (provider as unknown as { generateVoice?: unknown }).generateVoice === "function";
}
function isImageProvider(provider: AiProvider): provider is ImageGenerationProvider {
  return typeof (provider as unknown as { generateImage?: unknown }).generateImage === "function";
}
function isVideoProvider(provider: AiProvider): provider is VideoGenerationProvider {
  return typeof (provider as unknown as { generateVideo?: unknown }).generateVideo === "function";
}

export class WorkflowExecutionService {
  async execute(job: WorkflowJob, input: WorkflowExecutionInput, controls: WorkflowExecutionControls): Promise<void> {
    const steps = workflowService.getSteps(job.route);
    const totalWeight = Math.max(1, steps.reduce((sum, step) => sum + step.progressWeight, 0));
    let completedWeight = 0;

    const run: StepRunner = async (stepId, action) => {
      await this.waitUntilRunnable(controls);
      const step = steps.find((item) => item.id === stepId);
      if (!step) throw new Error(`Unknown workflow step: ${stepId}`);
      this.log(controls, `Bắt đầu: ${step.label}`);
      controls.update((current) => ({ ...current, currentStep: step.label }));
      await action();
      await this.waitUntilRunnable(controls);
      completedWeight += step.progressWeight;
      const progress = Math.min(99, Math.round((completedWeight / totalWeight) * 100));
      controls.update((current) => ({ ...current, progress, currentStep: step.label }));
      this.log(controls, `Xong: ${step.label}`);
    };

    try {
      if (job.route === "auto-translate") await this.runAutoTranslate(input, controls, run);
      if (job.route === "auto-remix") await this.runAutoRemix(input, controls, run);
      if (job.route === "auto-magic") await this.runAutoMagic(input, controls, run);
      await this.waitUntilRunnable(controls);
      controls.update((current) => ({
        ...current,
        status: "completed",
        progress: 100,
        currentStep: "Hoàn tất AI · sẵn sàng render / xuất",
        error: undefined,
        logs: [...current.logs, { time: now(), message: "Pipeline AI đã hoàn tất và tạo xong các asset khả dụng." }]
      }));
    } catch (error) {
      if (error instanceof WorkflowCancelledError || controls.getStatus() === "cancelled") {
        controls.update((current) => ({
          ...current,
          status: "cancelled",
          currentStep: "Đã hủy",
          logs: [...current.logs, { time: now(), message: "Tác vụ đã được hủy trước bước tiếp theo." }]
        }));
        return;
      }
      const message = errorMessage(error);
      controls.update((current) => ({
        ...current,
        status: "failed",
        currentStep: "Lỗi xử lý",
        error: message,
        logs: [...current.logs, { time: now(), message: `Lỗi: ${message}` }]
      }));
    }
  }

  private async runAutoTranslate(input: WorkflowExecutionInput, controls: WorkflowExecutionControls, run: StepRunner) {
    if (!input.mediaPath) throw new Error("Auto Dịch cần đường dẫn video native. Hãy chọn video bằng nút Chọn video từ máy.");
    const targetLanguage = input.targetLanguage ?? "en";
    let transcript: SpeechTranscriptionResult | undefined;
    let translated: SpeechTranscriptionResult | undefined;

    await run("speech", async () => {
      transcript = await this.transcribe({ mediaPath: input.mediaPath!, language: "auto" }, controls);
      this.artifact(controls, { transcript });
    });
    if (!transcript) throw new Error("Không nhận được transcript từ video.");
    const source = transcript;

    await run("translate", async () => {
      translated = await this.translateTranscript(source, targetLanguage, controls);
      this.artifact(controls, { translatedTranscript: translated });
    });
    if (!translated) throw new Error("Không tạo được bản dịch.");
    const targetTranscript = translated;

    await run("voice", async () => {
      const voice = await this.generateVoice({
        text: targetTranscript.transcript,
        voiceId: input.voiceId ?? (targetLanguage === "vi" ? "Ngọc Huyền" : "marin"),
        language: targetLanguage,
        style: input.voiceStyle ?? "Tự nhiên, rõ ràng, giữ nhịp gần với video gốc."
      }, controls);
      this.artifact(controls, { voice });
    });

    await run("subtitle", async () => {
      const subtitles = await this.generateSubtitles({ transcript: targetTranscript, targetLanguage }, controls);
      this.artifact(controls, { subtitles });
    });

    await run("mix", async () => this.note(controls, "Voice và SRT đã sẵn sàng cho FFmpeg composer; không còn dùng progress mô phỏng."));
    await run("export", async () => this.note(controls, "Pipeline AI hoàn tất. Render cuối sẽ dùng video nguồn cùng các asset voice/subtitle đã sinh."));
  }

  private async runAutoRemix(input: WorkflowExecutionInput, controls: WorkflowExecutionControls, run: StepRunner) {
    if (!input.mediaPath) throw new Error("Auto Remix cần đường dẫn video native. Hãy chọn video bằng nút Chọn video từ máy.");
    let transcript: SpeechTranscriptionResult | undefined;
    let analysis = "";
    let rewritten = "";

    await run("analysis", async () => {
      transcript = await this.transcribe({ mediaPath: input.mediaPath!, language: "auto" }, controls);
      const result = await this.generateText({
        systemInstruction: "Bạn là video editor và content strategist. Phân tích transcript video, nêu hook, thông điệp chính, nhịp nội dung, phần thừa và cơ hội tăng retention. Trả lời bằng tiếng Việt, súc tích và thực dụng.",
        prompt: this.clip(transcript.transcript, 14000)
      }, controls);
      analysis = result.text;
      this.artifact(controls, { transcript, analysis });
    });
    if (!transcript) throw new Error("Không nhận được transcript từ video.");
    const source = transcript;

    await run("scene", async () => this.note(controls, `Đã dựng scene fallback từ ${source.segments.length || 1} đoạn timestamp transcript; PySceneDetect là module local tùy chọn.`));
    await run("speech", async () => this.note(controls, `Tái sử dụng transcript ${source.transcript.length.toLocaleString("vi-VN")} ký tự, không gọi STT lần hai.`));
    await run("ocr", async () => this.note(controls, "OCR là module local tùy chọn; khi chưa có native runner, layer chữ gốc được giữ nguyên."));

    await run("rewrite", async () => {
      const result = await this.generateText({
        systemInstruction: "Bạn là biên tập viên video ngắn. Viết lại lời thoại hấp dẫn hơn nhưng không bịa dữ kiện, giữ ý chính và tạo CTA tự nhiên khi phù hợp. Chỉ trả về kịch bản mới.",
        prompt: `PHÂN TÍCH:\n${this.clip(analysis, 5000)}\n\nTRANSCRIPT:\n${this.clip(source.transcript, 14000)}`
      }, controls);
      rewritten = result.text;
      this.artifact(controls, { script: rewritten });
    });

    await run("visual", async () => {
      if (aiProviderRegistry.runnableByCapability("image").length === 0) return this.note(controls, "Không có image adapter đang hoạt động nên giữ visual gốc.");
      const images = await this.generateImage({
        prompt: `Create a cinematic supporting B-roll image for this rewritten video segment. No text overlay. Content: ${this.clip(rewritten, 1800)}`,
        aspectRatio: input.aspectRatio ?? "16:9",
        count: 1
      }, controls);
      this.artifact(controls, { images });
    });

    await run("voice", async () => {
      if (aiProviderRegistry.runnableByCapability("voice").length === 0) return this.note(controls, "Không có voice adapter đang hoạt động nên giữ giọng gốc.");
      const voice = await this.generateVoice({
        text: this.clip(rewritten, 9000),
        voiceId: input.voiceId ?? "Ngọc Huyền",
        language: "vi",
        style: input.voiceStyle ?? "Tự nhiên, truyền cảm, không đọc kiểu quảng cáo máy móc."
      }, controls);
      this.artifact(controls, { voice });
    });

    await run("caption", async () => {
      const subtitles = await this.generateSubtitles({ transcript: source, targetLanguage: "vi" }, controls);
      this.artifact(controls, { subtitles });
    });
    await run("music", async () => this.note(controls, "Music bed được giữ ở hook media local; không phát sinh API call không cần thiết."));
    await run("enhance", async () => this.note(controls, "Enhancement được chuyển cho FFmpeg/media engine ở giai đoạn render."));
    await run("export", async () => this.note(controls, "Đã chuẩn bị transcript, script, visual, voice và subtitle khả dụng cho bước render cuối."));
  }

  private async runAutoMagic(input: WorkflowExecutionInput, controls: WorkflowExecutionControls, run: StepRunner) {
    let creativeBrief = "";
    let script = "";
    let visualPrompt = "";

    await run("idea", async () => {
      let sourceContext = input.idea?.trim() || "";
      if (input.mediaPath && aiProviderRegistry.runnableByCapability("speech").length > 0) {
        const transcript = await this.transcribe({ mediaPath: input.mediaPath, language: "auto" }, controls);
        this.artifact(controls, { transcript });
        sourceContext = sourceContext ? `${sourceContext}\n\nNội dung video tham chiếu:\n${this.clip(transcript.transcript, 8000)}` : transcript.transcript;
      }
      if (!sourceContext) sourceContext = "Tạo một video ngắn 8 giây có hook rõ ràng, dễ hiểu và hình ảnh nổi bật.";
      const result = await this.generateText({
        systemInstruction: "Bạn là creative director cho video AI. Chuyển ý tưởng đầu vào thành creative brief khả thi cho một clip 8 giây, nêu chủ thể, hành động, bối cảnh, camera và cảm xúc.",
        prompt: `Phong cách: ${input.visualStyle ?? "Realistic"}\nÝ tưởng: ${this.clip(sourceContext, 10000)}`
      }, controls);
      creativeBrief = result.text;
      this.artifact(controls, { analysis: creativeBrief });
    });

    await run("script", async () => {
      const result = await this.generateText({
        systemInstruction: "Viết storyboard cho đúng một clip 8 giây. Mô tả theo mốc thời gian, hành động chính, camera và nếu có lời thoại thì tối đa 20 từ. Không thêm giải thích ngoài storyboard.",
        prompt: this.clip(creativeBrief, 8000)
      }, controls);
      script = result.text;
      this.artifact(controls, { script });
    });

    await run("character", async () => {
      const result = await this.generateText({
        systemInstruction: "Tạo visual bible cực ngắn để giữ nhân vật và bối cảnh nhất quán: ngoại hình, trang phục, ánh sáng, màu, môi trường. Không viết storyboard mới.",
        prompt: `Style: ${input.visualStyle ?? "Realistic"}\nStoryboard:\n${this.clip(script, 8000)}`
      }, controls);
      this.note(controls, `Visual bible: ${this.clip(result.text, 500)}`);
    });

    await run("prompt", async () => {
      const result = await this.generateText({
        systemInstruction: "Tạo duy nhất một prompt video generation giàu chi tiết nhưng gọn, cho clip 8 giây. Bao gồm chủ thể, hành động, bối cảnh, ánh sáng, camera, chuyển động và phong cách. Không dùng markdown, không giải thích.",
        prompt: `Creative brief:\n${this.clip(creativeBrief, 5000)}\n\nStoryboard:\n${this.clip(script, 7000)}\n\nStyle: ${input.visualStyle ?? "Realistic"}`
      }, controls);
      visualPrompt = result.text;
      this.artifact(controls, { visualPrompt });
    });

    await run("visual", async () => {
      if (aiProviderRegistry.runnableByCapability("image").length === 0) return this.note(controls, "Không có image adapter; Veo sẽ chạy text-to-video trực tiếp.");
      const images = await this.generateImage({ prompt: visualPrompt, aspectRatio: input.aspectRatio ?? "16:9", count: 1 }, controls);
      this.artifact(controls, { images });
    });

    await run("video", async () => {
      const imagePath = controls.getJob()?.artifacts?.images?.imagePaths[0];
      const video = await this.generateVideo({
        prompt: visualPrompt,
        durationSeconds: 8,
        aspectRatio: input.aspectRatio ?? "16:9",
        referenceImagePath: imagePath
      }, controls);
      this.artifact(controls, { video });
    });

    await run("audio", async () => {
      if (aiProviderRegistry.runnableByCapability("voice").length === 0) return this.note(controls, "Không có voice adapter; giữ audio do video model tạo hoặc video không voice.");
      const narrationResult = await this.generateText({
        systemInstruction: "Viết đúng một câu thuyết minh tự nhiên, tối đa 18 từ, phù hợp clip 8 giây. Chỉ trả về câu thoại.",
        prompt: this.clip(script, 5000)
      }, controls);
      const narration = narrationResult.text.trim();
      const voice = await this.generateVoice({
        text: narration,
        voiceId: input.voiceId ?? ((input.targetLanguage ?? "vi") === "vi" ? "Ngọc Huyền" : "marin"),
        language: input.targetLanguage ?? "vi",
        style: input.voiceStyle ?? "Tự nhiên, điện ảnh, ngắn gọn."
      }, controls);
      const transcript: SpeechTranscriptionResult = {
        transcript: narration,
        language: input.targetLanguage ?? "vi",
        confidence: 1,
        segments: [{ start: 0, end: 8, text: narration }]
      };
      let subtitles: SubtitleGenerationResult | undefined;
      if (aiProviderRegistry.runnableByCapability("subtitle").length > 0) {
        subtitles = await this.generateSubtitles({ transcript, targetLanguage: input.targetLanguage ?? "vi" }, controls);
      }
      this.artifact(controls, { narration, voice, ...(subtitles ? { subtitles } : {}) });
    });

    await run("export", async () => this.note(controls, "Veo MP4 và asset bổ sung đã sẵn sàng cho media composer/export."));
  }

  private async translateTranscript(transcript: SpeechTranscriptionResult, targetLanguage: "en" | "zh" | "vi", controls: WorkflowExecutionControls): Promise<SpeechTranscriptionResult> {
    const sourceSegments = transcript.segments.length > 0 ? transcript.segments : [{ start: 0, end: 4, text: transcript.transcript }];
    const sourceTexts = sourceSegments.map((segment) => segment.text);
    const result = await this.generateText({
      systemInstruction: `Bạn là dịch giả video. Dịch từng phần tử sang ${this.languageName(targetLanguage)}, giữ nguyên ý, giọng điệu và tên riêng. Trả về DUY NHẤT một JSON array chuỗi có đúng ${sourceTexts.length} phần tử, cùng thứ tự; không markdown.`,
      prompt: JSON.stringify(sourceTexts)
    }, controls);
    const translatedItems = this.parseStringArray(result.text);
    if (translatedItems?.length === sourceTexts.length) {
      return {
        transcript: translatedItems.join(" "),
        language: targetLanguage,
        confidence: transcript.confidence,
        segments: sourceSegments.map((segment, index) => ({ ...segment, text: translatedItems[index] }))
      };
    }
    const start = sourceSegments[0]?.start ?? 0;
    const sourceEnd = sourceSegments[sourceSegments.length - 1]?.end ?? 0;
    const end = sourceEnd > start ? sourceEnd : start + 4;
    return { transcript: result.text.trim(), language: targetLanguage, confidence: transcript.confidence, segments: [{ start, end, text: result.text.trim() }] };
  }

  private async generateText(request: TextGenerationRequest, controls: WorkflowExecutionControls): Promise<TextGenerationResult> {
    return (await this.callProvider("llm", ["openAI", "gemini"], isTextProvider, (provider) => provider.generateText(request), controls)).result;
  }
  private async transcribe(request: SpeechTranscriptionRequest, controls: WorkflowExecutionControls): Promise<SpeechTranscriptionResult> {
    return (await this.callProvider("speech", ["deepgram", "openAI"], isSpeechProvider, (provider) => provider.transcribe(request), controls)).result;
  }
  private async generateSubtitles(request: SubtitleGenerationRequest, controls: WorkflowExecutionControls): Promise<SubtitleGenerationResult> {
    return (await this.callProvider("subtitle", ["openAI", "deepgram"], isSubtitleProvider, (provider) => provider.generateSubtitles(request), controls)).result;
  }
  private async generateVoice(request: VoiceGenerationRequest, controls: WorkflowExecutionControls): Promise<VoiceGenerationResult> {
    const normalizedVoice = request.voiceId.trim().toLocaleLowerCase("vi-VN");
    const localOnly = normalizedVoice === "ngọc huyền" || normalizedVoice === "ngoc_huyen";
    const preferredIds = localOnly ? ["vieNeuLocal", "korvaLocal"] : ["openAI", "elevenLabs"];
    const allowedIds = localOnly ? ["vieNeuLocal", "korvaLocal"] : undefined;

    return (
      await this.callProvider(
        "voice",
        preferredIds,
        isVoiceProvider,
        (provider) => provider.generateVoice(request),
        controls,
        allowedIds
      )
    ).result;
  }
  private async generateImage(request: ImageGenerationRequest, controls: WorkflowExecutionControls): Promise<ImageGenerationResult> {
    return (await this.callProvider("image", ["openAI"], isImageProvider, (provider) => provider.generateImage(request), controls)).result;
  }
  private async generateVideo(request: VideoGenerationRequest, controls: WorkflowExecutionControls): Promise<VideoGenerationResult> {
    return (await this.callProvider("video", ["googleVeo"], isVideoProvider, (provider) => provider.generateVideo(request), controls)).result;
  }

  private async callProvider<TProvider extends AiProvider, TResult>(
    capability: ProviderCapability,
    preferredIds: string[],
    guard: (provider: AiProvider) => provider is TProvider,
    action: (provider: TProvider) => Promise<TResult>,
    controls: WorkflowExecutionControls,
    allowedIds?: string[]
  ): Promise<{ provider: TProvider; result: TResult }> {
    const runnable = aiProviderRegistry.runnableByCapability(capability);
    const ordered = [
      ...preferredIds.flatMap((id) => runnable.filter((provider) => provider.id === id)),
      ...runnable.filter((provider) => !preferredIds.includes(provider.id))
    ].filter((provider, index, all) => all.findIndex((item) => item.id === provider.id) === index);
    const providers = ordered.filter(guard).filter((provider) => !allowedIds || allowedIds.includes(provider.id));
    if (providers.length === 0) {
      if (allowedIds?.length) {
        throw new Error(`Chưa có TTS local khả dụng. Hãy chạy VieNeu-TTS hoặc cài KorvaTTS (voice local: ${allowedIds.join(", ")}).`);
      }
      throw new Error(`Không có adapter thực thi cho capability ${capability}.`);
    }

    const failures: string[] = [];
    for (const provider of providers) {
      await this.waitUntilRunnable(controls);
      try {
        this.log(controls, `Provider: ${provider.name} · ${capability}`);
        const result = await action(provider);
        return { provider, result };
      } catch (error) {
        failures.push(`${provider.name}: ${errorMessage(error)}`);
        this.log(controls, `Fallback sau lỗi ${provider.name}: ${errorMessage(error)}`);
      }
    }
    throw new Error(`Tất cả provider cho ${capability} đều lỗi. ${failures.join(" | ")}`);
  }

  private async waitUntilRunnable(controls: WorkflowExecutionControls) {
    for (;;) {
      const status = controls.getStatus();
      if (status === "cancelled") throw new WorkflowCancelledError();
      if (status !== "paused") return;
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
  }

  private log(controls: WorkflowExecutionControls, message: string) {
    controls.update((job) => ({ ...job, logs: [...job.logs, { time: now(), message }] }));
  }
  private note(controls: WorkflowExecutionControls, message: string) {
    controls.update((job) => ({
      ...job,
      artifacts: { ...job.artifacts, notes: [...(job.artifacts?.notes ?? []), message] },
      logs: [...job.logs, { time: now(), message }]
    }));
  }
  private artifact(controls: WorkflowExecutionControls, patch: Partial<WorkflowArtifacts>) {
    controls.update((job) => ({ ...job, artifacts: { ...job.artifacts, ...patch } }));
  }
  private parseStringArray(raw: string): string[] | null {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start < 0 || end <= start) return null;
    try {
      const parsed: unknown = JSON.parse(raw.slice(start, end + 1));
      if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) return null;
      return parsed as string[];
    } catch {
      return null;
    }
  }
  private languageName(language: "en" | "zh" | "vi") {
    return language === "en" ? "tiếng Anh" : language === "zh" ? "tiếng Trung" : "tiếng Việt";
  }
  private clip(value: string, limit: number) {
    const text = value.trim();
    return text.length > limit ? `${text.slice(0, limit)}…` : text;
  }
}

export const workflowExecutionService = new WorkflowExecutionService();
