import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

/** First Socket.io usage in Inkspace — kept deliberately simple: no rooms,
 *  no auth, just a global broadcast so any open dashboard tab ticks live. */
export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: { origin: "*" },
  });
  return io;
}

export function emitMetricsUpdate(payload: { type: string; postId?: string }): void {
  io?.emit("metrics:update", payload);
}
