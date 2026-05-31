import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Switch, Alert, ActivityIndicator, Modal, TextInput, ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { formatPKR } from '@lastcall/shared';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
type Day = typeof DAYS[number];

interface Template {
  id: string;
  title: string;
  originalPrice: number;
  discountedPrice: number;
  quantityTotal: number;
  pickupStart: string;
  pickupEnd: string;
  activeDays: Day[];
  isActive: boolean;
  category?: string;
}

const emptyForm = {
  title: '', description: '', originalPrice: '', discountedPrice: '',
  quantityTotal: '5', pickupStart: '18:00', pickupEnd: '21:00',
  activeDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'] as Day[],
  category: '',
};

export default function TemplatesScreen() {
  const qc = useQueryClient();
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState<Template | null>(null);
  const [form, setForm]                 = useState({ ...emptyForm });

  const { data, isLoading, refetch } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn:  () => api.get('/partners/me/templates').then((r) => r.data.data),
  });

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (payload: any) =>
      editing
        ? api.patch(`/partners/me/templates/${editing.id}`, payload)
        : api.post('/partners/me/templates', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['partner-stats'] });
      closeForm();
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Failed to save template'),
  });

  const { mutate: toggle } = useMutation({
    mutationFn: (id: string) => api.patch(`/partners/me/templates/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => api.delete(`/partners/me/templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(t: Template) {
    setEditing(t);
    setForm({
      title:           t.title,
      description:     '',
      originalPrice:   String(t.originalPrice),
      discountedPrice: String(t.discountedPrice),
      quantityTotal:   String(t.quantityTotal),
      pickupStart:     t.pickupStart,
      pickupEnd:       t.pickupEnd,
      activeDays:      t.activeDays,
      category:        t.category ?? '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  function toggleDay(day: Day) {
    setForm((p) => ({
      ...p,
      activeDays: p.activeDays.includes(day)
        ? p.activeDays.filter((d) => d !== day)
        : [...p.activeDays, day],
    }));
  }

  function handleSave() {
    if (!form.title || !form.discountedPrice || !form.originalPrice) {
      return Alert.alert('Missing fields', 'Title and prices are required');
    }
    if (form.activeDays.length === 0) {
      return Alert.alert('Select days', 'Choose at least one day');
    }
    save({
      title:           form.title,
      originalPrice:   parseFloat(form.originalPrice),
      discountedPrice: parseFloat(form.discountedPrice),
      quantityTotal:   parseInt(form.quantityTotal),
      pickupStart:     form.pickupStart,
      pickupEnd:       form.pickupEnd,
      activeDays:      form.activeDays,
      category:        form.category || undefined,
      isActive:        true,
    });
  }

  function confirmDelete(id: string) {
    Alert.alert('Delete Template?', 'This template will stop auto-publishing bags.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Header banner */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔁 Auto-Publish Templates</Text>
        <Text style={styles.headerSub}>
          Set once — bags publish automatically at 2:00 PM every day you choose.
          Your fans are notified the moment each bag goes live.
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(t) => t.id}
          onRefresh={refetch}
          refreshing={isLoading}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛍️</Text>
              <Text style={styles.emptyTitle}>No templates yet</Text>
              <Text style={styles.emptySub}>Create your first template and never list manually again</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, !item.isActive && styles.cardInactive]}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {formatPKR(item.discountedPrice)} · {item.quantityTotal} bags · {item.pickupStart}–{item.pickupEnd}
                  </Text>
                  <View style={styles.daysRow}>
                    {DAYS.map((d) => (
                      <View
                        key={d}
                        style={[styles.dayChip, item.activeDays.includes(d) && styles.dayChipActive]}
                      >
                        <Text style={[styles.dayText, item.activeDays.includes(d) && { color: '#fff' }]}>
                          {d.slice(0, 2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <Switch
                  value={item.isActive}
                  onValueChange={() => toggle(item.id)}
                  trackColor={{ false: '#d1d5db', true: '#1d4ed8' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn}   onPress={() => openEdit(item)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
        <Text style={styles.createBtnText}>+ Create New Template</Text>
      </TouchableOpacity>

      {/* Create / Edit Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
          <Text style={styles.modalTitle}>{editing ? 'Edit Template' : 'New Template'}</Text>

          <Label text="Bag Title *" />
          <TextInput style={styles.input} placeholder="e.g. Evening Biryani Box" value={form.title} onChangeText={(v) => setForm((p) => ({ ...p, title: v }))} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Label text="Original Price (Rs) *" />
              <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="500" value={form.originalPrice} onChangeText={(v) => setForm((p) => ({ ...p, originalPrice: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Sale Price (Rs) *" />
              <TextInput style={styles.input} keyboardType="decimal-pad" placeholder="150" value={form.discountedPrice} onChangeText={(v) => setForm((p) => ({ ...p, discountedPrice: v }))} />
            </View>
          </View>

          <Label text="Bags Per Day *" />
          <TextInput style={styles.input} keyboardType="number-pad" placeholder="5" value={form.quantityTotal} onChangeText={(v) => setForm((p) => ({ ...p, quantityTotal: v }))} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Label text="Pickup Start (HH:MM)" />
              <TextInput style={styles.input} placeholder="18:00" value={form.pickupStart} onChangeText={(v) => setForm((p) => ({ ...p, pickupStart: v }))} />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Pickup End (HH:MM)" />
              <TextInput style={styles.input} placeholder="21:00" value={form.pickupEnd} onChangeText={(v) => setForm((p) => ({ ...p, pickupEnd: v }))} />
            </View>
          </View>

          <Label text="Publish on these days *" />
          <View style={styles.daysPickerRow}>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayPickerChip, form.activeDays.includes(d) && styles.dayPickerChipActive]}
                onPress={() => toggleDay(d)}
              >
                <Text style={[styles.dayPickerText, form.activeDays.includes(d) && { color: '#fff' }]}>
                  {d.slice(0, 2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={closeForm}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Template</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 }}>{text}</Text>;
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#f9fafb' },
  header:             { backgroundColor: '#1d4ed8', padding: 20, paddingTop: 24 },
  headerTitle:        { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub:          { fontSize: 13, color: '#bfdbfe', lineHeight: 18 },
  list:               { padding: 16, paddingBottom: 100 },
  card:               { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardInactive:       { opacity: 0.6 },
  cardTop:            { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle:          { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardMeta:           { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  daysRow:            { flexDirection: 'row', gap: 4 },
  dayChip:            { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#e5e7eb' },
  dayChipActive:      { backgroundColor: '#1d4ed8' },
  dayText:            { fontSize: 10, fontWeight: '700', color: '#374151' },
  cardActions:        { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  editBtn:            { flex: 1, backgroundColor: '#eff6ff', borderRadius: 8, padding: 8, alignItems: 'center' },
  editBtnText:        { color: '#1d4ed8', fontWeight: '700', fontSize: 13 },
  deleteBtn:          { flex: 1, backgroundColor: '#fef2f2', borderRadius: 8, padding: 8, alignItems: 'center' },
  deleteBtnText:      { color: '#ef4444', fontWeight: '700', fontSize: 13 },
  createBtn:          { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: '#1d4ed8', borderRadius: 14, padding: 16, alignItems: 'center' },
  createBtnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty:              { alignItems: 'center', marginTop: 60 },
  emptyEmoji:         { fontSize: 48, marginBottom: 12 },
  emptyTitle:         { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub:           { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 6, paddingHorizontal: 20 },
  modal:              { flex: 1, padding: 24, backgroundColor: '#fff' },
  modalTitle:         { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 12 },
  input:              { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12, backgroundColor: '#fafafa' },
  row:                { flexDirection: 'row', gap: 12 },
  daysPickerRow:      { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  dayPickerChip:      { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#e5e7eb' },
  dayPickerChipActive:{ backgroundColor: '#1d4ed8' },
  dayPickerText:      { fontSize: 13, fontWeight: '700', color: '#374151' },
  modalActions:       { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:          { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText:      { color: '#374151', fontWeight: '700' },
  saveBtn:            { flex: 2, backgroundColor: '#1d4ed8', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnText:        { color: '#fff', fontWeight: '700', fontSize: 15 },
});
