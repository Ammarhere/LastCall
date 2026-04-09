import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import api from '../services/api';

export default function DashboardScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try { const r = await api.get('/api/partners/me/stats'); setStats(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchStats(); }, []);
  if (loading) return <ActivityIndicator style={{flex:1}} color="#2E7D32" size="large" />;

  return (
    <ScrollView style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor="#2E7D32" />}>
      <Text style={s.heading}>Dashboard</Text>
      <View style={s.grid}>
        {[
          { label: "Today's Earnings", value: `PKR ${stats?.revenue?.today_earnings || 0}`, color: '#2E7D32' },
          { label: 'Total Earnings',   value: `PKR ${stats?.revenue?.total_earnings || 0}`, color: '#1565C0' },
          { label: 'Orders Today',     value: stats?.orders?.today || 0,  color: '#E65100' },
          { label: 'Bags Sold',        value: stats?.bags?.sold || 0,     color: '#6A1B9A' },
        ].map(k => (
          <View key={k.label} style={s.card}>
            <Text style={[s.value, {color: k.color}]}>{k.value}</Text>
            <Text style={s.label}>{k.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f7f7f7', padding:16, paddingTop:56 },
  heading:   { fontSize:26, fontWeight:'900', color:'#1a1a1a', marginBottom:20 },
  grid:      { flexDirection:'row', flexWrap:'wrap', gap:12 },
  card:      { backgroundColor:'#fff', borderRadius:16, padding:20, width:'47%', shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  value:     { fontSize:22, fontWeight:'900', marginBottom:4 },
  label:     { fontSize:12, color:'#888', fontWeight:'600' },
});
