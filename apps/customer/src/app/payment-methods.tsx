import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const METHODS = ['JAZZCASH', 'EASYPAISA', 'SADAPAY', 'NAYAPAY', 'RAAST', 'BANK_TRANSFER'];
const METHOD_ICONS: Record<string, string> = {
  JAZZCASH: '📱', EASYPAISA: '📱', SADAPAY: '💳',
  NAYAPAY: '💳', RAAST: '🏦', BANK_TRANSFER: '🏦',
};

export default function PaymentMethodsScreen() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [method, setMethod] = useState('JAZZCASH');
  const [label,  setLabel]  = useState('');
  const [masked, setMasked]  = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['saved-methods'],
    queryFn:  () => api.get('/users/me/saved-payment-methods').then((r) => r.data.data),
  });

  const { mutate: add, isPending } = useMutation({
    mutationFn: () => api.post('/users/me/saved-payment-methods', { method, label, maskedIdentifier: masked }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['saved-methods'] }); setShowAdd(false); setLabel(''); setMasked(''); },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Failed'),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/saved-payment-methods/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-methods'] }),
  });

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💳</Text>
              <Text style={styles.emptyTitle}>No saved methods</Text>
              <Text style={styles.emptySub}>Save a payment method for faster checkout</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.icon}>{METHOD_ICONS[item.method] ?? '💳'}</Text>
              <View style={styles.info}>
                <Text style={styles.cardLabel}>{item.label}</Text>
                {item.maskedIdentifier && <Text style={styles.masked}>{item.maskedIdentifier}</Text>}
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Remove?', '', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => remove(item.id) },
              ])}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
        <Text style={styles.addBtnText}>+ Add Payment Method</Text>
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Add Payment Method</Text>

          <Text style={styles.label}>Method</Text>
          <View style={styles.methodRow}>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodChip, method === m && styles.methodChipActive]}
                onPress={() => setMethod(m)}
              >
                <Text style={[styles.methodText, method === m && { color: '#fff' }]}>{m.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Label (e.g. "My JazzCash")</Text>
          <TextInput style={styles.input} placeholder="Label" value={label} onChangeText={setLabel} />

          <Text style={styles.label}>Account / Number (optional)</Text>
          <TextInput style={styles.input} placeholder="03xx-xxxxxxx" value={masked} onChangeText={setMasked} keyboardType="phone-pad" />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!label || isPending) && { opacity: 0.5 }]}
              onPress={() => add()}
              disabled={!label || isPending}
            >
              {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f9fafb' },
  list:            { padding: 16, paddingBottom: 90 },
  card:            { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, elevation: 1 },
  icon:            { fontSize: 24 },
  info:            { flex: 1 },
  cardLabel:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  masked:          { fontSize: 12, color: '#6b7280', marginTop: 2 },
  remove:          { color: '#ef4444', fontSize: 18, padding: 4 },
  addBtn:          { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#16A34A', borderRadius: 14, padding: 16, alignItems: 'center' },
  addBtnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty:           { alignItems: 'center', paddingTop: 80 },
  emptyEmoji:      { fontSize: 48, marginBottom: 12 },
  emptyTitle:      { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub:        { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 6 },
  modal:           { flex: 1, padding: 24, backgroundColor: '#fff' },
  modalTitle:      { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 20 },
  label:           { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 4 },
  input:           { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 14, backgroundColor: '#f9fafb' },
  methodRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  methodChip:      { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#e5e7eb' },
  methodChipActive:{ backgroundColor: '#16A34A' },
  methodText:      { fontSize: 12, fontWeight: '600', color: '#374151' },
  modalActions:    { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:       { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelText:      { color: '#374151', fontWeight: '700' },
  saveBtn:         { flex: 1, backgroundColor: '#16A34A', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnText:     { color: '#fff', fontWeight: '700', fontSize: 15 },
});
