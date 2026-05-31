import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { formatPKR } from '@lastcall/shared';
import { CountdownTimer } from '../../components/CountdownTimer';

const KARACHI_AREAS = ['All', 'Burns Road', 'DHA', 'Clifton', 'Gulshan', 'Saddar', 'North Nazimabad', 'Malir', 'PECHS'];

export default function HomeScreen() {
  useSocket();
  const [selectedArea, setSelectedArea] = useState('All');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['bags', selectedArea, search],
    queryFn: () => api.get('/bags', {
      params: { area: selectedArea !== 'All' ? selectedArea.toLowerCase().replace(/ /g, '-') : undefined },
    }).then((r) => r.data.data),
    retry: 2,
  });

  const bags = (data ?? []).filter((b: any) =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.partner?.businessName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search bags or restaurants..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Area chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        {KARACHI_AREAS.map((area) => (
          <TouchableOpacity
            key={area}
            style={[styles.chip, selectedArea === area && styles.chipActive]}
            onPress={() => setSelectedArea(area)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selectedArea === area && styles.chipTextActive]}>
              {area}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Error state */}
      {isError && (
        <View style={styles.centerBox}>
          <Text style={styles.errorText}>Could not load bags. Check your connection.</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {isLoading && !isError && (
        <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 40 }} />
      )}

      {/* Bag grid */}
      {!isLoading && !isError && (
        <FlatList
          data={bags}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#16A34A" />}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyEmoji}>🛍️</Text>
              <Text style={styles.emptyTitle}>No bags right now</Text>
              <Text style={styles.emptySub}>Check back closer to closing time</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/bag/${item.id}`)}
              activeOpacity={0.9}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.cardImg} />
              ) : (
                <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                  <Text style={{ fontSize: 32 }}>🛍️</Text>
                </View>
              )}
              <View style={styles.cardBody}>
                <Text style={styles.cardPartner} numberOfLines={1}>{item.partner?.businessName}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatPKR(item.discountedPrice)}</Text>
                  <Text style={styles.originalPrice}>{formatPKR(item.originalPrice)}</Text>
                </View>
                <Text style={styles.qty}>{item.quantityLeft} left</Text>
                <CountdownTimer pickupDate={item.pickupDate} pickupEnd={item.pickupEnd} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f9fafb' },

  // Search
  searchRow:          { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchInput:        {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },

  // Chips — FIXED: explicit height so they don't stretch
  chipScroll:         { flexGrow: 0, flexShrink: 0 },
  chipContainer:      {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip:               {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive:         { backgroundColor: '#16A34A' },
  chipText:           { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive:     { color: '#fff' },

  // Bag grid
  list:               { padding: 12, paddingBottom: 24 },
  row:                { justifyContent: 'space-between', marginBottom: 12 },

  card:               {
    width: '48.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardImg:            { width: '100%', height: 130 },
  cardImgPlaceholder: { backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  cardBody:           { padding: 10 },
  cardPartner:        { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  cardTitle:          { fontSize: 13, fontWeight: '700', color: '#111827', marginBottom: 6, lineHeight: 18 },
  priceRow:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  price:              { fontSize: 14, fontWeight: '800', color: '#16A34A' },
  originalPrice:      { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  qty:                { fontSize: 11, color: '#6b7280' },

  // States
  centerBox:          { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:         { fontSize: 48, marginBottom: 12 },
  emptyTitle:         { fontSize: 17, fontWeight: '700', color: '#111827' },
  emptySub:           { fontSize: 13, color: '#6b7280', marginTop: 4 },
  errorText:          { color: '#ef4444', marginBottom: 10, fontSize: 14 },
  retryBtn:           { backgroundColor: '#16A34A', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryText:          { color: '#fff', fontWeight: '700' },
});
