import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import api from '../services/api';
import useAuthStore from '../store/authStore';

const StatCard = ({ label, value, color = '#111', prefix = '' }) => (
  <View style={s.statCard}>
    <Text style={s.statLabel}>{label}</Text>
    <Text style={[s.statValue, { color }]}>{prefix}{value}</Text>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const { user } = useAuthStore();
  const [stats, setStats]         = useState(null);
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/api/partners/me/stats'),
        api.get('/api/orders'),
      ]);
      setStats(statsRes.data);
      setOrders(ordersRes.data.orders.slice(0, 5)); // latest 5
    } catch (e) {
      console.error('Dashboard fetch error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#2E7D32" size="large" />;

  const STATUS_COLOR = { confirmed: '#1565C0', ready: '#E65100', picked_up: '#388E3C', cancelled: '#c62828' };

  return (
    <ScrollView
      style={s.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#2E7D32" />}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {getTimeOfDay()}, {user?.name?.split(' ')[0] || 'Partner'} 👋</Text>
          <Text style={s.subGreeting}>Here's today's summary</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('Bags', { screen: 'CreateBag' })}>
          <Text style={s.addBtnText}>+ New Bag</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={s.statsGrid}>
        <StatCard label="Today's Orders"  value={stats?.today_orders  ?? 0} color="#1565C0" />
        <StatCard label="Active Bags"     value={stats?.active_bags   ?? 0} color="#2E7D32" />
        <StatCard label="Total Earnings"  value={formatPKR(stats?.total_earnings)} color="#2E7D32" prefix="PKR " />
        <StatCard label="All-time Orders" value={stats?.total_orders  ?? 0} color="#555" />
      </View>

      {/* Recent Orders */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Today's Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
            <Text style={s.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {orders.length === 0 ? (
          <View style={s.emptyOrders}>
            <Text style={s.emptyText}>No orders yet today 📭</Text>
            <Text style={s.emptyHint}>Orders will appear here once customers start buying</Text>
          </View>
        ) : (
          orders.map(order => (
            <View key={order.id} style={s.orderRow}>
              <View style={s.orderLeft}>
                <Text style={s.orderCustomer}>{order.customer_name || 'Customer'}</Text>
                <Text style={s.orderBag}>{order.bag_title}</Text>
                <Text style={s.orderCode}>Code: <Text style={{ fontWeight: '900', color: '#111' }}>{order.pickup_code}</Text></Text>
              </View>
              <View style={s.orderRight}>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLOR[order.order_status] + '22' }]}>
                  <Text style={[s.statusText, { color: STATUS_COLOR[order.order_status] }]}>
                    {order.order_status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <Text style={s.orderAmt}>PKR {order.total_amount}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.actionsRow}>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Bags', { screen: 'CreateBag' })}>
            <Text style={s.actionIcon}>🎒</Text>
            <Text style={s.actionLabel}>Create Bag</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Orders')}>
            <Text style={s.actionIcon}>📦</Text>
            <Text style={s.actionLabel}>View Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.actionCard} onPress={() => navigation.navigate('Profile')}>
            <Text style={s.actionIcon}>⚙️</Text>
            <Text style={s.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
function formatPKR(n) {
  if (!n) return '0';
  return Math.round(n).toLocaleString('en-PK');
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f7f7f7' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
                   padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  greeting:      { fontSize: 20, fontWeight: '900', color: '#111' },
  subGreeting:   { fontSize: 13, color: '#888', marginTop: 2 },
  addBtn:        { backgroundColor: '#2E7D32', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 16 },
  statCard:      { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14, padding: 16,
                   shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statLabel:     { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statValue:     { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  section:       { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16,
                   padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: '#111' },
  seeAll:        { fontSize: 13, color: '#2E7D32', fontWeight: '600' },
  orderRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  orderLeft:     { flex: 1 },
  orderRight:    { alignItems: 'flex-end', gap: 4 },
  orderCustomer: { fontSize: 14, fontWeight: '700', color: '#111' },
  orderBag:      { fontSize: 12, color: '#888', marginTop: 2 },
  orderCode:     { fontSize: 12, color: '#888', marginTop: 2 },
  statusBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:    { fontSize: 10, fontWeight: '700' },
  orderAmt:      { fontSize: 13, fontWeight: '800', color: '#2E7D32' },
  emptyOrders:   { alignItems: 'center', paddingVertical: 24 },
  emptyText:     { fontSize: 15, color: '#999', marginBottom: 4 },
  emptyHint:     { fontSize: 12, color: '#bbb', textAlign: 'center' },
  actionsRow:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionCard:    { flex: 1, backgroundColor: '#f7f7f7', borderRadius: 12, padding: 16, alignItems: 'center' },
  actionIcon:    { fontSize: 24, marginBottom: 6 },
  actionLabel:   { fontSize: 12, fontWeight: '700', color: '#333', textAlign: 'center' },
});
