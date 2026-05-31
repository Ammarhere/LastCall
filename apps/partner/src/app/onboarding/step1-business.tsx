import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../../services/api';
import { useAuthStore } from '../../../store/authStore';

export default function OnboardingStep1() {
  const loadUser = useAuthStore((s) => s.loadUser);
  const [form, setForm] = useState({
    businessName: '', category: 'Restaurant', description: '',
    cityId: '', area: '', address: '', pickupInstructions: '',
  });

  const CATEGORIES = ['Restaurant', 'Bakery', 'Café', 'Sweet Shop', 'Biryani', 'BBQ', 'Fast Food', 'Snacks'];

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/partners/register', { ...form }),
    onSuccess: async () => {
      await loadUser();
      router.push('/onboarding/step2-documents');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Registration failed'),
  });

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChangeText: (v: string) => setForm((p) => ({ ...p, [key]: v })),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.progress}><View style={[styles.progressFill, { width: '33%' }]} /></View>
      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.heading}>Business Information</Text>

      <Label text="Business Name *" />
      <TextInput style={styles.input} placeholder="e.g. Ali's Biryani House" {...f('businessName')} />

      <Label text="Category *" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, form.category === cat && styles.catChipActive]}
            onPress={() => setForm((p) => ({ ...p, category: cat }))}
          >
            <Text style={[styles.catText, form.category === cat && { color: '#fff' }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Label text="Description" />
      <TextInput style={[styles.input, { height: 80 }]} multiline placeholder="Tell customers about your business" {...f('description')} />

      <Label text="City ID *" />
      <TextInput style={styles.input} placeholder="(UUID from cities API)" {...f('cityId')} />

      <Label text="Area / Neighbourhood *" />
      <TextInput style={styles.input} placeholder="e.g. DHA Phase 6" {...f('area')} />

      <Label text="Full Address *" />
      <TextInput style={styles.input} placeholder="Street, Landmark" {...f('address')} />

      <Label text="Pickup Instructions" />
      <TextInput style={styles.input} placeholder="e.g. Come to the main counter" {...f('pickupInstructions')} />

      <TouchableOpacity
        style={[styles.btn, (isPending || !form.businessName || !form.address) && { opacity: 0.5 }]}
        onPress={() => mutate()}
        disabled={isPending || !form.businessName || !form.address}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Next: Upload Documents →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 }}>{text}</Text>;
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff' },
  content:       { padding: 20 },
  progress:      { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 8 },
  progressFill:  { height: 4, backgroundColor: '#1d4ed8', borderRadius: 2 },
  step:          { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  heading:       { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 20 },
  input:         { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: '#fafafa' },
  catRow:        { marginBottom: 12 },
  catChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e5e7eb', marginRight: 8 },
  catChipActive: { backgroundColor: '#1d4ed8' },
  catText:       { fontSize: 13, color: '#374151', fontWeight: '600' },
  btn:           { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  btnText:       { color: '#fff', fontSize: 15, fontWeight: '700' },
});
