import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const TEMPLATES = [
  {
    id: '1',
    title: 'Mutual Non-Disclosure Agreement',
    description: 'A standard mutual NDA to protect confidential information shared between two parties (via Cooley GO).',
    url: 'https://www.cooleygo.com/documents/mutual-non-disclosure-agreement/'
  },
  {
    id: '2',
    title: 'Independent Contractor Agreement',
    description: 'Agreement for hiring freelancers or independent contractors for specific projects.',
    url: 'https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/whdfs13.pdf'
  },
  {
    id: '3',
    title: 'Y-Combinator SAFE',
    description: 'Simple Agreement for Future Equity, standard for early-stage startup fundraising.',
    url: 'https://www.ycombinator.com/documents'
  },
  {
    id: '4',
    title: 'Employment Offer Letter',
    description: 'A standard offer letter for full-time employment with standard clauses.',
    url: 'https://www.dir.ca.gov/dlse/lc_2810.5_notice.pdf'
  }
];

export default function TemplatesScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();


  const renderTemplate = ({ item, index }: { item: typeof TEMPLATES[0]; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : colors.primary }]}>
        <View style={styles.cardHeader}>
          <LinearGradient
            colors={[colors.primaryGradientStart || colors.primary, colors.primaryGradientEnd || colors.primary]}
            style={styles.iconBox}
          >
            <Ionicons name="document" size={24} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
          </View>
        </View>
        {Platform.OS === 'web' ? (
          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <View style={[styles.downloadBtn, { backgroundColor: colors.cardAlt }]}>
              <Ionicons name="cloud-download" size={18} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.downloadText, { color: colors.primary }]}>Download Template</Text>
            </View>
          </a>
        ) : (
          <TouchableOpacity 
            style={[styles.downloadBtn, { backgroundColor: colors.cardAlt }]}
            onPress={() => Linking.openURL(item.url).catch(e => console.log(e))}
          >
            <Ionicons name="cloud-download" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.downloadText, { color: colors.primary }]}>Download Template</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={[colors.bg, colors.cardAlt]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View entering={FadeInDown.duration(200)} style={[styles.header, { borderBottomColor: colors.divider }]}>
          <TouchableOpacity 
            style={styles.menuIcon}
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          >
            <Ionicons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Contract Templates</Text>
        </Animated.View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Safe, standard legal templates vetted for common use cases. Tap to download.
        </Text>

        <FlatList
          data={TEMPLATES}
          keyExtractor={item => item.id}
          renderItem={renderTemplate}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { padding: 16, paddingTop: Platform.OS === 'ios' ? 10 : 40, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 16 },
  title: { fontSize: 24, fontFamily: 'SpaceGrotesk_700Bold' },
  subtitle: { paddingHorizontal: 24, fontSize: 15, lineHeight: 22, marginBottom: 24, fontFamily: 'Inter_400Regular' },
  list: { padding: 24, paddingTop: 0 },
  card: { padding: 20, borderRadius: 16, marginBottom: 16, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  iconBox: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  downloadBtn: { flexDirection: 'row', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  downloadText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' }
});
