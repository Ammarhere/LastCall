import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, TextInput, Alert
} from 'react-native';
import api from '../services/api';

const STATUS_COLOR = {
  confirmed: '#1565C0',
  ready:     '#2E7D32',
  picked_up: '#555',
  cancelled: '#c62828',
};

export default function OrdersScreen() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Two-step verification state
  const [modalOrder, setModalOrder] = useState(null); // order being verified
  const [step, setStep]             = useState(1);     // 1 = enter code, 2 = confirm cash
  const [codeInput, setCodeInput]   = useState('');
  const [verifying, setVerifying]   = useState(false);

  const fetchOrders = async () => {
    try {
      const r = await api.get('/api/orders');
      setOrders(r.data.orders);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const openVerification = (order) => {
    setModalOrder(order);
    setStep(1);
    setCodeInput('');
  };

  const closeModal = () => {
    setModalOrder(null);
    setStep(1);
    setCodeInput('');
  };

  const handleStep1 = () => {
    if (codeInput.trim().toUpperCase() !== modalOrder.pickup_code.toUpperCase()) {
      Alert.alert('Wrong Code', 'The pickup code does not match. Ask the customer to show their code.');
      return;
    }
    setStep(2);
  };

  const handleStep2 = async () => {
    setVerifying(true);
    try {
      await api.post(`/api/orders/${modalOrder.id}/verify-pickup`, {
        pickup_code:      modalOrder.pickup_code,
        cash_received:    true,
      });
      closeModal();
      Alert.alert('✅ Done!', `Order confirmed. PKR ${modalOrder.total_amount} collected.\nYour payout will be settled on Monday.`);
      fetchOrders();
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Something went wrong.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#E53935" size="large" />;

  return (
    <View style={s.container}>
      <Text style={s.heading}>Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            tintColor="#E53935"
          />
        }
        ListEmptyComponent={
          <Text style={s.empty}>No orders yet!{'\n'}Start rescuing food 🛍️</Text>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.name}>{item.business_name}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.order_status] + '22' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[item.order_status] }]}>
                  {item.order_status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={s.title}>{item.bag_title}</Text>

            <View style={s.row}>
              <Text style={s.price}>PKR {item.total_amount}</Text>
              <Text style={s.method}>
                {item.payment_method === 'cash' ? '💵 Cash' : `💳 ${item.payment_method}`}
              </Text>
            </View>

            <Text style={s.code}>Code: {item.pickup_code}</Text>

            {/* Show verify button only for cash orders that are confirmed (not yet picked up) */}
            {item.payment_method === 'cash' && item.order_status === 'confirmed' && (
              <TouchableOpacity
                style={s.verifyBtn}
                onPress={() => openVerification(item)}
              >
                <Text style={s.verifyBtnText}>Verify Pickup & Confirm Cash</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* ── Two-Step Verification Modal ── */}
      <Modal visible={!!modalOrder} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>

            {step === 1 && (
              <>
                <Text style={s.modalTitle}>Step 1 of 2</Text>
                <Text style={s.modalSubtitle}>Ask the customer to show their pickup code, then enter it below.</Text>
                <TextInput
                  style={s.codeField}
                  placeholder="Enter pickup code"
                  value={codeInput}
                  onChangeText={setCodeInput}
                  autoCapitalize="characters"
                  maxLength={6}
                />
                <TouchableOpacity style={s.modalBtn} onPress={handleStep1}>
                  <Text style={s.modalBtnText}>Verify Code →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={closeModal}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 2 && (
              <>
                <Text style={s.modalTitle}>Step 2 of 2</Text>
                <Text style={s.modalSubtitle}>Code verified ✅</Text>
                <Text style={s.cashAmount}>Collect PKR {modalOrder?.total_amount} cash from customer</Text>
                <Text style={s.cashNote}>
                  Your payout (after LastCall commission) will be settled every Monday via JazzCash.
                </Text>
                <TouchableOpacity
                  style={[s.modalBtn, verifying && { opacity: 0.6 }]}
                  onPress={handleStep2}
                  disabled={verifying}
                >
                  {verifying
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={s.modalBtnText}>✅ Cash Received — Complete Order</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={closeModal}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f7f7f7', padding: 16, paddingTop: 56 },
  heading:      { fontSize: 26, fontWeight: '900', color: '#1a1a1a', marginBottom: 16 },

  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
                  shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name:         { fontSize: 13, color: '#E53935', fontWeight: '700' },
  title:        { fontSize: 16, fontWeight: '700', color: '#111', marginVertical: 6 },
  price:        { fontSize: 18, fontWeight: '900', color: '#111' },
  method:       { fontSize: 13, color: '#888' },
  code:         { fontSize: 13, color: '#888', marginBottom: 10 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  empty:        { textAlign: 'center', color: '#999', marginTop: 80, fontSize: 15, lineHeight: 24 },

  verifyBtn:    { backgroundColor: '#E53935', borderRadius: 12, padding: 12, alignItems: 'center' },
  verifyBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                  padding: 24, paddingBottom: 40 },
  modalTitle:   { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 8 },
  modalSubtitle:{ fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },

  codeField:    { borderWidth: 2, borderColor: '#E53935', borderRadius: 12, padding: 14,
                  fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: 6,
                  marginBottom: 16, color: '#111' },

  cashAmount:   { fontSize: 28, fontWeight: '900', color: '#E53935', textAlign: 'center',
                  marginVertical: 16 },
  cashNote:     { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 20 },

  modalBtn:     { backgroundColor: '#E53935', borderRadius: 14, padding: 16, alignItems: 'center',
                  marginBottom: 12 },
  modalBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn:    { alignItems: 'center', padding: 10 },
  cancelText:   { color: '#999', fontSize: 14 },
});