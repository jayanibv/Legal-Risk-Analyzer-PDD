import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ClausesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  
  let result = null;
  try {
    if (params.resultData) {
      result = JSON.parse(params.resultData as string);
    }
  } catch (e) {
    console.error("Failed to parse result data");
  }

  // Dummy recommendations if none provided by AI
  const recommendations = result?.recommendations || [
    { title: "Clarify Termination Rights", description: "Ensure the document explicitly states the notice period for termination without cause." },
    { title: "Limit IP Transfer", description: "Limit the scope of intellectual property transfer to only the specific work product." },
    { title: "Add Indemnification Cap", description: "Limit your liability by adding a cap to indemnification clauses." }
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Clause Recommendations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Based on our AI analysis, here are some suggested improvements for your document.
        </Text>

        {recommendations.map((item: any, idx: number) => (
          <View key={idx} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="bulb-outline" size={22} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            </View>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{item.description}</Text>
            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.applyBtnText}>Mark as Fixed</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800' },
  backButton: { padding: 8 },
  container: { padding: 20 },
  subtitle: { fontSize: 15, marginBottom: 24, lineHeight: 22 },
  card: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginLeft: 10 },
  cardDesc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  applyBtn: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  applyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});
