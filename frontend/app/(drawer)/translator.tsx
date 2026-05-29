import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Keyboard, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { translateText } from '../../services/api';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const LANGUAGES = ["Plain English", "Spanish", "French", "Hindi", "Mandarin"];

export default function TranslatorScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  
  const [inputText, setInputText] = useState('');
  const [targetLang, setTargetLang] = useState('Plain English');
  const [outputText, setOutputText] = useState('');
  const [translatorNotes, setTranslatorNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!inputText.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    try {
      const res = await translateText(inputText, targetLang);
      setOutputText(res.response);
      setTranslatorNotes(res.notes);
    } catch (e: any) {
      setOutputText("Error: Could not translate the text. Please try again.");
      setTranslatorNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.bg, colors.cardAlt]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity 
            style={styles.menuIcon}
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          >
            <Ionicons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Legalese Translator</Text>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.container}>
          <Animated.View entering={FadeInDown.duration(200).springify()}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Original Legal Clause</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.divider, shadowColor: isDark ? '#000' : colors.primary }]}
              placeholder="Paste confusing legal text here..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={inputText}
              onChangeText={setInputText}
            />
          </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(200).springify()}>
          <Text style={[styles.label, { color: colors.textSecondary, marginTop: 24 }]}>Translate to</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity 
                key={lang}
                style={[
                  styles.langChip, 
                  { backgroundColor: targetLang === lang ? colors.primary : colors.cardAlt, borderColor: targetLang === lang ? colors.primary : colors.cardAlt }
                ]}
                onPress={() => setTargetLang(lang)}
              >
                <Text style={{ color: targetLang === lang ? '#FFFFFF' : colors.text, fontWeight: targetLang === lang ? '700' : '500' }}>
                  {lang === "Plain English" ? "Plain English (Like I'm 5)" : lang}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity 
            disabled={!inputText.trim() || loading}
            onPress={handleTranslate}
          >
            <LinearGradient
              colors={inputText.trim() ? [colors.primaryGradientStart || colors.primary, colors.primaryGradientEnd || colors.primary] : [colors.divider, colors.divider]}
              style={styles.translateBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="language" size={20} color={inputText.trim() ? "#FFFFFF" : colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.translateBtnText, { color: inputText.trim() ? "#FFFFFF" : colors.textSecondary }]}>Translate</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {outputText ? (
          <Animated.View entering={FadeInUp.duration(200).springify()} style={styles.resultContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Translation Result</Text>
            <View style={[styles.resultBox, { backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.resultText, { color: colors.text }]}>{outputText}</Text>
            </View>
            
            {translatorNotes ? (
              <Animated.View entering={SlideInRight.delay(200).duration(200).springify()} style={[styles.notesBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="information-circle" size={16} color={colors.primary} />
                  <Text style={[styles.notesTitle, { color: colors.primary }]}> Translator Notes</Text>
                </View>
                <Text style={[styles.notesText, { color: colors.text }]}>{translatorNotes}</Text>
              </Animated.View>
            ) : null}
          </Animated.View>
        ) : null}
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: 16, paddingTop: Platform.OS === 'ios' ? 10 : 40, flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 16 },
  title: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
  container: { padding: 24, paddingTop: 10 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  textArea: { minHeight: 180, borderRadius: 16, padding: 20, fontSize: 16, lineHeight: 24, fontFamily: 'Inter_400Regular', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  langScroll: { marginBottom: 32, flexGrow: 0 },
  langChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16, marginRight: 12, borderWidth: 1 },
  translateBtn: { flexDirection: 'row', height: 60, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  translateBtnText: { fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold' },
  resultContainer: { marginTop: 8 },
  resultBox: { padding: 24, borderRadius: 16 },
  resultText: { fontSize: 16, lineHeight: 26, fontFamily: 'Inter_400Regular' },
  notesBox: { marginTop: 16, padding: 20, borderRadius: 16, borderWidth: 1 },
  notesTitle: { fontSize: 13, fontFamily: 'SpaceGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  notesText: { fontSize: 15, lineHeight: 24, fontFamily: 'Inter_400Regular' }
});
