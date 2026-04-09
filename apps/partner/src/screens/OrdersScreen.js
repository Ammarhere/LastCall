import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '../services/api';

const NEXT_STATUS = { confirmed: 'ready', ready: 'picked_up' };
const STATUS_COLOR = { confirmed:'#1565C0', ready:'#E65100', picked_up:'#388E3C', cancelled:'#c62828' };
const STATUS_LABEL = { confirmed:'Confirmed', ready:'Ready for Pickup', picked_up:'Picked Up', cancelled:'Cancelled' };

export default function OrdersScreen() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try { const r = await api.get('/api/orders'); setOrders(r.data.orders); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.order_status];
    if (!next) return;
    Alert.alert('Update Status', `Mark order as "${STATUS_LABEL[next]}"?`, [
      { text: 'Cancel' },
      { text: 'Confirm', onPress: async () => {
        try {
          await api.patch(`/api/orders/${order.id}/status`, { status: next });
          fetchOrders();
        } catch (e) { Alert.alert('Error', e.response?.data?.error || e.message); }
      }},
    ]);
  };

  if (loading) return <ActivityIndicator style={{flex:1}} color="#2E7D32" size="large" />;

  return (
    <View style={s.container}>
      <Text style={s.heading}>Today's Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#2E7D32" />}
        ListEmptyComponent={<Text style={s.empty}>No orders yet today 📭</Text>}
        renderItem={({item}) => (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.name}>{item.customer_name || 'Customer'}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.order_status]+'22' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[item.order_status] }]}>
                  {STATUS_LABEL[item.order_status]}
                </Text>
              </View>
            </View>
            <Text style={s.bagTitle}>{item.bag_title}</Text>
            <View style={s.row}>
              <Text style={s.phone}>{item.customer_phone}</Text>
              <Text style={s.code}>Code: <Text style={s.codeVal}>{item.pickup_code}</Text></Text>
            </View>
            <Text style={s.amount}>PKR {item.total_amount} · Your share: PKR {item.partner_payout}</Text>
            {NEXT_STATUS[item.order_status] && (
              <TouchableOpacity style={s.actionBtn} onPress={() => advanceStatus(item)}>
                <Text style={s.actionText}>
                  Mark as {STATUS_LABEL[NEXT_STATUS[item.order_status]]} →
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:'#f7f7f7', padding:16, paddingTop:56 },
  heading:    { fontSize:26, fontWeight:'900', color:'#1a1a1a', marginBottom:16 },
  card:       { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  row:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  name:       { fontSize:15, fontWeight:'800', color:'#111' },
  badge:      { paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  badgeText:  { fontSize:11, fontWeight:'700' },
  bagTitle:   { fontSize:13, color:'#555', marginBottom:6 },
  phone:      { fontSize:13, color:'#888' },
  code:       { fontSize:13, color:'#888' },
  codeVal:    { fontWeight:'900', color:'#111' },
  amount:     { fontSize:13, color:'#2E7D32', fontWeight:'700', marginTop:4 },
  actionBtn:  { marginTop:12, backgroundColor:'#2E7D32', borderRadius:10, padding:12, alignItems:'center' },
  actionText: { color:'#fff', fontWeight:'700', fontSize:14 },
  empty:      { textAlign:'center', color:'#999', marginTop:80, fontSize:15 },
});
