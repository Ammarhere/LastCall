import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native';
import api from '../services/api';

const PAYMENT_METHODS = [
  { id: 'cash',          label: 'Cash on Pickup',  icon: '💵', desc: 'Pay when you collect your bag' },
  { id: 'jazzcash',      label: 'JazzCash',         icon: '📱', desc: 'Pay via JazzCash wallet or card' },
  { id: 'easypaisa',     label: 'Easypaisa',        icon: '📱', desc: 'Pay via Easypaisa wallet or card' },
  { id: 'sadapay',       label: 'SadaPay',          icon: '💳', desc: 'Pay via SadaPay' },
  { id: 'nayapay',       label: 'NayaPay',          icon: '💙', desc: 'Pay via NayaPay' },
  { id: 'raast',         label: 'Raast',            icon: '🏦', desc: 'Instant bank transfer via Raast' },
  { id: 'bank_transfer', label: 'Bank Transfer',    icon: '🏛️', desc: 'IBFT to LastCall account' },
];

export default function PaymentScreen({ route, navigation }) {
  const { bag, quantity } = route.params;
  const [selected, setSelected] = useState('cash');
  const [loading, setLoading]   = useState(false);

  const total = (parseFloat(bag.discounted_price) * quantity).toFixed(2);

  const handlePay = async () => {
    setLoading(true);
    try {
      if (selected === 'cash') {
        // Cash — create order directly
        const res = await api.post('/api/orders', {
          bag_id:   bag.id,
          quantity,
          payment_method: 'cash',
        });
        navigation.replace('OrderConfirmed', { order: res.data.order });

      } else {
        // Digital — initiate payment, get gateway details
        const res = await api.post('/api/payments/initiate', {
          bag_id:   bag.id,
          quantity,
          method:   selected,
        });

        const data = res.data;

        if (data.gateway === 'bank_transfer' || data.type === 'manual_iban') {
          // Show bank details to customer
          const details = data.bank_details;
          Alert.alert(
            'Transfer Details',
            `Bank: ${details.bank_name}\nAccount: ${details.account_name}\nIBAN: ${details.iban}\nAmount: PKR ${total}\nReference: ${details.reference}\n\n${data.instructions}`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        } else {
          // For JazzCash, Easypaisa, NayaPay, Raast — show gateway URL/instructions
          // In production: open WebView or deep-link to gateway app
          Alert.alert(
            'Redirecting to ' + data.gateway,
            data.instructions || `You will be redirected to complete payment.\nReference: ${data.txn_ref}`,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Order Summary */}
      <View style={s.summary}>
        <Text style={s.summaryLabel}>Ordering from</Text>
        <Text style={s.summaryBusiness}>{bag.business_name}</Text>
        <Text style={s.summaryBag}>{bag.title} × {quantity}</Text>
        <View style={s.summaryRow}>
          <Text style={s.summaryTotal}>Total</Text>
          <Text style={s.summaryAmount}>PKR {total}</Text>
        </View>
      </View>

      <Text style={s.sectionTitle}>Choose Payment Method</Text>

      {PAYMENT_METHODS.map(m => (
        <TouchableOpacity
          key={m.id}
          style={[s.method, selected === m.id && s.methodActive]}
          onPress={() => setSelected(m.id)}
        >
          <Text style={s.methodIcon}>{m.icon}</Text>
          <View style={s.methodInfo}>
            <Text style={[s.methodLabel, selected === m.id && s.methodLabelActive]}>
              {m.label}
            </Text>
            <Text style={s.methodDesc}>{m.desc}</Text>
          </View>
          <View style={[s.radio, selected === m.id && s.radioActive]}>
            {selected === m.id && <View style={s.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}

      {selected === 'cash' && (
        <View style={s.cashNote}>
          <Text style={s.cashNoteText}>
            💡 Cash orders are tracked. Your pickup code confirms collection and the restaurant settles commission with LastCall weekly.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[s.btn, loading && s.btnDisabled]}
        onPress={handlePay}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.btnText}>
              {selected === 'cash' ? `Confirm Order · PKR ${total}` : `Pay PKR ${total} via ${PAYMENT_METHODS.find(m => m.id === selected)?.label}`}
            </Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f7f7f7' },
  content:            { padding: 16, paddingBottom: 40 },

  summary:            { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24,
                        shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryLabel:       { fontSize: 12, color: '#999', marginBottom: 4 },
  summaryBusiness:    { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 2 },
  summaryBag:         { fontSize: 14, color: '#555', marginBottom: 12 },
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  summaryTotal:       { fontSize: 14, color: '#999' },
  summaryAmount:      { fontSize: 22, fontWeight: '900', color: '#E53935' },

  sectionTitle:       { fontSize: 16, fontWeight: '800', color: '#111', marginBottom: 12 },

  method:             { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        borderWidth: 2, borderColor: 'transparent',
                        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  methodActive:       { borderColor: '#E53935' },
  methodIcon:         { fontSize: 24 },
  methodInfo:         { flex: 1 },
  methodLabel:        { fontSize: 15, fontWeight: '700', color: '#111' },
  methodLabelActive:  { color: '#E53935' },
  methodDesc:         { fontSize: 12, color: '#999', marginTop: 2 },
  radio:              { width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                        borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  radioActive:        { borderColor: '#E53935' },
  radioDot:           { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E53935' },

  cashNote:           { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginBottom: 16 },
  cashNoteText:       { fontSize: 12, color: '#795548', lineHeight: 18 },

  btn:                { backgroundColor: '#E53935', borderRadius: 16, padding: 18,
                        alignItems: 'center', marginTop: 8 },
  btnDisabled:        { opacity: 0.6 },
  btnText:            { color: '#fff', fontSize: 16, fontWeight: '800' },
});