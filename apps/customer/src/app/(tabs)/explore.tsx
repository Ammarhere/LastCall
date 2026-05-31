import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  TextInput, StyleSheet, ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';
import { CountdownTimer } from '../../components/CountdownTimer';

const CATEGORIES = ['All', 'Restaurant', 'Bakery', 'Café', 'Sweet Shop', 'Biryani', 'BBQ', 'Fast Food', 'Snacks'];

export default function ExploreScreen() {
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [priceMax, setPriceMax] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bags', 'explore', category, priceMax],
    queryFn:  () => api.get('/bags', {
      params: {
        category: category !== 'All' ? category : undefined,
        priceMax:  priceMax || undefined,
      },
    }).then((r) => r.data.data),
  });

  const filtered = (data ?? []).filter((b: any) =>
    !search ||
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.partner?.businessName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filterRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Search..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
        <TextInput
          style={[styles.input, { width: 110 }]}
          placeholder="Max price"
          placeholderTextColor="#9ca3af"
          value={priceMax}
          onChangeText={setPriceMax}
          keyboardType="number-pad"
        />
      </View>

      {/* Category chips — FIXED height */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <Text style={styles.emptyText}>No results found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/bag/${item.id}`)} activeOpacity={0.9}>
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.img} />
              ) : (
                <View style={[styles.img, styles.imgPlaceholder]}>
                  <Text style={{ fontSize: 28 }}>🛍️</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.partner} numberOfLines={1}>{item.partner?.businessName}</Text>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>{formatPKR(item.discountedPrice)}</Text>
                  <Text style={styles.originalPrice}>{formatPKR(item.originalPrice)}</Text>
                </View>
                <Text style={styles.meta}>{item.quantityLeft} left{item.category ? ` · ${item.category}` : ''}</Text>
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
  container:      { flex: 1, backgroundColor: '#f9fafb' },

  filterRow:      { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4 },
  input:          {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#111827',
  },

  // Chips — explicit height to prevent stretching
  chipScroll:     { flexGrow: 0, flexShrink: 0 },
  chipContainer:  {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip:           {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive:     { backgroundColor: '#16A34A' },
  chipText:       { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  list:           { padding: 12, paddingBottom: 24 },
  card:           {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  img:            { width: 90, height: 90 },
  imgPlaceholder: { backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  info:           { flex: 1, padding: 12, justifyContent: 'center' },
  partner:        { fontSize: 11, color: '#6b7280', marginBottom: 2 },
  title:          { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  priceRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  price:          { fontSize: 14, fontWeight: '800', color: '#16A34A' },
  originalPrice:  { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  meta:           { fontSize: 11, color: '#9ca3af' },

  centerBox:      { alignItems: 'center', paddingTop: 60 },
  emptyText:      { color: '#9ca3af', fontSize: 15 },
});
