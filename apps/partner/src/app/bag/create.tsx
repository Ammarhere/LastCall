import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../../services/api';

export default function CreateBagScreen() {
  const [form, setForm] = useState({
    title:           '',
    description:     '',
    originalPrice:   '',
    discountedPrice: '',
    quantityTotal:   '1',
    pickupDate:      new Date().toISOString().split('T')[0],
    pickupStart:     '18:00',
    pickupEnd:       '21:00',
    tags:            '',
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => api.post('/bags', {
      ...form,
      originalPrice:   parseFloat(form.originalPrice),
      discountedPrice: parseFloat(form.discountedPrice),
      quantityTotal:   parseInt(form.quantityTotal),
      tags:            form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      Alert.alert('Success!', 'Bag created and now live.');
      router.push('/(tabs)/bags');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Failed to create bag'),
  });

  const field = (key: keyof typeof form) => ({
    value:         form[key],
    onChangeText:  (v: string) => setForm((p) => ({ ...p, [key]: v })),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Create a New Bag</Text>

      <Label text="Bag Title *" />
      <TextInput style={styles.input} placeholder="e.g. Surprise Desi Box" {...field('title')} />

      <Label text="Description" />
      <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="What's in the bag?" {...field('description')} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Label text="Original Price (Rs)" />
          <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="500" {...field('originalPrice')} />
        </View>
        <View style={{ flex: 1 }}>
          <Label text="Discounted Price (Rs) *" />
          <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="180" {...field('discountedPrice')} />
        </View>
      </View>

      <Label text="Quantity Available *" />
      <TextInput style={styles.input} keyboardType="number-pad" placeholder="5" {...field('quantityTotal')} />

      <Label text="Pickup Date (YYYY-MM-DD)" />
      <TextInput style={styles.input} placeholder="2024-12-31" {...field('pickupDate')} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Label text="Pickup Start (HH:MM)" />
          <TextInput style={styles.input} placeholder="18:00" {...field('pickupStart')} />
        </View>
        <View style={{ flex: 1 }}>
          <Label text="Pickup End (HH:MM)" />
          <TextInput style={styles.input} placeholder="21:00" {...field('pickupEnd')} />
        </View>
      </View>

      <Label text="Tags (comma-separated)" />
      <TextInput style={styles.input} placeholder="biryani, rice, spicy" {...field('tags')} />

      <TouchableOpacity
        style={[styles.btn, isPending && { opacity: 0.6 }]}
        onPress={() => create()}
        disabled={isPending || !form.title || !form.discountedPrice}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>🛍️ Create & Publish Bag</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 }}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content:   { padding: 20 },
  heading:   { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 20 },
  input:     { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 14, backgroundColor: '#fafafa' },
  row:       { flexDirection: 'row', gap: 12 },
  btn:       { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});
