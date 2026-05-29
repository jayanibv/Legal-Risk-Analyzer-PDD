import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';
import { useFonts, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
      <Stack.Screen name="upload" options={{ presentation: 'modal' }} />
      <Stack.Screen name="scanning" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="summary" />
      <Stack.Screen name="details" />
      <Stack.Screen name="export" options={{ presentation: 'modal' }} />
    </Stack>
    </ThemeProvider>
  );
}
