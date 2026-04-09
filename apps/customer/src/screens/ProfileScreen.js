import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useAuthStore from '../store/authStore';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  return (
    <View style={s.container}>
      <View style={s.avatar}><Text style={s.avatarText}>{user?.name?.[0] || '?'}</Text></View>
      <Text style={s.name}>{user?.name || 'Customer'}</Text>
      <Text style={s.phone}>{user?.phone}</Text>
      <TouchableOpacity style={s.btn} onPress={logout}>
        <Text style={s.btnText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', padding:24 },
  avatar:    { width:80, height:80, borderRadius:40, backgroundColor:'#E53935', alignItems:'center', justifyContent:'center', marginBottom:16 },
  avatarText:{ fontSize:32, color:'#fff', fontWeight:'900' },
  name:      { fontSize:22, fontWeight:'800', color:'#111', marginBottom:4 },
  phone:     { fontSize:15, color:'#888', marginBottom:40 },
  btn:       { width:'100%', borderWidth:1.5, borderColor:'#E53935', borderRadius:14, padding:16, alignItems:'center' },
  btnText:   { color:'#E53935', fontWeight:'700', fontSize:16 },
});
