import type { TranscriptEvent } from "./types";

export class RollingSummaryService {
  private transcript = "";
  private previousSummary = "";
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly apiKey: string | undefined,
    private readonly model: string,
    private readonly emit: (event: TranscriptEvent) => void,
  ) {}

  add(text: string): void {
    this.transcript += `${this.transcript ? " " : ""}${text.trim()}`;
    if (!this.apiKey || this.transcript.length < 240) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.summarize(), 15_000);
  }

  close(): void {
    clearTimeout(this.timer);
  }

  private async summarize(): Promise<void> {
    if (this.running || !this.apiKey) return;
    this.running = true;
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          max_output_tokens: 350,
          input: [
            { role: "system", content: "Maintain concise live meeting notes. Return Markdown with Key points, Decisions, and Action items. Never invent names or commitments." },
            { role: "user", content: `Previous summary:\n${this.previousSummary || "None"}\n\nTranscript so far:\n${this.transcript.slice(-12000)}` },
          ],
        }),
      });
      if (!response.ok) throw new Error(`Summary request failed (${response.status})`);
      const data: any = await response.json();
      const summary = data.output_text || data.output?.flatMap((item: any) => item.content || []).map((item: any) => item.text || "").join("\n");
      if (summary?.trim()) {
        this.previousSummary = summary.trim();
        this.emit({ type: "summary", text: this.previousSummary, at: Date.now() });
      }
    } catch (error) {
      console.warn("[recording:summary] Rolling summary failed", error);
    } finally {
      this.running = false;
    }
  }
}
