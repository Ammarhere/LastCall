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
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      return Alert.alert('Enter a valid phone number');
    }
    setStep('otp');
  };

  const handleVerify = async () => {
    if (!otp.trim()) return Alert.alert('Enter the OTP sent to your phone');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/dev-login', { phone });
      await setToken(data.data.token);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error ?? 'Login failed. Try again.');
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
        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logoEmoji}>🛍️</Text>
          <Text style={styles.logoText}>Last Call</Text>
        </View>
        <Text style={styles.tagline}>Save food. Save money.</Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="03xx-xxxxxxx"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, !phone.trim() && styles.btnDisabled]}
              onPress={handleSendOTP}
              disabled={!phone.trim()}
            >
              <Text style={styles.btnText}>Send OTP</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Enter the 6-digit code sent to</Text>
            <Text style={styles.phoneDisplay}>{phone}</Text>
            <TextInput
              style={[styles.input, styles.otpInput]}
              placeholder="• • • • • •"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, (loading || otp.length < 4) && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={loading || otp.length < 4}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Verify & Continue</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.changeBtn} onPress={() => { setStep('phone'); setOtp(''); }}>
              <Text style={styles.changeBtnText}>← Change number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  inner:        { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logoRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoEmoji:    { fontSize: 36, marginRight: 8 },
  logoText:     { fontSize: 32, fontWeight: '800', color: '#16A34A' },
  tagline:      { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 48 },
  label:        { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 8 },
  phoneDisplay: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  input:        {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  otpInput:     { fontSize: 24, textAlign: 'center', letterSpacing: 8, fontWeight: '700' },
  btn:          { backgroundColor: '#16A34A', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnDisabled:  { opacity: 0.5 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  changeBtn:    { padding: 14, alignItems: 'center' },
  changeBtnText:{ color: '#16A34A', fontSize: 14, fontWeight: '600' },
});
