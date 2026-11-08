import React from 'react';
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

type Game = {
  slug: string;
  name: string;
  description: string;
  entry: string;
  rake: string;
  icon: keyof typeof Ionicons.glyphMap;
  category: string;
  color: string;
};

const games: Game[] = [
  {
    slug: 'spin-wheel',
    name: 'Spin Wheel',
    description: 'Spin the wheel and discover your outcome.',
    entry: '20 Pts',
    rake: '12%',
    icon: 'disc-outline',
    category: 'INSTANT LUCK',
    color: '#8B5CF6',
  },
  {
    slug: 'crash-rocket',
    name: 'Crash / Rocket',
    description: 'Watch the multiplier and decide when to cash out.',
    entry: '5 Pts',
    rake: '10%',
    icon: 'rocket-outline',
    category: 'TIMING',
    color: '#F97316',
  },
  {
    slug: 'prediction-pot',
    name: 'Prediction Pot',
    description: 'Make predictions and compete with other players.',
    entry: '20 Pts',
    rake: '15%',
    icon: 'trophy-outline',
    category: 'PREDICTION',
    color: '#EAB308',
  },
  {
    slug: 'trivia',
    name: 'Trivia Tournament',
    description: 'Answer questions and climb the leaderboard.',
    entry: '10 Pts',
    rake: '15%',
    icon: 'help-circle-outline',
    category: 'KNOWLEDGE',
    color: '#0EA5E9',
  },
  {
    slug: 'daily-challenge',
    name: 'Daily Challenge',
    description: 'Complete a new challenge every day.',
    entry: '10 Pts',
    rake: '15%',
    icon: 'calendar-outline',
    category: 'DAILY GAME',
    color: '#10B981',
  },
  {
    slug: 'mystery-box',
    name: 'Mystery Box',
    description: 'Open a mystery box to reveal what is inside.',
    entry: '15 Pts',
    rake: '15%',
    icon: 'gift-outline',
    category: 'SURPRISE',
    color: '#EC4899',
  },
  {
    slug: 'greedy-split',
    name: 'The Greedy Split',
    description: 'Choose whether to split or steal in a duel.',
    entry: '20 Pts',
    rake: '20%',
    icon: 'people-outline',
    category: 'STRATEGY',
    color: '#6366F1',
  },
  {
    slug: 'last-one-standing',
    name: 'Last One Standing',
    description: 'Survive the elimination rounds.',
    entry: '10 Pts',
    rake: '20%',
    icon: 'shield-outline',
    category: 'ELIMINATION',
    color: '#EF4444',
  },
  {
    slug: 'lowest-unique-bid',
    name: 'Lowest Unique Bid',
    description: 'Choose a number nobody else chooses.',
    entry: '5 Pts',
    rake: '20%',
    icon: 'calculator-outline',
    category: 'STRATEGY',
    color: '#14B8A6',
  },
  {
    slug: 'minefield',
    name: 'Minefield Battle',
    description: 'Find gems and avoid hidden bombs.',
    entry: '10 Pts',
    rake: '20%',
    icon: 'grid-outline',
    category: 'RISK & SKILL',
    color: '#F43F5E',
  },
  {
    slug: 'number-guess',
    name: 'Number Guess',
    description: 'Guess the secret number between 1 and 100.',
    entry: '5 Pts',
    rake: '20%',
    icon: 'dice-outline',
    category: 'QUICK GAME',
    color: '#A855F7',
  },
];

export default function GamesScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B17" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BRITUME</Text>
            <Text style={styles.heading}>Games Arena</Text>
            <Text style={styles.subtitle}>
              Play, compete and challenge yourself.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="game-controller" size={27} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeTop}>
            <View style={styles.modeIcon}>
              <Ionicons name="game-controller-outline" size={22} color="#34D399" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modeTitle}>Free Play Preview</Text>
              <Text style={styles.modeSubtitle}>
                Explore the games while we prepare the gaming backend.
              </Text>
            </View>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>FREE</Text>
            </View>
          </View>

          <View style={styles.modeDivider} />

          <View style={styles.modeBottom}>
            <Ionicons name="information-circle-outline" size={17} color="#A7F3D0" />
            <Text style={styles.modeNote}>
              Paid entries and cash prizes are not enabled yet.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Choose your game</Text>
            <Text style={styles.sectionSubtitle}>
              11 games available to explore
            </Text>
          </View>
          <Text style={styles.gameCount}>11 GAMES</Text>
        </View>

        <View style={styles.gameGrid}>
          {games.map((game) => (
            <Pressable
              key={game.slug}
              onPress={() =>
                router.push(`/games/${game.slug}` as any)
              }
              style={({ pressed }) => [
                styles.gameCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.gameIcon,
                    { backgroundColor: `${game.color}20` },
                  ]}
                >
                  <Ionicons
                    name={game.icon}
                    size={27}
                    color={game.color}
                  />
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#78918A"
                />
              </View>

              <Text style={styles.category}>{game.category}</Text>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameDescription} numberOfLines={2}>
                {game.description}
              </Text>

              <View style={styles.cardDivider} />

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.smallLabel}>ENTRY</Text>
                  <Text style={styles.entryValue}>{game.entry}</Text>
                </View>

                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>VIEW</Text>
                  <Ionicons name="arrow-forward" size={14} color="#071B17" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#34D399" />
          <Text style={styles.footerText}>
            BRITUME gaming features are being prepared. Game entry and
            prize payments will be enabled after backend verification.
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
