import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../../src/contexts/ThemeContext';

import { withThemeBackground } from '../../src/components/ThemeScreen';

const challenges = [
  {
    id: 'post',
    title: 'Create a Post',
    description: 'Share something with the BRITUME community.',
    reward: 5,
    icon: 'create-outline' as const,
  },
  {
    id: 'connect',
    title: 'Connect with People',
    description: 'Discover and connect with other users.',
    reward: 10,
    icon: 'people-outline' as const,
  },
  {
    id: 'video',
    title: 'Share a Video',
    description: 'Create and share a video with the community.',
    reward: 15,
    icon: 'videocam-outline' as const,
  },
  {
    id: 'community',
    title: 'Join a Community',
    description: 'Find a community that interests you.',
    reward: 10,
    icon: 'people-circle-outline' as const,
  },
];

type ThemeColors = ReturnType<typeof useAppTheme>['theme'];

function ChallengesScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        style={styles.back}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back to Rewards Hub"
      >
        <Ionicons
          name="arrow-back"
          size={23}
          color={theme.text}
        />
        <Text style={styles.backText}>Rewards Hub</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>BRITUME REWARDS</Text>
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.subtitle}>
          Complete activities, grow your community and earn rewards.
        </Text>
      </View>

      <View style={styles.notice}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={theme.cyan}
        />
        <Text style={styles.noticeText}>
          Preview mode. These activities and reward amounts are examples.
          No points are currently being awarded.
        </Text>
      </View>

      <View style={styles.progressCard}>
        <Ionicons
          name="trophy"
          size={42}
          color="#E5A52E"
        />
        <Text style={styles.progressTitle}>
          Your challenge journey
        </Text>
        <Text style={styles.progressNumber}>0 completed</Text>
        <Text style={styles.progressHint}>
          Your progress will appear here when challenges are activated.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Available challenges
      </Text>

      {challenges.map((challenge) => (
        <View
          key={challenge.id}
          style={styles.challengeCard}
          accessibilityLabel={`${challenge.title}. Preview reward: ${challenge.reward} points. Locked.`}
        >
          <View style={styles.challengeIcon}>
            <Ionicons
              name={challenge.icon}
              size={25}
              color={theme.cyan}
            />
          </View>

          <View style={styles.challengeInfo}>
            <Text style={styles.challengeTitle}>
              {challenge.title}
            </Text>
            <Text style={styles.challengeDescription}>
              {challenge.description}
            </Text>
            <Text style={styles.reward}>
              Preview reward: {challenge.reward} points
            </Text>
          </View>

          <View style={styles.lock}>
            <Ionicons
              name="lock-closed"
              size={19}
              color={theme.muted}
            />
          </View>
        </View>
      ))}

      <View style={styles.footerCard}>
        <Ionicons
          name="shield-checkmark-outline"
          size={27}
          color={theme.cyan}
        />
        <Text style={styles.footerTitle}>
          Fair rewards for everyone
        </Text>
        <Text style={styles.footerText}>
          BRITUME will verify completed activities on the server before
          awarding points. Repeated or fraudulent activity will not qualify.
        </Text>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      padding: 20,
      paddingBottom: 45,
    },
    back: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 25,
    },
    backText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '600',
    },
    header: {
      marginBottom: 20,
    },
    eyebrow: {
      color: theme.cyan,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 2,
    },
    title: {
      color: theme.text,
      fontSize: 29,
      fontWeight: '900',
      marginTop: 7,
    },
    subtitle: {
      color: theme.muted,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 7,
    },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      borderRadius: 14,
      backgroundColor: theme.panel,
      marginBottom: 22,
    },
    noticeText: {
      color: theme.text,
      flex: 1,
      fontSize: 13,
      lineHeight: 19,
    },
    progressCard: {
      alignItems: 'center',
      padding: 25,
      borderRadius: 22,
      backgroundColor: theme.panel,
      marginBottom: 27,
    },
    progressTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      marginTop: 12,
    },
    progressNumber: {
      color: theme.cyan,
      fontSize: 25,
      fontWeight: '900',
      marginTop: 8,
    },
    progressHint: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 8,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '800',
      marginBottom: 13,
    },
    challengeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      marginBottom: 11,
    },
    challengeIcon: {
      width: 47,
      height: 47,
      borderRadius: 14,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    challengeInfo: {
      flex: 1,
    },
    challengeTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
    },
    challengeDescription: {
      color: theme.muted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 4,
    },
    reward: {
      color: theme.cyan,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 7,
    },
    lock: {
      padding: 5,
    },
    footerCard: {
      alignItems: 'center',
      padding: 20,
      borderRadius: 17,
      backgroundColor: theme.panel,
      marginTop: 17,
    },
    footerTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: '800',
      marginTop: 10,
    },
    footerText: {
      color: theme.muted,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 19,
      marginTop: 8,
    },
  });
}

export default withThemeBackground(ChallengesScreen);
