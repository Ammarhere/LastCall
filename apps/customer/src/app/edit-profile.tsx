import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function EditProfileScreen() {
  const { user, loadUser } = useAuthStore();
  const qc = useQueryClient();

  const [name,  setName]  = useState(user?.name  ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => api.patch('/users/me', { name, email: email || undefined }),
    onSuccess: async () => {
      await loadUser();
      qc.invalidateQueries({ queryKey: ['profile'] });
      Alert.alert('Saved!', 'Your profile has been updated.');
      router.back();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Could not save'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Edit Profile</Text>

      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Email Address</Text>
      <TextInput
        style={styles.input}
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.sub}>Phone: {user?.phone} (cannot be changed)</Text>

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content:   { padding: 24 },
  heading:   { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 24 },
  label:     { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input:     { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 18, backgroundColor: '#f9fafb', color: '#111827' },
  sub:       { fontSize: 12, color: '#9ca3af', marginBottom: 24 },
  btn:       { backgroundColor: '#16A34A', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center' },
  cancelText:{ color: '#6b7280', fontSize: 14 },
});
