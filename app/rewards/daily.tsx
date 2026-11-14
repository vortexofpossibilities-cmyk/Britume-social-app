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

const rewards = [
  { day: 'Day 1', points: 2 },
  { day: 'Day 2', points: 3 },
  { day: 'Day 3', points: 5 },
  { day: 'Day 4', points: 7 },
  { day: 'Day 5', points: 10 },
  { day: 'Day 6', points: 15 },
  { day: 'Day 7', points: 25 },
];

type ThemeColors = ReturnType<typeof useAppTheme>['theme'];

function DailyRewardsScreen() {
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
        <Text style={styles.title}>Daily Rewards</Text>
        <Text style={styles.subtitle}>
          Visit BRITUME regularly and build your daily reward streak.
        </Text>
      </View>

      <View style={styles.notice}>
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={theme.cyan}
        />
        <Text style={styles.noticeText}>
          Preview mode. Daily check-ins and point payments are not active yet.
        </Text>
      </View>

      <View style={styles.streakCard}>
        <Ionicons
          name="flame"
          size={48}
          color="#F59E0B"
        />
        <Text style={styles.streakNumber}>0 Days</Text>
        <Text style={styles.streakLabel}>
          Your current streak
        </Text>
        <Text style={styles.streakHint}>
          Your streak will begin when daily rewards are activated.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Your 7-day reward journey
      </Text>

      {rewards.map((reward, index) => (
        <View
          key={reward.day}
          style={styles.rewardRow}
          accessibilityLabel={`${reward.day}, ${reward.points} points, locked`}
        >
          <View style={styles.dayIcon}>
            <Ionicons
              name={index === 6 ? 'trophy' : 'gift-outline'}
              size={23}
              color={index === 6 ? '#E5A52E' : theme.cyan}
            />
          </View>

          <View style={styles.rewardInfo}>
            <Text style={styles.dayTitle}>
              {reward.day}
            </Text>
            <Text style={styles.dayDescription}>
              {index === 6
                ? 'Weekly streak reward'
                : 'Daily check-in reward'}
            </Text>
          </View>

          <Text style={styles.points}>
            {reward.points} pts
          </Text>

          <Ionicons
            name="lock-closed"
            size={17}
            color={theme.muted}
          />
        </View>
      ))}

      <View style={styles.footerCard}>
        <Ionicons
          name="calendar"
          size={27}
          color={theme.cyan}
        />
        <Text style={styles.footerTitle}>
          Keep showing up
        </Text>
        <Text style={styles.footerText}>
          The daily reward system will track check-ins securely and prevent
          duplicate claims when connected to the BRITUME backend.
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
    streakCard: {
      alignItems: 'center',
      padding: 25,
      borderRadius: 22,
      backgroundColor: theme.panel,
      marginBottom: 27,
    },
    streakNumber: {
      color: theme.text,
      fontSize: 27,
      fontWeight: '900',
      marginTop: 10,
    },
    streakLabel: {
      color: theme.cyan,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 5,
    },
    streakHint: {
      color: theme.muted,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
      marginTop: 10,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '800',
      marginBottom: 13,
    },
    rewardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      padding: 13,
      borderRadius: 15,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
    },
    dayIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rewardInfo: {
      flex: 1,
    },
    dayTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
    },
    dayDescription: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 4,
    },
    points: {
      color: theme.cyan,
      fontSize: 13,
      fontWeight: '900',
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

export default withThemeBackground(DailyRewardsScreen);
