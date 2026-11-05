import React, { useMemo } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAppTheme } from '../../src/contexts/ThemeContext';

type Game = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  status: 'available' | 'coming';
  color: string;
};

const games: Game[] = [
  {
    id: 'spin',
    title: 'Spin Wheel',
    description: 'Spin for a chance to win BRITUME points.',
    icon: 'sync-circle-outline',
    status: 'available',
    color: '#E5A52E',
  },
  {
    id: 'mystery',
    title: 'Mystery Boxes',
    description: 'Open mysterious boxes and discover rewards.',
    icon: 'gift-outline',
    status: 'available',
    color: '#A77AF5',
  },
  {
    id: 'daily',
    title: 'Daily Rewards',
    description: 'Come back daily and collect rewards.',
    icon: 'calendar-outline',
    status: 'coming',
    color: '#36B9A0',
  },
  {
    id: 'challenges',
    title: 'Challenges',
    description: 'Complete challenges and earn points.',
    icon: 'trophy-outline',
    status: 'coming',
    color: '#E47B63',
  },
  {
    id: 'more',
    title: 'More Games',
    description: 'New games and experiences are coming.',
    icon: 'game-controller-outline',
    status: 'coming',
    color: '#4D9DE0',
  },
];

export default function RewardsScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const openGame = (game: Game) => {
    if (game.status === 'coming') {
      Alert.alert(
        'Coming soon',
        `${game.title} will be added to BRITUME Rewards Hub.`,
      );
      return;
    }

    if (game.id === 'spin') {
      router.push('/rewards/spin' as never);
      return;
    }

    if (game.id === 'mystery') {
      router.push('/rewards/mystery-box' as never);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>BRITUME</Text>
          <Text style={styles.heading}>Rewards Hub</Text>
          <Text style={styles.subtitle}>
            Play games. Complete challenges. Earn rewards.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="gift" size={27} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text style={styles.heroEyebrow}>WELCOME TO THE HUB</Text>
          <Text style={styles.heroTitle}>
            Your next reward could be one game away!
          </Text>
          <Text style={styles.heroDescription}>
            Explore games and activities in one place.
            More experiences will be added over time.
          </Text>
        </View>

        <View style={styles.heroIcon}>
          <Ionicons name="game-controller" size={55} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Explore games</Text>
          <Text style={styles.sectionSubtitle}>
            Choose an experience to get started.
          </Text>
        </View>
        <Ionicons name="sparkles" size={23} color={theme.cyan} />
      </View>

      <View style={styles.gamesGrid}>
        {games.map(game => (
          <Pressable
            key={game.id}
            onPress={() => openGame(game)}
            style={({ pressed }) => [
              styles.gameCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.gameIcon,
                { backgroundColor: game.color },
              ]}
            >
              <Ionicons
                name={game.icon}
                size={29}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.gameText}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDescription}>
                {game.description}
              </Text>
            </View>

            <View
              style={[
                styles.status,
                game.status === 'available'
                  ? styles.availableStatus
                  : styles.comingStatus,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  game.status === 'available'
                    ? styles.availableText
                    : styles.comingText,
                ]}
              >
                {game.status === 'available'
                  ? 'PLAY'
                  : 'COMING SOON'}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={theme.muted}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.notice}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={theme.cyan}
        />
        <Text style={styles.noticeText}>
          Game rewards, costs and winning chances will be
          displayed before you play. Rewards are subject
          to BRITUME game rules.
        </Text>
      </View>

      <Text style={styles.footer}>
        MORE GAMES. MORE EXPERIENCES. BRITUME.
      </Text>
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      padding: 15,
      paddingBottom: 45,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    brand: {
      color: theme.cyan,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 2,
    },
    heading: {
      color: theme.text,
      fontSize: 27,
      fontWeight: '900',
      marginTop: 3,
    },
    subtitle: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 5,
    },
    headerIcon: {
      width: 53,
      height: 53,
      borderRadius: 18,
      backgroundColor: theme.cyan,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hero: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 23,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 17,
      marginBottom: 27,
      overflow: 'hidden',
    },
    heroText: {
      flex: 1,
    },
    heroEyebrow: {
      color: theme.cyan,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    heroTitle: {
      color: theme.text,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '900',
    },
    heroDescription: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 8,
    },
    heroIcon: {
      width: 67,
      height: 67,
      borderRadius: 23,
      backgroundColor: theme.cyan,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 13,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '900',
    },
    sectionSubtitle: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 4,
    },
    gamesGrid: {
      gap: 11,
    },
    gameCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 19,
      padding: 12,
      minHeight: 91,
      gap: 11,
    },
    pressed: {
      opacity: 0.75,
      transform: [{ scale: 0.99 }],
    },
    gameIcon: {
      width: 49,
      height: 49,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gameText: {
      flex: 1,
    },
    gameTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '900',
    },
    gameDescription: {
      color: theme.muted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
    },
    status: {
      borderRadius: 9,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    availableStatus: {
      backgroundColor: '#DDF5E9',
    },
    comingStatus: {
      backgroundColor: theme.panel2,
    },
    statusText: {
      fontSize: 9,
      fontWeight: '900',
    },
    availableText: {
      color: '#167A4B',
    },
    comingText: {
      color: theme.muted,
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 13,
      marginTop: 22,
    },
    noticeText: {
      flex: 1,
      color: theme.muted,
      fontSize: 11,
      lineHeight: 17,
    },
    footer: {
      color: theme.muted,
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1.2,
      textAlign: 'center',
      marginTop: 25,
    },
  });
                }
