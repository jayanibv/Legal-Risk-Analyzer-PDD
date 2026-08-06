import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, StatusBar, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { GlobalStore } from '../services/store';
import { useTheme } from '../context/ThemeContext';

export default function UploadScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  // Animations
  const bounceY = useSharedValue(0);
  const shimmerTranslateX = useSharedValue(-300);

  useEffect(() => {
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }]
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }]
  }));

  const triggerShimmer = () => {
    shimmerTranslateX.value = -300;
    shimmerTranslateX.value = withTiming(500, { duration: 700, easing: Easing.inOut(Easing.ease) });
  };

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      if (!res.canceled && res.assets) {
        setSelectedFile(res.assets[0]);
        setText('');
        // Simulate progress
        setUploadProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
          progress += 5;
          setUploadProgress(progress);
          if (progress >= 100) clearInterval(interval);
        }, 30);
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
    
    triggerShimmer();
    
    setTimeout(() => {
      GlobalStore.selectedFile = selectedFile;
      GlobalStore.textContent = text;
      router.replace('/scanning');
    }, 750);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient colors={[colors.bg, colors.cardAlt]} style={StyleSheet.absoluteFillObject} />
      
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInDown.duration(200)} style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Scan</Text>
          <View style={{ width: 24 }} />
        </Animated.View>

        <View style={styles.container}>
          {/* Tabs */}
          <Animated.View entering={FadeInUp.delay(100).duration(200).springify()} style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'upload' && { backgroundColor: colors.primary }]} 
              onPress={() => setActiveTab('upload')}
            >
              <Text style={[styles.tabText, activeTab === 'upload' ? { color: '#1B1F3B' } : { color: colors.textSecondary }]}>Upload File</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'paste' && { backgroundColor: colors.primary }]} 
              onPress={() => setActiveTab('paste')}
            >
              <Text style={[styles.tabText, activeTab === 'paste' ? { color: '#1B1F3B' } : { color: colors.textSecondary }]}>Paste Text</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <Animated.View entering={FadeInUp.duration(300).springify()} style={{ flex: 1, marginTop: 24 }}>
              <TouchableOpacity
                style={[
                  styles.uploadZone, 
                  { backgroundColor: colors.card, borderColor: colors.border }, 
                  selectedFile && { borderColor: colors.primary, backgroundColor: colors.primary + '10' }
                ]}
                onPress={handlePickDocument}
              >
                {!selectedFile ? (
                  <>
                    <Animated.View style={bounceStyle}>
                      <Ionicons name="document-text" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
                    </Animated.View>
                    <Text style={[styles.uploadText, { color: colors.text }]}>Tap to browse or drag file here</Text>
                    <Text style={[styles.uploadSub, { color: colors.textSecondary }]}>PDF, DOCX — Max 10MB</Text>
                  </>
                ) : (
                  <View style={styles.progressContainer}>
                    <Ionicons name="document" size={48} color={colors.primary} style={{ marginBottom: 12 }} />
                    <Text style={[styles.uploadText, { color: colors.text, marginBottom: 4 }]} numberOfLines={1}>{selectedFile.name}</Text>
                    <Text style={[styles.uploadSub, { color: colors.textSecondary, marginBottom: 24 }]}>
                      {(selectedFile.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0)} MB
                    </Text>
                    
                    <View style={[styles.progressBarBg, { backgroundColor: colors.divider }]}>
                      <View style={[styles.progressBarFill, { backgroundColor: colors.primary, width: `${uploadProgress}%` }]} />
                    </View>
                    <Text style={{ color: colors.primary, marginTop: 12, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>
                      {uploadProgress}% Uploaded
                    </Text>

                    <TouchableOpacity onPress={() => setSelectedFile(null)} style={styles.removeIcon}>
                      <Ionicons name="close-circle" size={28} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Paste Tab */}
          {activeTab === 'paste' && (
            <Animated.View entering={FadeInUp.duration(300).springify()} style={{ flex: 1, marginTop: 24 }}>
              <View style={[styles.textInputWrapper, isFocused && { borderColor: colors.primary, shadowColor: colors.primary, shadowOffset: {width: 0, height: 0}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  placeholder="Paste legal clauses or agreement text here..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  value={text}
                  onChangeText={(val) => {
                    setText(val);
                    if (val) setSelectedFile(null);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                <View style={styles.textFooter}>
                  <Animated.View entering={FadeInUp} style={[styles.langBadge, { backgroundColor: colors.primary + '15' }, !text && { opacity: 0 }]}>
                    <Ionicons name="language" size={14} color={colors.primary} />
                    <Text style={[styles.langText, { color: colors.primary }]}>English Detected</Text>
                  </Animated.View>
                  <Text style={[styles.charCount, { color: colors.textSecondary }]}>{text.length} chars</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Analyze Button */}
          <Animated.View entering={FadeInUp.delay(200).duration(200).springify()}>
            <TouchableOpacity disabled={!text && !selectedFile} onPress={handleContinue} style={{ marginTop: 24, overflow: 'hidden', borderRadius: 12 }}>
              <LinearGradient
                colors={(!text && !selectedFile) ? [colors.divider, colors.divider] : ['#00E5FF', '#00F5A0']}
                start={{x:0, y:0}} end={{x:1, y:1}}
                style={styles.button}
              >
                <Text style={[styles.buttonText, { color: (!text && !selectedFile) ? colors.textSecondary : '#1B1F3B' }]}>Analyze Document →</Text>
                
                {/* Shimmer Overlay */}
                <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle, { opacity: 0.3, width: '200%' }]}>
                  <LinearGradient
                    colors={['transparent', '#FFFFFF', 'transparent']}
                    start={{x:0, y:0}} end={{x:1, y:0}}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
  container: { flex: 1, padding: 24 },
  tabContainer: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  uploadZone: { flex: 1, borderWidth: 1, borderRadius: 24, justifyContent: 'center', alignItems: 'center', padding: 24 },
  uploadText: { fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', textAlign: 'center' },
  uploadSub: { marginTop: 8, fontSize: 14, fontFamily: 'Inter_400Regular' },
  progressContainer: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  progressBarBg: { width: '80%', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  removeIcon: { position: 'absolute', top: -20, right: -10, padding: 8 },
  textInputWrapper: { flex: 1, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  textInput: { flex: 1, padding: 20, fontSize: 16, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
  textFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(139,146,184,0.1)' },
  langBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  langText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginLeft: 4 },
  charCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  button: { flexDirection: 'row', height: 60, justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' }
});
