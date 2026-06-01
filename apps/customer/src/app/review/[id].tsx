import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../services/api';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState('');

  const { data: order } = useQuery({
    queryKey: ['order', id],
    queryFn:  () => api.get(`/orders/${id}`).then((r) => r.data.data),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => api.post('/reviews', { orderId: id, rating, comment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      Alert.alert('Thank you!', 'Your review has been submitted.', [
        { text: 'Done', onPress: () => router.replace('/(tabs)/orders') },
      ]);
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Could not submit review'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Leave a Review</Text>

      {order && (
        <View style={styles.orderCard}>
          <Text style={styles.orderPartner}>{order.partner?.businessName}</Text>
          <Text style={styles.orderBag}>{order.bag?.title}</Text>
        </View>
      )}

      {/* Star Rating */}
      <Text style={styles.label}>How was your experience?</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <Text style={styles.ratingLabel}>
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
        </Text>
      )}

      {/* Comment */}
      <Text style={styles.label}>Tell us more (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="What did you like about the bag? Any feedback for the restaurant?"
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
      />
      <Text style={styles.charCount}>{comment.length}/500</Text>

      <TouchableOpacity
        style={[styles.btn, (rating === 0 || isPending) && styles.btnDisabled]}
        onPress={() => submit()}
        disabled={rating === 0 || isPending}
      >
        {isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Submit Review</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/(tabs)/orders')}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff' },
  content:     { padding: 24 },
  heading:     { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 20 },
  orderCard:   { backgroundColor: '#f9fafb', borderRadius: 14, padding: 14, marginBottom: 24 },
  orderPartner:{ fontSize: 13, color: '#6b7280' },
  orderBag:    { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  label:       { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 },
  starsRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  star:        { fontSize: 44, color: '#e5e7eb' },
  starActive:  { color: '#f59e0b' },
  ratingLabel: { fontSize: 16, fontWeight: '700', color: '#f59e0b', marginBottom: 20 },
  input:       {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14,
    padding: 14, fontSize: 14, minHeight: 100, textAlignVertical: 'top',
    backgroundColor: '#f9fafb', color: '#111827', marginBottom: 4,
  },
  charCount:   { fontSize: 11, color: '#9ca3af', textAlign: 'right', marginBottom: 24 },
  btn:         { backgroundColor: '#16A34A', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnDisabled: { opacity: 0.4 },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn:     { padding: 14, alignItems: 'center' },
  skipText:    { color: '#9ca3af', fontSize: 14 },
});
