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

    if (socket) { socket.disconnect(); socket = null; }

    socket = io(process.env.EXPO_PUBLIC_SOCKET_URL ?? '', {
      auth:       { token },
      transports: ['websocket'],
      reconnection:      true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => { connected.current = true; });

    socket.on('connect_error', () => { connected.current = false; });

    // New order comes in — refresh orders list
    socket.on(SocketEvents.ORDER_NEW, () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['partner-stats'] });
    });

    // Partner account approved
    socket.on(SocketEvents.PARTNER_APPROVED, () => {
      queryClient.invalidateQueries({ queryKey: ['partner-me'] });
    });

    socket.on(SocketEvents.NOTIFICATION_NEW, () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    socket.on('disconnect', () => { connected.current = false; });

    return () => {
      socket?.disconnect();
      socket = null;
      connected.current = false;
    };
  }, [token, user?.id]);

  return socket;
}
