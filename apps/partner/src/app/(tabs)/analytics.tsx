import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn:  () => api.get('/partners/me/analytics').then((r) => r.data.data),
  });

  if (isLoading) return <ActivityIndicator size="large" color="#1d4ed8" style={{ flex: 1 }} />;

  const topBags = (data?.bagPerformance ?? []).slice(0, 5);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Performance (Last 30 Days)</Text>

      <View style={styles.kpiRow}>
        <KPI label="Total Orders" value={String(data?.totalOrders ?? 0)} />
        <KPI label="Revenue"      value={formatPKR(data?.revenue ?? 0)} />
      </View>

      {topBags.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top Bags by Orders</Text>
          <BarChart
            data={{
              labels: topBags.map((b: any) => b.title.slice(0, 8)),
              datasets: [{ data: topBags.map((b: any) => b.sold) }],
            }}
            width={screenWidth - 40}
            height={220}
            yAxisLabel=""
            yAxisSuffix=" sold"
            chartConfig={{
              backgroundColor: '#1d4ed8',
              backgroundGradientFrom: '#1d4ed8',
              backgroundGradientTo: '#3b82f6',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            }}
            style={styles.chart}
          />
        </>
      )}

      <Text style={styles.sectionTitle}>Bag Breakdown</Text>
      {topBags.map((b: any) => (
        <View key={b.title} style={styles.bagRow}>
          <Text style={styles.bagTitle} numberOfLines={1}>{b.title}</Text>
          <View style={styles.bagRight}>
            <Text style={styles.bagSold}>{b.sold} sold</Text>
            <Text style={styles.bagRevenue}>{formatPKR(b.revenue)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f9fafb' },
  content:      { padding: 20 },
  heading:      { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 20 },
  kpiRow:       { flexDirection: 'row', gap: 12, marginBottom: 24 },
  kpi:          { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  kpiValue:     { fontSize: 22, fontWeight: '800', color: '#1d4ed8' },
  kpiLabel:     { fontSize: 12, color: '#6b7280', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  chart:        { borderRadius: 16, marginBottom: 24 },
  bagRow:       { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  bagTitle:     { flex: 1, fontSize: 13, color: '#374151', fontWeight: '600' },
  bagRight:     { alignItems: 'flex-end' },
  bagSold:      { fontSize: 12, color: '#6b7280' },
  bagRevenue:   { fontSize: 14, fontWeight: '700', color: '#16A34A' },
});
