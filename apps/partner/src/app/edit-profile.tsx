import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function EditPartnerProfileScreen() {
  const { loadUser } = useAuthStore();
  const qc = useQueryClient();

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner-me'],
    queryFn:  () => api.get('/partners/me').then((r) => r.data.data),
  });

  const [businessName,        setBusinessName]       = useState('');
  const [description,         setDescription]        = useState('');
  const [address,             setAddress]            = useState('');
  const [pickupInstructions,  setPickupInstructions] = useState('');

  React.useEffect(() => {
    if (partner) {
      setBusinessName(partner.businessName ?? '');
      setDescription(partner.description ?? '');
      setAddress(partner.address ?? '');
      setPickupInstructions(partner.pickupInstructions ?? '');
    }
  }, [partner]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.patch('/partners/me', {
      businessName, description, address, pickupInstructions,
    }),
    onSuccess: async () => {
      await loadUser();
      qc.invalidateQueries({ queryKey: ['partner-me'] });
      Alert.alert('Saved!', 'Business profile updated.');
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Could not save'),
  });

  if (isLoading) return <ActivityIndicator size="large" color="#1d4ed8" style={{ flex: 1 }} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Edit Business Profile</Text>

      <Label text="Business Name" />
      <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} placeholder="Your restaurant name" />

      <Label text="Description" />
      <TextInput style={[styles.input, { height: 90 }]} multiline value={description} onChangeText={setDescription} placeholder="Tell customers about your business" />

      <Label text="Address" />
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Full address" />

      <Label text="Pickup Instructions" />
      <TextInput style={styles.input} value={pickupInstructions} onChangeText={setPickupInstructions} placeholder="e.g. Come to the main counter" />

      <TouchableOpacity
        style={[styles.btn, isPending && { opacity: 0.6 }]}
        onPress={() => save()}
        disabled={isPending}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content:   { padding: 24 },
  heading:   { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 24 },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 4 },
  input:     { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16, backgroundColor: '#f9fafb', color: '#111827' },
  btn:       { backgroundColor: '#1d4ed8', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4, marginBottom: 12 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText:{ color: '#6b7280', fontSize: 14 },
});
