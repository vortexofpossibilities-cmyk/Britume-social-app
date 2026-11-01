
import React from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
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
    <View style={styles.barContainer}>
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
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.pressedCreate,
                ]}
              >
                <Ionicons name="add" size={34} color="#FFFFFF" />
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.name}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              accessibilityState={{ selected: active }}
              onPress={() => router.push(item.route as never)}
              style={({ pressed }) => [
                styles.iconButton,
                { width: (width - 24) / items.length },
                active && styles.activeIconButton,
                pressed && styles.pressedIcon,
              ]}
              hitSlop={5}
            >
              <Ionicons
                name={item.icon}
                size={25}
                color={active ? theme.cyan : theme.muted}
              />
            </Pressable>
          );
        })}
      </View>
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
  barContainer: {
    backgroundColor: theme.bg,
    paddingHorizontal: 9,
    paddingTop: 7,
    paddingBottom: Platform.OS === 'ios' ? 18 : 9,
  },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 25,
    paddingHorizontal: 2,
    paddingTop: 7,
    paddingBottom: 7,

    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 9,
  },

  iconButton: {
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  activeIconButton: {
    backgroundColor: theme.panel2,
    borderWidth: 1,
    borderColor: theme.borderStrong,

    shadowColor: theme.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 3,
  },

  pressedIcon: {
    transform: [{ scale: 0.91 }],
  },

  createButton: {
    width: 53,
    height: 53,
    borderRadius: 19,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -23,
    borderWidth: 4,
    borderColor: theme.panel,

    shadowColor: theme.blueDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },

  pressedCreate: {
    transform: [{ scale: 0.92 }],
    elevation: 3,
  },
});
