
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, router } from 'expo-router';

import {
  getGame,
  createGameSession,
  finishGameSession,
  checkNumberGuess,
  generatePracticeNumber,
  calculateTriviaScore,
  calculateDailyChallengeScore,
  evaluateGreedySplit,
  type GameSession,
} from '../../src/games';

import { withThemeBackground } from '../../src/components/ThemeScreen';

function IndividualGameScreen() {
  const params = useLocalSearchParams<{ game: string }>();
  const slug = Array.isArray(params.game)
    ? params.game[0]
    : params.game;

  const game = Object.entries({
    'spin-wheel': 'pooled-spin',
    'crash-rocket': 'rocket',
    'prediction-pot': 'prediction-pot',
    trivia: 'trivia',
    'daily-challenge': 'daily-challenge',
    'mystery-box': 'mystery-box',
    'greedy-split': 'greedy-split',
    'last-one-standing': 'last-standing',
    'lowest-unique-bid': 'lowest-bid',
    minefield: 'minefield',
    'number-guess': 'number-guess',
  }).find(([, id]) => id === slug);

  const gameId = game?.[1] ?? slug;
  const definition = getGame(gameId ?? '');

  const [session, setSession] = useState<GameSession | null>(null);
  const [score, setScore] = useState(0);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState('');
  const [secretNumber, setSecretNumber] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [triviaAnswers, setTriviaAnswers] = useState(0);
  const [splitOffer, setSplitOffer] = useState('50');

  if (!definition) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Game not found' }} />
        <Text style={styles.title}>Game not found</Text>
        <Text style={styles.description}>
          This game could not be found in the BRITUME catalogue.
        </Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const startGame = () => {
    setSession(createGameSession(definition.id));
    setScore(0);
    setGuess('');
    setFeedback('');
    setAttempts(0);
    setCompletedTasks(0);
    setTriviaAnswers(0);
    setSecretNumber(
      definition.id === 'number-guess'
        ? generatePracticeNumber()
        : null
    );
  };

  const endGame = (finalScore: number) => {
    if (!session) return;

    setScore(finalScore);
    setSession(finishGameSession(session, finalScore));
  };

  const submitGuess = () => {
    if (secretNumber === null) return;

    const value = Number(guess);
    const result = checkNumberGuess(value, secretNumber);

    setAttempts((previous) => previous + 1);

    if (result === 'correct') {
      setFeedback('Correct! You discovered the number.');
      endGame(Math.max(10, 100 - attempts * 10));
    } else if (result === 'too-low') {
      setFeedback('Too low! Try a higher number.');
    } else if (result === 'too-high') {
      setFeedback('Too high! Try a lower number.');
    } else {
      setFeedback('Enter a whole number from 1 to 100.');
    }

    setGuess('');
  };

  const renderGameContent = () => {
    if (!session) {
      return (
        <View style={styles.panel}>
          <View
            style={[
              styles.largeIcon,
              { backgroundColor: `${definition.accent}22` },
            ]}
          >
            <Ionicons
              name={definition.icon as keyof typeof Ionicons.glyphMap}
              size={45}
              color={definition.accent}
            />
          </View>

          <Text style={styles.panelTitle}>
            Ready to play?
          </Text>

          <Text style={styles.description}>
            Start a free practice session. Your practice score
            is not a cash balance or redeemable reward.
          </Text>

          <Pressable style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>START PRACTICE</Text>
            <Ionicons name="arrow-forward" size={17} color="#071B17" />
          </Pressable>
        </View>
      );
    }

    if (session.status === 'completed') {
      return (
        <View style={styles.panel}>
          <Ionicons
            name="trophy-outline"
            size={54}
            color="#34D399"
          />
          <Text style={styles.panelTitle}>Practice complete!</Text>
          <Text style={styles.score}>{score}</Text>
          <Text style={styles.description}>Practice score</Text>

          <Pressable style={styles.button} onPress={startGame}>
            <Text style={styles.buttonText}>PLAY AGAIN</Text>
          </Pressable>
        </View>
      );
    }

    switch (definition.id) {
      case 'number-guess':
        return (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>
              Guess the number
            </Text>
            <Text style={styles.description}>
              Find the secret number between 1 and 100.
            </Text>

            <TextInput
              style={styles.input}
              value={guess}
              onChangeText={setGuess}
              keyboardType="number-pad"
              placeholder="Enter your guess"
              placeholderTextColor="#78918A"
              maxLength={3}
            />

            <Pressable style={styles.button} onPress={submitGuess}>
              <Text style={styles.buttonText}>SUBMIT GUESS</Text>
            </Pressable>

            {!!feedback && (
              <Text style={styles.feedback}>{feedback}</Text>
            )}

            <Text style={styles.description}>
              Attempts: {attempts}
            </Text>
          </View>
        );

      case 'trivia':
        return (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Trivia practice</Text>
            <Text style={styles.description}>
              How many sides does a hexagon have?
            </Text>

            {[5, 6, 7, 8].map((answer) => (
              <Pressable
                key={answer}
                style={styles.answerButton}
                onPress={() => {
                  const correct = answer === 6;
                  const next = triviaAnswers + (correct ? 1 : 0);
                  setTriviaAnswers(next);
                  endGame(calculateTriviaScore(next, 1));
                  setFeedback(
                    correct ? 'Correct answer!' : 'Not quite. The answer is 6.'
                  );
                }}
              >
                <Text style={styles.answerText}>{answer}</Text>
              </Pressable>
            ))}
          </View>
        );

      case 'daily-challenge':
        return (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Daily practice</Text>
            <Text style={styles.description}>
              Complete this simple challenge.
            </Text>

            <Text style={styles.score}>
              {completedTasks}/3
            </Text>

            <Pressable
              style={styles.button}
              onPress={() => {
                const next = Math.min(completedTasks + 1, 3);
                setCompletedTasks(next);

                if (next === 3) {
                  endGame(calculateDailyChallengeScore(next, 3));
                }
              }}
            >
              <Text style={styles.buttonText}>
                COMPLETE TASK
              </Text>
            </Pressable>
          </View>
        );

      case 'greedy-split':
        return (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>The Greedy Split</Text>
            <Text style={styles.description}>
              A practice puzzle: divide 100 imaginary tokens.
              How many would you offer the other player?
            </Text>

            <TextInput
              style={styles.input}
              value={splitOffer}
              onChangeText={setSplitOffer}
              keyboardType="number-pad"
              placeholder="Your offer"
              placeholderTextColor="#78918A"
            />

            <Pressable
              style={styles.button}
              onPress={() => {
                const result = evaluateGreedySplit(
                  100,
                  Number(splitOffer),
                  40
                );

                setFeedback(
                  result.accepted
                    ? `Offer accepted! You keep ${result.remaining} imaginary tokens.`
                    : 'Offer rejected. Try a more generous split.'
                );

                endGame(result.accepted ? result.remaining : 0);
              }}
            >
              <Text style={styles.buttonText}>SUBMIT OFFER</Text>
            </Pressable>

            {!!feedback && (
              <Text style={styles.feedback}>{feedback}</Text>
            )}
          </View>
        );

      default:
        return (
          <View style={styles.panel}>
            <Ionicons
              name="construct-outline"
              size={48}
              color="#34D399"
            />
            <Text style={styles.panelTitle}>
              Practice mode is coming
            </Text>
            <Text style={styles.description}>
              This game's individual mechanics are still being
              developed. Your game card is connected to the
              BRITUME game catalogue.
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B17" />

      <Stack.Screen
        options={{
          title: definition.name,
          headerStyle: { backgroundColor: '#071B17' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#34D399" />
          <Text style={styles.backText}>Games Arena</Text>
        </Pressable>

        <View style={styles.header}>
          <View
            style={[
              styles.gameIcon,
              { backgroundColor: `${definition.accent}22` },
            ]}
          >
            <Ionicons
              name={definition.icon as keyof typeof Ionicons.glyphMap}
              size={34}
              color={definition.accent}
            />
          </View>

          <Text style={styles.title}>{definition.name}</Text>

          <Text style={styles.description}>
            {definition.description}
          </Text>

          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>
              FREE PRACTICE
            </Text>
          </View>
        </View>

        {renderGameContent()}

        <View style={styles.notice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color="#34D399"
          />
          <Text style={styles.noticeText}>
            Practice only. No paid entry, wagering or cash prizes.
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
    padding: 18,
    paddingBottom: 45,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 25,
  },
  backText: {
    color: '#34D399',
    fontWeight: '700',
    fontSize: 13,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  gameIcon: {
    width: 75,
    height: 75,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  description: {
    color: '#A3B8B0',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
  },
  freeBadge: {
    backgroundColor: '#065F46',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginTop: 13,
  },
  freeBadgeText: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  panel: {
    backgroundColor: '#102B24',
    borderWidth: 1,
    borderColor: '#204438',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginTop: 5,
  },
  largeIcon: {
    width: 85,
    height: 85,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  panelTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    minHeight: 49,
    backgroundColor: '#34D399',
    borderRadius: 13,
    paddingHorizontal: 20,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  buttonText: {
    color: '#071B17',
    fontSize: 12,
    fontWeight: '900',
  },
  score: {
    color: '#34D399',
    fontSize: 45,
    fontWeight: '900',
    marginVertical: 12,
  },
  input: {
    width: '100%',
    backgroundColor: '#071B17',
    borderWidth: 1,
    borderColor: '#28614F',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 17,
    textAlign: 'center',
    marginTop: 18,
  },
  feedback: {
    color: '#A7F3D0',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
  },
  answerButton: {
    width: '100%',
    backgroundColor: '#174536',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  answerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  notice: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: '#102B24',
    borderRadius: 13,
    padding: 14,
    marginTop: 22,
    alignItems: 'center',
  },
  noticeText: {
    color: '#A7C0B6',
    fontSize: 11,
    flex: 1,
    lineHeight: 17,
  },
});

export default withThemeBackground(IndividualGameScreen);
