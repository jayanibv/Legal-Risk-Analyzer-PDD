import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, SafeAreaView, Alert, Modal, TextInput, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { removeToken } from '../../services/auth';
import { getUserProfile, updateProfile } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [userDob, setUserDob] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [contentModal, setContentModal] = useState<{ visible: boolean, title: string, content: any[] }>({ visible: false, title: '', content: [] });
  
  const [newName, setNewName] = useState('');
  const [newDob, setNewDob] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [modalError, setModalError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState({ day: '', month: '', year: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
        setUserName(profile.name || 'User');
        setUserEmail(profile.email || '');
        setUserDob(profile.dob || '');
        setNewName(profile.name || '');
        setNewDob(profile.dob || '');
      }
    } catch (e) {
      console.log("Could not fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    router.replace('/onboarding');
  };

  const showContent = (type: 'privacy' | 'help' | 'support') => {
    const data = {
      privacy: {
        title: 'Privacy & Security',
        content: [
          { q: 'Is my data safe?', a: 'Yes, we use AES-256 encryption. Your documents are processed in a secure sandbox and are never shared with third parties.' },
          { q: 'Do you train AI on my files?', a: 'No. Your documents are used only for your specific analysis and are not used for training any public models.' }
        ]
      },
      help: {
        title: 'Help Center & FAQ',
        content: [
          { q: 'How do I upload a document?', a: 'Go to the Dashboard and click the "New Document Scan" button. You can upload a PDF or paste raw text.' },
          { q: 'What does the Risk Score mean?', a: 'The score (0-100) measures how favorable or predatory the terms are. Higher scores indicate more risks.' },
          { q: 'Can I see old reports?', a: 'Yes, all your previous scans are saved in the "History" tab for easy access anytime.' }
        ]
      },
      support: {
        title: 'Contact Support',
        content: [
          { q: 'Email Support', a: 'support@legalrisk.ai' },
          { q: 'Business Hours', a: 'Mon-Fri, 9:00 AM - 6:00 PM IST' },
          { q: 'Response Time', a: 'Typically within 24 hours.' }
        ]
      }
    };
    setContentModal({ visible: true, ...data[type] });
  };

  const handleConfirmDate = () => {
    if (!tempDate.year || !tempDate.month || !tempDate.day) {
       setModalError("Please enter full date");
       return;
    }
    const formatted = `${tempDate.year}-${tempDate.month.padStart(2, '0')}-${tempDate.day.padStart(2, '0')}`;
    setNewDob(formatted);
    setShowDatePicker(false);
    setModalError('');
  };

  const handleUpdateProfile = async () => {
    if (!newName || !newDob) {
      setModalError("Please fill in all fields");
      return;
    }
    setSaving(true);
    setModalError('');
    try {
      await updateProfile(newName, newDob);
      setUserName(newName);
      setUserDob(newDob);
      setEditModalVisible(false);
      // Wait for modal to close before showing alert on native
      if (Platform.OS !== 'web') {
        setTimeout(() => Alert.alert("Success", "Profile updated successfully!"), 500);
      }
    } catch (e: any) {
      setModalError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const SettingRow = ({ icon, title, showToggle, toggleValue, onToggle, onPress }: any) => (
    <TouchableOpacity 
      style={[styles.settingRow, { borderBottomColor: colors.divider }]} 
      onPress={onPress}
      disabled={showToggle}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={22} color={colors.textSecondary} style={styles.settingIcon} />
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {showToggle ? (
        <Switch 
          value={toggleValue} 
          onValueChange={onToggle}
          trackColor={{ false: '#CBD5E1', true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{userName}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userEmail}</Text>
          </View>
          <TouchableOpacity style={[styles.editBtn, { borderColor: colors.primary }]} onPress={() => {
            setNewName(userName);
            setNewDob(userDob);
            setModalError('');
            setEditModalVisible(true);
          }}>
            <Text style={[styles.editBtnText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App Settings</Text>
          <SettingRow 
            icon="moon-outline" 
            title="Dark Mode" 
            showToggle={true} 
            toggleValue={isDark} 
            onToggle={toggleTheme} 
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support & Legal</Text>
          <SettingRow icon="shield-outline" title="Privacy & Security" onPress={() => showContent('privacy')} />
          <SettingRow icon="help-circle-outline" title="Help Center & FAQ" onPress={() => showContent('help')} />
          <SettingRow icon="mail-outline" title="Contact Support" onPress={() => showContent('support')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Logout Account</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0 (Production)</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            
            {modalError ? <Text style={{ color: '#EF4444', marginBottom: 16, textAlign: 'center' }}>{modalError}</Text> : null}

            <TextInput style={[styles.modalInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.divider }]} placeholder="Full Name" value={newName} onChangeText={setNewName} />
            
            <TouchableOpacity 
              style={[styles.modalInput, { backgroundColor: colors.bg, borderColor: colors.divider, justifyContent: 'center' }]} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: newDob ? colors.text : colors.textSecondary }}>
                {newDob || 'Date of Birth'}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.divider }]} onPress={() => { setEditModalVisible(false); setModalError(''); }}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleUpdateProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, width: '90%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 20, textAlign: 'center' }]}>Select Date of Birth</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 12 }}>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.bg, color: colors.text }]}
                placeholder="DD"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
                value={tempDate.day}
                onChangeText={(text) => setTempDate(prev => ({...prev, day: text.replace(/[^0-9]/g, '')}))}
              />
              <Text style={{ fontSize: 24, color: colors.textSecondary, marginHorizontal: 4 }}>/</Text>
              <TextInput
                style={[styles.dateInput, { backgroundColor: colors.bg, color: colors.text }]}
                placeholder="MM"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
                value={tempDate.month}
                onChangeText={(text) => setTempDate(prev => ({...prev, month: text.replace(/[^0-9]/g, '')}))}
              />
              <Text style={{ fontSize: 24, color: colors.textSecondary, marginHorizontal: 4 }}>/</Text>
              <TextInput
                style={[styles.dateInput, { width: 100, backgroundColor: colors.bg, color: colors.text }]}
                placeholder="YYYY"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={4}
                value={tempDate.year}
                onChangeText={(text) => setTempDate(prev => ({...prev, year: text.replace(/[^0-9]/g, '')}))}
              />
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.divider }]} onPress={() => setShowDatePicker(false)}>
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: colors.primary }]} onPress={handleConfirmDate}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Content Modal (Privacy, Help, Support) */}
      <Modal visible={contentModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, width: '90%', maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>{contentModal.title}</Text>
              <TouchableOpacity onPress={() => setContentModal({ ...contentModal, visible: false })}>
                <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ marginTop: 20 }}>
              {contentModal.content.map((item, idx) => (
                <View key={idx} style={{ marginBottom: 24 }}>
                  <Text style={[styles.faqQ, { color: colors.text }]}>{item.q}</Text>
                  <Text style={[styles.faqA, { color: colors.textSecondary }]}>{item.a}</Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: colors.primary }]} 
              onPress={() => setContentModal({ ...contentModal, visible: false })}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '800' },
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 24, marginBottom: 32, borderWidth: 1 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '800' },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName: { fontSize: 18, fontWeight: '800' },
  profileEmail: { fontSize: 14, marginTop: 4 },
  editBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  editBtnText: { fontWeight: '700', fontSize: 13 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, borderBottomWidth: 1 },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: { marginRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 20, borderRadius: 20, marginTop: 10 },
  logoutText: { marginLeft: 12, color: '#EF4444', fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', padding: 24, borderRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  faqQ: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  faqA: { fontSize: 15, lineHeight: 22 },
  modalInput: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 0.48, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  dateInput: { width: 60, height: 50, borderRadius: 12, textAlign: 'center', fontSize: 16, borderWidth: 1, borderColor: 'transparent' }
});
