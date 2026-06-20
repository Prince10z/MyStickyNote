export type RecordingState = "idle" | "connecting" | "recording" | "paused" | "error";

export interface CaptureSource {
  id: string;
  name: string;
  kind: "screen" | "window";
  displayId?: string;
}

export interface StartRecordingRequest {
  sourceId: string;
  sourceName: string;
  includeMicrophone: boolean;
}

export interface SourceContext {
  application: string;
  windowTitle: string;
  contentTitle: string;
  sourceType: "meeting" | "youtube" | "browser" | "unknown";
  capturedAt: number;
}

export interface TranscriptEvent {
  type: "partial" | "final" | "summary" | "status" | "error";
  text?: string;
  message?: string;
  at: number;
}
