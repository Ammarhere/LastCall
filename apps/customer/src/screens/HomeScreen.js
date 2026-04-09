import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [area, setArea] = useState('');

  const fetchBags = useCallback(async () => {
    try {
      const res = await api.get('/api/bags', { params: { area: area || undefined } });
      setBags(res.data.bags);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [area]);

  useEffect(() => { fetchBags(); }, [fetchBags]);

  if (loading) return <ActivityIndicator style={{flex:1}} color="#E53935" size="large" />;

  return (
    <View style={s.container}>
      <Text style={s.heading}>Available Today</Text>
      <TextInput style={s.search} placeholder="Filter by area (e.g. DHA, Clifton)"
        value={area} onChangeText={setArea} onSubmitEditing={fetchBags} returnKeyType="search" />
      <FlatList
        data={bags}
        keyExtractor={i => i.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBags(); }} tintColor="#E53935" />}
        ListEmptyComponent={<Text style={s.empty}>No bags available right now 😕{'\n'}Check back later!</Text>}
        renderItem={({item}) => (
          <TouchableOpacity style={s.card} onPress={() => navigation.navigate('BagDetail', { bag: item })}>
            <Text style={s.partner}>{item.business_name} · {item.area}</Text>
            <Text style={s.title}>{item.title}</Text>
            <View style={s.row}>
              <Text style={s.price}>PKR {item.discounted_price}</Text>
              <Text style={s.original}>PKR {item.original_price}</Text>
              <View style={s.badge}><Text style={s.badgeText}>{item.quantity_left} left</Text></View>
            </View>
            <Text style={s.pickup}>🕐 Pickup {item.pickup_start} – {item.pickup_end}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f7f7f7', paddingHorizontal:16, paddingTop:56 },
  heading:   { fontSize:26, fontWeight:'900', color:'#1a1a1a', marginBottom:12 },
  search:    { backgroundColor:'#fff', borderRadius:12, padding:12, fontSize:14, marginBottom:12, borderWidth:1, borderColor:'#eee' },
  card:      { backgroundColor:'#fff', borderRadius:16, padding:16, marginBottom:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  partner:   { fontSize:12, color:'#E53935', fontWeight:'700', marginBottom:4 },
  title:     { fontSize:17, fontWeight:'800', color:'#111', marginBottom:10 },
  row:       { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  price:     { fontSize:20, fontWeight:'900', color:'#E53935' },
  original:  { fontSize:14, color:'#aaa', textDecorationLine:'line-through' },
  badge:     { marginLeft:'auto', backgroundColor:'#E8F5E9', paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  badgeText: { fontSize:12, color:'#2E7D32', fontWeight:'700' },
  pickup:    { fontSize:13, color:'#666' },
  empty:     { textAlign:'center', color:'#999', marginTop:80, fontSize:15, lineHeight:24 },
});
