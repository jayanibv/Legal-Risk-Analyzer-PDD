import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '../services/auth';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function Index() {
    const [status, setStatus] = useState<'loading' | 'onboarding' | 'dashboard'>('loading');

    useEffect(() => {
        const check = async () => {
            const authed = await isAuthenticated();
            
            // Check if it's the very first time
            const hasSeenOnboarding = Platform.OS === 'web' 
                ? localStorage.getItem('has_seen_onboarding')
                : null; // Use SecureStore if needed

            if (!hasSeenOnboarding) {
                setStatus('onboarding');
            } else if (authed) {
                setStatus('dashboard');
            } else {
                setStatus('onboarding');
            }
        };
        check();
    }, []);

    if (status === 'loading') {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                <ActivityIndicator size="large" color="#1A365D" />
            </View>
        );
    }

    if (status === 'dashboard') {
        return <Redirect href="/(tabs)" />;
    } else {
        return <Redirect href="/onboarding" />;
    }
}
