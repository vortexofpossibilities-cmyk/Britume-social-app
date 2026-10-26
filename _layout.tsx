import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth/AuthProvider';
import { theme } from '../src/lib/theme';

export default function RootLayout() {
  return <AuthProvider>
    <StatusBar style="light" backgroundColor={theme.bg} />
    <Stack screenOptions={{
      headerStyle: { backgroundColor: theme.bg },
      headerTintColor: theme.text,
      headerTitleStyle: { fontWeight: '800' },
      contentStyle: { backgroundColor: theme.bg },
    }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'card' }} />
      <Stack.Screen name="features" options={{ title: 'BRITUME Features', presentation: 'card' }} />
      <Stack.Screen name="stories" options={{ title: 'Stories', presentation: 'card' }} />
      <Stack.Screen name="communities" options={{ title: 'Communities', presentation: 'card' }} />
      <Stack.Screen name="messages" options={{ title: 'Messages', presentation: 'card' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', presentation: 'card' }} />
      <Stack.Screen name="ai" options={{ title: 'BRITUME AI', presentation: 'card' }} />
      <Stack.Screen name="studio" options={{ title: 'BRITUME Studio', presentation: 'card' }} />
      <Stack.Screen name="games" options={{ title: 'BRITUME Games', presentation: 'card' }} />
      <Stack.Screen name="competitions" options={{ title: 'Competitions', presentation: 'card' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard', presentation: 'card' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy & Safety', presentation: 'card' }} />
      <Stack.Screen name="features" options={{ title: 'BRITUME Features', presentation: 'card' }} />
      <Stack.Screen name="stories" options={{ title: 'Stories', presentation: 'card' }} />
      <Stack.Screen name="communities" options={{ title: 'Communities', presentation: 'card' }} />
      <Stack.Screen name="messages" options={{ title: 'Messages', presentation: 'card' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications', presentation: 'card' }} />
      <Stack.Screen name="ai" options={{ title: 'BRITUME AI', presentation: 'card' }} />
      <Stack.Screen name="studio" options={{ title: 'BRITUME Studio', presentation: 'card' }} />
      <Stack.Screen name="games" options={{ title: 'BRITUME Games', presentation: 'card' }} />
      <Stack.Screen name="competitions" options={{ title: 'Competitions', presentation: 'card' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard', presentation: 'card' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy & Safety', presentation: 'card' }} />
    </Stack>
  </AuthProvider>;
}
