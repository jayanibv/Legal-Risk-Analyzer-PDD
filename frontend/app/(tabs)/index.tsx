import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { isAuthenticated, removeToken } from '../../services/auth';
import { getHistory, getUserProfile } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [userName, setUserName] = useState('User');
  const [stats, setStats] = useState({ total: 0, highRisk: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated();
      if (!authed) {
        router.replace('/onboarding');
      } else {
        fetchData();
      }
    };
    checkAuth();
  }, []);

  const fetchData = async () => {
    try {
      const profile = await getUserProfile();
      if (profile && profile.name) setUserName(profile.name);
      
      const data = await getHistory();
      if (Array.isArray(data)) {
        setRecentScans(data.slice(0, 3));
        const highRisk = data.filter(d => d.risk_level?.toLowerCase() === 'high risk').length;
        setStats({ total: data.length, highRisk });
      }
    } catch (e: any) {
      console.log("Dashboard fetch error:", e.message);
      if (e.message && (e.message.includes("401") || e.message.includes("Unauthorized"))) {
        await removeToken();
        router.replace('/onboarding');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    if (!level) return colors.textSecondary;
    switch (level.toLowerCase()) {
      case 'high risk': return colors.error;
      case 'medium risk': return colors.warning;
      case 'low risk': return colors.success;
      default: return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good Morning,</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.profileIcon, { backgroundColor: colors.card, borderColor: colors.divider }]} 
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="person" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Scans</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.divider }]}>
            <Text style={[styles.statNumber, { color: colors.error }]}>{stats.highRisk}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>High Risk</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.uploadCard, { backgroundColor: isDark ? colors.card : '#EBF8FF', borderColor: colors.primary }]}
          onPress={() => router.push('/upload')}
        >
          <View style={[styles.uploadIconContainer, { backgroundColor: colors.bg }]}>
            <Ionicons name="cloud-upload" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.uploadTitle, { color: colors.text }]}>New Document Scan</Text>
          <Text style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>Upload PDF or paste text to analyze</Text>
        </TouchableOpacity>

        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : recentScans.length > 0 ? (
            recentScans.map((scan, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.recentItem, { backgroundColor: colors.card, borderColor: colors.divider }]} 
                onPress={() => router.push({ pathname: '/summary', params: { id: scan.id } })}
              >
                <Ionicons name="document-text" size={24} color={colors.textSecondary} />
                <View style={styles.recentItemText}>
                  <Text style={[styles.recentItemTitle, { color: colors.text }]} numberOfLines={1}>{scan.filename || "Pasted Text"}</Text>
                  <Text style={[styles.recentItemDate, { color: colors.textSecondary }]}>
                    {scan.date || "Just now"}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getRiskColor(scan.risk_level) + '20' }]}>
                  <Text style={[styles.badgeText, { color: getRiskColor(scan.risk_level) }]}>
                    {scan.risk_level || "Analyzing"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No recent scans found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  greeting: { fontSize: 14, fontWeight: '600' },
  userName: { fontSize: 28, fontWeight: '800' },
  profileIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statCard: { flex: 0.48, padding: 20, borderRadius: 20, borderWidth: 1 },
  statNumber: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  uploadCard: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 32 },
  uploadIconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  uploadTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  uploadSubtitle: { fontSize: 14, textAlign: 'center' },
  recentSection: { flex: 1 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '800' },
  seeAll: { fontSize: 14, fontWeight: '700' },
  recentItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  recentItemText: { flex: 1, marginLeft: 16 },
  recentItemTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  recentItemDate: { fontSize: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  emptyText: { textAlign: 'center', marginTop: 24, fontSize: 15 }
});