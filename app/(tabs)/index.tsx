import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth/AuthProvider';
import { theme } from '../src/lib/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" backgroundColor={theme.bg} />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.bg,
          },
          headerTintColor: theme.text,
          headerTitleStyle: {
            fontWeight: '800',
          },
          contentStyle: {
            backgroundColor: theme.bg,
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="profile-edit" options={{ title: 'Edit profile', presentation: 'card' }} />
        <Stack.Screen name="profile/[username]" options={{ title: 'Profile', presentation: 'card' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'card' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="stories" options={{ title: 'Stories' }} />
      </Stack>
    </AuthProvider>
  );
}

