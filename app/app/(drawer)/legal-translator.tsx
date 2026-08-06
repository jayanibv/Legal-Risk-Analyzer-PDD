import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
  Alert,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useLocalSearchParams, useRouter } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { translateDocument } from '../../services/api';
import { GlobalStore } from '../../services/store';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const LANGUAGES = [
  { id: 'Tamil', label: 'Tamil', flag: '🇮🇳' },
  { id: 'Telugu', label: 'Telugu', flag: '🇮🇳' },
  { id: 'Spanish', label: 'Spanish', flag: '🇪🇸' },
  { id: 'Mandarin', label: 'Mandarin (Chinese)', flag: '🇨🇳' },
  { id: 'German', label: 'German', flag: '🇩🇪' },
  { id: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { id: 'Portuguese', label: 'Portuguese', flag: '🇵🇹' }
];

export default function LegalTranslatorScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [documentText, setDocumentText] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Spanish');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    // Determine document text from route params, GlobalStore.textContent, or current analysis
    let initialText = '';
    if (params.text && typeof params.text === 'string' && params.text.trim()) {
      initialText = params.text;
    } else if (GlobalStore.textContent && GlobalStore.textContent.trim()) {
      initialText = GlobalStore.textContent;
    } else if (GlobalStore.currentAnalysis) {
      const current = GlobalStore.currentAnalysis as any;
      const summaries = current.summaries || current.summary || [];
      if (Array.isArray(summaries) && summaries.length > 0) {
        initialText = summaries.join('\n\n');
      }
    }
    setDocumentText(initialText);
  }, [params.text]);

  const handleTranslate = async () => {
    const textToTranslate = documentText.trim();
    if (!textToTranslate) {
      Alert.alert('Input Error', 'Please provide or analyze a document before translating.');
      return;
    }

    setLoading(true);
    setError('');
    setTranslatedText('');

    try {
      const res = await translateDocument(textToTranslate, selectedLanguage);
      if (res && res.translated_text) {
        setTranslatedText(res.translated_text);
      } else {
        throw new Error('No translated text returned from AI server.');
      }
    } catch (e: any) {
      const errMsg = e.message || 'Translation failed. Please check if local Ollama is running.';
      setError(errMsg);
      Alert.alert('Translation Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(translatedText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      Alert.alert('Copy', 'Selected text copied!');
    }
  };

  const handleShare = async () => {
    if (!translatedText) return;
    try {
      await Share.share({
        message: translatedText,
        title: `Legal Document Translation (${selectedLanguage})`
      });
    } catch (e: any) {
      console.log('Share error:', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.bg, colors.cardAlt]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(200)} style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity
            style={styles.menuIcon}
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          >
            <Ionicons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.text }]}>Legal Translator</Text>
          </View>
          <Ionicons name="language-outline" size={26} color={colors.primary} />
        </Animated.View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Document Preview Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📄 Document Preview</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
              {documentText ? (
                <ScrollView style={styles.previewScroll} nestedScrollEnabled>
                  <Text style={[styles.previewText, { color: colors.textSecondary }]}>
                    {documentText}
                  </Text>
                </ScrollView>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={40} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No document text found. Paste text or scan a document to translate.
                  </Text>
                  <TouchableOpacity
                    style={[styles.smallScanButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/upload')}
                  >
                    <Text style={styles.smallScanText}>Scan Document</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Language Selector Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🌐 Translate To</Text>
            <View style={styles.languageGrid}>
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.id;
                return (
                  <TouchableOpacity
                    key={lang.id}
                    style={[
                      styles.languageChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border
                      }
                    ]}
                    onPress={() => setSelectedLanguage(lang.id)}
                  >
                    <Text style={styles.flagText}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.languageChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text, fontWeight: isSelected ? '700' : '500' }
                      ]}
                    >
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Translate Button */}
          <TouchableOpacity
            style={[
              styles.translateButton,
              { backgroundColor: colors.primary, opacity: loading || !documentText.trim() ? 0.7 : 1 }
            ]}
            onPress={handleTranslate}
            disabled={loading || !documentText.trim()}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.translateButtonText}>Translating Document...</Text>
              </View>
            ) : (
              <View style={styles.loadingRow}>
                <Ionicons name="sparkles" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.translateButtonText}>Translate Document</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Error Message if any */}
          {error ? (
            <Animated.View entering={FadeInUp.duration(300)} style={[styles.errorCard, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={[styles.errorCardText, { color: colors.error }]}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Translation Output Section */}
          {translatedText ? (
            <Animated.View entering={FadeInUp.duration(400)} style={styles.section}>
              <View style={styles.outputHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                  ✨ Translated Document ({selectedLanguage})
                </Text>
              </View>

              <View style={[styles.card, styles.outputCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <ScrollView style={styles.outputScroll} nestedScrollEnabled>
                  <Text style={[styles.outputText, { color: colors.text }]}>
                    {translatedText}
                  </Text>
                </ScrollView>

                {/* Actions Toolbar */}
                <View style={[styles.actionRow, { borderTopColor: colors.divider }]}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.cardAlt }]}
                    onPress={handleCopy}
                  >
                    <Ionicons
                      name={copied ? 'checkmark-circle' : 'copy-outline'}
                      size={18}
                      color={copied ? colors.success : colors.primary}
                    />
                    <Text style={[styles.actionBtnText, { color: copied ? colors.success : colors.primary }]}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.cardAlt }]}
                    onPress={handleShare}
                  >
                    <Ionicons name="share-outline" size={18} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1
  },
  menuIcon: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20
  },
  container: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1
  },
  previewScroll: { maxHeight: 150 },
  previewText: { fontSize: 14, lineHeight: 22 },
  emptyContainer: { alignItems: 'center', paddingVertical: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 12 },
  smallScanButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  smallScanText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justify: 'space-between',
    gap: 8
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '48%',
    marginBottom: 4
  },
  flagText: { fontSize: 16, marginRight: 8 },
  languageChipText: { fontSize: 14 },
  translateButton: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  translateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20
  },
  errorCardText: { fontSize: 14, flex: 1 },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  outputCard: {
    borderWidth: 1.5
  },
  outputScroll: { maxHeight: 300, marginBottom: 16 },
  outputText: { fontSize: 15, lineHeight: 24 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', marginLeft: 6 }
});
