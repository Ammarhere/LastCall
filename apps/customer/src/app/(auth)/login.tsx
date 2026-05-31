import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const setToken = useAuthStore((s) => s.setToken);

  const handleSendOTP = () => {
    if (!phone.trim() || phone.length < 10) return Alert.alert('Enter your phone number');
    // In dev mode we skip real SMS — any code works (we verify "123456" or skip)
    setStep('otp');
  };

  const handleVerify = async () => {
    if (!otp.trim()) return Alert.alert('Enter the OTP');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/dev-login', { phone });
      await setToken(data.data.token);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🛍️</Text>
        <Text style={styles.title}>Last Call</Text>
        <Text style={styles.tagline}>Save food. Save money.</Text>

        {/* DEV MODE NOTICE */}
        <View style={styles.devBadge}>
          <Text style={styles.devText}>🔧 Dev Mode — OTP: 123456</Text>
        </View>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="03xx-xxxxxxx"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TouchableOpacity style={styles.btn} onPress={handleSendOTP}>
              <Text style={styles.btnText}>Send OTP</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter OTP (use 123456 in dev)</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Verify & Login</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.link}>← Change number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner:     { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo:      { fontSize: 48, textAlign: 'center', marginBottom: 4 },
  title:     { fontSize: 28, fontWeight: '800', color: '#16A34A', textAlign: 'center' },
  tagline:   { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  devBadge:  { backgroundColor: '#fef3c7', borderRadius: 8, padding: 8, marginBottom: 24, alignItems: 'center' },
  devText:   { fontSize: 12, color: '#92400e', fontWeight: '600' },
  label:     { fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '600' },
  input:     { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16 },
  btn:       { backgroundColor: '#16A34A', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  link:      { textAlign: 'center', color: '#16A34A', marginTop: 16, fontSize: 14 },
});
