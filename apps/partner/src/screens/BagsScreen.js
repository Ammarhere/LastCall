import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '../services/api';

const STATUS_COLOR = { available:'#2E7D32', sold_out:'#E65100', cancelled:'#c62828' };

export default function BagsScreen({ navigation }) {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBags = useCallback(async () => {
    try {
      const me = await api.get('/api/partners/me');
      const res = await api.get('/api/bags', { params: { partner_id: me.data.partner.id } });
      // Filter to own bags client-side since listing is public
      setBags(res.data.bags.filter(b => b.partner_id === me.data.partner.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchBags(); }, [fetchBags]);

  const cancelBag = (id) => {
    Alert.alert('Cancel Bag', 'Mark this bag as cancelled?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: async () => {
        await api.delete(`/api/bags/${id}`);
        fetchBags();
      }},
    ]);
  };

  if (loading) return <ActivityIndicator style={{flex:1}} color="#2E7D32" size="large" />;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.heading}>My Bags</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('CreateBag')}>
          <Text style={s.addText}>+ New Bag</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={bags}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBags(); }} tintColor="#2E7D32" />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No bags yet!</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('CreateBag')}>
              <Text style={s.emptyBtnText}>Create your first bag →</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({item}) => (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.title}>{item.title}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status]+'22' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[item.status] }]}>
                  {item.status.replace('_',' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={s.row}>
              <Text style={s.price}>PKR {item.discounted_price}</Text>
              <Text style={s.original}>PKR {item.original_price}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.meta}>🕐 {item.pickup_start} – {item.pickup_end}</Text>
              <Text style={s.meta}>{item.quantity_left}/{item.quantity_total} left</Text>
            </View>
            {item.status === 'available' && (
              <TouchableOpacity style={s.cancelBtn} onPress={() => cancelBag(item.id)}>
                <Text style={s.cancelText}>Cancel Bag</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#f7f7f7', padding:16, paddingTop:56 },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16 },
  heading:     { fontSize:26, fontWeight:'900', color:'#1a1a1a' },
  addBtn:      { backgroundColor:'#2E7D32', paddingHorizontal:16, paddingVertical:8, borderRadius:20 },
  addText:     { color:'#fff', fontWeight:'700', fontSize:14 },
  card:        { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  row:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:6 },
  title:       { fontSize:16, fontWeight:'800', color:'#111', flex:1 },
  badge:       { paddingHorizontal:10, paddingVertical:4, borderRadius:20, marginLeft:8 },
  badgeText:   { fontSize:11, fontWeight:'700' },
  price:       { fontSize:18, fontWeight:'900', color:'#2E7D32' },
  original:    { fontSize:13, color:'#bbb', textDecorationLine:'line-through' },
  meta:        { fontSize:13, color:'#888' },
  cancelBtn:   { marginTop:8, borderWidth:1, borderColor:'#c62828', borderRadius:10, padding:8, alignItems:'center' },
  cancelText:  { color:'#c62828', fontWeight:'700', fontSize:13 },
  empty:       { alignItems:'center', marginTop:80 },
  emptyText:   { fontSize:18, color:'#999', marginBottom:16 },
  emptyBtn:    { backgroundColor:'#2E7D32', paddingHorizontal:24, paddingVertical:12, borderRadius:12 },
  emptyBtnText:{ color:'#fff', fontWeight:'700' },
});
