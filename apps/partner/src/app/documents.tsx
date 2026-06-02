import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const DOC_TYPES = [
  { key: 'CNIC',             label: '🪪 CNIC / National ID',  required: true },
  { key: 'BUSINESS_LICENSE', label: '📄 Business License',    required: false },
  { key: 'BANK_STATEMENT',   label: '🏦 Bank Statement',      required: false },
  { key: 'UTILITY_BILL',     label: '📑 Utility Bill',        required: false },
];

export default function DocumentsScreen() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [uploaded, setUploaded] = React.useState<Record<string, boolean>>({});

  const { mutate: upload, isPending } = useMutation({
    mutationFn: async ({ type, uri, name, mimeType }: any) => {
      const formData = new FormData();
      formData.append('document', { uri, name, type: mimeType } as any);
      formData.append('type', type);
      return api.post('/partners/me/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (_data, vars) => {
      setUploaded((p) => ({ ...p, [vars.type]: true }));
      Alert.alert('Uploaded!', 'Document submitted for review.');
    },
    onError: (err: any) => Alert.alert('Upload failed', err.response?.data?.error ?? 'Try again'),
  });

  const pick = async (type: string) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (result.canceled) return;
    const file = result.assets[0];
    upload({ type, uri: file.uri, name: file.name, mimeType: file.mimeType ?? 'image/jpeg' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Documents</Text>
      <Text style={styles.sub}>
        Upload verification documents for your partner account.
        CNIC is required. All documents are reviewed by our team.
      </Text>

      {DOC_TYPES.map((doc) => (
        <TouchableOpacity
          key={doc.key}
          style={[styles.card, uploaded[doc.key] && styles.cardDone]}
          onPress={() => pick(doc.key)}
          disabled={isPending}
          activeOpacity={0.8}
        >
          <Text style={styles.cardIcon}>{uploaded[doc.key] ? '✅' : '📤'}</Text>
          <View style={styles.cardBody}>
            <Text style={styles.cardLabel}>{doc.label}</Text>
            <Text style={styles.cardStatus}>
              {uploaded[doc.key] ? 'Uploaded — pending review' : `Tap to upload${doc.required ? ' (required)' : ' (optional)'}`}
            </Text>
          </View>
        </TouchableOpacity>
      ))}

      {isPending && <ActivityIndicator color="#1d4ed8" style={{ marginTop: 16 }} />}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          📋 Documents are reviewed within 24–48 hours. You will be notified via push notification when your account is approved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content:   { padding: 24 },
  heading:   { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  sub:       { fontSize: 13, color: '#6b7280', lineHeight: 20, marginBottom: 24 },
  card:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardDone:  { borderColor: '#16A34A', backgroundColor: '#f0fdf4' },
  cardIcon:  { fontSize: 28 },
  cardBody:  { flex: 1 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardStatus:{ fontSize: 12, color: '#6b7280', marginTop: 2 },
  note:      { backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginTop: 8 },
  noteText:  { fontSize: 13, color: '#1d4ed8', lineHeight: 20 },
});
