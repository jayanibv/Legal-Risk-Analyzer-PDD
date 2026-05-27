import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getAnalysisById } from '../services/api';

export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();

  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [params.id, params.resultData]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (params.resultData) {
        const parsed = JSON.parse(params.resultData as string);
        setResult(parsed);
      } else if (params.id) {
        const data = await getAnalysisById(params.id);
        setResult(data);
      } else {
        setError('No analysis data found');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high risk': return colors.error;
      case 'medium risk': return colors.warning;
      case 'low risk': return colors.success;
      default: return colors.primary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !result) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Result not found'}</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.buttonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const riskColor = getRiskColor(result.risk_level);
  // Handle both singular and plural keys for backward compatibility
  const overviewData = result.summaries || result.summary || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Risk Summary</Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/export', params: { resultData: JSON.stringify(result) } })}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.scoreContainer}>
          <View style={[styles.scoreCircle, { borderColor: riskColor, backgroundColor: colors.card }]}>
            <Text style={[styles.scoreText, { color: riskColor }]}>{result.risk_score}</Text>
            <Text style={[styles.scoreMax, { color: colors.textSecondary }]}>/ 100</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: riskColor + '20' }]}>
            <Text style={[styles.badgeText, { color: riskColor }]}>{result.risk_level?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Document Overview</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            {overviewData.length > 0 ? overviewData.map((point: string, idx: number) => (
              <View key={idx} style={styles.bulletRow}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{point}</Text>
              </View>
            )) : <Text style={[styles.bulletText, { color: colors.textSecondary }]}>No overview available.</Text>}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.detailsButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/details', params: { resultData: JSON.stringify(result) } })}
        >
          <Text style={styles.detailsButtonText}>View Detailed Risks</Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  container: { padding: 24 },
  scoreContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  scoreCircle: { width: 160, height: 160, borderRadius: 80, borderWidth: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4 },
  scoreText: { fontSize: 48, fontWeight: '800' },
  scoreMax: { fontSize: 16, fontWeight: '600', marginTop: -5 },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  badgeText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  card: { borderRadius: 20, padding: 20, borderWidth: 1 },
  bulletRow: { flexDirection: 'row', marginBottom: 12, paddingRight: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginRight: 12 },
  bulletText: { fontSize: 15, lineHeight: 22, flex: 1 },
  detailsButton: { flexDirection: 'row', height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  button: { padding: 16, borderRadius: 12, minWidth: 150, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold' },
  detailsButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginRight: 8 },
  errorText: { fontSize: 16, marginBottom: 20, textAlign: 'center' }
});
