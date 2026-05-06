import http from "node:http";
import { pathToFileURL } from "node:url";
import next from "next";
import { WebSocket, WebSocketServer } from "ws";
import { verifyToken } from "./lib/api/auth-service.js";

const progressSteps = [
  { event: "queued", progress: 10, message: "Review queued" },
  { event: "parsing", progress: 35, message: "Extracting assignment text" },
  { event: "reviewing", progress: 70, message: "Generating structured feedback" },
  { event: "complete", progress: 100, message: "Review ready" },
];

export async function startServer({
  hostname = process.env.HOST || "127.0.0.1",
  port = Number(process.env.PORT || 3000),
  dev = process.env.NODE_ENV !== "production",
} = {}) {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();
  const handleUpgrade = app.getUpgradeHandler();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const pathname = new URL(req.url || "", `http://${req.headers.host}`).pathname;

    if (pathname === "/ws/progress") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
      return;
    }

    if (pathname.startsWith("/_next/webpack-hmr")) {
      handleUpgrade(req, socket, head).catch((error) => {
        socket.destroy();
        console.error("Failed to handle websocket upgrade", error);
      });
    }
  });

  wss.on("connection", async (socket, request) => {
    try {
      const url = new URL(request.url || "", `http://${request.headers.host}`);
      await verifyToken(url.searchParams.get("token") || "");
    } catch {
      socket.close(1008, "Unauthorized");
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (socket.readyState !== WebSocket.OPEN) {
        clearInterval(timer);
        return;
      }

      socket.send(JSON.stringify(progressSteps[index]));
      index += 1;

      if (index >= progressSteps.length) {
        clearInterval(timer);
      }
    }, 250);

    socket.on("close", () => clearInterval(timer));
  });

  await new Promise((resolve) => {
    server.listen(port, hostname, resolve);
  });

  console.log(`SmartReview AI ready at http://${hostname}:${port}`);

  return {
    app,
    server,
    hostname,
    port,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      wss.close();
      await app.close();
    },
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  await startServer();
}
