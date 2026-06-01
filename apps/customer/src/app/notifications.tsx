import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export default function NotificationsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/notifications').then((r) => r.data.data),
  });

  const { mutate: markAll } = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: markOne } = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = (data ?? []).filter((n: any) => !n.isRead).length;

  return (
    <View style={styles.container}>
      {unread > 0 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={() => markAll()}>
          <Text style={styles.markAllText}>Mark all as read ({unread})</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => !item.isRead && markOne(item.id)}
              activeOpacity={0.8}
            >
              {!item.isRead && <View style={styles.dot} />}
              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f9fafb' },
  markAllBtn:  { margin: 16, marginBottom: 0, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, alignItems: 'center' },
  markAllText: { color: '#16A34A', fontWeight: '700', fontSize: 13 },
  list:        { padding: 16 },
  card:        { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', gap: 10, elevation: 1 },
  cardUnread:  { borderLeftWidth: 3, borderLeftColor: '#16A34A' },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A', marginTop: 5, flexShrink: 0 },
  content:     { flex: 1 },
  title:       { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 2 },
  body:        { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  time:        { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:  { fontSize: 48, marginBottom: 12 },
  emptyTitle:  { fontSize: 18, fontWeight: '700', color: '#111827' },
});
