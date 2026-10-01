import { invoke } from "@tauri-apps/api/core";

export interface NativeMediaSelection {
  path: string;
  name: string;
  sizeBytes: number;
}

export class NativeMediaClient {
  pickVideo(): Promise<NativeMediaSelection | null> {
    return invoke<NativeMediaSelection | null>("pick_video_file");
  }

  inspect(path: string): Promise<NativeMediaSelection> {
    return invoke<NativeMediaSelection>("inspect_video_file", { path });
  }
}

export const nativeMediaClient = new NativeMediaClient();
