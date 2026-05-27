import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { getHistory } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const formatDate = (dateString: string) => {
  if (!dateString) return "Just now";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
};

export default function HistoryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const fetchHistory = async () => {
    try {
      const data = await getHistory();
      if (Array.isArray(data)) setHistory(data);
    } catch (e) {
      console.log("History fetch failed");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high risk': return colors.error;
      case 'medium risk': return colors.warning;
      case 'low risk': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.divider }]}
      onPress={() => router.push({ pathname: '/summary', params: { id: item.id } })}
    >
      <View style={[styles.iconBox, { backgroundColor: getRiskColor(item.risk_level) + '15' }]}>
        <Ionicons name="document-text" size={24} color={getRiskColor(item.risk_level)} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.filename, { color: colors.text }]} numberOfLines={1}>{item.filename}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(item.date)}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: getRiskColor(item.risk_level) + '10' }]}>
        <Text style={[styles.badgeText, { color: getRiskColor(item.risk_level) }]}>{item.risk_level?.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Document History</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={64} color={colors.divider} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No documents found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '800' },
  list: { padding: 24, paddingTop: 0 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  iconBox: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  info: { flex: 1 },
  filename: { fontSize: 16, fontWeight: '700' },
  date: { fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16 }
});
