// ─── Socket.IO Client ────────────────────────────────────────────────────────
// Singleton socket connection. Used for real-time message delivery.
// Falls back gracefully — the app works fine with REST-only if socket fails.

import { io, Socket } from 'socket.io-client';

const SERVER_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ??
  'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}
