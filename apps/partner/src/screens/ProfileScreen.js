import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useAuthStore from '../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  return (
    <View style={s.container}>
      <View style={s.avatar}><Text style={s.avatarText}>{user?.name?.[0] || '🏪'}</Text></View>
      <Text style={s.name}>{user?.name || 'Partner'}</Text>
      <Text style={s.phone}>{user?.phone}</Text>
      <View style={s.infoBox}>
        <Text style={s.infoText}>Commission rate: 10%</Text>
        <Text style={s.infoText}>Payouts: every Monday</Text>
      </View>
      <TouchableOpacity style={s.btn} onPress={logout}>
        <Text style={s.btnText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', padding:24 },
  avatar:    { width:80, height:80, borderRadius:40, backgroundColor:'#2E7D32', alignItems:'center', justifyContent:'center', marginBottom:16 },
  avatarText:{ fontSize:32, color:'#fff', fontWeight:'900' },
  name:      { fontSize:22, fontWeight:'800', color:'#111', marginBottom:4 },
  phone:     { fontSize:15, color:'#888', marginBottom:24 },
  infoBox:   { backgroundColor:'#f1f8f1', borderRadius:14, padding:16, width:'100%', marginBottom:32, gap:8 },
  infoText:  { fontSize:14, color:'#2E7D32', fontWeight:'600' },
  btn:       { width:'100%', borderWidth:1.5, borderColor:'#2E7D32', borderRadius:14, padding:16, alignItems:'center' },
  btnText:   { color:'#2E7D32', fontWeight:'700', fontSize:16 },
});
