
import React, { useMemo } from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';

import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

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
    icon: 'gift-outline',
    route: '/(tabs)/rewards',
    activePath: '/rewards',
    key: 'rewards',
  },
  {
    icon: 'game-controller-outline',
    route: '/(tabs)/games',
    activePath: '/games',
    key: 'games',
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
              : item.key === 'rewards'
                ? 'Rewards'
                : item.key === 'games'
                  ? 'Games'
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
                  size={34}
                  color="#FFFFFF"
                />
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
                name={item.icon}
                size={23}
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
  const { theme } = useAppTheme();

  return (
    <Tabs
      tabBar={() => <IconBar />}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.bg,
        },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="create" />

      <Tabs.Screen name="games" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="rewards" options={{ href: null }} />
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen name="offline" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}

function createStyles(
  theme: ReturnType<typeof useAppTheme>['theme'],
) {
  return StyleSheet.create({
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
      paddingHorizontal: 5,
      paddingTop: 7,
      paddingBottom: 7,
      gap: 2,
    },

    iconButton: {
      flex: 1,
      minWidth: 0,
      height: 46,
      borderRadius: 14,
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
      width: 43,
      height: 53,
      borderRadius: 17,
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
}
