const { spawn } = require("node:child_process");
const path = require("node:path");
const WebSocket = require("ws");

const root = path.resolve(__dirname, "..");
const port = 18_000 + (process.pid % 1_000);
const token = "recording-test-token";
const gateway = spawn(process.execPath, [path.join(__dirname, "mock-transcription-gateway.js")], {
  cwd: root,
  env: {
    ...process.env,
    MOCK_TRANSCRIPTION_GATEWAY_PORT: String(port),
    MOCK_TRANSCRIPTION_GATEWAY_TOKEN: token,
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let socket;

function cleanup() {
  if (socket?.readyState === WebSocket.OPEN) socket.close(1000, "test complete");
  if (!gateway.killed) gateway.kill("SIGTERM");
}

function fail(error) {
  cleanup();
  console.error("[recording-test] failed", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

const timeout = setTimeout(() => fail(new Error("Timed out waiting for transcript events")), 8_000);

gateway.stderr.on("data", chunk => process.stderr.write(chunk));
gateway.once("error", fail);
gateway.stdout.on("data", chunk => {
  const output = chunk.toString();
  process.stdout.write(output);
  if (!output.includes("listening on") || socket) return;

  socket = new WebSocket(`ws://127.0.0.1:${port}/v1/live-transcription`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const received = new Set();
  socket.once("open", () => {
    socket.send(JSON.stringify({
      type: "session.start",
      metadata: { contentTitle: "Recording integration test", sourceType: "youtube" },
      audio: { format: "pcm16", sampleRate: 24000, channels: 1 },
    }));
    for (let index = 0; index < 8; index += 1) socket.send(Buffer.alloc(8_192, index + 1));
  });

  socket.on("message", raw => {
    const event = JSON.parse(raw.toString());
    received.add(event.type);
    if (!received.has("transcript.partial") || !received.has("transcript.final") || !received.has("summary.updated")) return;
    clearTimeout(timeout);
    console.info("[recording-test] passed: control messages, binary audio, transcript, and summary events are working");
    cleanup();
  });
  socket.once("error", fail);
});

process.once("exit", cleanup);
