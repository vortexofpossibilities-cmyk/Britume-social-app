
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/lib/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.bg,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '900',
        },
        tabBarStyle: {
          backgroundColor: theme.bg,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: '#168BFF',
        tabBarInactiveTintColor: '#8A9BB0',
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarLabel: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="search-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="add-circle-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="offline"
        options={{
          title: 'Offline',
          tabBarLabel: 'Offline',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="download-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
