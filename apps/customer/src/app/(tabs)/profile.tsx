import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Share } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { formatPKR } from '@lastcall/shared';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const { data: impact } = useQuery({
    queryKey: ['impact'],
    queryFn:  () => api.get('/users/me/impact').then((r) => r.data.data),
  });

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + Name */}
      <View style={styles.avatarRow}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
        )}
        <View>
          <Text style={styles.name}>{user?.name ?? 'Set your name'}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>
      </View>

      {/* Impact Stats */}
      {impact && (
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>🌍 Your Impact</Text>
          <View style={styles.impactRow}>
            <View style={styles.impactStat}>
              <Text style={styles.impactNum}>{impact.mealsSaved}</Text>
              <Text style={styles.impactLabel}>Meals Saved</Text>
            </View>
            <View style={styles.impactStat}>
              <Text style={styles.impactNum}>{impact.co2SavedKg} kg</Text>
              <Text style={styles.impactLabel}>CO₂ Saved</Text>
            </View>
          </View>

          {/* Share My Impact button */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => {
              Share.share({
                message: `I've rescued ${impact.mealsSaved} meals from going to waste with Last Call 🌍\nPrevented ${impact.co2SavedKg}kg of CO₂ so far!\n\nJoin me → https://lastcall.pk/join/${user?.referralCode ?? ''}`,
                title:   'My Last Call Impact',
              });
            }}
          >
            <Text style={styles.shareBtnText}>🌍 Share My Impact</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Referral */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎁 Refer & Earn</Text>
        <Text style={styles.sectionSub}>Share your code: <Text style={styles.code}>{user?.referralCode}</Text></Text>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {[
          { label: '❤️ Favourites', route: '/favourites' },
          { label: '🔔 Notifications', route: '/notifications' },
          { label: '💳 Saved Payment Methods', route: '/payment-methods' },
          { label: '✏️ Edit Profile', route: '/edit-profile' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#f9fafb' },
  content:           { padding: 24 },
  avatarRow:         { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatar:            { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center' },
  avatarInitial:     { fontSize: 28, color: '#fff', fontWeight: '700' },
  name:              { fontSize: 20, fontWeight: '700', color: '#111827' },
  shareBtn:          { backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 14, borderWidth: 1, borderColor: '#d1fae5' },
  shareBtnText:      { color: '#16A34A', fontSize: 14, fontWeight: '700' },
  phone:             { fontSize: 13, color: '#6b7280', marginTop: 2 },
  impactCard:        { backgroundColor: '#f0fdf4', borderRadius: 16, padding: 20, marginBottom: 20 },
  impactTitle:       { fontSize: 16, fontWeight: '700', color: '#16A34A', marginBottom: 12 },
  impactRow:         { flexDirection: 'row', justifyContent: 'space-around' },
  impactStat:        { alignItems: 'center' },
  impactNum:         { fontSize: 24, fontWeight: '800', color: '#16A34A' },
  impactLabel:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  section:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitle:      { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  sectionSub:        { fontSize: 13, color: '#6b7280' },
  code:              { color: '#16A34A', fontWeight: '800' },
  menu:              { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', elevation: 1, marginBottom: 24 },
  menuItem:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuLabel:         { fontSize: 15, color: '#374151' },
  menuArrow:         { fontSize: 20, color: '#9ca3af' },
  logoutBtn:         { backgroundColor: '#fee2e2', borderRadius: 12, padding: 16, alignItems: 'center' },
  logoutText:        { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});
