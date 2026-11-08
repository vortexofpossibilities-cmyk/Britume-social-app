import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

type GameInfo = {
  name: string;
  category: string;
  entry: string;
  rake: string;
  contribution: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  description: string;
  instructions: string[];
  rules: string;
};

const gameData: Record<string, GameInfo> = {
  'spin-wheel': {
    name: 'Spin Wheel',
    category: 'INSTANT LUCK',
    entry: '20 Points',
    rake: '12%',
    contribution: '17.60 Points',
    icon: 'disc-outline',
    color: '#8B5CF6',
    description: 'Spin the wheel and see which outcome you receive.',
    instructions: [
      'Open the Spin Wheel game.',
      'Review the available wheel outcomes.',
      'Start a spin when the game is enabled.',
      'Your result will be displayed after the spin.',
    ],
    rules: 'The planned wheel has five possible outcomes: Lose, Small, Medium, Big and Jackpot. Final probabilities and payouts will be controlled and verified by the game backend.',
  },

  'crash-rocket': {
    name: 'Crash / Rocket',
    category: 'TIMING GAME',
    entry: '5 Points',
    rake: '10%',
    contribution: '4.50 Points',
    icon: 'rocket-outline',
    color: '#F97316',
    description: 'Watch the rocket multiplier and decide when to cash out.',
    instructions: [
      'Join a rocket round.',
      'Watch the multiplier increase.',
      'Choose when to cash out.',
      'The round ends when the rocket crashes.',
    ],
    rules: 'The final multiplier, crash result and eligible payouts must be calculated by the server. The screen must never decide the outcome locally.',
  },

  'prediction-pot': {
    name: 'Prediction Pot',
    category: 'PREDICTION',
    entry: '20 Points',
    rake: '15%',
    contribution: '17.00 Points',
    icon: 'trophy-outline',
    color: '#EAB308',
    description: 'Make predictions and compete with other players.',
    instructions: [
      'Choose an available prediction event.',
      'Read the event details and closing time.',
      'Submit your prediction before entries close.',
      'Correct predictions share the eligible prize pot.',
    ],
    rules: 'Only verified event results can settle a prediction round. Tied correct predictions share the eligible prize according to the published rules.',
  },

  trivia: {
    name: 'Trivia Tournament',
    category: 'KNOWLEDGE',
    entry: '10 Points',
    rake: '15%',
    contribution: '8.50 Points',
    icon: 'help-circle-outline',
    color: '#0EA5E9',
    description: 'Answer questions and compete on the leaderboard.',
    instructions: [
      'Join an available trivia round.',
      'Read each question carefully.',
      'Select your answer before time runs out.',
      'Your score determines your leaderboard position.',
    ],
    rules: 'The planned prize split is 70% for first place and 30% for second place. Ties, disconnections and incomplete rounds need defined settlement rules.',
  },

  'daily-challenge': {
    name: 'Daily Challenge',
    category: 'DAILY GAME',
    entry: '10 Points',
    rake: '15%',
    contribution: '8.50 Points',
    icon: 'calendar-outline',
    color: '#10B981',
    description: 'Complete a new challenge every day.',
    instructions: [
      'Open the daily challenge.',
      'Read the task instructions.',
      'Complete the challenge before the deadline.',
      'Check the results after the challenge closes.',
    ],
    rules: 'The planned prize pool is shared among eligible finishers. The backend will validate completions and calculate each eligible share.',
  },

  'mystery-box': {
    name: 'Mystery Box',
    category: 'SURPRISE',
    entry: '15 Points',
    rake: '15%',
    contribution: '12.75 Points',
    icon: 'gift-outline',
    color: '#EC4899',
    description: 'Open a mystery box to discover its contents.',
    instructions: [
      'View the available mystery boxes.',
      'Check the possible rewards.',
      'Open a box when the game is enabled.',
      'View your confirmed reward.',
    ],
    rules: 'Physical and airtime rewards can only be offered when actual stock is available. The backend must reserve stock before confirming a physical prize.',
  },

  'greedy-split': {
    name: 'The Greedy Split',
    category: 'STRATEGY',
    entry: '20 Points',
    rake: '20%',
    contribution: '16.00 Points',
    icon: 'people-outline',
    color: '#6366F1',
    description: 'Choose whether to split or steal in a strategy duel.',
    instructions: [
      'Join an available duel.',
      'Wait for your opponent.',
      'Choose Split or Steal privately.',
      'Both choices are revealed when the timer ends.',
    ],
    rules: 'The outcome depends on both players’ choices. The exact split, steal and disconnect rules must be published before competitive rounds begin.',
  },

  'last-one-standing': {
    name: 'Last One Standing',
    category: 'ELIMINATION',
    entry: '10 Points',
    rake: '20%',
    contribution: '8.00 Points',
    icon: 'shield-outline',
    color: '#EF4444',
    description: 'Survive the elimination rounds and remain in the game.',
    instructions: [
      'Join an available room.',
      'Wait for the round to begin.',
      'Complete each elimination challenge.',
      'Try to remain until the final round.',
    ],
    rules: 'The game server controls the round timer, player elimination and final winner. Disconnection and tie rules must be handled by the backend.',
  },

  'lowest-unique-bid': {
    name: 'Lowest Unique Bid',
    category: 'STRATEGY',
    entry: '5 Points',
    rake: '20%',
    contribution: '4.00 Points',
    icon: 'calculator-outline',
    color: '#14B8A6',
    description: 'Choose a number that is the lowest number selected by only one player.',
    instructions: [
      'Join a bidding round.',
      'Choose a secret number from 1 to 50.',
      'Submit before the round closes.',
      'The lowest number chosen by only one player wins.',
    ],
    rules: 'All bids remain secret until the round closes. The server checks duplicate numbers and calculates the lowest unique bid.',
  },

  minefield: {
    name: 'Minefield Battle',
    category: 'RISK & SKILL',
    entry: '10 Points',
    rake: '20%',
    contribution: '8.00 Points',
    icon: 'grid-outline',
    color: '#F43F5E',
    description: 'Search the grid for gems while avoiding hidden bombs.',
    instructions: [
      'Enter the minefield round.',
      'Explore the 5 × 5 grid.',
      'Collect gems and avoid bombs.',
      'The top eligible scores qualify for the planned prize split.',
    ],
    rules: 'The server must generate and validate the grid. The planned grid has 20 gems and 5 bombs, with the top three eligible scores sharing the prize.',
  },

  'number-guess': {
    name: 'Number Guess',
    category: 'QUICK GAME',
    entry: '5 Points',
    rake: '20%',
    contribution: '4.00 Points',
    icon: 'dice-outline',
    color: '#A855F7',
    description: 'Guess the secret number between 1 and 100.',
    instructions: [
      'Join a number-guess round.',
      'Submit a number between 1 and 100.',
      'Wait for the round to close.',
      'The closest eligible guess wins. Ties share the prize.',
    ],
    rules: 'The secret number is generated on the server and remains hidden until the round closes. The server validates guesses and calculates the result.',
  },
};

export default function GameDetailsScreen() {
  const params = useLocalSearchParams<{ game?: string }>();
  const gameSlug = Array.isArray(params.game)
    ? params.game[0]
    : params.game;

  const game = gameSlug ? gameData[gameSlug] : undefined;

  const [showPreview, setShowPreview] = useState(false);

  if (!game) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="game-controller-outline" size={55} color="#34D399" />
        <Text style={styles.notFoundTitle}>Game not found</Text>
        <Text style={styles.notFoundText}>
          This game is not available in the BRITUME Games list.
        </Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B17" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          <Text style={styles.backText}>All Games</Text>
        </Pressable>

        <View style={styles.hero}>
          <View
            style={[
              styles.heroIcon,
              { backgroundColor: `${game.color}22` },
            ]}
          >
            <Ionicons name={game.icon} size={52} color={game.color} />
          </View>

          <Text style={styles.category}>{game.category}</Text>
          <Text style={styles.title}>{game.name}</Text>
          <Text style={styles.description}>{game.description}</Text>

          <View style={styles.previewBadge}>
            <Ionicons name="eye-outline" size={15} color="#A7F3D0" />
            <Text style={styles.previewBadgeText}>FREE PLAY PREVIEW</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Game information</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>PLANNED ENTRY</Text>
            <Text style={styles.infoValue}>{game.entry}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>HOUSE RAKE</Text>
            <Text style={styles.infoValue}>{game.rake}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>POT CONTRIBUTION</Text>
            <Text style={styles.infoValue}>{game.contribution}</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="lock-closed-outline" size={20} color="#FBBF24" />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Game entry is not active yet</Text>
            <Text style={styles.noticeText}>
              These are planned entry and rake settings. No points will be
              deducted and no prizes will be paid from this preview screen.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>How to play</Text>

        <View style={styles.instructionsCard}>
          {game.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionRow}>
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Game rules</Text>

        <View style={styles.rulesCard}>
          <Ionicons
            name="information-circle-outline"
            size={21}
            color="#34D399"
          />
          <Text style={styles.rulesText}>{game.rules}</Text>
        </View>

        <Pressable
          style={styles.previewButton}
          onPress={() => setShowPreview((current) => !current)}
        >
          <Ionicons
            name={showPreview ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="#071B17"
          />
          <Text style={styles.previewButtonText}>
            {showPreview ? 'Hide preview information' : 'View game preview'}
          </Text>
        </Pressable>

        {showPreview && (
          <View style={styles.previewPanel}>
            <Ionicons
              name="construct-outline"
              size={30}
              color="#34D399"
            />
            <Text style={styles.previewTitle}>Game screen preparation</Text>
            <Text style={styles.previewDescription}>
              This game has its own information screen. The interactive game
              board, timer, player matching, scoring and results will be built
              in the next development stage.
            </Text>
            <Text style={styles.previewDescription}>
              Supabase will later handle wallet checks, entries, round
              management, outcomes and payouts.
            </Text>
          </View>
        )}

        <View style={styles.bottomNotice}>
          <Ionicons name="shield-checkmark-outline" size={18} color="#34D399" />
          <Text style={styles.bottomNoticeText}>
            Real-money gaming will remain disabled until the backend,
            payment controls, security and regulatory requirements are
            verified.
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
  content: {
    padding: 18,
    paddingBottom: 45,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    marginBottom: 25,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  hero: {
    alignItems: 'center',
    backgroundColor: '#102B24',
    borderRadius: 22,
    padding: 23,
    borderWidth: 1,
    borderColor: '#204438',
    marginBottom: 27,
  },
  heroIcon: {
    width: 105,
    height: 105,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
  },
  category: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    color: '#A8BEB4',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 9,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#164C3A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 18,
  },
  previewBadgeText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 13,
  },
  infoGrid: {
    gap: 10,
    marginBottom: 22,
  },
  infoCard: {
    backgroundColor: '#102B24',
    borderRadius: 13,
    padding: 15,
    borderWidth: 1,
    borderColor: '#204438',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#91AAA1',
    fontSize: 10,
    fontWeight: '800',
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#3B2E12',
    borderColor: '#70551C',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 25,
  },
  noticeTitle: {
    color: '#FDE68A',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 5,
  },
  noticeText: {
    color: '#E9D9A8',
    fontSize: 11,
    lineHeight: 17,
  },
  instructionsCard: {
    backgroundColor: '#102B24',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#204438',
    gap: 17,
    marginBottom: 24,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberCircle: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#164C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '900',
  },
  instructionText: {
    flex: 1,
    color: '#D5E5DD',
    fontSize: 12,
    lineHeight: 18,
  },
  rulesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    backgroundColor: '#102B24',
    borderRadius: 14,
    padding: 15,
    borderWidth: 1,
    borderColor: '#204438',
    marginBottom: 22,
  },
  rulesText: {
    flex: 1,
    color: '#AFC4BA',
    fontSize: 12,
    lineHeight: 19,
  },
  previewButton: {
    backgroundColor: '#34D399',
    borderRadius: 13,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  previewButtonText: {
    color: '#071B17',
    fontSize: 14,
    fontWeight: '900',
  },
  previewPanel: {
    backgroundColor: '#102B24',
    borderWidth: 1,
    borderColor: '#28614F',
    borderRadius: 15,
    padding: 17,
    marginTop: 13,
    gap: 10,
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  previewDescription: {
    color: '#AFC4BA',
    fontSize: 12,
    lineHeight: 19,
  },
  bottomNotice: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    marginTop: 23,
    paddingHorizontal: 3,
  },
  bottomNoticeText: {
    flex: 1,
    color: '#8FA99E',
    fontSize: 11,
    lineHeight: 17,
  },
  notFound: {
    flex: 1,
    backgroundColor: '#071B17',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  notFoundTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 15,
  },
  notFoundText: {
    color: '#A8BEB4',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#34D399',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 22,
  },
  backButtonText: {
    color: '#071B17',
    fontWeight: '900',
  },
});
