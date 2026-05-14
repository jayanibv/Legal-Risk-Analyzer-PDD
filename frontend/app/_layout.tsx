import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="upload" options={{ presentation: 'modal' }} />
      <Stack.Screen name="scanning" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="summary" />
      <Stack.Screen name="details" />
      <Stack.Screen name="export" options={{ presentation: 'modal' }} />
    </Stack>
    </ThemeProvider>
  );
}
