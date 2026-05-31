import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from '../middleware/requestLogger';

let io: SocketServer;

interface AuthPayload {
  userId:    string;
  role:      string;
  partnerId?: string;
}

/** Verify JWT and return payload, or null if invalid */
function verifySocketToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

/** Determine which rooms a given user is allowed to join */
function allowedRooms(user: AuthPayload): Set<string> {
  const rooms = new Set<string>();
  rooms.add(`user:${user.userId}`);
  if (user.role === 'PARTNER' && user.partnerId) {
    rooms.add(`partner:${user.partnerId}`);
  }
  if (user.role === 'ADMIN') {
    rooms.add('admin');
  }
  return rooms;
}

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin:      [env.FRONTEND_URL, env.ADMIN_URL],
      credentials: true,
    },
  });

  // ── Global auth middleware: every connection must carry a valid JWT ──────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      logger.warn({ socketId: socket.id }, 'Socket connection rejected: no token');
      return next(new Error('Authentication required'));
    }
    const user = verifySocketToken(token);
    if (!user) {
      logger.warn({ socketId: socket.id }, 'Socket connection rejected: invalid token');
      return next(new Error('Invalid or expired token'));
    }
    (socket as any).user = user;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    const permitted = allowedRooms(user);

    // Auto-join the user's own room on connect
    for (const room of permitted) {
      socket.join(room);
    }

    // Allow client to join only rooms it is authorised for
    socket.on('join', (roomId: string) => {
      if (permitted.has(roomId)) {
        socket.join(roomId);
      } else {
        logger.warn({ socketId: socket.id, userId: user.userId, roomId }, 'Unauthorised room join attempt');
      }
    });

    socket.on('leave', (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on('disconnect', () => {
      logger.debug({ socketId: socket.id, userId: user.userId }, 'Socket disconnected');
    });
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialised');
  return io;
}
