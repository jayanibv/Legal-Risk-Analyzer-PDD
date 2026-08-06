import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { analyzeText, analyzePDF } from '../services/api';
import { GlobalStore } from '../services/store';
import { useTheme } from '../context/ThemeContext';

export default function ScanningScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        let data;
        if (GlobalStore.selectedFile) {
          const file = GlobalStore.selectedFile;
          // For web, file.file contains the actual Blob/File object needed by FormData
          const uriToPass = file.file || file.uri; 
          data = await analyzePDF(uriToPass, file.name);
        } else if (GlobalStore.textContent) {
          data = await analyzeText(GlobalStore.textContent);
        } else {
          throw new Error("No input provided");
        }

        if (data.detail) throw new Error(data.detail);

        // Store result in global state or pass via params
        GlobalStore.currentAnalysis = data;
        router.replace({
          pathname: '/summary',
          params: { id: data.id }
        });

      } catch (error: any) {
        Alert.alert("Analysis Failed", error.message || "Could not reach server.");
        router.replace('/upload');
      }
    };

    runAnalysis();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={[styles.pulseCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30, 58, 138, 0.1)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(30, 58, 138, 0.2)' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Analyzing Document...</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>AI is scanning for hidden risks, unfair clauses, and critical obligations.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  pulseCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderWidth: 1 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24 }
});
