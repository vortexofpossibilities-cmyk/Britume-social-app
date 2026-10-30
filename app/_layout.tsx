import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/auth/AuthProvider';
import { fetchPostsForUser } from '../src/lib/posts';
import { fetchPublicProfileByUsername, getProfileName } from '../src/lib/profile';
import { theme } from '../src/lib/theme';

export default function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUsername = useMemo(() => {
    return typeof username === 'string' ? username.trim() : '';
  }, [username]);

  const loadProfile = useCallback(async () => {
    if (!targetUsername) {
      setProfile(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const nextProfile = await fetchPublicProfileByUsername(targetUsername);
      setProfile(nextProfile);

      if (!nextProfile) {
        setPosts([]);
        return;
      }

      const nextPosts = await fetchPostsForUser(nextProfile.user_id, { includePrivate: false });
      setPosts(nextPosts);
    } catch (error) {
      console.warn('Profile route failed:', error);
      setProfile(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [targetUsername]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const isCurrentUser = Boolean(session?.user?.id && profile && session.user.id === profile.user_id);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.cyan} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-circle-outline" size={48} color={theme.cyan} />
        <Text style={styles.emptyTitle}>Profile not found</Text>
        <Text style={styles.emptyText}>This public profile is unavailable or does not exist.</Text>
        <Pressable style={styles.primaryAction} onPress={() => router.back()}>
          <Text style={styles.primaryActionText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>

        {isCurrentUser ? (
          <Pressable style={styles.editButton} onPress={() => router.push('/profile-edit')}>
            <Ionicons name="pencil-outline" size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={38} color={theme.cyan} />
          </View>
        </View>

        <Text style={styles.profileName}>{getProfileName(profile)}</Text>
        <Text style={styles.username}>@{profile.username || targetUsername}</Text>
        <Text style={styles.bio}>{profile.bio || 'No bio yet.'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{posts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{profile.is_public ? 'Public' : 'Private'}</Text>
          <Text style={styles.statLabel}>Visibility</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Posts</Text>
      {posts.length === 0 ? (
        <View style={styles.emptyPosts}>
          <Text style={styles.emptyPostsText}>No public posts yet.</Text>
        </View>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <Text style={styles.postMeta}>{new Date(post.created_at).toLocaleDateString()}</Text>
            <Text style={styles.postContent}>{post.content}</Text>
          </View>
        ))
      )}
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
    paddingBottom: 30,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.cyan,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '800',
  },
  username: {
    color: theme.cyan,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  bio: {
    color: theme.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 4,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 10,
  },
  postCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  postMeta: {
    color: theme.muted,
    fontSize: 11,
    marginBottom: 6,
  },
  postContent: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    backgroundColor: theme.bg,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyText: {
    color: theme.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  primaryAction: {
    backgroundColor: theme.cyan,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 18,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyPosts: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  emptyPostsText: {
    color: theme.muted,
    fontSize: 13,
  },
});
