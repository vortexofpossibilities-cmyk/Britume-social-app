
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  BRITUME_GAMES,
  type GameDefinition,
  type GameCategory,
} from '../../src/games';

const CATEGORY_FILTERS: {
  label: string;
  value: 'all' | GameCategory;
}[] = [
  { label: 'All', value: 'all' },
  { label: 'Skill', value: 'skill' },
  { label: 'Strategy', value: 'strategy' },
  { label: 'Social', value: 'social' },
  { label: 'Practice', value: 'practice' },
];

const CATEGORY_LABELS: Record<GameCategory, string> = {
  skill: 'SKILL',
  strategy: 'STRATEGY',
  social: 'SOCIAL',
  practice: 'PRACTICE',
};

const GAME_ROUTES: Record<string, string> = {
  'pooled-spin': 'pooled-spin',
  trivia: 'trivia',
  'last-standing': 'last-one-standing',
  'daily-challenge': 'daily-challenge',
  'prediction-pot': 'prediction-pot',
  'greedy-split': 'greedy-split',
  'lowest-bid': 'lowest-unique-bid',
  'number-guess': 'number-guess',
  rocket: 'crash-rocket',
  minefield: 'minefield',
  'mystery-box': 'mystery-box',
};

export default function GamesScreen() {
  const [activeFilter, setActiveFilter] = useState<
    'all' | GameCategory
  >('all');

  const filteredGames = useMemo(() => {
    if (activeFilter === 'all') {
      return BRITUME_GAMES;
    }

    return BRITUME_GAMES.filter(
      (game) => game.category === activeFilter
    );
  }, [activeFilter]);

  const openGame = (game: GameDefinition) => {
    if (game.status !== 'ready') return;

    const route = GAME_ROUTES[game.id];

    if (!route) return;

    router.push(`/games/${route}` as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#071B17"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BRITUME</Text>

            <Text style={styles.heading}>
              Games Arena
            </Text>

            <Text style={styles.subtitle}>
              Play, compete and challenge yourself.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="game-controller"
              size={27}
              color="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeTop}>
            <View style={styles.modeIcon}>
              <Ionicons
                name="game-controller-outline"
                size={22}
                color="#34D399"
              />
            </View>

            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>
                Free Play Preview
              </Text>

              <Text style={styles.modeSubtitle}>
                Explore the games while we prepare the gaming backend.
              </Text>
            </View>

            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>
                FREE
              </Text>
            </View>
          </View>

          <View style={styles.modeDivider} />

          <View style={styles.modeBottom}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color="#A7F3D0"
            />

            <Text style={styles.modeNote}>
              Practice only. Paid entries and cash prizes are not enabled.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Choose your game
            </Text>

            <Text style={styles.sectionSubtitle}>
              {filteredGames.length} games to explore
            </Text>
          </View>

          <Text style={styles.gameCount}>
            {BRITUME_GAMES.length} GAMES
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {CATEGORY_FILTERS.map((filter) => {
            const selected =
              activeFilter === filter.value;

            return (
              <Pressable
                key={filter.value}
                onPress={() => setActiveFilter(filter.value)}
                style={[
                  styles.filterButton,
                  selected && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.gameGrid}>
          {filteredGames.map((game) => {
            const ready = game.status === 'ready';

            return (
              <Pressable
                key={game.id}
                disabled={!ready}
                onPress={() => openGame(game)}
                style={({ pressed }) => [
                  styles.gameCard,
                  pressed && styles.cardPressed,
                  !ready && styles.cardUnavailable,
                ]}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.gameIcon,
                      {
                        backgroundColor: `${game.accent}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={game.icon as keyof typeof Ionicons.glyphMap}
                      size={27}
                      color={game.accent}
                    />
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color="#78918A"
                  />
                </View>

                <Text style={styles.category}>
                  {CATEGORY_LABELS[game.category]}
                </Text>

                <Text style={styles.gameName}>
                  {game.name}
                </Text>

                <Text
                  style={styles.gameDescription}
                  numberOfLines={2}
                >
                  {game.description}
                </Text>

                <View style={styles.cardDivider} />

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.smallLabel}>
                      PLAYERS
                    </Text>

                    <Text style={styles.entryValue}>
                      {game.players}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.playButton,
                      !ready && styles.comingButton,
                    ]}
                  >
                    <Text
                      style={[
                        styles.playButtonText,
                        !ready && styles.comingButtonText,
                      ]}
                    >
                      {ready ? 'PLAY' : 'SOON'}
                    </Text>

                    <Ionicons
                      name={
                        ready
                          ? 'arrow-forward'
                          : 'time-outline'
                      }
                      size={14}
                      color={ready ? '#071B17' : '#A7C0B6'}
                    />
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color="#34D399"
          />

          <Text style={styles.footerText}>
            BRITUME gaming features are being prepared.
            Practice mode is free. Any future competition
            features will require appropriate backend,
            security and legal checks.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071B17',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 22,
  },

  brand: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
  },

  heading: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 5,
  },

  subtitle: {
    color: '#A3B8B0',
    fontSize: 13,
    marginTop: 5,
  },

  headerIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: '#123D32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeCard: {
    backgroundColor: '#10352B',
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1D5946',
    marginBottom: 27,
  },

  modeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#164C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modeTextContainer: {
    flex: 1,
  },

  modeTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  modeSubtitle: {
    color: '#B5D4C8',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },

  freeBadge: {
    backgroundColor: '#065F46',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  freeBadgeText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '900',
  },

  modeDivider: {
    height: 1,
    backgroundColor: '#28614F',
    marginVertical: 13,
  },

  modeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  modeNote: {
    color: '#A7F3D0',
    fontSize: 11,
    flex: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#91AAA1',
    fontSize: 12,
    marginTop: 4,
  },

  gameCount: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  filterContainer: {
    gap: 9,
    paddingBottom: 15,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#102B24',
    borderWidth: 1,
    borderColor: '#204438',
  },

  filterButtonActive: {
    backgroundColor: '#34D399',
    borderColor: '#34D399',
  },

  filterText: {
    color: '#A7C0B6',
    fontSize: 12,
    fontWeight: '700',
  },

  filterTextActive: {
    color: '#071B17',
  },

  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  gameCard: {
    width: '48%',
    backgroundColor: '#102B24',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#204438',
    minHeight: 207,
  },

  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  cardUnavailable: {
    opacity: 0.65,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  gameIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  category: {
    color: '#34D399',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6,
  },

  gameName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    minHeight: 35,
  },

  gameDescription: {
    color: '#9DB3AA',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
    minHeight: 30,
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#25473C',
    marginVertical: 11,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  smallLabel: {
    color: '#78958A',
    fontSize: 8,
    fontWeight: '800',
  },

  entryValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },

  playButton: {
    backgroundColor: '#34D399',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  playButtonText: {
    color: '#071B17',
    fontSize: 9,
    fontWeight: '900',
  },

  comingButton: {
    backgroundColor: '#25473C',
  },

  comingButtonText: {
    color: '#A7C0B6',
  },

  footer: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: '#102B24',
    borderRadius: 13,
    padding: 13,
    marginTop: 22,
  },

  footerText: {
    flex: 1,
    color: '#A7C0B6',
    fontSize: 11,
    lineHeight: 17,
  },
});
