
import React from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { theme } from '../../src/lib/theme';

const items = [
  {
    icon: 'people-outline' as const,
    route: '/(tabs)/discover',
    name: 'Friends',
  },
  {
    icon: 'people-circle-outline' as const,
    route: '/communities',
    name: 'Communities',
  },
  {
    icon: 'add' as const,
    route: '/(tabs)/create',
    name: 'Create',
  },
  {
    icon: 'home-outline' as const,
    route: '/(tabs)',
    name: 'Home',
  },
  {
    icon: 'chatbubble-ellipses-outline' as const,
    route: '/messages',
    name: 'Messages',
  },
  {
    icon: 'sparkles-outline' as const,
    route: '/ai',
    name: 'BRITUME AI',
  },
];

function IconBar() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();

  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const active =
          item.name === 'Home'
            ? pathname === '/(tabs)' || pathname === '/'
            : pathname === item.route;

        if (item.name === 'Create') {
          return (
            <Pressable
              key={item.name}
              accessibilityRole="button"
              accessibilityLabel="Create a post, photo, video or Reel"
              onPress={() => router.push(item.route as never)}
              style={styles.createButton}
            >
              <Ionicons name="add" size={32} color="#FFFFFF" />
            </Pressable>
          );
        }

        return (
          <Pressable
            key={item.name}
            accessibilityRole="button"
            accessibilityLabel={item.name}
            onPress={() => router.push(item.route as never)}
            style={[
              styles.iconButton,
              { width: (width - 12) / items.length },
            ]}
            hitSlop={5}
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={active ? theme.cyan : theme.muted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <IconBar />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="create" />

      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="offline" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.panel,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingHorizontal: 6,
    paddingTop: 9,
    paddingBottom: 10,
    minHeight: 66,
  },

  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },

  createButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    borderColor: theme.panel,
    elevation: 7,
    shadowColor: theme.cyan,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 7,
  },
});
