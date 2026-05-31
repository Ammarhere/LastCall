import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';

export default function OrdersScreen() {
  const qc = useQueryClient();
  const [verifyModal, setVerifyModal] = useState<any>(null);
  const [pickupCode, setPickupCode] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn:  () => api.get('/orders').then((r) => r.data.data),
    refetchInterval: 20000,
  });

  const { mutate: advanceStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
    onError:   (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Failed'),
  });

  const { mutate: verifyPickup, isPending: verifying } = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      api.post(`/orders/${id}/verify-pickup`, { pickupCode, cashConfirmed: true }),
    onSuccess: () => {
      setVerifyModal(null);
      setPickupCode('');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['partner-stats'] });
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Invalid code'),
  });

  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: '#3b82f6', READY: '#f59e0b', PICKED_UP: '#16A34A', CANCELLED: '#ef4444',
  };

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
          ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.customer}>{item.user?.name ?? item.user?.phone}</Text>
                  <Text style={styles.bag}>{item.bag?.title}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[item.orderStatus] ?? '#e5e7eb') + '20' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[item.orderStatus] ?? '#374151' }]}>{item.orderStatus}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.amount}>{formatPKR(item.totalAmount)}</Text>
                <Text style={styles.method}>{item.paymentMethod}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-PK')}</Text>
              </View>

              <View style={styles.actions}>
                {item.orderStatus === 'CONFIRMED' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                    onPress={() => advanceStatus({ id: item.id, status: 'READY' })}
                  >
                    <Text style={styles.actionBtnText}>Mark Ready</Text>
                  </TouchableOpacity>
                )}
                {item.orderStatus === 'READY' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
                    onPress={() => setVerifyModal(item)}
                  >
                    <Text style={styles.actionBtnText}>Verify Pickup</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* Pickup Verification Modal */}
      <Modal visible={!!verifyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Verify Pickup</Text>
            <Text style={styles.modalSub}>Ask customer for their 6-digit code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter code"
              value={pickupCode}
              onChangeText={setPickupCode}
              maxLength={6}
              autoCapitalize="characters"
              keyboardType="default"
            />
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
              onPress={() => verifyPickup({ id: verifyModal.id })}
              disabled={verifying || pickupCode.length < 6}
            >
              {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Confirm & Mark Picked Up</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setVerifyModal(null); setPickupCode(''); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f9fafb' },
  list:         { padding: 16 },
  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  customer:     { fontSize: 14, fontWeight: '700', color: '#111827' },
  bag:          { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  infoRow:      { flexDirection: 'row', gap: 16, marginBottom: 12 },
  amount:       { fontSize: 15, fontWeight: '800', color: '#16A34A' },
  method:       { fontSize: 12, color: '#6b7280', alignSelf: 'center' },
  date:         { fontSize: 11, color: '#9ca3af', alignSelf: 'center', marginLeft: 'auto' },
  actions:      { flexDirection: 'row', gap: 8 },
  actionBtn:    { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  actionBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  empty:        { textAlign: 'center', color: '#9ca3af', marginTop: 60 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 },
  modalTitle:   { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  modalSub:     { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  codeInput:    { borderWidth: 2, borderColor: '#16A34A', borderRadius: 12, padding: 14, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 16, fontWeight: '800' },
  cancelBtn:    { padding: 14, alignItems: 'center', marginTop: 8 },
  cancelBtnText:{ color: '#6b7280', fontSize: 14 },
});
