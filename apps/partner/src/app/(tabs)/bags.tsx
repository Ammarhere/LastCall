import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';

export default function BagsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['partner-bags'],
    queryFn:  () => api.get('/bags').then((r) => r.data.data),
  });

  const { mutate: cancelBag } = useMutation({
    mutationFn: (id: string) => api.delete(`/bags/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['partner-bags'] }),
    onError:    () => Alert.alert('Error', 'Could not cancel bag'),
  });

  const confirmCancel = (id: string) => {
    Alert.alert('Cancel Bag?', 'This will remove the bag from listings.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel Bag', style: 'destructive', onPress: () => cancelBag(id) },
    ]);
  };

  const STATUS_COLORS: Record<string, string> = {
    AVAILABLE: '#16A34A', DRAFT: '#6b7280', SOLD_OUT: '#f59e0b', CANCELLED: '#ef4444', EXPIRED: '#9ca3af',
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/bag/create')}>
        <Text style={styles.createBtnText}>+ Create New Bag</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No bags yet. Create your first one!</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.img} />
                ) : (
                  <View style={[styles.img, { backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 24 }}>🛍️</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.price}>{formatPKR(item.discountedPrice)}</Text>
                <View style={styles.meta}>
                  <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] ?? '#e5e7eb') + '20' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] ?? '#374151' }]}>{item.status}</Text>
                  </View>
                  <Text style={styles.qty}>{item.quantityLeft}/{item.quantityTotal} left</Text>
                </View>
              </View>
              {item.status === 'AVAILABLE' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item.id)}>
                  <Text style={styles.cancelText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f9fafb' },
  createBtn:   { margin: 16, marginBottom: 8, backgroundColor: '#1d4ed8', borderRadius: 12, padding: 14, alignItems: 'center' },
  createBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  list:        { padding: 16 },
  card:        { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  cardLeft:    {},
  img:         { width: 80, height: 80 },
  cardBody:    { flex: 1, padding: 12 },
  title:       { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  price:       { fontSize: 15, fontWeight: '800', color: '#16A34A', marginBottom: 6 },
  meta:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:       { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText:   { fontSize: 10, fontWeight: '700' },
  qty:         { fontSize: 11, color: '#6b7280' },
  cancelBtn:   { padding: 12, justifyContent: 'center' },
  cancelText:  { color: '#ef4444', fontWeight: '700', fontSize: 16 },
  empty:       { textAlign: 'center', color: '#9ca3af', marginTop: 60 },
});
