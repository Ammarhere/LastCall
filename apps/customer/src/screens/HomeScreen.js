import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView
} from 'react-native';
import api from '../services/api';

const AREAS = [
  'All', 'Burns Road', 'DHA', 'Clifton', 'Gulshan', 'PECHS',
  'Saddar', 'North Nazimabad', 'Bahadurabad', 'Johar',
];

export default function HomeScreen({ navigation }) {
  const [bags, setBags]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [area, setArea]           = useState('All');

  const fetchBags = useCallback(async () => {
    try {
      const res = await api.get('/api/bags', {
        params: { area: area === 'All' ? undefined : area },
      });
      setBags(res.data.bags);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [area]);

  useEffect(() => { fetchBags(); }, [fetchBags]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#E53935" size="large" />;

  return (
    <View style={s.container}>
      <Text style={s.heading}>Available Today</Text>

      {/* Area Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipsRow}
        contentContainerStyle={s.chipsContent}
      >
        {AREAS.map(a => (
          <TouchableOpacity
            key={a}
            style={[s.chip, area === a && s.chipActive]}
            onPress={() => setArea(a)}
          >
            <Text style={[s.chipText, area === a && s.chipTextActive]}>{a}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={bags}
        keyExtractor={i => i.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchBags(); }}
            tintColor="#E53935"
          />
        }
        ListEmptyComponent={
          <Text style={s.empty}>
            No bags available in {area} right now 😕{'\n'}Check back later!
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => navigation.navigate('BagDetail', { bag: item })}
          >
            <Text style={s.partner}>{item.business_name} · {item.area}</Text>
            <Text style={s.title}>{item.title}</Text>
            <View style={s.row}>
              <Text style={s.price}>PKR {item.discounted_price}</Text>
              <Text style={s.original}>PKR {item.original_price}</Text>
              <View style={s.badge}>
                <Text style={s.badgeText}>{item.quantity_left} left</Text>
              </View>
            </View>
            <Text style={s.pickup}>🕐 Pickup {item.pickup_start} – {item.pickup_end}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f7f7f7', paddingHorizontal: 16, paddingTop: 56 },
  heading:       { fontSize: 26, fontWeight: '900', color: '#1a1a1a', marginBottom: 12 },

  chipsRow:      { flexGrow: 0, marginBottom: 14 },
  chipsContent:  { gap: 8, paddingRight: 16 },
  chip:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                   backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  chipActive:    { backgroundColor: '#E53935', borderColor: '#E53935' },
  chipText:      { fontSize: 13, fontWeight: '600', color: '#555' },
  chipTextActive:{ color: '#fff' },

  card:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
                   shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  partner:       { fontSize: 12, color: '#E53935', fontWeight: '700', marginBottom: 4 },
  title:         { fontSize: 17, fontWeight: '800', color: '#111', marginBottom: 10 },
  row:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  price:         { fontSize: 20, fontWeight: '900', color: '#E53935' },
  original:      { fontSize: 14, color: '#aaa', textDecorationLine: 'line-through' },
  badge:         { marginLeft: 'auto', backgroundColor: '#E8F5E9',
                   paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:     { fontSize: 12, color: '#2E7D32', fontWeight: '700' },
  pickup:        { fontSize: 13, color: '#666' },
  empty:         { textAlign: 'center', color: '#999', marginTop: 80, fontSize: 15, lineHeight: 24 },
});