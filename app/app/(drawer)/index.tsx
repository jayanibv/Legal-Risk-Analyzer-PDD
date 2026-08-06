import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { isAuthenticated, removeToken } from '../../services/auth';
import { getHistory, getUserProfile } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Animated, { FadeInDown, FadeInUp, withRepeat, withTiming, useSharedValue, useAnimatedStyle, Easing, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

const PulseDot = ({ color }: { color: string }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(2, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: color }, animatedStyle]} />
      <View style={[styles.pulseCore, { backgroundColor: color }]} />
    </View>
  );
};

const ConcentricRings = ({ color }: { color: string }) => {
  const scale1 = useSharedValue(0.8);
  const opacity1 = useSharedValue(0.8);
  const scale2 = useSharedValue(0.8);
  const opacity2 = useSharedValue(0.8);

  useEffect(() => {
    scale1.value = withRepeat(withTiming(1.6, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    opacity1.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    setTimeout(() => {
      scale2.value = withRepeat(withTiming(1.6, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
      opacity2.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    }, 1000);
  }, []);

  const style1 = useAnimatedStyle(() => ({ transform: [{ scale: scale1.value }], opacity: opacity1.value }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ scale: scale2.value }], opacity: opacity2.value }));

  return (
    <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', width: 120, height: 120 }}>
      <Animated.View style={[{ position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: color }, style1]} />
      <Animated.View style={[{ position: 'absolute', width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: color }, style2]} />
    </View>
  );
};

const AnimatedGradientBorder = ({ children, colors, cardColor }: { children: React.ReactNode, colors: string[], cardColor: string }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', padding: 2, marginBottom: 24, shadowColor: colors[0], shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 }}>
      <Animated.View style={[{ position: 'absolute', top: -300, left: -300, right: -300, bottom: -300 }, animatedStyle]}>
        <LinearGradient colors={[colors[0], colors[1], colors[0], colors[1], colors[0]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      </Animated.View>
      <View style={{ backgroundColor: cardColor, borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
};

const formatDate = (dateString: string) => {
  if (!dateString) return "Just now";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
};

export default function DashboardScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [userName, setUserName] = useState('User');
  const [stats, setStats] = useState({ total: 0, highRisk: 0 });
  
  const uploadScale = useSharedValue(1);

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const authed = await isAuthenticated();
        if (!authed) {
          router.replace('/onboarding');
        } else {
          fetchData();
        }
      };
      checkAuth();
    }, [])
  );

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
      if (e.message && (e.message.includes("401") || e.message.includes("Unauthorized"))) {
        await removeToken();
        router.replace('/onboarding');
      }
    }
  };

  const getRiskColor = (level: string) => {
    if (!level) return colors.textSecondary;
    switch (level.toLowerCase()) {
      case 'high risk': return colors.error;
      case 'medium risk': return '#FFB020'; // amber
      case 'low risk': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const uploadAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: uploadScale.value }]
  }));

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[colors.bg, colors.cardAlt]} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(200).springify()} style={styles.header}>
            <TouchableOpacity style={styles.menuIcon} onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}>
              <Ionicons name="menu" size={28} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.avatarRing, { borderColor: colors.primary, shadowColor: colors.primary }]}>
              <Image source={require('../../assets/images/mascot.jpg')} style={styles.mascotImg} resizeMode="contain" />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {Platform.OS === 'web' ? (
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>Hello, {userName}</Text>
              ) : (
                <MaskedView
                  style={{ flex: 1, height: 40 }}
                  maskElement={<Text style={[styles.welcomeTitle, { color: colors.text }]}>Hello, {userName}</Text>}
                >
                  <LinearGradient
                    colors={[colors.primary, isDark ? '#FFFFFF' : colors.text]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </MaskedView>
              )}
              <PulseDot color={colors.primary} />
            </View>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>What would you like to review today?</Text>
          </View>

          {/* Stat Cards */}
          <View style={styles.statsRow}>
            <Animated.View entering={FadeInUp.delay(100).duration(200).springify()} style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: colors.primary, shadowColor: colors.primary }]}>
              <Ionicons name="documents" size={64} color={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} style={styles.statWatermark} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Scans</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).duration(200).springify()} style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: colors.error, shadowColor: colors.error }]}>
              <Ionicons name="warning" size={64} color={isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} style={styles.statWatermark} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.highRisk}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>High Risk</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Ionicons name="alert-circle" size={14} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: 12, marginLeft: 4, fontFamily: 'Inter_600SemiBold' }}>Action needed</Text>
              </View>
            </Animated.View>
          </View>

          {/* Quick Upload Zone */}
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Analyze Document</Text>
          <Animated.View entering={FadeInUp.delay(300).duration(200).springify()}>
            <AnimatedGradientBorder colors={[colors.primary, colors.secondary]} cardColor={colors.cardAlt}>
              <Pressable
                onPressIn={() => uploadScale.value = withSpring(1.02)}
                onPressOut={() => uploadScale.value = withSpring(1)}
                onPress={() => router.push('/upload')}
              >
                <Animated.View style={[styles.uploadInner, uploadAnimatedStyle]}>
                  <View style={styles.uploadIllustration}>
                    <ConcentricRings color={colors.primary} />
                    <Ionicons name="document-text" size={48} color={colors.primary} />
                  </View>
                  <Text style={[styles.uploadTitle, { color: colors.text }]}>Tap or drag file to analyze</Text>
                  <Text style={[styles.uploadSubtitle, { color: colors.textSecondary }]}>PDF, DOCX — Max 10MB</Text>
                </Animated.View>
              </Pressable>
            </AnimatedGradientBorder>
          </Animated.View>

          {/* Recent Scans */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 0 }]}>Recent Scans</Text>
            <TouchableOpacity onPress={() => router.push('/(drawer)/history')} style={styles.ghostButton}>
              <Text style={[styles.ghostButtonText, { color: colors.primary }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentScans.length === 0 ? (
             <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular', fontStyle: 'italic', paddingLeft: 8 }}>No recent scans found.</Text>
          ) : (
            recentScans.map((scan, index) => {
              const riskColor = getRiskColor(scan.risk_level);
              return (
                <Animated.View key={scan.id} entering={FadeInUp.delay(400 + (index * 100)).duration(200).springify()}>
                  <TouchableOpacity 
                    style={[styles.recentCard, { backgroundColor: colors.card, shadowColor: isDark ? '#000' : colors.primary }]}
                    onPress={() => router.push({ pathname: '/summary', params: { id: scan.id } })}
                  >
                    <View style={[styles.fileTypePill, { backgroundColor: colors.error + '20' }]}>
                      <Ionicons name="document" size={20} color={colors.error} />
                    </View>
                    
                    <View style={styles.recentInfo}>
                      <Text style={[styles.recentTitle, { color: colors.text }]} numberOfLines={1}>{scan.filename}</Text>
                      <View style={styles.riskBarContainer}>
                        <View style={[styles.riskBar, { backgroundColor: riskColor, width: scan.risk_level === 'High Risk' ? '80%' : scan.risk_level === 'Medium Risk' ? '50%' : '20%' }]} />
                      </View>
                      <Text style={[styles.recentDate, { color: colors.textSecondary }]}>{formatDate(scan.date)}</Text>
                    </View>
                    
                    <View style={[styles.riskBadge, { backgroundColor: riskColor + '15', borderColor: riskColor }]}>
                      <Text style={[styles.riskBadgeText, { color: riskColor }]}>{scan.risk_level}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} style={{ marginLeft: 8 }} />
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 24, paddingTop: Platform.OS === 'ios' ? 10 : 40, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  menuIcon: { padding: 4 },
  avatarRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  mascotImg: { width: 42, height: 42, borderRadius: 21 },
  pulseContainer: { width: 12, height: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  pulseRing: { position: 'absolute', width: 24, height: 24, borderRadius: 12 },
  pulseCore: { width: 8, height: 8, borderRadius: 4 },
  welcomeSection: { marginBottom: 32 },
  welcomeTitle: { fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold' },
  welcomeSubtitle: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  statCard: { flex: 0.48, padding: 20, borderRadius: 16, borderLeftWidth: 4, overflow: 'hidden', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  statWatermark: { position: 'absolute', right: -10, bottom: -10 },
  statValue: { fontSize: 32, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { fontSize: 14, fontFamily: 'SpaceGrotesk_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16, marginTop: 8 },
  uploadInner: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  uploadIllustration: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  uploadTitle: { fontSize: 18, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 8 },
  uploadSubtitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  ghostButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(0, 229, 255, 0.1)' },
  ghostButtonText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  recentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  fileTypePill: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  recentInfo: { flex: 1, marginRight: 8 },
  recentTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  riskBarContainer: { height: 4, backgroundColor: 'rgba(139, 146, 184, 0.2)', borderRadius: 2, width: '100%', marginBottom: 6 },
  riskBar: { height: '100%', borderRadius: 2 },
  recentDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  riskBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  riskBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase' },
});