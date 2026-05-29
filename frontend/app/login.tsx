import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { login, resetPassword } from '../services/api';
import { saveToken } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotDob, setForgotDob] = useState('');
  const [forgotSecurity, setForgotSecurity] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');


  const { colors, isDark } = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please fill in all fields');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await login(email, password);
      if (data.access_token) {
        await saveToken(data.access_token);
        router.replace('/(drawer)');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotEmail || !forgotDob || !forgotSecurity || !newPassword) {
      setModalError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setModalError('');
    try {
      await resetPassword(forgotEmail, forgotDob, forgotSecurity, newPassword);
      setModalSuccess('Password reset successfully!');
      setTimeout(() => {
        setShowForgotModal(false);
        setModalSuccess('');
        setForgotEmail('');
        setForgotDob('');
        setForgotSecurity('');
        setNewPassword('');
      }, 2000);
    } catch (error: any) {
      setModalError(error.message);
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
                <Ionicons name="lock-open" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to access your reports</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(200).delay(100).springify()} style={[styles.form, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : colors.primary }]}>
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

              <TouchableOpacity style={styles.forgotBtn} onPress={() => setShowForgotModal(true)}>
                <Text style={[styles.forgotText, { color: colors.textSecondary }]}>Forgot Password?</Text>
              </TouchableOpacity>

              <AnimatedButton
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                colors={colors}
              />

              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={showForgotModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Verify your identity to reset password</Text>
            
            <TextInput style={[styles.modalInput, { backgroundColor: colors.cardAlt, color: colors.text }]} placeholderTextColor={colors.textSecondary} placeholder="Email" value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" />
            <TextInput style={[styles.modalInput, { backgroundColor: colors.cardAlt, color: colors.text }]} placeholderTextColor={colors.textSecondary} placeholder="Date of Birth (YYYY-MM-DD)" value={forgotDob} onChangeText={setForgotDob} />
            <TextInput style={[styles.modalInput, { backgroundColor: colors.cardAlt, color: colors.text }]} placeholderTextColor={colors.textSecondary} placeholder="Best friend's name?" value={forgotSecurity} onChangeText={setForgotSecurity} />
            <TextInput style={[styles.modalInput, { backgroundColor: colors.cardAlt, color: colors.text }]} placeholderTextColor={colors.textSecondary} placeholder="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

            {modalError ? <Text style={styles.modalError}>{modalError}</Text> : null}
            {modalSuccess ? <Text style={styles.modalSuccess}>{modalSuccess}</Text> : null}

            <AnimatedButton
                title="Reset Password"
                onPress={handleResetPassword}
                loading={loading}
                colors={colors}
                style={{ width: '100%' }}
            />
            
            <TouchableOpacity onPress={() => { setShowForgotModal(false); setModalError(''); setModalSuccess(''); }} style={{ marginTop: 24, padding: 8 }}>
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
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 28 },
  forgotText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 16, fontFamily: 'Inter_600SemiBold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontFamily: 'Inter_400Regular' },
  footerLink: { fontFamily: 'Inter_600SemiBold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 50 : 32 },
  modalTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
  modalSubtitle: { marginTop: 8, marginBottom: 32, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  modalInput: { width: '100%', height: 60, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, fontFamily: 'Inter_400Regular' },
  modalError: { color: '#EF4444', marginBottom: 16, textAlign: 'center', fontFamily: 'Inter_600SemiBold' },
  modalSuccess: { color: '#10B981', marginBottom: 16, textAlign: 'center', fontFamily: 'Inter_600SemiBold' }
});
