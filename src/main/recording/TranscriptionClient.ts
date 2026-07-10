import WebSocket from "ws";
import type { TranscriptEvent } from "./types";

interface ConnectionOptions {
  gatewayUrl?: string;
  gatewayToken?: string;
  openAIKey?: string;
  model?: string;
}

type ClientMode = "idle" | "gateway" | "realtime" | "file";

export class TranscriptionClient {
  private socket?: WebSocket;
  private mode: ClientMode = "idle";
  private queuedBytes = 0;
  private pendingAudioBytes = 0;
  private commitTimer?: NodeJS.Timeout;
  private fileFlushTimer?: NodeJS.Timeout;
  private fileFlushInFlight?: Promise<void>;
  private fileAudioChunks: Buffer[] = [];
  private fileAudioBytes = 0;
  private fileTranscriptContext = "";
  private readyTimeout?: NodeJS.Timeout;
  private readyHandlers?: {
    resolve: () => void;
    reject: (error: Error) => void;
  };
  private readonly partialsByItem = new Map<string, string>();
  private readonly sampleRate = 24000;
  private readonly bytesPerSample = 2;
  private readonly commitIntervalMs = 4_000;
  private readonly closeFlushTimeoutMs = 2_500;
  private readonly fileFlushIntervalMs = 8_000;
  private readonly fileMinFlushBytes = 24000 * 2 * 5;
  private readonly fileMaxFlushBytes = 24000 * 2 * 18;

  constructor(
    private readonly options: ConnectionOptions,
    private readonly emit: (event: TranscriptEvent) => void,
  ) {}

  async connect(metadata: object): Promise<void> {
    const usingGateway = Boolean(this.options.gatewayUrl);
    const connectionModel = process.env.OPENAI_REALTIME_CONNECTION_MODEL || "gpt-realtime-2.1";
    const url = usingGateway
      ? this.options.gatewayUrl!
      : `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(connectionModel)}`;

    if (!usingGateway && !this.options.openAIKey) {
      throw new Error("Live audio needs a transcription gateway or an OpenAI API key. DeepSeek can summarize text, but it cannot transcribe audio.");
    }

    if (!usingGateway && this.shouldForceFileTranscription()) {
      this.startFileTranscription("Using standard OpenAI audio transcription. Transcript updates arrive every few seconds.");
      return;
    }

    const headers: Record<string, string> = usingGateway
      ? { Authorization: `Bearer ${this.options.gatewayToken || ""}` }
      : { Authorization: `Bearer ${this.options.openAIKey}` };

    try {
      this.mode = usingGateway ? "gateway" : "realtime";
      this.socket = await this.openSocket(url, headers);

      this.socket.on("message", data => this.handleMessage(data.toString()));
      this.socket.on("error", error => this.emit({ type: "error", message: error.message, at: Date.now() }));
      this.socket.on("close", code => {
        clearInterval(this.commitTimer);
        this.commitTimer = undefined;
        if (code !== 1000 && this.mode !== "file") {
          this.emit({ type: "error", message: `Transcription disconnected (${code})`, at: Date.now() });
        }
      });

      if (usingGateway) {
        this.socket.send(JSON.stringify({ type: "session.start", metadata, audio: { format: "pcm16", sampleRate: 24000, channels: 1 } }));
      } else {
        const transcriptionModel = this.options.model || "gpt-realtime-whisper";
        const ready = this.waitForSessionReady();
        this.socket.send(JSON.stringify({
          type: "session.update",
          session: {
            type: "transcription",
            audio: {
              input: {
                format: { type: "audio/pcm", rate: this.sampleRate },
                transcription: {
                  model: transcriptionModel,
                  language: process.env.TRANSCRIPTION_LANGUAGE || "en",
                  delay: this.getTranscriptionDelay(),
                },
                turn_detection: null,
              },
            },
          },
        }));
        await ready;
        this.emit({ type: "status", message: `Connected to OpenAI Realtime transcription (${transcriptionModel})`, at: Date.now() });
        this.commitTimer = setInterval(() => this.commitPendingAudio(), this.commitIntervalMs);
      }
    } catch (error) {
      if (!usingGateway && this.shouldFallbackToFileTranscription(error)) {
        this.closeSocketImmediately();
        this.startFileTranscription("OpenAI Realtime is not available for this key. Using standard audio transcription fallback.");
        return;
      }
      throw error;
    }
  }

  appendAudio(pcm: Uint8Array): void {
    if (this.mode === "file") {
      this.appendFileAudio(pcm);
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    if (pcm.byteLength > 256 * 1024 || this.socket.bufferedAmount > 2 * 1024 * 1024) {
      if (this.queuedBytes === 0) {
        this.emit({ type: "status", message: "Network is congested; dropping delayed audio.", at: Date.now() });
      }
      this.queuedBytes = this.socket.bufferedAmount;
      return;
    }

    this.queuedBytes = 0;
    if (this.mode === "gateway") {
      this.socket.send(pcm, { binary: true });
    } else {
      this.socket.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: Buffer.from(pcm).toString("base64"),
      }));
      this.pendingAudioBytes += pcm.byteLength;
    }
  }

  pause(): void {
    if (this.mode === "file") {
      void this.flushFileAudio(true);
      return;
    }

    if (this.socket?.readyState !== WebSocket.OPEN) return;
    if (this.mode === "gateway") {
      this.socket.send(JSON.stringify({ type: "session.pause" }));
    } else {
      this.commitPendingAudio(true);
    }
  }

  resume(): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.mode === "gateway") {
      this.socket.send(JSON.stringify({ type: "session.resume" }));
    }
  }

  getMode(): ClientMode {
    return this.mode;
  }

  async close(): Promise<void> {
    clearInterval(this.commitTimer);
    this.commitTimer = undefined;
    this.rejectReady(new Error("Transcription stopped before the session was ready"));

    if (this.mode === "file") {
      clearInterval(this.fileFlushTimer);
      this.fileFlushTimer = undefined;
      await this.flushFileAudio(true);
    }

    const socket = this.socket;
    if (socket?.readyState === WebSocket.OPEN) {
      if (this.mode === "gateway") {
        socket.send(JSON.stringify({ type: "session.stop" }));
        await this.waitForProviderClose(socket, this.closeFlushTimeoutMs, () => socket.close(1000, "Recording stopped"));
      } else if (this.mode === "realtime") {
        const committedFinalAudio = this.commitPendingAudio(true);
        if (committedFinalAudio) await this.waitForFinalTranscripts(this.closeFlushTimeoutMs);
        await this.waitForProviderClose(socket, 750, () => {
          if (socket.readyState === WebSocket.OPEN) socket.close(1000, "Recording stopped");
        });
      }
    }
    this.socket = undefined;
    this.pendingAudioBytes = 0;
    this.partialsByItem.clear();
    this.fileAudioChunks = [];
    this.fileAudioBytes = 0;
    this.mode = "idle";
  }

  private commitPendingAudio(force = false): boolean {
    if (this.mode !== "realtime" || this.socket?.readyState !== WebSocket.OPEN) return false;

    const oneSecondOfAudio = this.sampleRate * this.bytesPerSample;
    const minimumForcedAudio = Math.floor(oneSecondOfAudio / 4);
    const minimumBytes = force ? minimumForcedAudio : oneSecondOfAudio;
    if (this.pendingAudioBytes < minimumBytes) return false;

    this.socket.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    this.pendingAudioBytes = 0;
    return true;
  }

  private openSocket(url: string, headers: Record<string, string>): Promise<WebSocket> {
    return new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(url, { headers });
      let timeout: NodeJS.Timeout;
      const cleanup = () => {
        clearTimeout(timeout);
        socket.off("error", onError);
        socket.off("close", onClose);
      };
      const onError = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onClose = (code: number) => {
        cleanup();
        reject(new Error(`Transcription connection closed before it was ready (${code})`));
      };
      timeout = setTimeout(() => {
        cleanup();
        socket.terminate();
        reject(new Error("Transcription connection timed out"));
      }, 12_000);
      socket.once("open", () => {
        cleanup();
        resolve(socket);
      });
      socket.once("error", onError);
      socket.once("close", onClose);
    });
  }

  private closeSocketImmediately(): void {
    const socket = this.socket;
    this.socket = undefined;
    this.clearReadyWait();
    if (!socket) return;
    socket.removeAllListeners();
    if (socket.readyState === WebSocket.OPEN) socket.close(1000, "Using fallback transcription");
    else socket.terminate();
  }

  private shouldForceFileTranscription(): boolean {
    const mode = String(process.env.OPENAI_TRANSCRIPTION_MODE || "").toLowerCase();
    return mode === "file" || mode === "audio" || mode === "transcriptions";
  }

  private shouldFallbackToFileTranscription(error: unknown): boolean {
    if (process.env.OPENAI_DISABLE_TRANSCRIPTION_FALLBACK === "1") return false;
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();
    if (/(incorrect|invalid|expired)\s+api\s+key|unauthorized|authentication/.test(normalized)) return false;
    return true;
  }

  private startFileTranscription(message: string): void {
    this.mode = "file";
    this.pendingAudioBytes = 0;
    clearInterval(this.fileFlushTimer);
    this.fileFlushTimer = setInterval(() => void this.flushFileAudio(), this.fileFlushIntervalMs);
    this.emit({ type: "status", message, at: Date.now() });
  }

  private appendFileAudio(pcm: Uint8Array): void {
    if (pcm.byteLength === 0) return;
    this.fileAudioChunks.push(Buffer.from(pcm));
    this.fileAudioBytes += pcm.byteLength;
    if (this.fileAudioBytes >= this.fileMaxFlushBytes) void this.flushFileAudio();
  }

  private async flushFileAudio(force = false): Promise<void> {
    if (this.fileFlushInFlight) {
      await this.fileFlushInFlight;
      if (force && this.fileAudioBytes > 0) await this.flushFileAudio(true);
      return;
    }

    if (this.fileAudioBytes === 0 || (!force && this.fileAudioBytes < this.fileMinFlushBytes)) return;

    const pcm = Buffer.concat(this.fileAudioChunks, this.fileAudioBytes);
    this.fileAudioChunks = [];
    this.fileAudioBytes = 0;

    this.fileFlushInFlight = this.transcribeFileAudio(pcm)
      .catch(error => {
        this.emit({
          type: "error",
          message: error instanceof Error ? error.message : "Standard audio transcription failed",
          at: Date.now(),
        });
      })
      .finally(() => {
        this.fileFlushInFlight = undefined;
      });

    await this.fileFlushInFlight;
  }

  private async transcribeFileAudio(pcm: Buffer): Promise<void> {
    const primaryModel = process.env.OPENAI_FILE_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe";
    const fallbackModel = process.env.OPENAI_FILE_TRANSCRIPTION_FALLBACK_MODEL || "whisper-1";
    let text = "";

    try {
      text = await this.requestAudioTranscription(pcm, primaryModel);
    } catch (error) {
      if (primaryModel !== fallbackModel && this.shouldRetryWithFallbackModel(error)) {
        this.emit({ type: "status", message: `Retrying transcription with ${fallbackModel}`, at: Date.now() });
        text = await this.requestAudioTranscription(pcm, fallbackModel);
      } else {
        throw error;
      }
    }

    const transcript = text.trim();
    if (!transcript) return;

    this.fileTranscriptContext = `${this.fileTranscriptContext} ${transcript}`.trim().slice(-1200);
    this.emit({ type: "final", text: transcript, at: Date.now() });
  }

  private async requestAudioTranscription(pcm: Buffer, model: string): Promise<string> {
    if (!this.options.openAIKey) throw new Error("OpenAI API key is required for standard audio transcription.");

    const wav = this.createWavFile(pcm);
    const form = new FormData();
    form.append("file", new Blob([wav], { type: "audio/wav" }), `live-notes-${Date.now()}.wav`);
    form.append("model", model);
    form.append("response_format", "json");

    const language = process.env.TRANSCRIPTION_LANGUAGE || "en";
    if (language) form.append("language", language);

    const prompt = this.buildFileTranscriptionPrompt();
    if (prompt) form.append("prompt", prompt);

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.options.openAIKey}` },
      body: form,
    });
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`Standard audio transcription failed (${response.status}): ${this.extractProviderError(body)}`);
    }

    try {
      const data: any = JSON.parse(body);
      return String(data.text || "");
    } catch {
      return body;
    }
  }

  private buildFileTranscriptionPrompt(): string {
    const context = this.fileTranscriptContext.trim();
    return context
      ? `Continue this live transcript. Previous transcript context: ${context}`
      : "Transcribe the meeting or media audio accurately with punctuation.";
  }

  private shouldRetryWithFallbackModel(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();
    if (/(incorrect|invalid|expired)\s+api\s+key|unauthorized|authentication/.test(normalized)) return false;
    return /(model|not allowed|not permitted|unsupported|access|permission|404|403|400)/.test(normalized);
  }

  private extractProviderError(body: string): string {
    try {
      const data = JSON.parse(body);
      return String(data.error?.message || data.message || body).slice(0, 500);
    } catch {
      return body.slice(0, 500);
    }
  }

  private createWavFile(pcm: Buffer): Buffer {
    const header = Buffer.alloc(44);
    const dataSize = pcm.length;
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(this.sampleRate, 24);
    header.writeUInt32LE(this.sampleRate * this.bytesPerSample, 28);
    header.writeUInt16LE(this.bytesPerSample, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcm], 44 + dataSize);
  }

  private getTranscriptionDelay(): string {
    const delay = process.env.TRANSCRIPTION_DELAY || "low";
    return ["minimal", "low", "medium", "high", "xhigh"].includes(delay) ? delay : "low";
  }

  private waitForSessionReady(): Promise<void> {
    this.clearReadyWait();
    return new Promise((resolve, reject) => {
      this.readyHandlers = { resolve, reject };
      this.readyTimeout = setTimeout(() => {
        const error = new Error("OpenAI transcription session was not confirmed in time");
        this.rejectReady(error);
      }, 8_000);
    });
  }

  private resolveReady(): void {
    const handlers = this.readyHandlers;
    if (!handlers) return;
    this.clearReadyWait();
    handlers.resolve();
  }

  private rejectReady(error: Error): void {
    const handlers = this.readyHandlers;
    if (!handlers) return;
    this.clearReadyWait();
    handlers.reject(error);
  }

  private clearReadyWait(): void {
    clearTimeout(this.readyTimeout);
    this.readyTimeout = undefined;
    this.readyHandlers = undefined;
  }

  private waitForProviderClose(socket: WebSocket, timeoutMs: number, flush: () => void): Promise<void> {
    return new Promise(resolve => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        socket.off("close", finish);
        socket.off("error", finish);
        resolve();
      };
      const timeout = setTimeout(finish, timeoutMs);
      socket.once("close", finish);
      socket.once("error", finish);
      flush();
    });
  }

  private waitForFinalTranscripts(timeoutMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeoutMs));
  }

  private handleMessage(raw: string): void {
    try {
      const event = JSON.parse(raw);
      const type = String(event.type || "");

      if (type === "error") {
        const message = event.error?.message || event.message || "Unknown OpenAI error";
        if (this.readyHandlers) {
          this.rejectReady(new Error(message));
          return;
        }
        this.emit({ type: "error", message, at: Date.now() });
        return;
      }

      if (type === "session.updated" || type === "transcription_session.updated") {
        this.resolveReady();
        return;
      }

      if (type === "status") {
        this.emit({ type: "status", message: event.message || "Transcription status updated", at: Date.now() });
        return;
      }

      if (type === "conversation.item.input_audio_transcription.failed") {
        this.emit({
          type: "error",
          message: event.error?.message || "OpenAI could not transcribe the latest audio segment",
          at: Date.now(),
        });
        return;
      }

      if (type === "conversation.item.input_audio_transcription.delta") {
        const itemId = String(event.item_id || "active");
        const text = `${this.partialsByItem.get(itemId) || ""}${event.delta || ""}`;
        this.partialsByItem.set(itemId, text);
        this.emit({ type: "partial", text, at: Date.now() });
        return;
      }

      if (type === "conversation.item.input_audio_transcription.completed") {
        const itemId = String(event.item_id || "active");
        this.partialsByItem.delete(itemId);
        if (event.transcript) this.emit({ type: "final", text: event.transcript, at: Date.now() });
        return;
      }

      const text = event.delta || event.transcript || event.text;
      if (!text) return;

      if (type === "summary.updated" || type === "summary") {
        this.emit({ type: "summary", text, at: Date.now() });
        return;
      }

      if (type.includes("delta") || type === "transcript.partial") {
        this.emit({ type: "partial", text, at: Date.now() });
      } else if (type.includes("completed") || type.includes("done") || type === "transcript.final") {
        this.emit({ type: "final", text, at: Date.now() });
      }
    } catch (error) {
      console.warn("[recording:transcription] Ignoring malformed provider event", error);
    }
  }
}
