import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { login, resetPassword } from '../services/api';
import { saveToken } from '../services/auth';
import { Ionicons } from '@expo/vector-icons';

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
        router.replace('/(tabs)');
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Ionicons name="lock-open" size={64} color="#1A365D" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to access your reports</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#64748B" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholderTextColor="#94A3B8" placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
              <TextInput
                style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                placeholderTextColor="#94A3B8" placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => setShowForgotModal(true)}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.mainBtn, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>Sign In</Text>}
            </TouchableOpacity>

            {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>


      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>Verify your identity to reset password</Text>
            
            <TextInput style={styles.modalInput} placeholderTextColor="#94A3B8" placeholder="Email" value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" />
            <TextInput style={styles.modalInput} placeholderTextColor="#94A3B8" placeholder="Date of Birth (YYYY-MM-DD)" value={forgotDob} onChangeText={setForgotDob} />
            <TextInput style={styles.modalInput} placeholderTextColor="#94A3B8" placeholder="Best friend's name?" value={forgotSecurity} onChangeText={setForgotSecurity} />
            <TextInput style={styles.modalInput} placeholderTextColor="#94A3B8" placeholder="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

            {modalError ? <Text style={styles.modalError}>{modalError}</Text> : null}
            {modalSuccess ? <Text style={styles.modalSuccess}>{modalSuccess}</Text> : null}

            <TouchableOpacity style={styles.modalBtn} onPress={handleResetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnText}>Reset Password</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setShowForgotModal(false); setModalError(''); setModalSuccess(''); }} style={{ marginTop: 20 }}>
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
  header: { alignItems: 'center', marginBottom: 48 },
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
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  mainBtn: { backgroundColor: '#1A365D', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748B' },
  footerLink: { color: '#1A365D', fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#1E293B' },
  modalSubtitle: { color: '#64748B', marginTop: 8, marginBottom: 24, textAlign: 'center' },
  modalInput: { backgroundColor: '#F1F5F9', width: '100%', height: 56, borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  modalError: { color: '#EF4444', marginBottom: 16, textAlign: 'center' },
  modalSuccess: { color: '#10B981', marginBottom: 16, textAlign: 'center', fontWeight: 'bold' },
  modalBtn: { backgroundColor: '#1A365D', width: '100%', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
