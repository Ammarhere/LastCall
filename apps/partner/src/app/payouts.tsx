import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../../services/api';
import { formatPKR } from '@lastcall/shared';

const STATUS_COLORS: Record<string, string> = {
  PENDING:    '#f59e0b',
  PROCESSING: '#3b82f6',
  COMPLETED:  '#16A34A',
  FAILED:     '#ef4444',
};

export default function PayoutsScreen() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['partner-payouts'],
    queryFn:  () => api.get('/partners/me/payouts').then((r) => r.data.data),
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💸</Text>
              <Text style={styles.emptyTitle}>No payouts yet</Text>
              <Text style={styles.emptySub}>Payouts are sent every Monday after orders are picked up</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.period}>
                  {new Date(item.periodStart).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })} –{' '}
                  {new Date(item.periodEnd).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.status] ?? '#e5e7eb') + '20' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status] ?? '#374151' }]}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.breakdown}>
                <Row label="Orders" value={String(item.orderCount)} />
                <Row label="Gross" value={formatPKR(item.grossAmount)} />
                <Row label="Commission (20%)" value={`- ${formatPKR(item.commissionDeducted)}`} negative />
                <View style={styles.divider} />
                <Row label="Net Payout" value={formatPKR(item.netAmount)} bold />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function Row({ label, value, negative, bold }: { label: string; value: string; negative?: boolean; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      <Text style={[styles.rowValue, negative && styles.negative, bold && styles.rowValueBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f9fafb' },
  list:         { padding: 16 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  period:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  breakdown:    { gap: 8 },
  row:          { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel:     { fontSize: 13, color: '#6b7280' },
  rowLabelBold: { fontWeight: '700', color: '#111827' },
  rowValue:     { fontSize: 13, color: '#374151' },
  rowValueBold: { fontWeight: '800', fontSize: 15, color: '#16A34A' },
  negative:     { color: '#ef4444' },
  divider:      { height: 1, backgroundColor: '#f3f4f6', marginVertical: 4 },
  empty:        { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:   { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub:     { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 6, paddingHorizontal: 32 },
});
