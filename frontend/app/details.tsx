import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  let result = null;
  try {
    if (params.resultData) {
      result = JSON.parse(params.resultData as string);
    }
  } catch (e) {
    console.error("Failed to parse result data");
  }

  if (!result) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>No details found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Detailed Risks</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Critical Concerns</Text>
        {result.risks && result.risks.length > 0 ? (
          result.risks.map((risk: any, idx: number) => (
            <View key={idx} style={[styles.riskCard, { backgroundColor: colors.card, borderLeftColor: colors.error, borderColor: colors.divider }]}>
              <View style={styles.riskHeader}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.riskType, { color: colors.text }]}>{risk.type || 'Potential Issue'}</Text>
              </View>
              <Text style={[styles.riskDescription, { color: colors.textSecondary }]}>{risk.description}</Text>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No specific risks detected.</Text>
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 32 }]}>Detected Clauses</Text>
        <View style={styles.clauseContainer}>
          {result.clauses && result.clauses.map((clause: string, idx: number) => (
            <View key={idx} style={[styles.clauseBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.clauseText, { color: colors.primary }]}>{clause}</Text>
            </View>
          ))}
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
  container: { padding: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20 },
  riskCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderLeftWidth: 6, borderWidth: 1, elevation: 2 },
  riskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  riskType: { fontSize: 17, fontWeight: '700', marginLeft: 10 },
  riskDescription: { fontSize: 14, lineHeight: 22 },
  clauseContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  clauseBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  clauseText: { fontSize: 13, fontWeight: '700' },
  emptyText: { fontStyle: 'italic', fontSize: 15 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginBottom: 20, fontSize: 16 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});
