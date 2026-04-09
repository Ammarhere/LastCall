import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform
} from 'react-native';
import api from '../services/api';

const CATEGORIES = ['Bakery', 'Restaurant', 'Cafe', 'Grocery', 'Sweets', 'Other'];

export default function CreateBagScreen({ navigation }) {
  const [form, setForm] = useState({
    title: '', description: '', original_price: '',
    discounted_price: '', quantity_total: '1',
    pickup_start: '18:00', pickup_end: '21:00',
    pickup_date: new Date().toISOString().split('T')[0],
    tags: [],
  });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleTag = (tag) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const validate = () => {
    if (!form.title.trim())           return 'Bag title is required';
    if (!form.original_price)         return 'Original price is required';
    if (!form.discounted_price)       return 'Discounted price is required';
    const op = parseFloat(form.original_price);
    const dp = parseFloat(form.discounted_price);
    if (isNaN(op) || op <= 0)         return 'Enter a valid original price';
    if (isNaN(dp) || dp <= 0)         return 'Enter a valid discounted price';
    if (dp >= op)                     return 'Discounted price must be less than original price';
    if (!form.pickup_start.match(/^\d{2}:\d{2}$/)) return 'Invalid pickup start time (HH:MM)';
    if (!form.pickup_end.match(/^\d{2}:\d{2}$/))   return 'Invalid pickup end time (HH:MM)';
    if (!form.pickup_date.match(/^\d{4}-\d{2}-\d{2}$/)) return 'Invalid pickup date (YYYY-MM-DD)';
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) return Alert.alert('Validation Error', err);
    setLoading(true);
    try {
      await api.post('/api/bags', {
        title:            form.title.trim(),
        description:      form.description.trim(),
        original_price:   parseFloat(form.original_price),
        discounted_price: parseFloat(form.discounted_price),
        quantity_total:   parseInt(form.quantity_total) || 1,
        pickup_start:     form.pickup_start,
        pickup_end:       form.pickup_end,
        pickup_date:      form.pickup_date,
        tags:             JSON.stringify(form.tags),
      });
      Alert.alert('✅ Bag Created!', 'Your magic bag is now live for customers.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  const discount = form.original_price && form.discounted_price
    ? Math.round((1 - parseFloat(form.discounted_price) / parseFloat(form.original_price)) * 100)
    : 0;

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.heading}>Create Magic Bag</Text>
      </View>

      {/* Title */}
      <View style={s.field}>
        <Text style={s.label}>Bag Title *</Text>
        <TextInput style={s.input} placeholder="e.g. Surprise Bakery Bag"
          value={form.title} onChangeText={v => set('title', v)} maxLength={80} />
      </View>

      {/* Description */}
      <View style={s.field}>
        <Text style={s.label}>Description</Text>
        <TextInput style={[s.input, s.textarea]} placeholder="What might be inside? (optional)"
          value={form.description} onChangeText={v => set('description', v)}
          multiline numberOfLines={3} maxLength={300} />
      </View>

      {/* Prices */}
      <View style={s.row}>
        <View style={[s.field, { flex: 1 }]}>
          <Text style={s.label}>Original Price (PKR) *</Text>
          <TextInput style={s.input} placeholder="800" value={form.original_price}
            onChangeText={v => set('original_price', v)} keyboardType="decimal-pad" />
        </View>
        <View style={[s.field, { flex: 1 }]}>
          <Text style={s.label}>Your Price (PKR) *</Text>
          <TextInput style={s.input} placeholder="300" value={form.discounted_price}
            onChangeText={v => set('discounted_price', v)} keyboardType="decimal-pad" />
        </View>
      </View>

      {/* Discount preview */}
      {discount > 0 && (
        <View style={s.discountBadge}>
          <Text style={s.discountText}>🎉 {discount}% savings for customers!</Text>
        </View>
      )}

      {/* Quantity */}
      <View style={s.field}>
        <Text style={s.label}>Number of Bags Available *</Text>
        <View style={s.qtyRow}>
          {['1','2','3','5','10'].map(q => (
            <TouchableOpacity key={q} style={[s.qtyBtn, form.quantity_total === q && s.qtyBtnActive]}
              onPress={() => set('quantity_total', q)}>
              <Text style={[s.qtyText, form.quantity_total === q && s.qtyTextActive]}>{q}</Text>
            </TouchableOpacity>
          ))}
          <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Other"
            value={!['1','2','3','5','10'].includes(form.quantity_total) ? form.quantity_total : ''}
            onChangeText={v => set('quantity_total', v)} keyboardType="number-pad" />
        </View>
      </View>

      {/* Pickup time */}
      <View style={s.row}>
        <View style={[s.field, { flex: 1 }]}>
          <Text style={s.label}>Pickup Start (HH:MM) *</Text>
          <TextInput style={s.input} placeholder="18:00" value={form.pickup_start}
            onChangeText={v => set('pickup_start', v)} keyboardType="numbers-and-punctuation" />
        </View>
        <View style={[s.field, { flex: 1 }]}>
          <Text style={s.label}>Pickup End (HH:MM) *</Text>
          <TextInput style={s.input} placeholder="21:00" value={form.pickup_end}
            onChangeText={v => set('pickup_end', v)} keyboardType="numbers-and-punctuation" />
        </View>
      </View>

      {/* Pickup date */}
      <View style={s.field}>
        <Text style={s.label}>Pickup Date (YYYY-MM-DD) *</Text>
        <TextInput style={s.input} placeholder="2026-04-09" value={form.pickup_date}
          onChangeText={v => set('pickup_date', v)} keyboardType="numbers-and-punctuation" />
      </View>

      {/* Tags */}
      <View style={s.field}>
        <Text style={s.label}>Tags (optional)</Text>
        <View style={s.tagsRow}>
          {['Vegetarian','Halal','Vegan','Gluten-Free','Spicy','Sweet','Savory','Fresh'].map(tag => (
            <TouchableOpacity key={tag} style={[s.tag, form.tags.includes(tag) && s.tagActive]}
              onPress={() => toggleTag(tag)}>
              <Text style={[s.tagText, form.tags.includes(tag) && s.tagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]}
        onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.submitText}>🎒 Publish Bag</Text>}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f7f7f7' },
  header:        { padding: 20, paddingTop: 56, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 8 },
  backBtn:       { marginBottom: 8 },
  backText:      { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  heading:       { fontSize: 22, fontWeight: '900', color: '#111' },
  field:         { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14 },
  label:         { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  input:         { borderWidth: 1.5, borderColor: '#eee', borderRadius: 10, padding: 12, fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 0 },
  textarea:      { minHeight: 80, textAlignVertical: 'top' },
  row:           { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 10 },
  discountBadge: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, alignItems: 'center' },
  discountText:  { color: '#2E7D32', fontWeight: '700', fontSize: 14 },
  qtyRow:        { flexDirection: 'row', gap: 8, alignItems: 'center' },
  qtyBtn:        { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  qtyBtnActive:  { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  qtyText:       { fontSize: 14, fontWeight: '700', color: '#555' },
  qtyTextActive: { color: '#fff' },
  tagsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:           { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#fafafa' },
  tagActive:     { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  tagText:       { fontSize: 13, color: '#555', fontWeight: '600' },
  tagTextActive: { color: '#fff' },
  submitBtn:     { margin: 16, backgroundColor: '#2E7D32', borderRadius: 16, padding: 18, alignItems: 'center' },
  submitText:    { color: '#fff', fontWeight: '800', fontSize: 16 },
});
