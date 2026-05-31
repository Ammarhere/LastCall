import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: '#3b82f6',
  READY:     '#f59e0b',
  PICKED_UP: '#16A34A',
  CANCELLED: '#ef4444',
  REFUNDED:  '#8b5cf6',
};

export default function OrdersScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn:  () => api.get('/orders').then((r) => r.data.data),
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isLoading}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🛍️</Text>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySub}>Start saving food today!</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/order/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.partner}>{item.partner?.businessName ?? 'Partner'}</Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.orderStatus] + '20' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[item.orderStatus] }]}>
                    {item.orderStatus}
                  </Text>
                </View>
              </View>
              <Text style={styles.title}>{item.bag?.title}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.amount}>{formatPKR(item.totalAmount)}</Text>
                {item.orderStatus === 'CONFIRMED' || item.orderStatus === 'READY' ? (
                  <Text style={styles.code}>Code: <Text style={{ fontWeight: '800' }}>{item.pickupCode}</Text></Text>
                ) : null}
              </View>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f9fafb' },
  list:       { padding: 16 },
  card:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowOpacity: 0.06, shadowRadius: 8 },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  partner:    { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  badge:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText:  { fontSize: 11, fontWeight: '700' },
  title:      { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount:     { fontSize: 16, fontWeight: '800', color: '#16A34A' },
  code:       { fontSize: 13, color: '#374151' },
  date:       { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  emptyBox:   { alignItems: 'center', marginTop: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  emptySub:   { fontSize: 14, color: '#6b7280', marginTop: 4 },
});
