import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../services/api';

export default function FavouritesScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['favourites'],
    queryFn:  () => api.get('/users/me/favourites').then((r) => r.data.data),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (partnerId: string) => api.delete(`/users/me/favourites/${partnerId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourites'] }),
  });

  return (
    <View style={styles.container}>
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
              <Text style={styles.emptyEmoji}>❤️</Text>
              <Text style={styles.emptyTitle}>No favourites yet</Text>
              <Text style={styles.emptySub}>Tap the heart on any partner to save them here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/partner/${item.id}`)}
              activeOpacity={0.9}
            >
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoPlaceholder]}>
                  <Text style={{ fontSize: 22 }}>🏪</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.businessName}</Text>
                <Text style={styles.meta}>{item.category} · {item.area}</Text>
                <Text style={styles.rating}>⭐ {item.rating?.toFixed(1) ?? '–'}</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => remove(item.id)}>
                <Text style={styles.removeText}>♥</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9fafb' },
  list:            { padding: 16 },
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 10, elevation: 2, gap: 12 },
  logo:            { width: 52, height: 52, borderRadius: 12 },
  logoPlaceholder: { backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  info:            { flex: 1 },
  name:            { fontSize: 15, fontWeight: '700', color: '#111827' },
  meta:            { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rating:          { fontSize: 12, color: '#f59e0b', marginTop: 2 },
  removeBtn:       { padding: 8 },
  removeText:      { fontSize: 20, color: '#ef4444' },
  empty:           { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:      { fontSize: 48, marginBottom: 12 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub:        { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 6, paddingHorizontal: 32 },
});
