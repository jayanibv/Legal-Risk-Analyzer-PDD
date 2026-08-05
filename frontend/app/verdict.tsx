import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { GlobalStore } from '../services/store';

export default function VerdictScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  let result = null;
  try {
    if (GlobalStore.currentAnalysis) {
      result = GlobalStore.currentAnalysis;
    } else if (params.resultData) {
      result = JSON.parse(params.resultData as string);
    }
  } catch (e) {
    console.error("Failed to parse result data");
  }

  const verdict = result?.verdict;

  if (!verdict) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>No decision support available.</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getRecommendationColor = (rec: string) => {
    const l = rec?.toLowerCase() || '';
    if (l.includes('caution')) return colors.warning;
    if (l.includes('do not') || l.includes('reject') || l.includes('danger')) return colors.error;
    return colors.success;
  };

  const recColor = getRecommendationColor(verdict.recommendation);

  const renderProgressBar = (label: string, value: number, color: string) => (
    <View style={styles.progressRow}>
      <View style={styles.progressLabelContainer}>
        <Text style={[styles.progressLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.progressValue, { color }]}>{value}%</Text>
      </View>
      <View style={[styles.progressBarBackground, { backgroundColor: colors.divider }]}>
        <View style={[styles.progressBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Decision Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: recColor + '15', borderColor: recColor }]}>
          <Text style={[styles.bannerText, { color: recColor }]}>{verdict.recommendation}</Text>
        </View>

        {/* Metrics Grid */}
        <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          {renderProgressBar("Confidence", verdict.confidence || 0, colors.primary)}
          {renderProgressBar("Fairness", verdict.fairness || 0, colors.success)}
          {renderProgressBar("Completeness", verdict.completeness || 0, colors.primary)}
        </View>

        {/* Top Concerns */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>Top Concerns</Text>
        <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          {verdict.top_concerns && verdict.top_concerns.length > 0 ? (
            verdict.top_concerns.map((c: string, idx: number) => (
              <View key={idx} style={styles.listItem}>
                <Ionicons name="warning" size={20} color={colors.warning} style={styles.listIcon} />
                <Text style={[styles.listText, { color: colors.textSecondary }]}>{c}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.listText, { color: colors.textSecondary }]}>No major concerns detected.</Text>
          )}
        </View>

        {/* Recommended Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>Recommended Actions</Text>
        <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
          {verdict.recommended_actions && verdict.recommended_actions.length > 0 ? (
            verdict.recommended_actions.map((a: string, idx: number) => (
              <View key={idx} style={styles.listItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} style={styles.listIcon} />
                <Text style={[styles.listText, { color: colors.textSecondary }]}>{a}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.listText, { color: colors.textSecondary }]}>No specific actions required.</Text>
          )}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            This assessment is AI-generated and intended to assist document review. It is not legal advice and should not replace consultation with a qualified legal professional.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  container: { padding: 24, paddingBottom: 60 },
  banner: { padding: 24, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  bannerText: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  metricsCard: { borderRadius: 20, padding: 24, borderWidth: 1, elevation: 2 },
  progressRow: { marginBottom: 16 },
  progressLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 16, fontWeight: '600' },
  progressValue: { fontSize: 16, fontWeight: '800' },
  progressBarBackground: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  listCard: { borderRadius: 20, padding: 20, borderWidth: 1, elevation: 2 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  listIcon: { marginTop: 2, marginRight: 12 },
  listText: { fontSize: 15, lineHeight: 22, flex: 1 },
  disclaimerContainer: { marginTop: 40, padding: 16, backgroundColor: 'transparent' },
  disclaimerText: { fontSize: 12, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginBottom: 20, fontSize: 16 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
