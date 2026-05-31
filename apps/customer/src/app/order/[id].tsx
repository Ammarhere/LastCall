import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';
import { useSocket } from '../../hooks/useSocket';

const STATUS_STEPS = ['CONFIRMED', 'READY', 'PICKED_UP'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  useSocket();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => api.get(`/orders/${id}`).then((r) => r.data.data),
    refetchInterval: (q) => ['CONFIRMED', 'READY'].includes(q.state.data?.orderStatus) ? 15000 : false,
  });

  const { mutate: submitReview } = useMutation({
    mutationFn: (data: any) => api.post('/reviews', data),
  });

  if (isLoading) return <ActivityIndicator size="large" color="#16A34A" style={{ flex: 1 }} />;
  if (!order)    return <Text style={{ textAlign: 'center', marginTop: 80 }}>Order not found</Text>;

  const stepIdx = STATUS_STEPS.indexOf(order.orderStatus);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Stepper */}
      <View style={styles.stepper}>
        {STATUS_STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, i <= stepIdx && styles.stepDotActive]}>
                <Text style={styles.stepDotText}>{i < stepIdx ? '✓' : `${i + 1}`}</Text>
              </View>
              <Text style={[styles.stepLabel, i <= stepIdx && styles.stepLabelActive]}>{step.replace('_', ' ')}</Text>
            </View>
            {i < STATUS_STEPS.length - 1 && (
              <View style={[styles.stepLine, i < stepIdx && styles.stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Pickup Code */}
      {['CONFIRMED', 'READY'].includes(order.orderStatus) && (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Pickup Code</Text>
          <Text style={styles.code}>{order.pickupCode}</Text>
          <Text style={styles.codeSub}>Show this to the partner to collect your bag</Text>
        </View>
      )}

      {/* Order Info */}
      <View style={styles.card}>
        <Row label="Bag"        value={order.bag?.title     ?? '—'} />
        <Row label="Partner"    value={order.partner?.businessName ?? '—'} />
        <Row label="Quantity"   value={`${order.quantity}x`} />
        <Row label="Total"      value={formatPKR(order.totalAmount)} />
        <Row label="Payment"    value={order.paymentMethod} />
        <Row label="Status"     value={order.paymentStatus} />
        <Row label="Ordered"    value={new Date(order.createdAt).toLocaleString('en-PK')} />
      </View>

      {/* Review Prompt */}
      {order.orderStatus === 'PICKED_UP' && !order.review && (
        <TouchableOpacity style={styles.reviewBtn} onPress={() => router.push(`/review/${id}`)}>
          <Text style={styles.reviewBtnText}>⭐ Leave a Review</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f9fafb' },
  content:        { padding: 20 },
  stepper:        { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepItem:       { alignItems: 'center', flex: 1 },
  stepDot:        { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepDotActive:  { backgroundColor: '#16A34A' },
  stepDotText:    { color: '#fff', fontWeight: '700', fontSize: 12 },
  stepLabel:      { fontSize: 10, color: '#9ca3af', textAlign: 'center', fontWeight: '600' },
  stepLabelActive:{ color: '#16A34A' },
  stepLine:       { height: 2, flex: 0.5, backgroundColor: '#e5e7eb', marginBottom: 20 },
  stepLineActive: { backgroundColor: '#16A34A' },
  codeCard:       { backgroundColor: '#16A34A', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  codeLabel:      { color: '#d1fae5', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  code:           { color: '#fff', fontSize: 48, fontWeight: '800', letterSpacing: 6 },
  codeSub:        { color: '#d1fae5', fontSize: 12, marginTop: 8, textAlign: 'center' },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 16 },
  row:            { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel:       { fontSize: 13, color: '#6b7280' },
  rowValue:       { fontSize: 13, color: '#111827', fontWeight: '600' },
  reviewBtn:      { backgroundColor: '#fef3c7', borderRadius: 12, padding: 16, alignItems: 'center' },
  reviewBtnText:  { color: '#92400e', fontSize: 15, fontWeight: '700' },
});
