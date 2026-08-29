import { BusinessAuthProvider } from '@workspace/auth/client';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. See .env.example.');
}
if (!convexUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_URL. See .env.example.');
}

export default function RootLayout() {
  return (
    <BusinessAuthProvider publishableKey={publishableKey} convexUrl={convexUrl}>
      <StatusBar style="light" />
      <Slot />
    </BusinessAuthProvider>
  );
}
