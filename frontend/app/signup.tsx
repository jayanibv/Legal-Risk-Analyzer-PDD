import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signup } from '../services/api';
import { saveToken } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';

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

  const { colors, isDark } = useTheme();
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
        router.replace('/(drawer)');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={[colors.bg, colors.cardAlt]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <Animated.View entering={FadeInDown.duration(200).springify()} style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="shield-checkmark" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Secure legal analysis starts here</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(200).delay(100).springify()} style={[styles.form, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : colors.primary }]}>
              <View style={[styles.inputBox, { backgroundColor: colors.cardAlt }]}>
                <Ionicons name="person" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholderTextColor={colors.textSecondary} placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={[styles.inputBox, { backgroundColor: colors.cardAlt }]}>
                <Ionicons name="mail" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholderTextColor={colors.textSecondary} placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity style={[styles.inputBox, { backgroundColor: colors.cardAlt }]} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                <Text style={[styles.input, { color: dob ? colors.text : colors.textSecondary, paddingTop: 18 }]}>
                  {dob || "Date of Birth (Select)"}
                </Text>
              </TouchableOpacity>

              <View style={[styles.inputBox, { backgroundColor: colors.cardAlt }]}>
                <Ionicons name="help-buoy" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholderTextColor={colors.textSecondary} placeholder="Security Q: Best friend's name?"
                  value={securityAnswer}
                  onChangeText={setSecurityAnswer}
                />
              </View>

              <View style={[styles.inputBox, { backgroundColor: colors.cardAlt }]}>
                <Ionicons name="lock-closed" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholderTextColor={colors.textSecondary} placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.strengthContainer}>
                <View style={[styles.strengthBar, { width: `${(passwordStrength.score + 1) * 25}%`, backgroundColor: passwordStrength.color }]} />
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
              </View>

              <View style={[styles.inputBox, { backgroundColor: colors.cardAlt, marginTop: 12 }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  placeholderTextColor={colors.textSecondary} placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.checkbox} onPress={() => setIsMajor(!isMajor)}>
                <Ionicons name={isMajor ? "checkbox" : "square"} size={22} color={isMajor ? colors.primary : colors.textSecondary} />
                <Text style={[styles.checkboxLabel, { color: colors.textSecondary }]}>I am 18 years or older</Text>
              </TouchableOpacity>

              <AnimatedButton
                title="Sign Up"
                onPress={handleSignup}
                loading={loading}
                colors={colors}
              />

              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Existing user? </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Login</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date of Birth</Text>
            <View style={styles.dateRow}>
              <TextInput style={[styles.dateInput, { backgroundColor: colors.cardAlt, color: colors.text }]} placeholderTextColor={colors.textSecondary} placeholder="DD" value={tempDate.day} onChangeText={(v) => setTempDate({ ...tempDate, day: v })} keyboardType="number-pad" maxLength={2} />
              <TextInput style={[styles.dateInput, { backgroundColor: colors.cardAlt, color: colors.text }]} placeholderTextColor={colors.textSecondary} placeholder="MM" value={tempDate.month} onChangeText={(v) => setTempDate({ ...tempDate, month: v })} keyboardType="number-pad" maxLength={2} />
              <TextInput style={[styles.dateInput, { backgroundColor: colors.cardAlt, color: colors.text, width: 80 }]} placeholderTextColor={colors.textSecondary} placeholder="YYYY" value={tempDate.year} onChangeText={(v) => setTempDate({ ...tempDate, year: v })} keyboardType="number-pad" maxLength={4} />
            </View>
            <AnimatedButton
                title="Confirm Date"
                onPress={handleConfirmDate}
                colors={colors}
                style={{ width: '100%' }}
            />
            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={{ marginTop: 24, padding: 8 }}>
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold', marginTop: 16 },
  subtitle: { fontSize: 16, marginTop: 8, fontFamily: 'Inter_400Regular' },
  form: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 16
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontFamily: 'Inter_400Regular' },
  strengthContainer: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginBottom: 16, position: 'relative' },
  strengthBar: { height: '100%', borderRadius: 2 },
  strengthText: { position: 'absolute', right: 0, top: 6, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  checkbox: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 8 },
  checkboxLabel: { marginLeft: 10, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 12, fontFamily: 'Inter_600SemiBold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontFamily: 'Inter_400Regular' },
  footerLink: { fontFamily: 'Inter_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 50 : 32 },
  modalTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 24 },
  modalSubtitle: { marginTop: 8, marginBottom: 24, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  dateRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 },
  dateInput: { width: 60, height: 60, borderRadius: 12, textAlign: 'center', fontSize: 18, fontFamily: 'Inter_600SemiBold' },
});
