import { randomUUID } from "node:crypto";
import { app, BrowserWindow, desktopCapturer, ipcMain, session, systemPreferences } from "electron";
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

const broadcast = (channel: string, payload: unknown) => {
  BrowserWindow.getAllWindows().forEach(window => window.webContents.send(channel, payload));
};

const setState = (next: RecordingState, message?: string) => {
  state = next;
  broadcast("recording:state", { state, message, at: Date.now() });
};

const stopActiveRecording = () => {
  transcription?.close();
  transcription = undefined;
  summaryService?.close();
  summaryService = undefined;
  void repository.finish();
  selectedSourceId = undefined;
  ownerWebContentsId = undefined;
  if (state !== "idle") setState("idle");
};

export function registerRecordingFeature(options: RegistrationOptions): void {
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    const sources = await desktopCapturer.getSources({ types: ["screen", "window"], thumbnailSize: { width: 0, height: 0 } });
    const source = sources.find(item => item.id === selectedSourceId);
    if (!source) return callback({});
    callback({ video: source, audio: "loopback" });
  });

  const authorize = (event: Electron.IpcMainInvokeEvent | Electron.IpcMainEvent) => {
    if (!options.isTrustedSender(event.senderFrame?.url || event.sender.getURL())) {
      throw new Error("Blocked recording request from an untrusted renderer origin");
    }
  };

  ipcMain.handle("recording:get-sources", async event => {
    authorize(event);
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
  });

  ipcMain.handle("recording:get-permissions", event => {
    authorize(event);
    return {
      microphone: systemPreferences.getMediaAccessStatus("microphone"),
      screen: systemPreferences.getMediaAccessStatus("screen"),
      accessibility: process.platform === "darwin" ? systemPreferences.isTrustedAccessibilityClient(false) : true,
    };
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

    const emit = (transcriptEvent: TranscriptEvent) => {
      broadcast("recording:transcript", transcriptEvent);
      if (transcriptEvent.type === "final" && transcriptEvent.text) {
        repository.appendTranscript(transcriptEvent.text);
        summaryService?.add(transcriptEvent.text);
      }
      if (transcriptEvent.type === "summary" && transcriptEvent.text) repository.setSummary(transcriptEvent.text);
    };

    summaryService = new RollingSummaryService(openAI.apiKey, openAI.model || "gpt-4o-mini", emit);
    transcription = new TranscriptionClient({
      gatewayUrl: globalConfig.transcription?.gatewayUrl || process.env.TRANSCRIPTION_GATEWAY_URL,
      gatewayToken: globalConfig.transcription?.token || process.env.TRANSCRIPTION_GATEWAY_TOKEN,
      openAIKey: openAI.apiKey,
      model: globalConfig.transcription?.model || "gpt-realtime-whisper",
    }, emit);

    try {
      await transcription.connect(metadata);
      const id = randomUUID();
      await repository.start(id, metadata);
      setState("recording");
      console.info("[recording] Session started", { source: metadata.contentTitle, sourceType: metadata.sourceType });
      return { id, metadata };
    } catch (error) {
      transcription?.close();
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

  ipcMain.on("recording:audio", (event, bytes: Uint8Array) => {
    try {
      authorize(event);
      if (event.sender.id !== ownerWebContentsId || state !== "recording") return;
      if (!(bytes instanceof Uint8Array) || bytes.byteLength > 256 * 1024) return;
      transcription?.appendAudio(bytes);
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

  ipcMain.handle("recording:stop", event => {
    authorize(event);
    if (event.sender.id !== ownerWebContentsId) return;
    stopActiveRecording();
    console.info("[recording] Session stopped");
  });

  app.once("before-quit", stopActiveRecording);

  console.info("[recording] Audio intelligence services registered");
}
