import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name={ONBOARDING_STEPS[step].icon as any} size={100} color="#1A365D" />
          </View>
          <Text style={styles.title}>{ONBOARDING_STEPS[step].title}</Text>
          <Text style={styles.subtitle}>{ONBOARDING_STEPS[step].subtitle}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {ONBOARDING_STEPS.map((_, i) => (
              <View key={i} style={[styles.dot, step === i && styles.activeDot]} />
            ))}
          </View>
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>{step === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { alignItems: 'flex-end', paddingTop: 20 },
  skipText: { fontSize: 16, color: '#64748B', fontWeight: '600' },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  iconContainer: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#EBF8FF', justifyContent: 'center', alignItems: 'center',
    marginBottom: 40
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1A365D', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 16, color: '#64748B', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20 },
  footer: { paddingBottom: 40 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1', marginHorizontal: 4 },
  activeDot: { backgroundColor: '#1A365D', width: 24 },
  button: {
    backgroundColor: '#1A365D', paddingVertical: 18, borderRadius: 12,
    alignItems: 'center', shadowColor: '#1A365D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 5
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
