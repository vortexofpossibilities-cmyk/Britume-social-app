
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

import { withThemeBackground } from '../../src/components/ThemeScreen';

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
  'number-guess': 'number-guess',
  'math-duel': 'math-duel',
  trivia: 'trivia',
  'memory-match': 'memory-match',
  'obstacle-dash': 'obstacle-dash',
  'ice-bridge': 'ice-bridge',
  'business-tycoon': 'business-tycoon',
  'word-scramble': 'word-scramble',
  'race-rush': 'race-rush',
  'arena-tactics': 'arena-tactics',
  'city-builder': 'city-builder',
  'science-battle': 'science-battle',
  'geography-quiz': 'geography-quiz',
  'greedy-split': 'greedy-split',
};

function GamesScreen() {
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
        backgroundColor="#07152D"
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

        <View style={styles.quickLinks}>
          <Pressable style={styles.quickLink} onPress={() => router.push('/games/rooms' as any)}>
            <Ionicons name="people-outline" size={19} color="#F4C76B" />
            <Text style={styles.quickLinkText}>Match Types</Text>
            <Ionicons name="chevron-forward" size={15} color="#B8C6D9" />
          </Pressable>
          <Pressable style={styles.quickLink} onPress={() => router.push('/games/competitions' as any)}>
            <Ionicons name="trophy-outline" size={19} color="#F4C76B" />
            <Text style={styles.quickLinkText}>Competitions</Text>
            <Ionicons name="chevron-forward" size={15} color="#B8C6D9" />
          </Pressable>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeTop}>
            <View style={styles.modeIcon}>
              <Ionicons
                name="game-controller-outline"
                size={22}
                color="#F4C76B"
              />
            </View>

            <View style={styles.modeTextContainer}>
              <Text style={styles.modeTitle}>
                Games Arena · Free Play
              </Text>

              <Text style={styles.modeSubtitle}>
                Play skill, memory, racing, business and educational challenges.
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
              color="#F7D98F"
            />

            <Text style={styles.modeNote}>
              Free demo play only. Scores have no cash value.
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
                    color="#A9B9CD"
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
                      color={ready ? '#07152D' : '#B7C7DA'}
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
            color="#F4C76B"
          />

          <Text style={styles.footerText}>
            Playable practice games are available now. Online multiplayer,
            scheduled tournaments and live leaderboards still need
            secure server integration. Demo scores are not money.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07152D',
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
    color: '#F4C76B',
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
    color: '#B8C6D9',
    fontSize: 13,
    marginTop: 5,
  },

  headerIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    backgroundColor: '#17365C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickLinks: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickLink: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 11,
    backgroundColor: '#102747',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#315078',
  },
  quickLinkText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    flex: 1,
  },

  modeCard: {
    backgroundColor: '#102747',
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: '#315078',
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
    backgroundColor: '#1B3B62',
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
    color: '#C0CDDF',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },

  freeBadge: {
    backgroundColor: '#17365C',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  freeBadgeText: {
    color: '#F7D98F',
    fontSize: 10,
    fontWeight: '900',
  },

  modeDivider: {
    height: 1,
    backgroundColor: '#315078',
    marginVertical: 13,
  },

  modeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  modeNote: {
    color: '#F7D98F',
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
    color: '#B8C6D9',
    fontSize: 12,
    marginTop: 4,
  },

  gameCount: {
    color: '#F4C76B',
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
    backgroundColor: '#102747',
    borderWidth: 1,
    borderColor: '#315078',
  },

  filterButtonActive: {
    backgroundColor: '#F4C76B',
    borderColor: '#F4C76B',
  },

  filterText: {
    color: '#B7C7DA',
    fontSize: 12,
    fontWeight: '700',
  },

  filterTextActive: {
    color: '#07152D',
  },

  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },

  gameCard: {
    width: '48%',
    backgroundColor: '#102747',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#315078',
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
    color: '#F4C76B',
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
    backgroundColor: '#F4C76B',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  playButtonText: {
    color: '#07152D',
    fontSize: 9,
    fontWeight: '900',
  },

  comingButton: {
    backgroundColor: '#25473C',
  },

  comingButtonText: {
    color: '#B7C7DA',
  },

  footer: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: '#102747',
    borderRadius: 13,
    padding: 13,
    marginTop: 22,
  },

  footerText: {
    flex: 1,
    color: '#B7C7DA',
    fontSize: 11,
    lineHeight: 17,
  },
});

export default withThemeBackground(GamesScreen);
