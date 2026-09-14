const bedrock = require("bedrock-protocol");
const fs = require("fs");
const path = require("path");

const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "settings.json"), "utf8"));

let reconnectDelay = settings.reconnect.initialDelayMs;
let reconnectTimer = null;
let stopped = false;

function setStatus(patch) {
  Object.assign(global.botStatus, patch);
}

function log(message) {
  console.log(`[BOT] ${message}`);
}

function scheduleReconnect() {
  if (stopped || !settings.reconnect.enabled || reconnectTimer) return;

  const delay = reconnectDelay;
  log(`Reconnecting in ${Math.round(delay / 1000)}s...`);
  setStatus({
    status: "reconnecting",
    lastEvent: `Reconnecting in ${Math.round(delay / 1000)}s`
  });

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);

  reconnectDelay = Math.min(
    Math.max(delay * 2, settings.reconnect.initialDelayMs),
    settings.reconnect.maxDelayMs
  );
}

function connect() {
  setStatus({
    status: "connecting",
    auth: "waiting",
    lastError: null,
    lastEvent: "Creating Bedrock client"
  });

  log(`Connecting to ${settings.server.host}:${settings.server.port}`);

  let client;

  try {
    client = bedrock.createClient({
      host: settings.server.host,
      port: Number(settings.server.port),
      username: settings.bot.username,
      offline: false,
      profilesFolder: path.join(__dirname, ".minecraft"),
      onMsaCode: (data) => {
        setStatus({
          auth: "device-code",
          lastEvent: `Microsoft code: ${data.user_code || "check Railway logs"}`
        });

        console.log("\n========== MICROSOFT LOGIN ==========");
        console.log(`Open: ${data.verification_uri || data.verification_uri_complete || "the Microsoft verification URL shown above"}`);
        console.log(`Code: ${data.user_code || "not provided"}`);
        console.log("Complete the normal Microsoft sign-in.");
        console.log("=====================================\n");
      },
      conLog: null
    });
  } catch (err) {
    setStatus({
      status: "error",
      lastError: err?.stack || String(err),
      lastEvent: "createClient failed"
    });
    console.error("[BOT] createClient failed:", err);
    return scheduleReconnect();
  }

  global.client = client;

  client.on("join", () => {
    reconnectDelay = settings.reconnect.initialDelayMs;
    setStatus({
      status: "joined",
      auth: "authenticated",
      lastEvent: "Server join received"
    });
    log("Server join received.");
  });

  client.on("spawn", () => {
    setStatus({
      status: "spawned",
      auth: "authenticated",
      lastEvent: "Player spawned"
    });
    log("Player spawned.");
  });

  client.on("text", (packet) => {
    const message = packet?.message || packet?.rawtext || JSON.stringify(packet);
    setStatus({
      lastEvent: `Chat: ${String(message).slice(0, 180)}`
    });
    console.log("[CHAT]", message);
  });

  client.on("move_player", (packet) => {
    const p = packet?.position;
    if (!p) return;

    const x = Number(p.x);
    const y = Number(p.y);
    const z = Number(p.z);

    if (![x, y, z].every(Number.isFinite)) return;

    const blockPosition = {
      x: Math.floor(x),
      y: Math.floor(y - 0.001),
      z: Math.floor(z)
    };

    setStatus({
      position: { x, y, z },
      blockPosition
    });
  });

  client.on("kick", (reason) => {
    const msg = typeof reason === "string"
      ? reason
      : (reason?.message || JSON.stringify(reason));

    setStatus({
      status: "kicked",
      lastEvent: `Kicked: ${String(msg).slice(0, 180)}`
    });
    console.log("[BOT] KICK:", msg);
  });

  client.on("close", (reason) => {
    const msg = reason ? String(reason) : "connection closed";

    setStatus({
      status: "closed",
      lastEvent: msg,
      lastError: null
    });

    global.botStatus.reconnects++;
    log(`Connection closed: ${msg}`);
    scheduleReconnect();
  });

  client.on("error", (err) => {
    const msg = err?.stack || err?.message || String(err);

    setStatus({
      status: "error",
      lastError: msg,
      lastEvent: "Client error"
    });

    console.error("[BOT] ERROR:", err);
  });
}

process.on("uncaughtException", (err) => {
  setStatus({
    status: "error",
    lastError: err?.stack || String(err),
    lastEvent: "Uncaught exception"
  });
  console.error("[PROCESS] Uncaught exception:", err);
});

process.on("unhandledRejection", (err) => {
  setStatus({
    status: "error",
    lastError: err?.stack || String(err),
    lastEvent: "Unhandled rejection"
  });
  console.error("[PROCESS] Unhandled rejection:", err);
});

connect();
