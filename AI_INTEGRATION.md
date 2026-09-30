# RemixAI Pro - AI Integration Ports

The application routes AI work by capability instead of coupling screens to one vendor.

## Stable native gateway

Frontend providers call `src/tauri/AiGatewayClient.ts`. The client exposes six stable operations:

- `generate-text`
- `transcribe`
- `generate-subtitle`
- `generate-voice`
- `generate-image`
- `generate-video`

Tauri exposes the matching commands in `src-tauri/src/ai_gateway.rs`. Provider-specific HTTP/SDK adapters should be attached there so API secrets and network policy can remain outside React components.

## Provider capability map

- Gemini: LLM / analysis / translation / prompts
- OpenAI: LLM / speech-to-text / voice / image
- Deepgram: speech-to-text / subtitle timing
- ElevenLabs: voice-over / dubbing
- FLUX: image and b-roll generation
- Google Veo: video generation
- Kling / Runway: video fallbacks
- Anthropic / OpenRouter: LLM fallbacks
- Replicate / fal.ai: image/video fallbacks
- PySceneDetect / PaddleOCR / YOLO11 / InsightFace: local processing

## Automation pipelines

The UI keeps exactly three primary modes while composing internal pipelines for:

1. Speech to text
2. Translation + AI dubbing
3. Smart subtitles
4. Voice/script to matching image and b-roll
5. Idea to complete video
6. Full automatic remix

## Security note

`.env.example` documents development configuration only. Do not commit real keys. Production builds should resolve secrets in the native adapter or an OS-backed secret store rather than embedding long-lived secrets in the webview bundle.
