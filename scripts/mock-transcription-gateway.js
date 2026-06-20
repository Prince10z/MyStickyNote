const http = require("node:http");
const { URL } = require("node:url");
const WebSocket = require("ws");
const { WebSocketServer } = WebSocket;

const port = Number(process.env.MOCK_TRANSCRIPTION_GATEWAY_PORT || 8787);
const host = process.env.MOCK_TRANSCRIPTION_GATEWAY_HOST || "127.0.0.1";
const pathName = process.env.MOCK_TRANSCRIPTION_GATEWAY_PATH || "/v1/live-transcription";
const expectedToken = process.env.MOCK_TRANSCRIPTION_GATEWAY_TOKEN || "dev-token";

const phrases = [
  "I’m just validating the live audio pipeline.",
  "The source is connected and audio frames are arriving.",
  "This mock gateway is simulating a transcript stream.",
  "We can now verify pause, resume, and stop behavior.",
  "The rolling summary should update when enough text accumulates.",
];

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "mock-transcription-gateway" }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

const wss = new WebSocketServer({ server, path: pathName });

server.on("error", error => {
  console.error("[mock-gateway] failed to start", error.message);
  process.exit(1);
});

function send(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function describeSource(metadata) {
  if (!metadata || typeof metadata !== "object") return "unknown source";
  const title = String(metadata.contentTitle || metadata.sourceTitle || metadata.title || "unknown source").trim();
  const type = String(metadata.sourceType || metadata.kind || "source").trim();
  return `${title} (${type})`;
}

wss.on("connection", (socket, request) => {
  const authHeader = String(request.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (token !== expectedToken) {
    console.warn("[mock-gateway] rejecting client with invalid token");
    socket.close(4401, "invalid token");
    return;
  }

  let sessionStarted = false;
  let paused = false;
  let totalBytes = 0;
  let chunkCount = 0;
  let phraseIndex = 0;
  let summarySent = false;
  let lastTranscriptAt = 0;
  let metadata = {};
  let startTimer = null;
  let summaryTimer = null;

  console.info("[mock-gateway] client connected");

  send(socket, {
    type: "status",
    message: "Mock transcription gateway connected",
    at: Date.now(),
  });

  const emitPartial = () => {
    if (!sessionStarted || paused || totalBytes === 0) return;
    const phrase = phrases[phraseIndex % phrases.length];
    phraseIndex += 1;
    lastTranscriptAt = Date.now();
    send(socket, {
      type: "transcript.partial",
      text: `${phrase} [${Math.max(1, Math.round(totalBytes / 1024))} KB buffered]`,
      at: Date.now(),
    });
  };

  const emitFinal = () => {
    if (!sessionStarted || totalBytes === 0) return;
    const sourceLabel = describeSource(metadata);
    const transcript = `Live notes captured from ${sourceLabel}. Audio streaming, pause/resume, and transcript rendering are working.`;
    send(socket, {
      type: "transcript.final",
      text: transcript,
      at: Date.now(),
    });
    if (!summarySent) {
      send(socket, {
        type: "summary.updated",
        text: [
          "Summary",
          "",
          `- Source: ${sourceLabel}`,
          `- Frames received: ${chunkCount}`,
          `- Audio buffered: ${Math.max(1, Math.round(totalBytes / 1024))} KB`,
          "",
          "Key point: the desktop app successfully reached the gateway and streamed audio.",
          "",
          "Action item: replace this mock server with your real transcription backend.",
        ].join("\n"),
        at: Date.now(),
      });
      summarySent = true;
    }
  };

  const emitStartupTranscript = () => {
    if (!sessionStarted || paused) return;
    const sourceLabel = describeSource(metadata);
    send(socket, {
      type: "transcript.partial",
      text: `Listening to ${sourceLabel}...`,
      at: Date.now(),
    });
    startTimer = setTimeout(() => {
      if (!sessionStarted || paused) return;
      send(socket, {
        type: "transcript.final",
        text: `Session active for ${sourceLabel}. The desktop app is connected and ready to capture live notes.`,
        at: Date.now(),
      });
    }, 1200);
    summaryTimer = setTimeout(() => {
      if (!sessionStarted || paused) return;
      send(socket, {
        type: "summary.updated",
        text: [
          "Summary",
          "",
          `- Source: ${sourceLabel}`,
          "- Status: Connected",
          "- Validation: The live-notes UI reached the gateway successfully.",
          "",
          "Next step: speak into the selected source or play audio to verify continuous transcription.",
        ].join("\n"),
        at: Date.now(),
      });
      summarySent = true;
    }, 2500);
  };

  const heartbeat = setInterval(() => {
    if (!sessionStarted || paused) return;
    const idleFor = Date.now() - lastTranscriptAt;
    if (idleFor >= 4000) emitPartial();
  }, 1500);

  socket.on("message", raw => {
    if (typeof raw === "string") {
      try {
        const event = JSON.parse(raw);
        const type = String(event.type || "");

        if (type === "session.start") {
          sessionStarted = true;
          metadata = event.metadata || {};
          paused = false;
          totalBytes = 0;
          chunkCount = 0;
          summarySent = false;
          phraseIndex = 0;
          lastTranscriptAt = Date.now();

          console.info("[mock-gateway] session.start", describeSource(metadata));
          send(socket, {
            type: "status",
            message: `Recording from ${describeSource(metadata)}`,
            at: Date.now(),
          });
          emitStartupTranscript();
          return;
        }

        if (type === "session.pause") {
          paused = true;
          send(socket, {
            type: "status",
            message: "Session paused",
            at: Date.now(),
          });
          return;
        }

        if (type === "session.resume") {
          paused = false;
          lastTranscriptAt = Date.now();
          send(socket, {
            type: "status",
            message: "Session resumed",
            at: Date.now(),
          });
          return;
        }

        if (type === "session.stop") {
          emitFinal();
          send(socket, {
            type: "status",
            message: "Session stopped",
            at: Date.now(),
          });
          clearTimeout(startTimer);
          clearTimeout(summaryTimer);
          socket.close(1000, "session stopped");
          return;
        }

        return;
      } catch (error) {
        console.warn("[mock-gateway] failed to parse control message", error);
      }
      return;
    }

    if (paused || !sessionStarted) return;

    const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    totalBytes += bytes.length;
    chunkCount += 1;
    lastTranscriptAt = Date.now();

    if (chunkCount % 3 === 0) emitPartial();
    if (chunkCount % 8 === 0) emitFinal();
  });

  socket.on("close", code => {
    clearInterval(heartbeat);
    clearTimeout(startTimer);
    clearTimeout(summaryTimer);
    console.info("[mock-gateway] client disconnected", code);
  });

  socket.on("error", error => {
    clearInterval(heartbeat);
    clearTimeout(startTimer);
    clearTimeout(summaryTimer);
    console.warn("[mock-gateway] socket error", error.message);
  });
});

server.listen(port, host, () => {
  console.info(`[mock-gateway] listening on ws://${host}:${port}${pathName}`);
  console.info(`[mock-gateway] health check http://${host}:${port}/health`);
  console.info(`[mock-gateway] expected token: ${expectedToken}`);
});
