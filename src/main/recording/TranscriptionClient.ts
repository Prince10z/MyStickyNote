import WebSocket from "ws";
import type { TranscriptEvent } from "./types";

interface ConnectionOptions {
  gatewayUrl?: string;
  gatewayToken?: string;
  openAIKey?: string;
  model?: string;
}

export class TranscriptionClient {
  private socket?: WebSocket;
  private queuedBytes = 0;

  constructor(
    private readonly options: ConnectionOptions,
    private readonly emit: (event: TranscriptEvent) => void,
  ) {}

  async connect(metadata: object): Promise<void> {
    const usingGateway = Boolean(this.options.gatewayUrl);
    const url = usingGateway
      ? this.options.gatewayUrl!
      : `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(this.options.model || "gpt-realtime-whisper")}`;

    if (!usingGateway && !this.options.openAIKey) {
      throw new Error("Configure a transcription gateway or OpenAI API key in Settings.");
    }

    const headers: Record<string, string> = usingGateway
      ? { Authorization: `Bearer ${this.options.gatewayToken || ""}` }
      : { Authorization: `Bearer ${this.options.openAIKey}`, "OpenAI-Beta": "realtime=v1" };

    this.socket = await new Promise<WebSocket>((resolve, reject) => {
      const socket = new WebSocket(url, { headers });
      const timeout = setTimeout(() => reject(new Error("Transcription connection timed out")), 12_000);
      socket.once("open", () => {
        clearTimeout(timeout);
        resolve(socket);
      });
      socket.once("error", error => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    this.socket.on("message", data => this.handleMessage(data.toString()));
    this.socket.on("error", error => this.emit({ type: "error", message: error.message, at: Date.now() }));
    this.socket.on("close", code => this.emit({ type: "status", message: `Transcription disconnected (${code})`, at: Date.now() }));

    if (usingGateway) {
      this.socket.send(JSON.stringify({ type: "session.start", metadata, audio: { format: "pcm16", sampleRate: 24000, channels: 1 } }));
    } else {
      this.socket.send(JSON.stringify({
        type: "session.update",
        session: {
          type: "transcription",
          audio: {
            input: {
              format: { type: "audio/pcm", rate: 24000 },
              transcription: { model: this.options.model || "gpt-realtime-whisper" },
              turn_detection: { type: "server_vad", silence_duration_ms: 500 },
            },
          },
        },
      }));
    }
  }

  appendAudio(pcm: Uint8Array): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    if (pcm.byteLength > 256 * 1024 || this.socket.bufferedAmount > 2 * 1024 * 1024) {
      if (this.queuedBytes === 0) {
        this.emit({ type: "status", message: "Network is congested; dropping delayed audio.", at: Date.now() });
      }
      this.queuedBytes = this.socket.bufferedAmount;
      return;
    }

    this.queuedBytes = 0;
    if (this.options.gatewayUrl) {
      this.socket.send(pcm, { binary: true });
    } else {
      this.socket.send(JSON.stringify({
        type: "input_audio_buffer.append",
        audio: Buffer.from(pcm).toString("base64"),
      }));
    }
  }

  pause(): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.options.gatewayUrl) {
      this.socket.send(JSON.stringify({ type: "session.pause" }));
    }
  }

  resume(): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.options.gatewayUrl) {
      this.socket.send(JSON.stringify({ type: "session.resume" }));
    }
  }

  close(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.options.gatewayUrl) this.socket.send(JSON.stringify({ type: "session.stop" }));
      else this.socket.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      this.socket.close(1000, "Recording stopped");
    }
    this.socket = undefined;
  }

  private handleMessage(raw: string): void {
    try {
      const event = JSON.parse(raw);
      const type = String(event.type || "");
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
