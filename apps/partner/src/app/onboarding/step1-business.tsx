import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = ['Restaurant', 'Bakery', 'Café', 'Sweet Shop', 'Biryani', 'BBQ', 'Fast Food', 'Snacks', 'Desserts', 'Juice Bar'] as const;

export default function OnboardingStep1() {
  const loadUser = useAuthStore((s) => s.loadUser);

  const [businessName,       setBusinessName]       = useState('');
  const [category,           setCategory]           = useState('Restaurant');
  const [description,        setDescription]        = useState('');
  const [selectedCityId,     setSelectedCityId]     = useState('');
  const [selectedAreaName,   setSelectedAreaName]   = useState('');
  const [address,            setAddress]            = useState('');
  const [pickupInstructions, setPickupInstructions] = useState('');

  // Load cities from API
  const { data: cities, isLoading: loadingCities } = useQuery({
    queryKey: ['cities'],
    queryFn:  () => api.get('/cities').then((r) => r.data.data),
  });

  // Load areas when city is selected
  const { data: areas } = useQuery({
    queryKey: ['areas', selectedCityId],
    queryFn:  () => api.get(`/cities/${selectedCityId}/areas`).then((r) => r.data.data),
    enabled:  !!selectedCityId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/partners/register', {
      businessName,
      category,
      description:        description || undefined,
      cityId:             selectedCityId,
      area:               selectedAreaName || undefined,
      address,
      pickupInstructions: pickupInstructions || undefined,
    }),
    onSuccess: async () => {
      await loadUser();
      router.push('/onboarding/step2-documents');
    },
    onError: (err: any) => Alert.alert('Error', err.response?.data?.error ?? 'Registration failed'),
  });

  const canSubmit = businessName.trim() && address.trim() && selectedCityId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.progress}><View style={[styles.progressFill, { width: '33%' }]} /></View>
      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.heading}>Business Information</Text>

      {/* Business Name */}
      <Label text="Business Name *" />
      <TextInput
        style={styles.input}
        placeholder="e.g. Ali's Biryani House"
        value={businessName}
        onChangeText={setBusinessName}
        autoCapitalize="words"
      />

      {/* Category */}
      <Label text="Category *" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, category === cat && styles.chipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.chipText, category === cat && { color: '#fff' }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Description */}
      <Label text="Description" />
      <TextInput
        style={[styles.input, { height: 70 }]}
        multiline
        placeholder="Tell customers about your business"
        value={description}
        onChangeText={setDescription}
      />

      {/* City — loaded from API */}
      <Label text="City *" />
      {loadingCities ? (
        <ActivityIndicator color="#1d4ed8" style={{ marginBottom: 16 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {(cities ?? []).map((city: any) => (
            <TouchableOpacity
              key={city.id}
              style={[styles.chip, selectedCityId === city.id && styles.chipActive]}
              onPress={() => { setSelectedCityId(city.id); setSelectedAreaName(''); }}
            >
              <Text style={[styles.chipText, selectedCityId === city.id && { color: '#fff' }]}>{city.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Area — loaded from API based on selected city */}
      {selectedCityId && (
        <>
          <Label text="Area / Neighbourhood" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {(areas ?? []).map((area: any) => (
              <TouchableOpacity
                key={area.id}
                style={[styles.chip, selectedAreaName === area.name && styles.chipActive]}
                onPress={() => setSelectedAreaName(area.name)}
              >
                <Text style={[styles.chipText, selectedAreaName === area.name && { color: '#fff' }]}>{area.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Address */}
      <Label text="Full Address *" />
      <TextInput
        style={styles.input}
        placeholder="Street name, landmark"
        value={address}
        onChangeText={setAddress}
      />

      {/* Pickup Instructions */}
      <Label text="Pickup Instructions" />
      <TextInput
        style={styles.input}
        placeholder="e.g. Come to the main counter and show your code"
        value={pickupInstructions}
        onChangeText={setPickupInstructions}
      />

      <TouchableOpacity
        style={[styles.btn, (!canSubmit || isPending) && { opacity: 0.5 }]}
        onPress={() => mutate()}
        disabled={!canSubmit || isPending}
      >
        {isPending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.btnText}>Next: Upload Documents →</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  content:      { padding: 20, paddingBottom: 40 },
  progress:     { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#1d4ed8', borderRadius: 2 },
  step:         { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  heading:      { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 20 },
  label:        { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 8 },
  input:        {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    padding: 12, fontSize: 15, marginBottom: 8, backgroundColor: '#f9fafb', color: '#111827',
  },
  chipScroll:   { marginBottom: 14 },
  chip:         {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#e5e7eb', marginRight: 8, height: 36,
    justifyContent: 'center',
  },
  chipActive:   { backgroundColor: '#1d4ed8' },
  chipText:     { fontSize: 13, color: '#374151', fontWeight: '600' },
  btn:          { backgroundColor: '#1d4ed8', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
});
