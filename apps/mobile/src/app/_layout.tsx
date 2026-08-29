import { BusinessAuthProvider } from '@workspace/auth/client';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Cementerio as C } from '@/constants/cementerio';

SplashScreen.preventAutoHideAsync();

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

const publishableKey = requireEnv(
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
const convexUrl = requireEnv('EXPO_PUBLIC_CONVEX_URL', process.env.EXPO_PUBLIC_CONVEX_URL);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <BusinessAuthProvider publishableKey={publishableKey} convexUrl={convexUrl}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: C.bg },
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="admin" />
          </Stack>
        </ThemeProvider>
      </GestureHandlerRootView>
    </BusinessAuthProvider>
  );
}
