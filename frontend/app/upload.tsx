import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';

import { GlobalStore } from '../services/store';

export default function UploadScreen() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      if (!res.canceled && res.assets) {
        setSelectedFile(res.assets[0]);
        setText('');
      }
    } catch (err) {
      Alert.alert("Error", "Could not pick document.");
    }
  };

  const handleContinue = () => {
    if (!text && !selectedFile) {
      Alert.alert("Input Required", "Please upload a document or paste text to analyze.");
      return;
    }

    // Store in global memory instead of URL params (solves web File object passing)
    GlobalStore.selectedFile = selectedFile;
    GlobalStore.textContent = text;

    router.replace('/scanning');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Scan</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.label}>Select Document</Text>

        <TouchableOpacity
          style={[styles.uploadZone, selectedFile && styles.uploadZoneActive]}
          onPress={handlePickDocument}
        >
          <Ionicons
            name={selectedFile ? "document-text" : "cloud-upload-outline"}
            size={40}
            color={selectedFile ? "#3182CE" : "#94A3B8"}
          />
          <Text style={[styles.uploadText, selectedFile && styles.uploadTextActive]}>
            {selectedFile ? selectedFile.name : "Tap to Upload PDF"}
          </Text>
          {selectedFile && (
            <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.removeIcon}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR PASTE TEXT</Text>
          <View style={styles.line} />
        </View>

        <TextInput
          style={styles.textInput}
          placeholder="Paste legal clauses or agreement text here..."
          placeholderTextColor="#94A3B8"
          multiline
          value={text}
          onChangeText={(val) => {
            setText(val);
            if (val) setSelectedFile(null);
          }}
        />

        <TouchableOpacity
          style={[styles.button, (!text && !selectedFile) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!text && !selectedFile}
        >
          <Text style={styles.buttonText}>Continue to Analysis</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  container: { flex: 1, padding: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  uploadZone: { backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 16, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24, padding: 20 },
  uploadZoneActive: { backgroundColor: '#EBF8FF', borderColor: '#3182CE', borderStyle: 'solid' },
  uploadText: { marginTop: 12, fontSize: 16, color: '#64748B', fontWeight: '500', textAlign: 'center' },
  uploadTextActive: { color: '#1A365D', fontWeight: '600' },
  removeIcon: { position: 'absolute', top: 12, right: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 1 },
  textInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, fontSize: 15, color: '#1E293B', textAlignVertical: 'top' },
  button: { backgroundColor: '#1A365D', flexDirection: 'row', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  buttonDisabled: { backgroundColor: '#94A3B8' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
