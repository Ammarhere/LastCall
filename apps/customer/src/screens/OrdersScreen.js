import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../services/api';

const STATUS_COLOR = { confirmed:'#1565C0', ready:'#2E7D32', picked_up:'#555', cancelled:'#c62828' };

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try { const r = await api.get('/api/orders'); setOrders(r.data.orders); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  if (loading) return <ActivityIndicator style={{flex:1}} color="#E53935" size="large" />;

  return (
    <View style={s.container}>
      <Text style={s.heading}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor="#E53935" />}
        ListEmptyComponent={<Text style={s.empty}>No orders yet!\nStart rescuing food 🛍️</Text>}
        renderItem={({item}) => (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.name}>{item.business_name}</Text>
              <View style={[s.badge, {backgroundColor: STATUS_COLOR[item.order_status]+'22'}]}>
                <Text style={[s.badgeText, {color: STATUS_COLOR[item.order_status]}]}>
                  {item.order_status.replace('_',' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={s.title}>{item.bag_title}</Text>
            <View style={s.row}>
              <Text style={s.price}>PKR {item.total_amount}</Text>
              <Text style={s.code}>Code: {item.pickup_code}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f7f7f7', padding:16, paddingTop:56 },
  heading:   { fontSize:26, fontWeight:'900', color:'#1a1a1a', marginBottom:16 },
  card:      { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  row:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  name:      { fontSize:13, color:'#E53935', fontWeight:'700' },
  title:     { fontSize:16, fontWeight:'700', color:'#111', marginVertical:6 },
  price:     { fontSize:18, fontWeight:'900', color:'#111' },
  code:      { fontSize:13, color:'#888' },
  badge:     { paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  badgeText: { fontSize:11, fontWeight:'700' },
  empty:     { textAlign:'center', color:'#999', marginTop:80, fontSize:15, lineHeight:24 },
});
