const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, "settings.json"), "utf8"));

global.botStatus = {
  status: "starting",
  username: settings.bot.username,
  server: `${settings.server.host}:${settings.server.port}`,
  position: null,
  blockPosition: null,
  blockName: "Unavailable",
  blockDisplayName: "Unavailable",
  uptimeSeconds: 0,
  reconnects: 0,
  lastEvent: "Starting",
  lastError: null,
  auth: "waiting"
};

const startedAt = Date.now();

setInterval(() => {
  global.botStatus.uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);
}, 1000);

function sendJson(res, data) {
  const body = JSON.stringify(data);
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  res.end(body);
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/status") {
    return sendJson(res, global.botStatus);
  }

  if (req.url === "/health") {
    return sendJson(res, { ok: true, status: global.botStatus.status });
  }

  if (req.url === "/" || req.url === "/index.html") {
    return sendFile(res, path.join(__dirname, "public", "index.html"), "text/html; charset=utf-8");
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[WEB] Dashboard listening on port ${PORT}`);
  require("./bot.js");
});
