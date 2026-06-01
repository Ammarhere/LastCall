import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';
import { CountdownTimer } from '../../components/CountdownTimer';

export default function PartnerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner', id],
    queryFn:  () => api.get(`/partners/${id}`).then((r) => r.data.data),
  });

  const { data: favs } = useQuery({
    queryKey: ['favourites'],
    queryFn:  () => api.get('/users/me/favourites').then((r) => r.data.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', id],
    queryFn:  () => api.get(`/reviews/partner/${id}`).then((r) => r.data.data),
  });

  const isFav = (favs ?? []).some((f: any) => f.id === id);

  const { mutate: toggleFav } = useMutation({
    mutationFn: () => isFav
      ? api.delete(`/users/me/favourites/${id}`)
      : api.post(`/users/me/favourites/${id}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favourites'] }),
  });

  if (isLoading) return <ActivityIndicator size="large" color="#16A34A" style={{ flex: 1 }} />;
  if (!partner)  return <Text style={{ textAlign: 'center', marginTop: 80 }}>Partner not found</Text>;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {partner.logoUrl
          ? <Image source={{ uri: partner.logoUrl }} style={styles.logo} />
          : <View style={[styles.logo, styles.logoPlaceholder]}><Text style={{ fontSize: 36 }}>🏪</Text></View>
        }
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{partner.businessName}</Text>
          <Text style={styles.category}>{partner.category} · {partner.area}</Text>
          <Text style={styles.rating}>⭐ {partner.rating?.toFixed(1)} ({partner.reviewCount} reviews)</Text>
        </View>
        <TouchableOpacity style={styles.favBtn} onPress={() => toggleFav()}>
          <Text style={styles.favText}>{isFav ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>

      {partner.description && <Text style={styles.desc}>{partner.description}</Text>}

      {/* Available Bags */}
      {partner.bags?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Available Now</Text>
          {partner.bags.map((bag: any) => (
            <TouchableOpacity key={bag.id} style={styles.bagRow} onPress={() => router.push(`/bag/${bag.id}`)}>
              {bag.photoUrl
                ? <Image source={{ uri: bag.photoUrl }} style={styles.bagImg} />
                : <View style={[styles.bagImg, { backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 20 }}>🛍️</Text></View>
              }
              <View style={styles.bagInfo}>
                <Text style={styles.bagTitle} numberOfLines={1}>{bag.title}</Text>
                <Text style={styles.bagPrice}>{formatPKR(bag.discountedPrice)}</Text>
                <CountdownTimer pickupDate={bag.pickupDate} pickupEnd={bag.pickupEnd} />
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Reviews */}
      {reviews?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {reviews.slice(0, 5).map((r: any) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewer}>{r.user?.name ?? 'Customer'}</Text>
                <Text style={styles.stars}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
              </View>
              {r.comment && <Text style={styles.reviewText}>{r.comment}</Text>}
              {r.partnerReply && (
                <View style={styles.replyBox}>
                  <Text style={styles.replyLabel}>Reply from {partner.businessName}</Text>
                  <Text style={styles.replyText}>{r.partnerReply}</Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f9fafb' },
  header:         { flexDirection: 'row', padding: 16, backgroundColor: '#fff', alignItems: 'center', gap: 12 },
  logo:           { width: 64, height: 64, borderRadius: 14 },
  logoPlaceholder:{ backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  headerInfo:     { flex: 1 },
  name:           { fontSize: 17, fontWeight: '800', color: '#111827' },
  category:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  rating:         { fontSize: 12, color: '#f59e0b', marginTop: 2 },
  favBtn:         { padding: 8 },
  favText:        { fontSize: 28, color: '#ef4444' },
  desc:           { padding: 16, fontSize: 14, color: '#374151', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: '#111827', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  bagRow:         { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, overflow: 'hidden', elevation: 1 },
  bagImg:         { width: 80, height: 80 },
  bagInfo:        { flex: 1, padding: 12, justifyContent: 'center' },
  bagTitle:       { fontSize: 14, fontWeight: '700', color: '#111827' },
  bagPrice:       { fontSize: 14, fontWeight: '800', color: '#16A34A', marginTop: 2 },
  reviewCard:     { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 14, elevation: 1 },
  reviewTop:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewer:       { fontSize: 13, fontWeight: '700', color: '#111827' },
  stars:          { color: '#f59e0b', fontSize: 13 },
  reviewText:     { fontSize: 13, color: '#374151' },
  replyBox:       { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, marginTop: 8, borderLeftWidth: 2, borderLeftColor: '#16A34A' },
  replyLabel:     { fontSize: 11, fontWeight: '700', color: '#16A34A', marginBottom: 4 },
  replyText:      { fontSize: 12, color: '#374151' },
});
