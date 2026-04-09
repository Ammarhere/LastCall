import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone) return Alert.alert('Enter your phone number');
    setLoading(true);
    try {
      // TODO: Firebase Phone Auth
      // 1. auth().signInWithPhoneNumber(phone) → confirmation
      // 2. confirmation.confirm(otp) → idToken
      // 3. POST /api/auth/firebase-login → JWT
      // 4. useAuthStore.getState().setAuth(user, token)
      Alert.alert('Next Step', 'Wire up Firebase Phone Auth here.');
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <Text style={s.logo}>LastCall</Text>
      <Text style={s.role}>Partner Portal 🏪</Text>
      <Text style={s.sub}>Manage your magic bags</Text>
      <TextInput style={s.input} placeholder="+92 300 0000000"
        value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Continue with Phone →</Text>}
      </TouchableOpacity>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', alignItems:'center', justifyContent:'center', padding:28 },
  logo:      { fontSize:40, fontWeight:'900', color:'#2E7D32', letterSpacing:-1 },
  role:      { fontSize:18, fontWeight:'700', color:'#333', marginTop:4 },
  sub:       { fontSize:14, color:'#888', marginBottom:48 },
  input:     { width:'100%', borderWidth:1.5, borderColor:'#eee', borderRadius:14, padding:16, fontSize:16, marginBottom:16 },
  btn:       { width:'100%', backgroundColor:'#2E7D32', borderRadius:14, padding:17, alignItems:'center' },
  btnText:   { color:'#fff', fontSize:16, fontWeight:'700' },
});
