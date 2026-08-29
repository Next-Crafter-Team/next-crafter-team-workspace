import { Stack } from 'expo-router';

import { Cementerio as C } from '@/constants/cementerio';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: C.bg },
      }}
    />
  );
}
