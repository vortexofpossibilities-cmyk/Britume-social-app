
import React, { useMemo } from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  Text,
} from 'react-native';

import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { ThemeBackground } from '../../src/components/ThemeUI';

type TabItem = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  activePath: string;
  key: string;
};

const items: TabItem[] = [
  {
    icon: 'people-outline',
    route: '/(tabs)/discover',
    activePath: '/discover',
    key: 'friends',
  },
  {
    icon: 'people-circle-outline',
    route: '/communities',
    activePath: '/communities',
    key: 'communities',
  },
  {
    icon: 'add',
    route: '/(tabs)/create',
    activePath: '/create',
    key: 'create',
  },
  {
    icon: 'home-outline',
    route: '/(tabs)',
    activePath: '/',
    key: 'home',
  },
  {
    icon: 'wallet-outline',
    route: '/(tabs)/wallet',
    activePath: '/wallet',
    key: 'wallet',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    route: '/messages',
    activePath: '/messages',
    key: 'messages',
  },
  {
    icon: 'videocam-outline',
    route: '/reels',
activePath: '/reels',
key: 'videos',
  },
];

function IconBar() {
  const pathname = usePathname();
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  return (
    <View style={styles.barContainer}>
      <View style={styles.bar}>
        {items.map(item => {
          const label =
            item.key === 'wallet'
              ? 'Wallet'
              : t(item.key);

          const active =
            item.key === 'home'
              ? pathname === '/' || pathname === '/index'
              : pathname === item.activePath ||
                pathname.startsWith(item.activePath + '/');

          if (item.key === 'create') {
            return (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={t('createPostAccessibility')}
                onPress={() => router.push(item.route as never)}
                style={({ pressed }) => [
                  styles.createButton,
                  pressed && styles.pressedCreate,
                ]}
              >
                <Ionicons
                  name="add"
                  size={27}
                  color="#FFFFFF"
                />
                <Text style={styles.createLabel}>Create</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => router.push(item.route as never)}
              style={({ pressed }) => [
                styles.iconButton,
                active && styles.activeIconButton,
                pressed && styles.pressedIcon,
              ]}
              hitSlop={5}
            >
              <Ionicons
                name={active ? item.icon.replace('-outline', '') as React.ComponentProps<typeof Ionicons>['name'] : item.icon}
                size={21}
                color={active ? theme.blueLight : theme.muted}
              />
              <Text numberOfLines={1} style={[styles.iconLabel, active && styles.activeIconLabel]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useAppTheme();

  return (
    <ThemeBackground>
      <Tabs
      tabBar={() => <IconBar />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="create" />

      <Tabs.Screen name="games" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="offline" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
      </Tabs>
    </ThemeBackground>
  );
}

function createStyles(
  theme: ReturnType<typeof useAppTheme>['theme'],
) {
  return StyleSheet.create({
    barContainer: {
      backgroundColor: 'transparent',
      paddingHorizontal: 10,
      paddingTop: 5,
      paddingBottom: Platform.OS === 'ios' ? 18 : 8,
    },

    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.glass,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      borderRadius: 24,
      paddingHorizontal: 3,
      paddingTop: 6,
      paddingBottom: 6,
      gap: 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 8,
    },

    iconButton: {
      flex: 1,
      minWidth: 0,
      height: 51,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },

    activeIconButton: {
      backgroundColor: theme.panel2,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      shadowColor: '#02050B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.14,
      shadowRadius: 2,
      elevation: 0,
    },

    pressedIcon: {
      transform: [{ scale: 0.91 }],
    },

    createButton: {
      width: 49,
      height: 56,
      borderRadius: 18,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -11,
      borderWidth: 1,
      borderColor: theme.blueLight,
      shadowColor: theme.accent,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.32,
      shadowRadius: 12,
      elevation: 7,
      gap: 0,
    },

    pressedCreate: {
      transform: [{ scale: 0.94 }],
      elevation: 3,
    },

    iconLabel: {
      color: theme.muted,
      fontSize: 8,
      fontWeight: '600',
      letterSpacing: 0.1,
      maxWidth: '100%',
    },

    activeIconLabel: {
      color: theme.blueLight,
      fontWeight: '800',
    },

    createLabel: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '800',
      marginTop: -3,
    },
  });
}
