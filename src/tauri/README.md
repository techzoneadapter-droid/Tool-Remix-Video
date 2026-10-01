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
