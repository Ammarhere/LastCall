import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../services/api';

export default function CreateBagScreen({ navigation }) {
  const [form, setForm] = useState({ title:'', description:'', original_price:'', discounted_price:'', quantity_total:'1', pickup_start:'18:00', pickup_end:'21:00' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const submit = async () => {
    if (!form.title || !form.original_price || !form.discounted_price) return Alert.alert('Fill required fields');
    setLoading(true);
    try {
      await api.post('/api/bags', { ...form, original_price: parseFloat(form.original_price), discounted_price: parseFloat(form.discounted_price), quantity_total: parseInt(form.quantity_total) });
      Alert.alert('✅ Bag Created!', 'Your magic bag is now live.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) { Alert.alert('Error', e.response?.data?.error || e.message); }
    finally { setLoading(false); }
  };

  const field = (label, key, props={}) => (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput style={s.input} value={form[key]} onChangeText={v => set(key, v)} {...props} />
    </View>
  );

  return (
    <ScrollView style={s.container}>
      <Text style={s.heading}>Create Magic Bag</Text>
      {field('Title *', 'title', { placeholder: 'e.g. Chef\'s Surprise Box' })}
      {field('Description', 'description', { placeholder: 'What might be inside?', multiline: true })}
      {field('Original Price (PKR) *', 'original_price', { keyboardType:'numeric', placeholder:'800' })}
      {field('Discounted Price (PKR) *', 'discounted_price', { keyboardType:'numeric', placeholder:'300' })}
      {field('Quantity', 'quantity_total', { keyboardType:'numeric' })}
      {field('Pickup Start (HH:MM)', 'pickup_start', { placeholder:'18:00' })}
      {field('Pickup End (HH:MM)', 'pickup_end', { placeholder:'21:00' })}
      <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Bag →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff', padding:20 },
  heading:   { fontSize:26, fontWeight:'900', color:'#1a1a1a', marginTop:44, marginBottom:24 },
  field:     { marginBottom:16 },
  label:     { fontSize:13, fontWeight:'700', color:'#555', marginBottom:6 },
  input:     { borderWidth:1.5, borderColor:'#eee', borderRadius:12, padding:14, fontSize:15 },
  btn:       { backgroundColor:'#2E7D32', borderRadius:16, padding:18, alignItems:'center', marginTop:8, marginBottom:40 },
  btnText:   { color:'#fff', fontSize:17, fontWeight:'800' },
});
