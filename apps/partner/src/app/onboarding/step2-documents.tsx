import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../../services/api';

const DOC_TYPES = [
  { key: 'CNIC',             label: '🪪 CNIC / National ID' },
  { key: 'BUSINESS_LICENSE', label: '📄 Business License' },
  { key: 'BANK_STATEMENT',   label: '🏦 Bank Statement' },
];

export default function OnboardingStep2() {
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({});

  const { mutate: upload, isPending } = useMutation({
    mutationFn: async ({ type, uri, name, mimeType }: any) => {
      const formData = new FormData();
      formData.append('document', { uri, name, type: mimeType } as any);
      formData.append('type', type);
      return api.post('/partners/me/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (_data, vars) => setUploaded((p) => ({ ...p, [vars.type]: true })),
    onError:   (err: any) => Alert.alert('Upload failed', err.response?.data?.error ?? 'Try again'),
  });

  const pick = async (type: string) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (result.canceled) return;
    const file = result.assets[0];
    upload({ type, uri: file.uri, name: file.name, mimeType: file.mimeType });
  };

  const cnicUploaded = uploaded['CNIC'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.progress}><View style={[styles.progressFill, { width: '66%' }]} /></View>
      <Text style={styles.step}>Step 2 of 3</Text>
      <Text style={styles.heading}>Upload Documents</Text>
      <Text style={styles.sub}>We need to verify your identity before you can go live. CNIC is required.</Text>

      {DOC_TYPES.map((doc) => (
        <TouchableOpacity
          key={doc.key}
          style={[styles.docCard, uploaded[doc.key] && styles.docCardDone]}
          onPress={() => pick(doc.key)}
          disabled={isPending}
        >
          <Text style={styles.docIcon}>{uploaded[doc.key] ? '✅' : '📤'}</Text>
          <View>
            <Text style={styles.docLabel}>{doc.label}</Text>
            <Text style={styles.docStatus}>{uploaded[doc.key] ? 'Uploaded ✓' : 'Tap to upload'}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {isPending && <ActivityIndicator color="#1d4ed8" style={{ marginVertical: 16 }} />}

      <TouchableOpacity
        style={[styles.btn, !cnicUploaded && { opacity: 0.5 }]}
        onPress={() => router.push('/onboarding/step3-review')}
        disabled={!cnicUploaded}
      >
        <Text style={styles.btnText}>Next: Submit for Review →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back to Step 1</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  content:      { padding: 20 },
  progress:     { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#1d4ed8', borderRadius: 2 },
  step:         { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  heading:      { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  sub:          { fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 20 },
  docCard:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  docCardDone:  { borderColor: '#16A34A', backgroundColor: '#f0fdf4' },
  docIcon:      { fontSize: 28 },
  docLabel:     { fontSize: 14, fontWeight: '700', color: '#111827' },
  docStatus:    { fontSize: 12, color: '#6b7280', marginTop: 2 },
  btn:          { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  backBtn:      { padding: 10, alignItems: 'center' },
  backText:     { color: '#1d4ed8', fontSize: 13 },
});
