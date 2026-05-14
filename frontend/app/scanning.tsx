import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { analyzeText, analyzePDF } from '../services/api';
import { GlobalStore } from '../services/store';

export default function ScanningScreen() {
  const router = useRouter();

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
        router.replace({
          pathname: '/summary',
          params: { resultData: JSON.stringify(data) }
        });

      } catch (error: any) {
        Alert.alert("Analysis Failed", error.message || "Could not reach server.");
        router.replace('/upload');
      }
    };

    runAnalysis();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.pulseCircle}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Analyzing Document...</Text>
        <Text style={styles.subtitle}>AI is scanning for hidden risks, unfair clauses, and critical obligations.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A365D' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  pulseCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  title: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center', lineHeight: 24 }
});
