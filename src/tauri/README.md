# Tauri integration boundary

This folder contains frontend-facing helpers for commands exposed by the native Tauri application in `src-tauri`.

## AI provider secrets

- Development can still use `VITE_*_API_KEY` variables.
- The Windows desktop build can save provider keys from Settings > AI Providers.
- Native commands store only DPAPI-encrypted blobs under the app data directory.
- React receives provider configured/not-configured status only; saved secret values are not returned to the webview.
- `src-tauri/src/secret_store.rs` owns save/list/delete/read operations and is the only layer that should expose decrypted credentials to future native provider adapters.

## AI gateway

`AiGatewayClient.ts` remains the stable frontend boundary for text, speech, subtitle, voice, image, and video operations. Provider HTTP adapters should stay native and resolve credentials through the secret store instead of putting long-lived keys in React state.

## Connected text adapters

The native gateway now executes real text-generation calls for:

- OpenAI Responses API (default model: `gpt-5.6-luna`)
- Gemini Interactions API (default model: `gemini-3.8-flash`)

Provider calls resolve credentials inside the native layer. For local development you can also expose native process environment variables such as `OPENAI_API_KEY` or `GEMINI_API_KEY`; do not use `VITE_*` secrets for production.
