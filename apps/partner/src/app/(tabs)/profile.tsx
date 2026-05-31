import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';
import api from '../../services/api';

export default function PartnerProfileScreen() {
  const { user, logout }  = useAuthStore();
  const partner           = user?.partner;
  const [activeTab, setActiveTab] = useState<'profile' | 'reviews'>('profile');

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        {partner?.logoUrl ? (
          <Image source={{ uri: partner.logoUrl }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, { backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 32 }}>🏪</Text>
          </View>
        )}
        <Text style={styles.name}>{partner?.businessName ?? 'Your Business'}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
        <View style={[styles.statusBadge, partner?.status === 'APPROVED' ? styles.approved : styles.pending]}>
          <Text style={styles.statusText}>{partner?.status ?? 'PENDING'}</Text>
        </View>
      </View>

      {partner?.status === 'APPROVED' && (
        <View style={styles.ratingCard}>
          <Text style={styles.ratingNum}>⭐ {partner.rating?.toFixed(1)}</Text>
          <Text style={styles.ratingLabel}>Customer Rating</Text>
        </View>
      )}

      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}>Reviews</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'profile' ? (
        <>
          <View style={styles.menu}>
            {[
              { label: '📊 Analytics',            route: '/(tabs)/analytics' },
              { label: '🔁 Bag Templates',         route: '/bag/templates' },
              { label: '💸 Payout History',        route: '/payouts' },
              { label: '📝 Edit Business Profile', route: '/edit-profile' },
              { label: '📄 Documents',             route: '/documents' },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        partner && <ReviewsTab partnerId={partner.id} />
      )}
    </ScrollView>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────────

function ReviewsTab({ partnerId }: { partnerId: string }) {
  const qc = useQueryClient();
  const [replyingTo, setReplyingTo]     = useState<string | null>(null);
  const [replyText,  setReplyText]      = useState('');

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['partner-reviews', partnerId],
    queryFn:  () => api.get(`/reviews/partner/${partnerId}`).then((r) => r.data.data),
  });

  const { mutate: submitReply, isPending: submitting } = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) =>
      api.patch(`/reviews/${id}/reply`, { reply }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-reviews', partnerId] });
      setReplyingTo(null);
      setReplyText('');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Could not save reply'),
  });

  if (isLoading) return <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 40 }} />;

  if (!reviews?.length) {
    return (
      <View style={styles.emptyReviews}>
        <Text style={styles.emptyEmoji}>⭐</Text>
        <Text style={styles.emptyTitle}>No reviews yet</Text>
        <Text style={styles.emptySub}>Reviews appear here after customers pick up their orders</Text>
      </View>
    );
  }

  return (
    <>
      {reviews.map((review: any) => (
        <View key={review.id} style={styles.reviewCard}>
          {/* Customer review */}
          <View style={styles.reviewHeader}>
            <View style={styles.reviewerInfo}>
              <View style={styles.reviewerAvatar}>
                <Text style={styles.reviewerInitial}>{review.user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <Text style={styles.reviewerName}>{review.user?.name ?? 'Customer'}</Text>
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={{ fontSize: 14, color: s <= review.rating ? '#f59e0b' : '#e5e7eb' }}>★</Text>
              ))}
            </View>
          </View>

          {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
          <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString('en-PK')}</Text>

          {/* Existing reply */}
          {review.partnerReply ? (
            <View style={styles.replyBox}>
              <Text style={styles.replyLabel}>Your reply:</Text>
              <Text style={styles.replyText}>{review.partnerReply}</Text>
              <TouchableOpacity onPress={() => { setReplyingTo(review.id); setReplyText(review.partnerReply); }}>
                <Text style={styles.editReplyBtn}>Edit reply</Text>
              </TouchableOpacity>
            </View>
          ) : replyingTo !== review.id ? (
            <TouchableOpacity style={styles.replyBtn} onPress={() => { setReplyingTo(review.id); setReplyText(''); }}>
              <Text style={styles.replyBtnText}>↩ Reply to this review</Text>
            </TouchableOpacity>
          ) : null}

          {/* Reply input */}
          {replyingTo === review.id && (
            <View style={styles.replyInput}>
              <TextInput
                style={styles.replyTextInput}
                placeholder="Write a professional reply..."
                multiline
                value={replyText}
                onChangeText={setReplyText}
                maxLength={500}
              />
              <View style={styles.replyActions}>
                <TouchableOpacity style={styles.cancelReplyBtn} onPress={() => { setReplyingTo(null); setReplyText(''); }}>
                  <Text style={{ color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitReplyBtn, (!replyText.trim() || submitting) && { opacity: 0.5 }]}
                  onPress={() => submitReply({ id: review.id, reply: replyText.trim() })}
                  disabled={!replyText.trim() || submitting}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Post Reply</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f9fafb' },
  content:          { padding: 24 },
  header:           { alignItems: 'center', marginBottom: 20 },
  logo:             { width: 80, height: 80, borderRadius: 16, marginBottom: 12 },
  name:             { fontSize: 20, fontWeight: '800', color: '#111827' },
  phone:            { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statusBadge:      { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  approved:         { backgroundColor: '#d1fae5' },
  pending:          { backgroundColor: '#fef3c7' },
  statusText:       { fontSize: 12, fontWeight: '700', color: '#374151' },
  ratingCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 16, elevation: 2 },
  ratingNum:        { fontSize: 28, fontWeight: '800', color: '#f59e0b' },
  ratingLabel:      { fontSize: 12, color: '#6b7280', marginTop: 4 },
  tabs:             { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab:              { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive:        { backgroundColor: '#fff', elevation: 1 },
  tabText:          { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive:    { color: '#1d4ed8' },
  menu:             { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 1, marginBottom: 20 },
  menuItem:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuLabel:        { fontSize: 15, color: '#374151' },
  menuArrow:        { fontSize: 20, color: '#9ca3af' },
  logoutBtn:        { backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText:       { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  // Reviews
  reviewCard:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 1 },
  reviewHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewerInfo:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewerAvatar:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  reviewerInitial:  { fontSize: 14, fontWeight: '700', color: '#1d4ed8' },
  reviewerName:     { fontSize: 13, fontWeight: '600', color: '#374151' },
  starsRow:         { flexDirection: 'row' },
  reviewComment:    { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 4 },
  reviewDate:       { fontSize: 11, color: '#9ca3af' },
  replyBox:         { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, marginTop: 10, borderLeftWidth: 3, borderLeftColor: '#16A34A' },
  replyLabel:       { fontSize: 11, fontWeight: '700', color: '#16A34A', marginBottom: 4 },
  replyText:        { fontSize: 13, color: '#374151', lineHeight: 18 },
  editReplyBtn:     { fontSize: 12, color: '#1d4ed8', marginTop: 6 },
  replyBtn:         { marginTop: 10, paddingVertical: 8, alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 8 },
  replyBtnText:     { fontSize: 13, color: '#1d4ed8', fontWeight: '600' },
  replyInput:       { marginTop: 10 },
  replyTextInput:   { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', backgroundColor: '#fafafa' },
  replyActions:     { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelReplyBtn:   { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  submitReplyBtn:   { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1d4ed8' },
  emptyReviews:     { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji:       { fontSize: 40, marginBottom: 10 },
  emptyTitle:       { fontSize: 16, fontWeight: '700', color: '#111827' },
  emptySub:         { fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 4 },
});
