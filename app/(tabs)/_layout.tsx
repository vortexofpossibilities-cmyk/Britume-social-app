import React from 'react';
import { Tabs } from 'expo-router';
import { theme } from '../../src/lib/theme';

export default function TabLayout() {
  return <Tabs screenOptions={{
    headerStyle: { backgroundColor: theme.bg },
    headerTintColor: theme.text,
    headerTitleStyle: { fontWeight: '900' },
    tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.border },
    tabBarActiveTintColor: theme.cyan,
    tabBarInactiveTintColor: theme.muted,
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
    <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarLabel: 'Discover' }} />
    <Tabs.Screen name="create" options={{ title: 'Create', tabBarLabel: 'Create', tabBarIcon: ({ color }) => <TextIcon color={color} /> }} />
    <Tabs.Screen name="offline" options={{ title: 'Offline', tabBarLabel: 'Offline' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
  </Tabs>;
}
function TextIcon({ color }: { color: string }) {
  return <React.Fragment><></></React.Fragment>;
}
