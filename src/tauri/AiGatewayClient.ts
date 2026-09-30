import { invoke } from "@tauri-apps/api/core";

export type AiGatewayOperation =
  | "generate-text"
  | "transcribe"
  | "generate-subtitle"
  | "generate-voice"
  | "generate-image"
  | "generate-video";

export interface AiGatewayRequest<TPayload = unknown> {
  providerId: string;
  operation: AiGatewayOperation;
  payload: TPayload;
}

export interface AiGatewayHealth {
  status: "ready-for-adapter";
  transport: "tauri-native";
  supportedOperations: AiGatewayOperation[];
}

export class AiGatewayClient {
  health(): Promise<AiGatewayHealth> {
    return invoke<AiGatewayHealth>("ai_gateway_health");
  }

  execute<TPayload, TResult>(request: AiGatewayRequest<TPayload>): Promise<TResult> {
    return invoke<TResult>("ai_gateway_request", { request });
  }
}

export const aiGatewayClient = new AiGatewayClient();
