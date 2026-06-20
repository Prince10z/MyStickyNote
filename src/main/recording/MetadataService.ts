import type { SourceContext } from "./types";

function cleanTitle(title: string): string {
  return title
    .replace(/^\(\d+\)\s*/, "")
    .replace(/\s+[-–|]\s+(YouTube|Zoom(?: Meeting)?|Microsoft Teams|Google Chrome|Microsoft Edge|Safari)$/i, "")
    .trim();
}

export class MetadataService {
  async capture(sourceName: string): Promise<SourceContext> {
    // desktopCapturer's selected source name is intentionally preferred over the
    // foreground window: the selected Zoom/browser window can keep playing while
    // the user works in another application.
    const rawTitle = sourceName || "Selected audio source";
    const application = rawTitle.split(/[-–|]/).at(-1)?.trim() || "Unknown";
    const joined = `${rawTitle} ${application}`.toLowerCase();
    const sourceType = joined.includes("youtube")
      ? "youtube"
      : /(zoom|teams|meet)/.test(joined)
        ? "meeting"
        : /(chrome|edge|safari|firefox)/.test(joined)
          ? "browser"
          : "unknown";

    return {
      application,
      windowTitle: rawTitle,
      contentTitle: cleanTitle(rawTitle),
      sourceType,
      capturedAt: Date.now(),
    };
  }
}
