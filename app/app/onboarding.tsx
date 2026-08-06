import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const ONBOARDING_STEPS = [
  {
    title: 'Analyze Contracts in Seconds',
    subtitle: 'Upload any legal document and let AI find hidden risks instantly.',
    icon: 'document-text-outline',
  },
  {
    title: 'AI-Powered Risk Detection',
    subtitle: 'Instantly spot unfair clauses, missing terms, and critical obligations.',
    icon: 'search-outline',
  },
  {
    title: 'Bank-Grade Security',
    subtitle: 'Your documents are encrypted, secure, and never shared with third parties.',
    icon: 'shield-checkmark-outline',
  }
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { colors } = useTheme();

  const handleNext = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    if (Platform.OS === 'web') {
      localStorage.setItem('has_seen_onboarding', 'true');
    }
    router.replace('/signup');
  };

  const handleSkip = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name={ONBOARDING_STEPS[step].icon as any} size={100} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>{ONBOARDING_STEPS[step].title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{ONBOARDING_STEPS[step].subtitle}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {ONBOARDING_STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: colors.border }, step === i && [styles.activeDot, { backgroundColor: colors.primary }]]} />
            ))}
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleNext}>
            <Text style={styles.buttonText}>{step === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { alignItems: 'flex-end', paddingTop: 20 },
  skipText: { fontSize: 16, fontWeight: '600' },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  iconContainer: {
    width: 200, height: 200, borderRadius: 100,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 40
  },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  footer: { paddingBottom: 40 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  activeDot: { width: 24 },
  button: {
    paddingVertical: 18, borderRadius: 12,
    alignItems: 'center', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
