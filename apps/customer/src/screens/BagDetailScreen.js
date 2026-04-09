import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';

export default function BagDetailScreen({ route, navigation }) {
  const { bag } = route.params;
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post('/api/orders', { bag_id: bag.id, quantity: 1, payment_method: 'cash' });
      Alert.alert('✅ Order Confirmed!', `Pickup code: ${res.data.order.pickup_code}\n\nShow this code at the counter.`,
        [{ text: 'My Orders', onPress: () => navigation.navigate('Orders') }]);
    } catch (e) { Alert.alert('Error', e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  };

  const discount = Math.round((1 - bag.discounted_price / bag.original_price) * 100);

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <View style={s.discBadge}><Text style={s.discText}>-{discount}%</Text></View>
      </View>
      <Text style={s.partner}>{bag.business_name}</Text>
      <Text style={s.title}>{bag.title}</Text>
      {bag.description ? <Text style={s.desc}>{bag.description}</Text> : null}
      <View style={s.infoBox}>
        <Text style={s.infoLabel}>📍 Address</Text>
        <Text style={s.infoVal}>{bag.address}</Text>
        <Text style={s.infoLabel}>🕐 Pickup Window</Text>
        <Text style={s.infoVal}>{bag.pickup_start} – {bag.pickup_end}</Text>
        <Text style={s.infoLabel}>🛍️ Bags Left</Text>
        <Text style={s.infoVal}>{bag.quantity_left}</Text>
      </View>
      <View style={s.priceRow}>
        <View>
          <Text style={s.priceLabel}>You pay</Text>
          <Text style={s.price}>PKR {bag.discounted_price}</Text>
        </View>
        <Text style={s.original}>was PKR {bag.original_price}</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={placeOrder} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Reserve for PKR {bag.discounted_price}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#fff', padding:20 },
  header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20, marginTop:44 },
  back:       { fontSize:16, color:'#E53935', fontWeight:'600' },
  discBadge:  { backgroundColor:'#E53935', paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  discText:   { color:'#fff', fontWeight:'800', fontSize:14 },
  partner:    { fontSize:13, color:'#E53935', fontWeight:'700', marginBottom:6 },
  title:      { fontSize:24, fontWeight:'900', color:'#111', marginBottom:10 },
  desc:       { fontSize:15, color:'#555', lineHeight:22, marginBottom:16 },
  infoBox:    { backgroundColor:'#f7f7f7', borderRadius:14, padding:16, marginBottom:20 },
  infoLabel:  { fontSize:12, color:'#999', marginTop:10 },
  infoVal:    { fontSize:15, fontWeight:'600', color:'#222', marginTop:2 },
  priceRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24 },
  priceLabel: { fontSize:12, color:'#999' },
  price:      { fontSize:28, fontWeight:'900', color:'#E53935' },
  original:   { fontSize:14, color:'#bbb', textDecorationLine:'line-through' },
  btn:        { backgroundColor:'#E53935', borderRadius:16, padding:18, alignItems:'center', marginBottom:40 },
  btnText:    { color:'#fff', fontSize:17, fontWeight:'800' },
});
