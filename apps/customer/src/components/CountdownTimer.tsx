import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

interface Props {
  pickupDate: string | Date;  // ISO date or Date object
  pickupEnd:  string | Date;  // "1970-01-01THH:MM:00.000Z" from DB or "HH:MM"
}

function getPickupEndMs(pickupDate: string | Date, pickupEnd: string | Date): number {
  const dateStr = new Date(pickupDate).toISOString().split('T')[0]; // "YYYY-MM-DD"

  // pickupEnd comes from DB as a Date like "1970-01-01T18:30:00.000Z"
  // Extract HH:MM from it
  const endDate  = new Date(pickupEnd);
  const hours    = endDate.getUTCHours();
  const minutes  = endDate.getUTCMinutes();

  // Combine with pickup date
  return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`).getTime();
}

function formatCountdown(msLeft: number): { text: string; urgent: boolean } {
  if (msLeft <= 0) return { text: 'Closed', urgent: true };

  const totalMinutes = Math.floor(msLeft / 60000);
  const hours        = Math.floor(totalMinutes / 60);
  const minutes      = totalMinutes % 60;
  const urgent       = totalMinutes < 60;

  if (hours > 0) {
    return { text: `${hours}h ${minutes}m left`, urgent };
  }
  return { text: `${minutes}m left`, urgent };
}

export function CountdownTimer({ pickupDate, pickupEnd }: Props) {
  const [msLeft, setMsLeft] = useState<number>(() => {
    const endMs = getPickupEndMs(pickupDate, pickupEnd);
    return endMs - Date.now();
  });

  useEffect(() => {
    const endMs = getPickupEndMs(pickupDate, pickupEnd);

    const tick = () => setMsLeft(endMs - Date.now());
    tick(); // immediate update

    const interval = setInterval(tick, 60000); // update every minute
    return () => clearInterval(interval);
  }, [pickupDate, pickupEnd]);

  if (msLeft <= 0) return null; // hide expired bags (filtered at list level)

  const { text, urgent } = formatCountdown(msLeft);

  return (
    <Text style={[styles.timer, urgent && styles.urgent]}>
      ⏱ {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  timer:  { fontSize: 11, color: '#6b7280', fontWeight: '600', marginTop: 3 },
  urgent: { color: '#ef4444' },
});
