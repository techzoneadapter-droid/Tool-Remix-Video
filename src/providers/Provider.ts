export type ProviderCapability =
  | "llm"
  | "speech"
  | "subtitle"
  | "voice"
  | "image"
  | "video"
  | "ocr"
  | "scene-detection"
  | "object-detection"
  | "face-analysis";

export interface ProviderHealth {
  id: string;
  name: string;
  status: "ready" | "blocked";
  configured: boolean;
  capabilities: ProviderCapability[];
  missingConfigKeys: string[];
  message: string;
}

export interface AiProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: ProviderCapability[];
  getHealth(): ProviderHealth;
}

export interface TextGenerationRequest {
  prompt: string;
  systemInstruction?: string;
}

export interface TextGenerationResult {
  text: string;
  model: string;
}

export interface TextGenerationProvider extends AiProvider {
  generateText(request: TextGenerationRequest): Promise<TextGenerationResult>;
}

export interface SpeechTranscriptionRequest {
  mediaPath: string;
  language?: "en" | "zh" | "vi";
}

export interface SpeechTranscriptionResult {
  transcript: string;
  language: string;
  confidence: number;
  segments: Array<{ start: number; end: number; text: string }>;
}

export interface SpeechProvider extends AiProvider {
  transcribe(request: SpeechTranscriptionRequest): Promise<SpeechTranscriptionResult>;
}

export interface SubtitleGenerationRequest {
  transcript: SpeechTranscriptionResult;
  targetLanguage: "en" | "zh" | "vi";
}

export interface SubtitleGenerationResult {
  format: "srt" | "vtt";
  content: string;
}

export interface SubtitleProvider extends AiProvider {
  generateSubtitles(request: SubtitleGenerationRequest): Promise<SubtitleGenerationResult>;
}

export interface VoiceGenerationRequest {
  text: string;
  voiceId: string;
  language: "en" | "zh" | "vi";
  style?: string;
}

export interface VoiceGenerationResult {
  audioPath: string;
  durationSeconds: number;
}

export interface VoiceProvider extends AiProvider {
  generateVoice(request: VoiceGenerationRequest): Promise<VoiceGenerationResult>;
}

export interface VideoGenerationRequest {
  prompt: string;
  durationSeconds: number;
  aspectRatio: "16:9" | "9:16" | "1:1";
  referenceVideoPath?: string;
}

export interface VideoGenerationResult {
  videoPath: string;
  providerJobId: string;
}

export interface VideoGenerationProvider extends AiProvider {
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult>;
}

export interface ProviderConfigReader {
  has(key: string): boolean;
}
