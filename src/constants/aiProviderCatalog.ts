import { getProviderEnvKey, type ProviderId } from "@/config/providerConfig";
import type { ProviderCapability } from "@/providers/Provider";

export type ProviderCategory = "language" | "speech" | "voice" | "image" | "video" | "multi";

export interface AiProviderCatalogItem {
  id: ProviderId;
  name: string;
  category: ProviderCategory;
  description: string;
  capabilities: ProviderCapability[];
  recommendedFor: string[];
  modelHint: string;
  endpointHint: string;
}

export const aiProviderCatalog: AiProviderCatalogItem[] = [
  { id: "gemini", name: "Google Gemini", category: "language", description: "Phân tích video, viết lại kịch bản, dịch, tạo prompt và kiểm tra chất lượng.", capabilities: ["llm"], recommendedFor: ["Phân tích", "Dịch", "Viết lại", "Storyboard"], modelHint: "Gemini Flash / Pro", endpointHint: "Google AI / Vertex AI" },
  { id: "openAI", name: "OpenAI", category: "multi", description: "Cổng dự phòng đa năng cho LLM, speech, voice và tạo ảnh.", capabilities: ["llm", "speech", "voice", "image"], recommendedFor: ["Kịch bản", "STT", "Voice", "Ảnh"], modelHint: "Chọn model theo tài khoản", endpointHint: "OpenAI API" },
  { id: "anthropic", name: "Anthropic Claude", category: "language", description: "LLM dự phòng cho phân tích nội dung dài, viết kịch bản và lập kế hoạch cảnh.", capabilities: ["llm"], recommendedFor: ["Kịch bản", "Phân tích dài"], modelHint: "Claude Sonnet / Opus", endpointHint: "Anthropic API" },
  { id: "openRouter", name: "OpenRouter", category: "language", description: "Một cổng cho nhiều model LLM, dùng làm fallback khi cần đổi model nhanh.", capabilities: ["llm"], recommendedFor: ["Fallback LLM", "A/B model"], modelHint: "Model tùy chọn", endpointHint: "OpenRouter API" },
  { id: "deepgram", name: "Deepgram", category: "speech", description: "Chuyển giọng nói thành văn bản và tạo mốc thời gian phụ đề.", capabilities: ["speech", "subtitle"], recommendedFor: ["STT", "Subtitle", "Timestamp"], modelHint: "Nova", endpointHint: "Deepgram API" },
  { id: "elevenLabs", name: "ElevenLabs", category: "voice", description: "Thuyết minh, clone voice và tạo giọng đọc tự nhiên cho nhiều ngôn ngữ.", capabilities: ["voice"], recommendedFor: ["Voice over", "Dubbing"], modelHint: "Multilingual TTS", endpointHint: "ElevenLabs API" },
  { id: "flux", name: "FLUX", category: "image", description: "Tạo ảnh/b-roll khớp với câu thoại, storyboard và phong cách hình ảnh.", capabilities: ["image"], recommendedFor: ["Voice → ảnh", "B-roll", "Thumbnail"], modelHint: "FLUX Kontext", endpointHint: "Provider endpoint" },
  { id: "replicate", name: "Replicate", category: "multi", description: "Cổng dự phòng cho nhiều model tạo ảnh và video.", capabilities: ["image", "video"], recommendedFor: ["Ảnh", "Video fallback"], modelHint: "Model tùy chọn", endpointHint: "Replicate API" },
  { id: "fal", name: "fal.ai", category: "multi", description: "Cổng inference nhanh cho image/video generation và các model mới.", capabilities: ["image", "video"], recommendedFor: ["Ảnh", "Video", "Fast inference"], modelHint: "Model tùy chọn", endpointHint: "fal.ai API" },
  { id: "googleVeo", name: "Google Veo", category: "video", description: "Tạo clip mới từ prompt hoặc storyboard cho Auto Magic và Idea-to-Video.", capabilities: ["video"], recommendedFor: ["Idea → video", "Scene generation"], modelHint: "Veo", endpointHint: "Google / Vertex AI" },
  { id: "kling", name: "Kling", category: "video", description: "Video generation fallback cho các cảnh cần chuyển động rõ.", capabilities: ["video"], recommendedFor: ["Video fallback"], modelHint: "Kling Video", endpointHint: "Kling API" },
  { id: "runway", name: "Runway", category: "video", description: "Video generation fallback và thử nghiệm phong cách chuyển động.", capabilities: ["video"], recommendedFor: ["Video fallback", "Style test"], modelHint: "Runway Gen", endpointHint: "Runway API" }
];

export function getProviderConfigKey(id: ProviderId) {
  return getProviderEnvKey(id);
}
