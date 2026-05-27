import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signup } from '../services/api';
import { saveToken } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isMajor, setIsMajor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Weak', color: '#EF4444' });



  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState({ day: '', month: '', year: '' });

  const router = useRouter();

  useEffect(() => {
    validatePasswordStrength(password);
  }, [password]);

  const validatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score === 0) setPasswordStrength({ score: 0, label: 'Weak', color: '#EF4444' });
    else if (score === 1) setPasswordStrength({ score: 1, label: 'Fair', color: '#F59E0B' });
    else if (score === 2) setPasswordStrength({ score: 2, label: 'Good', color: '#3B82F6' });
    else setPasswordStrength({ score: 3, label: 'Strong', color: '#10B981' });
  };

  const handleConfirmDate = () => {
    if (!tempDate.year || !tempDate.month || !tempDate.day) {
      Alert.alert("Invalid Date", "Please enter full date");
      return;
    }
    const formatted = `${tempDate.year}-${tempDate.month.padStart(2, '0')}-${tempDate.day.padStart(2, '0')}`;
    setDob(formatted);
    setShowDatePicker(false);
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword || !dob || !securityAnswer) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    if (!isMajor) {
      setErrorMsg('You must confirm you are of legal age');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const data = await signup(name, email, password, isMajor, dob, securityAnswer);
      if (data.access_token) {
        await saveToken(data.access_token);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={64} color="#1A365D" />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Secure legal analysis starts here</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color="#64748B" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#64748B" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.inputBox} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#64748B" />
              <Text style={[styles.input, { color: dob ? '#1E293B' : '#94A3B8', paddingTop: 16 }]}>
                {dob || "Date of Birth (Select)"}
              </Text>
            </TouchableOpacity>

            <View style={styles.inputBox}>
              <Ionicons name="help-buoy-outline" size={20} color="#64748B" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Security Q: Best friend's name?"
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
              />
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.strengthContainer}>
              <View style={[styles.strengthBar, { width: `${(passwordStrength.score + 1) * 25}%`, backgroundColor: passwordStrength.color }]} />
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#64748B" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.checkbox} onPress={() => setIsMajor(!isMajor)}>
              <Ionicons name={isMajor ? "checkbox" : "square-outline"} size={22} color={isMajor ? "#1A365D" : "#94A3B8"} />
              <Text style={styles.checkboxLabel}>I am 18 years or older</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.mainBtn, loading && { opacity: 0.7 }]} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Sign Up</Text>}
            </TouchableOpacity>

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Existing user? </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date of Birth</Text>
            <View style={styles.dateRow}>
              <TextInput style={styles.dateInput} placeholder="DD" value={tempDate.day} onChangeText={(v) => setTempDate({ ...tempDate, day: v })} keyboardType="number-pad" maxLength={2} />
              <TextInput style={styles.dateInput} placeholder="MM" value={tempDate.month} onChangeText={(v) => setTempDate({ ...tempDate, month: v })} keyboardType="number-pad" maxLength={2} />
              <TextInput style={[styles.dateInput, { width: 80 }]} placeholder="YYYY" value={tempDate.year} onChangeText={(v) => setTempDate({ ...tempDate, year: v })} keyboardType="number-pad" maxLength={4} />
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={handleConfirmDate}>
              <Text style={styles.modalBtnText}>Confirm Date</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ marginTop: 20 }}>
              <Text style={{ color: '#64748B' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 32, fontWeight: '800', color: '#1A365D', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#64748B', marginTop: 8 },
  form: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
      native: { elevation: 5 }
    })
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1E293B' },
  strengthContainer: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 16, position: 'relative' },
  strengthBar: { height: '100%', borderRadius: 2 },
  strengthText: { position: 'absolute', right: 0, top: 6, fontSize: 12, fontWeight: '700' },
  checkbox: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkboxLabel: { marginLeft: 10, fontSize: 14, color: '#475569' },
  mainBtn: { backgroundColor: '#1A365D', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748B' },
  footerLink: { color: '#1A365D', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B', marginBottom: 16 },
  modalSubtitle: { color: '#64748B', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  dateRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  dateInput: { backgroundColor: '#F1F5F9', width: 60, height: 56, borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  modalBtn: { backgroundColor: '#1A365D', width: '100%', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
