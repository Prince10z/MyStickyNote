import { randomUUID } from "node:crypto";
import { app, BrowserWindow, desktopCapturer, ipcMain, session, shell, systemPreferences } from "electron";
import { MetadataService } from "./MetadataService";
import { TranscriptionClient } from "./TranscriptionClient";
import { RollingSummaryService } from "./RollingSummaryService";
import { SessionRepository } from "./SessionRepository";
import type { CaptureSource, RecordingState, StartRecordingRequest, TranscriptEvent } from "./types";

interface RegistrationOptions {
  getGlobalConfig: () => any;
  isTrustedSender: (url: string) => boolean;
}

let state: RecordingState = "idle";
let ownerWebContentsId: number | undefined;
let selectedSourceId: string | undefined;
let transcription: TranscriptionClient | undefined;
let summaryService: RollingSummaryService | undefined;
const repository = new SessionRepository();
const maxAudioFrameBytes = 256 * 1024;

const normalizeAudioPayload = (payload: unknown): Uint8Array | undefined => {
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (ArrayBuffer.isView(payload)) {
    return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
  }
  return undefined;
};

const broadcast = (channel: string, payload: unknown) => {
  BrowserWindow.getAllWindows().forEach(window => window.webContents.send(channel, payload));
};

const setState = (next: RecordingState, message?: string) => {
  state = next;
  broadcast("recording:state", { state, message, at: Date.now() });
};

const stopActiveRecording = async () => {
  const activeTranscription = transcription;
  transcription = undefined;
  await activeTranscription?.close().catch(error => {
    console.warn("[recording] Failed to flush transcription before stopping", error);
  });
  summaryService?.close();
  summaryService = undefined;
  void repository.finish();
  selectedSourceId = undefined;
  ownerWebContentsId = undefined;
  if (state !== "idle") setState("idle");
};

export function registerRecordingFeature(options: RegistrationOptions): void {
  const useNativeDisplayPicker = process.platform === "darwin";

  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      if (!options.isTrustedSender(request.frame?.url || request.securityOrigin || "")) {
        console.warn("[recording] Blocked display capture from an untrusted origin");
        return callback({});
      }
      const sources = await desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 0, height: 0 } });
      const source = sources.find(item => item.id === selectedSourceId);
      if (!source) {
        console.warn("[recording] Selected capture source is no longer available", { selectedSourceId });
        return callback({});
      }
      const canUseLoopbackAudio = process.platform === "win32";
      console.info("[recording] Granting display capture", {
        source: source.name,
        platform: process.platform,
        audio: canUseLoopbackAudio ? "loopback" : "system-picker-or-unavailable",
      });
      if (canUseLoopbackAudio) {
        callback({ video: source, audio: "loopback" });
      } else {
        callback({ video: source });
      }
    } catch (error) {
      console.error("[recording] Display capture failed", error);
      callback({});
    }
  }, { useSystemPicker: useNativeDisplayPicker });

  const authorize = (event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent) => {
    if (!options.isTrustedSender(event.senderFrame?.url || event.sender.getURL())) {
      throw new Error("Blocked recording request from an untrusted renderer origin");
    }
  };

  ipcMain.handle("recording:get-sources", async event => {
    authorize(event);
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 0, height: 0 },
        fetchWindowIcons: false,
      });
      return sources.map((source): CaptureSource => ({
        id: source.id,
        name: source.name,
        kind: source.id.startsWith("screen:") ? "screen" : "window",
        displayId: source.display_id,
      }));
    } catch (error) {
      console.warn("[recording] Unable to list capture sources", error);
      if (process.platform === "darwin") {
        throw new Error("Screen & System Audio Recording permission is required. Open macOS recording settings, allow myStickynote (or Electron during development), then restart the app.");
      }
      throw new Error("Unable to list screens and windows. Check desktop capture permissions, then restart the app.");
    }
  });

  ipcMain.handle("recording:get-permissions", event => {
    authorize(event);
    return {
      platform: process.platform,
      microphone: systemPreferences.getMediaAccessStatus("microphone"),
      screen: systemPreferences.getMediaAccessStatus("screen"),
      accessibility: process.platform === "darwin" ? systemPreferences.isTrustedAccessibilityClient(false) : true,
    };
  });

  ipcMain.handle("recording:open-permissions", async event => {
    authorize(event);
    if (process.platform !== "darwin") return false;
    await shell.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture");
    return true;
  });

  ipcMain.handle("recording:request-microphone", async event => {
    authorize(event);
    return process.platform === "darwin"
      ? systemPreferences.askForMediaAccess("microphone")
      : systemPreferences.getMediaAccessStatus("microphone") !== "denied";
  });

  ipcMain.handle("recording:start", async (event, input: StartRecordingRequest) => {
    authorize(event);
    if (state !== "idle") throw new Error("A recording is already active");
    if (!input || typeof input.sourceId !== "string" || input.sourceId.length > 300) throw new Error("Invalid capture source");

    setState("connecting");
    ownerWebContentsId = event.sender.id;
    const recordingOwnerId = event.sender.id;
    event.sender.once("destroyed", () => {
      if (ownerWebContentsId === recordingOwnerId) stopActiveRecording();
    });
    selectedSourceId = input.sourceId;
    const metadata = await new MetadataService().capture(String(input.sourceName || "").slice(0, 500));
    const globalConfig = options.getGlobalConfig() || {};
    const openAI = globalConfig.providers?.openai || {};
    const deepSeek = globalConfig.providers?.deepseek || {};

    const emit = (transcriptEvent: TranscriptEvent) => {
      broadcast("recording:transcript", transcriptEvent);
      if (transcriptEvent.type === "final" && transcriptEvent.text) {
        repository.appendTranscript(transcriptEvent.text);
        summaryService?.add(transcriptEvent.text);
      }
      if (transcriptEvent.type === "summary" && transcriptEvent.text) repository.setSummary(transcriptEvent.text);
      if (transcriptEvent.type === "error" && (state === "recording" || state === "paused")) {
        setState("error", transcriptEvent.message || "Transcription stopped unexpectedly");
        setTimeout(() => {
          if (state === "error") stopActiveRecording();
        }, 1500);
      }
    };

    const gatewayUrl = globalConfig.transcription?.gatewayUrl || process.env.TRANSCRIPTION_GATEWAY_URL;
    const gatewayToken = globalConfig.transcription?.token || process.env.TRANSCRIPTION_GATEWAY_TOKEN;

    const useDeepSeekSummary = globalConfig.activeProvider === "deepseek" && Boolean(deepSeek.apiKey);
    summaryService = new RollingSummaryService(
      useDeepSeekSummary ? deepSeek.apiKey : openAI.apiKey,
      useDeepSeekSummary ? (deepSeek.model || "deepseek-chat") : (openAI.model || "gpt-4o-mini"),
      emit,
      useDeepSeekSummary ? "https://api.deepseek.com/v1/chat/completions" : undefined,
    );
    transcription = new TranscriptionClient({
      gatewayUrl,
      gatewayToken,
      openAIKey: openAI.apiKey,
      model: globalConfig.transcription?.model || "gpt-realtime-whisper",
    }, emit);

    try {
      await transcription.connect(metadata);
      const id = randomUUID();
      await repository.start(id, metadata);
      setState("recording");
      console.info("[recording] Session started", {
        source: metadata.contentTitle,
        sourceType: metadata.sourceType,
        transcriptionMode: transcription.getMode(),
      });
      return { id, metadata };
    } catch (error) {
      await transcription?.close().catch(closeError => {
        console.warn("[recording] Failed to close transcription after start error", closeError);
      });
      void repository.finish();
      selectedSourceId = undefined;
      ownerWebContentsId = undefined;
      transcription = undefined;
      summaryService?.close();
      summaryService = undefined;
      setState("error", error instanceof Error ? error.message : "Unable to start transcription");
      setTimeout(() => setState("idle"), 1500);
      throw error;
    }
  });

  ipcMain.on("recording:audio", (event, bytes: unknown) => {
    try {
      authorize(event);
      if (event.sender.id !== ownerWebContentsId || state !== "recording") return;
      const audioFrame = normalizeAudioPayload(bytes);
      if (!audioFrame || audioFrame.byteLength === 0 || audioFrame.byteLength > maxAudioFrameBytes) return;
      transcription?.appendAudio(audioFrame);
    } catch (error) {
      console.warn("[recording] Rejected audio frame", error);
    }
  });

  ipcMain.handle("recording:pause", event => {
    authorize(event);
    if (event.sender.id !== ownerWebContentsId || state !== "recording") return;
    transcription?.pause();
    setState("paused");
  });

  ipcMain.handle("recording:resume", event => {
    authorize(event);
    if (event.sender.id !== ownerWebContentsId || state !== "paused") return;
    transcription?.resume();
    setState("recording");
  });

  ipcMain.handle("recording:stop", async event => {
    authorize(event);
    if (event.sender.id !== ownerWebContentsId) return;
    await stopActiveRecording();
    console.info("[recording] Session stopped");
  });

  app.once("before-quit", stopActiveRecording);

  console.info("[recording] Audio intelligence services registered");
}
