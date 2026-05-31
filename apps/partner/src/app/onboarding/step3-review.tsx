import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function OnboardingStep3() {
  return (
    <View style={styles.container}>
      <View style={styles.progress}><View style={[styles.progressFill, { width: '100%' }]} /></View>
      <Text style={styles.step}>Step 3 of 3</Text>

      <View style={styles.center}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.heading}>Application Submitted!</Text>
        <Text style={styles.sub}>
          Our team will review your application within 24–48 hours. You'll receive a WhatsApp message and push notification once approved.
        </Text>

        <View style={styles.checkList}>
          {[
            'Business details saved',
            'Documents uploaded',
            'Pending admin review',
            'You\'ll be notified on approval',
          ].map((item) => (
            <View key={item} style={styles.checkItem}>
              <Text style={styles.checkIcon}>✅</Text>
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
          <Text style={styles.btnText}>Got it — I'll wait</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff', padding: 20 },
  progress:     { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#1d4ed8', borderRadius: 2 },
  step:         { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji:        { fontSize: 72, marginBottom: 16 },
  heading:      { fontSize: 26, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 12 },
  sub:          { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 32, paddingHorizontal: 8 },
  checkList:    { alignSelf: 'stretch', marginBottom: 32 },
  checkItem:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  checkIcon:    { fontSize: 18 },
  checkText:    { fontSize: 14, color: '#374151', fontWeight: '600' },
  btn:          { backgroundColor: '#1d4ed8', borderRadius: 14, paddingHorizontal: 40, paddingVertical: 16 },
  btnText:      { color: '#fff', fontSize: 15, fontWeight: '700' },
});
