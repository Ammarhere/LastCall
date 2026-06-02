import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { formatPKR } from '@lastcall/shared';
import { useSocket } from '../../hooks/useSocket';

export default function DashboardScreen() {
  const { user } = useAuthStore();
  useSocket(); // Real-time: new orders auto-refresh stats

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['partner-stats'],
    queryFn:  () => api.get('/partners/me/stats').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn:  () => api.get('/orders').then((r) => r.data.data?.slice(0, 5)),
  });

  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: '#3b82f6', READY: '#f59e0b', PICKED_UP: '#16A34A', CANCELLED: '#ef4444',
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#1d4ed8" />}
    >
      <Text style={styles.greeting}>
        Good {getTimeOfDay()}, {user?.partner?.businessName ?? user?.name ?? 'Partner'} 👋
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.statsGrid}>
          <StatCard label="Today's Orders"   value={String(stats?.todayOrders      ?? 0)} color="#3b82f6" icon="📦" />
          <StatCard label="Pending"          value={String(stats?.pendingOrders    ?? 0)} color="#f59e0b" icon="⏳" />
          <StatCard label="Active Bags"      value={String(stats?.activeBags       ?? 0)} color="#16A34A" icon="🛍️" />
          <StatCard label="Total Earnings"   value={formatPKR(stats?.totalEarnings ?? 0)} color="#8b5cf6" icon="💰" />
          {/* Waiting Customers — the social proof card that amazes partners */}
          <StatCard
            label="Waiting Customers"
            value={String(stats?.waitingCustomers ?? 0)}
            color="#ec4899"
            icon="🔔"
            subtitle="notified on your next listing"
          />
          {stats?.activeTemplates > 0 && (
            <StatCard
              label="Auto-Publish"
              value={`${stats.activeTemplates} template${stats.activeTemplates > 1 ? 's' : ''}`}
              color="#14b8a6"
              icon="🔁"
              subtitle="bags publish at 2 PM daily"
            />
          )}
        </View>

        {/* Template prompt: shown when no templates exist yet */}
        {stats !== undefined && stats.activeTemplates === 0 && (
          <TouchableOpacity
            style={styles.templateBanner}
            onPress={() => router.push('/bag/templates')}
          >
            <Text style={styles.templateBannerIcon}>🔁</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.templateBannerTitle}>Set bags to auto-publish daily</Text>
              <Text style={styles.templateBannerSub}>Create once, never list manually again</Text>
            </View>
            <Text style={styles.templateBannerArrow}>→</Text>
          </TouchableOpacity>
        )}
        </>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>

      {(recentOrders ?? []).map((order: any) => (
        <View key={order.id} style={styles.orderRow}>
          <View>
            <Text style={styles.orderCustomer}>{order.user?.name ?? order.user?.phone}</Text>
            <Text style={styles.orderBag}>{order.bag?.title}</Text>
          </View>
          <View style={styles.orderRight}>
            <Text style={styles.orderAmount}>{formatPKR(order.totalAmount)}</Text>
            <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[order.orderStatus] ?? '#e5e7eb') + '20' }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLORS[order.orderStatus] ?? '#374151' }]}>{order.orderStatus}</Text>
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/bag/create')}>
        <Text style={styles.createBtnText}>+ Create New Bag</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon, subtitle }: { label: string; value: string; color: string; icon: string; subtitle?: string }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f9fafb' },
  content:              { padding: 20 },
  greeting:             { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 },
  statsGrid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard:             { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, borderLeftWidth: 4 },
  statIcon:             { fontSize: 24, marginBottom: 8 },
  statValue:            { fontSize: 20, fontWeight: '800', color: '#111827' },
  statLabel:            { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statSubtitle:         { fontSize: 10, color: '#9ca3af', marginTop: 2, fontStyle: 'italic' },
  templateBanner:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0fdfa', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#99f6e4' },
  templateBannerIcon:   { fontSize: 24 },
  templateBannerTitle:  { fontSize: 14, fontWeight: '700', color: '#0f766e' },
  templateBannerSub:    { fontSize: 12, color: '#14b8a6', marginTop: 2 },
  templateBannerArrow:  { fontSize: 18, color: '#14b8a6', fontWeight: '700' },
  sectionHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:         { fontSize: 16, fontWeight: '700', color: '#111827' },
  seeAll:       { fontSize: 13, color: '#1d4ed8' },
  orderRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  orderCustomer:{ fontSize: 13, fontWeight: '700', color: '#111827' },
  orderBag:     { fontSize: 12, color: '#6b7280', marginTop: 2 },
  orderRight:   { alignItems: 'flex-end', gap: 4 },
  orderAmount:  { fontSize: 14, fontWeight: '800', color: '#16A34A' },
  badge:        { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText:    { fontSize: 10, fontWeight: '700' },
  createBtn:    { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  createBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
});
