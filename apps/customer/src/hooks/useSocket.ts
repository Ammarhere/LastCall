import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { SocketEvents } from '@lastcall/shared';
import { queryClient } from '../lib/queryClient';

let socket: Socket | null = null;

export function useSocket() {
  const { user, token } = useAuthStore();
  const connected = useRef(false);

  useEffect(() => {
    if (!token || !user) return;
    if (connected.current && socket?.connected) return;

    // Disconnect stale socket before creating a new one
    if (socket) {
      socket.disconnect();
      socket = null;
    }

    socket = io(process.env.EXPO_PUBLIC_SOCKET_URL ?? '', {
      auth:       { token },           // JWT sent on handshake — verified server-side
      transports: ['websocket'],
      reconnection:       true,
      reconnectionAttempts: 5,
      reconnectionDelay:  2000,
    });

    socket.on('connect', () => {
      connected.current = true;
      // Server auto-joins rooms — no need to emit 'join' manually for own room
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      connected.current = false;
    });

    socket.on(SocketEvents.ORDER_STATUS_CHANGED, ({ orderId }: any) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    socket.on(SocketEvents.BAG_SOLD_OUT, ({ bagId }: any) => {
      queryClient.invalidateQueries({ queryKey: ['bag', bagId] });
      queryClient.invalidateQueries({ queryKey: ['bags'] });
    });

    socket.on(SocketEvents.BAG_NEW_LISTING, () => {
      // Invalidate bag listings so the home screen reflects new bags from partners users follow
      queryClient.invalidateQueries({ queryKey: ['bags'] });
    });

    socket.on(SocketEvents.NOTIFICATION_NEW, () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('disconnect', () => {
      connected.current = false;
    });

    return () => {
      socket?.disconnect();
      socket = null;
      connected.current = false;
    };
  }, [token, user?.id]); // re-connect only if user identity changes

  return socket;
}
