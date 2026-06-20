import { app } from "electron";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SourceContext } from "./types";

interface StoredSession {
  id: string;
  startedAt: number;
  endedAt?: number;
  metadata: SourceContext;
  transcript: string[];
  summary: string;
}

export class SessionRepository {
  private session?: StoredSession;
  private saveTimer?: NodeJS.Timeout;

  async start(id: string, metadata: SourceContext): Promise<void> {
    this.session = { id, startedAt: Date.now(), metadata, transcript: [], summary: "" };
    await this.save();
  }

  appendTranscript(text: string): void {
    if (!this.session || !text.trim()) return;
    this.session.transcript.push(text.trim());
    this.scheduleSave();
  }

  setSummary(summary: string): void {
    if (!this.session) return;
    this.session.summary = summary.trim();
    this.scheduleSave();
  }

  async finish(): Promise<void> {
    if (!this.session) return;
    this.session.endedAt = Date.now();
    clearTimeout(this.saveTimer);
    await this.save();
    this.session = undefined;
  }

  private scheduleSave(): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.save(), 750);
  }

  private async save(): Promise<void> {
    if (!this.session) return;
    const directory = join(app.getPath("userData"), "recording-sessions");
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, `${this.session.id}.json`), JSON.stringify(this.session, null, 2), "utf8");
  }
}
