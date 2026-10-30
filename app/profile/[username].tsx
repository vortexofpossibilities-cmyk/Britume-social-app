
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import {
  fetchPublicProfileByUsername,
  getProfileName,
  type ProfileRecord,
} from '../../src/lib/profile';

import { theme } from '../../src/lib/theme';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!username || typeof username !== 'string') {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await fetchPublicProfileByUsername(username);

      setProfile(result);
    } catch (error) {
      setProfile(null);

      Alert.alert(
        'Profile unavailable',
        error instanceof Error
          ? error.message
          : 'Could not load this profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [username]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.cyan} />
        <Text style={styles.mutedText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="person-circle-outline"
          size={65}
          color={theme.muted}
        />

        <Text style={styles.title}>Profile not found</Text>

        <Text style={styles.mutedText}>
          This profile may not exist or may not be publicly available.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (profile.is_public === false) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="lock-closed-outline"
          size={55}
          color={theme.cyan}
        />

        <Text style={styles.title}>Private profile</Text>

        <Text style={styles.mutedText}>
          This user has chosen to keep their profile private.
        </Text>

        <Pressable
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const displayName = getProfileName(profile);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={theme.text}
          />
        </Pressable>

        <Text style={styles.topTitle}>Public profile</Text>

        <View style={styles.backButton} />
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons
            name="person"
            size={43}
            color={theme.cyan}
          />
        </View>

        <Text style={styles.name}>{displayName}</Text>

        <Text style={styles.username}>
          @{profile.username}
        </Text>

        <Text style={styles.bio}>
          {profile.bio || 'Welcome to my BRITUME profile.'}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons
            name="globe-outline"
            size={21}
            color={theme.cyan}
          />

          <Text style={styles.infoText}>Public BRITUME profile</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Posts and activity</Text>

      <View style={styles.emptyCard}>
        <Ionicons
          name="images-outline"
          size={42}
          color={theme.muted}
        />

        <Text style={styles.emptyTitle}>Nothing to display yet</Text>

        <Text style={styles.mutedText}>
          Posts and other public activity will appear here when connected.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 35,
  },
  center: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  avatar: {
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor: theme.panel,
    borderWidth: 2,
    borderColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  name: {
    color: theme.text,
    fontSize: 23,
    fontWeight: '800',
  },
  username: {
    color: theme.cyan,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 5,
  },
  bio: {
    color: theme.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 27,
    marginBottom: 13,
  },
  emptyCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 7,
  },
  title: {
    color: theme.text,
    fontSize: 21,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  mutedText: {
    color: theme.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  button: {
    backgroundColor: theme.cyan,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
