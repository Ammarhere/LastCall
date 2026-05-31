import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';
import { CountdownTimer } from '../../components/CountdownTimer';

export default function BagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const { data: bag, isLoading } = useQuery({
    queryKey: ['bag', id],
    queryFn:  () => api.get(`/bags/${id}`).then((r) => r.data.data),
  });

  const { mutate: reserve, isPending } = useMutation({
    mutationFn: () => api.post('/orders', { bagId: id, quantity: 1, paymentMethod: 'CASH' }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['bags'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      router.push(`/order/${res.data.data.id}`);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error ?? 'Could not reserve bag');
    },
  });

  if (isLoading) return <ActivityIndicator size="large" color="#16A34A" style={{ flex: 1 }} />;
  if (!bag)      return <Text style={{ textAlign: 'center', marginTop: 80 }}>Bag not found</Text>;

  const discount = Math.round((1 - bag.discountedPrice / bag.originalPrice) * 100);

  return (
    <ScrollView style={styles.container}>
      {bag.photoUrl ? (
        <Image source={{ uri: bag.photoUrl }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, { backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 64 }}>🛍️</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{bag.title}</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.partnerRow} onPress={() => router.push(`/partner/${bag.partner.id}`)}>
          {bag.partner.logoUrl && <Image source={{ uri: bag.partner.logoUrl }} style={styles.partnerLogo} />}
          <View>
            <Text style={styles.partnerName}>{bag.partner.businessName}</Text>
            <Text style={styles.partnerArea}>{bag.partner.area} · ⭐ {bag.partner.rating.toFixed(1)}</Text>
          </View>
        </TouchableOpacity>

        {bag.description && <Text style={styles.desc}>{bag.description}</Text>}

        <View style={styles.infoGrid}>
          <InfoItem icon="🕐" label="Pickup window" value={`${new Date(`1970-01-01T${bag.pickupStart}`).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })} – ${new Date(`1970-01-01T${bag.pickupEnd}`).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}`} />
          <CountdownTimer pickupDate={bag.pickupDate} pickupEnd={bag.pickupEnd} />

          {/* Tappable address — opens Google Maps / Apple Maps */}
          <TouchableOpacity
            style={styles.addressRow}
            onPress={() => {
              const query = bag.partner.latitude && bag.partner.longitude
                ? `${bag.partner.latitude},${bag.partner.longitude}`
                : encodeURIComponent(bag.partner.address);
              Linking.openURL(`https://maps.google.com/?q=${query}`);
            }}
          >
            <Text style={styles.infoIcon}>📍</Text>
            <View>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={[styles.infoValue, { color: '#2563eb', textDecorationLine: 'underline' }]}>
                {bag.partner.address} ↗
              </Text>
            </View>
          </TouchableOpacity>

          <InfoItem icon="🛍️" label="Left" value={`${bag.quantityLeft} bags`} />
          <InfoItem icon="🌿" label="CO₂ Saved" value={`${bag.co2SavedKg} kg`} />
        </View>

        {bag.tags?.length > 0 && (
          <View style={styles.tags}>
            {bag.tags.map((t: string) => (
              <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
            ))}
          </View>
        )}

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>{formatPKR(bag.discountedPrice)}</Text>
            <Text style={styles.originalPrice}>was {formatPKR(bag.originalPrice)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.reserveBtn, (bag.quantityLeft === 0 || isPending) && { opacity: 0.5 }]}
            onPress={() => reserve()}
            disabled={bag.quantityLeft === 0 || isPending}
          >
            {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.reserveBtnText}>{bag.quantityLeft === 0 ? 'Sold Out' : 'Reserve Bag'}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#fff' },
  hero:            { width: '100%', height: 240 },
  body:            { padding: 20 },
  addressRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title:           { fontSize: 22, fontWeight: '800', color: '#111827', flex: 1, marginRight: 12 },
  discountBadge:   { backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  discountText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  partnerRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 12 },
  partnerLogo:     { width: 40, height: 40, borderRadius: 8 },
  partnerName:     { fontSize: 14, fontWeight: '700', color: '#111827' },
  partnerArea:     { fontSize: 12, color: '#6b7280', marginTop: 2 },
  desc:            { fontSize: 14, color: '#6b7280', lineHeight: 22, marginBottom: 16 },
  infoGrid:        { gap: 12, marginBottom: 16 },
  infoItem:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon:        { fontSize: 20 },
  infoLabel:       { fontSize: 11, color: '#9ca3af', fontWeight: '600' },
  infoValue:       { fontSize: 13, color: '#374151', fontWeight: '600', marginTop: 2 },
  tags:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  tag:             { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText:         { fontSize: 12, color: '#374151' },
  priceRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  price:           { fontSize: 26, fontWeight: '800', color: '#16A34A' },
  originalPrice:   { fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through' },
  reserveBtn:      { backgroundColor: '#16A34A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  reserveBtnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
