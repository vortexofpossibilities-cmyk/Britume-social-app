
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

import {
  fetchPostsForUser,
  type FeedPost,
} from '../../src/lib/posts';

import { theme } from '../../src/lib/theme';

import { withThemeBackground } from '../../src/components/ThemeScreen';

function PublicProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!username || typeof username !== 'string') {
      setProfile(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setPostsError('');

      const result = await fetchPublicProfileByUsername(username);
      setProfile(result);

      if (!result || result.is_public === false) {
        setPosts([]);
        return;
      }

      try {
        setLoadingPosts(true);

        const userPosts = await fetchPostsForUser(result.user_id, {
          includePrivate: false,
        });

        setPosts(userPosts);
      } catch (error) {
        setPosts([]);
        setPostsError(
          error instanceof Error
            ? error.message
            : 'Could not load this user’s posts.'
        );
      } finally {
        setLoadingPosts(false);
      }
    } catch (error) {
      setProfile(null);
      setPosts([]);

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
          <Ionicons name="arrow-back" size={23} color={theme.text} />
        </Pressable>

        <Text style={styles.topTitle}>Public profile</Text>

        <View style={styles.backButton} />
      </View>

      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={43} color={theme.cyan} />
        </View>

        <Text style={styles.name}>{displayName}</Text>

        <Text style={styles.username}>@{profile.username}</Text>

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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Posts and activity</Text>
        <Text style={styles.postCount}>{posts.length} posts</Text>
      </View>

      {loadingPosts ? (
        <View style={styles.emptyCard}>
          <ActivityIndicator size="small" color={theme.cyan} />
          <Text style={styles.mutedText}>Loading posts...</Text>
        </View>
      ) : postsError ? (
        <View style={styles.emptyCard}>
          <Ionicons
            name="cloud-offline-outline"
            size={38}
            color={theme.muted}
          />
          <Text style={styles.emptyTitle}>Posts unavailable</Text>
          <Text style={styles.mutedText}>{postsError}</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons
            name="images-outline"
            size={42}
            color={theme.muted}
          />

          <Text style={styles.emptyTitle}>No public posts yet</Text>

          <Text style={styles.mutedText}>
            When this user shares public posts on BRITUME, they will appear here.
          </Text>
        </View>
      ) : (
        posts.map((post) => (
          <View key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.smallAvatar}>
                <Ionicons
                  name="person"
                  size={19}
                  color={theme.cyan}
                />
              </View>

              <View style={styles.postAuthor}>
                <Text style={styles.postAuthorName}>
                  {displayName}
                </Text>

                <Text style={styles.postDate}>
                  {new Date(post.created_at).toLocaleDateString()}
                </Text>
              </View>

              <Ionicons
                name="globe-outline"
                size={18}
                color={theme.muted}
              />
            </View>

            {!!post.content && (
              <Text style={styles.postContent}>{post.content}</Text>
            )}

            {!!post.media?.length && (
              <View style={styles.mediaContainer}>
                {post.media.map((media) => (
                  <View key={media.id} style={styles.mediaItem}>
                    {media.media_type === 'image' && media.url ? (
                      <Image
                        source={{ uri: media.url }}
                        style={styles.postImage}
                        resizeMode="cover"
                      />
                    ) : media.media_type === 'video' ? (
                      <View style={styles.videoPreview}>
                        <Ionicons
                          name="play-circle"
                          size={48}
                          color="#FFFFFF"
                        />
                        <Text style={styles.videoLabel}>
                          Video post
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.mediaUnavailable}>
                        <Ionicons
                          name="image-outline"
                          size={30}
                          color={theme.muted}
                        />
                        <Text style={styles.mutedText}>
                          Media unavailable
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.postFooter}>
              <Ionicons
                name="checkmark-circle-outline"
                size={17}
                color={theme.success}
              />
              <Text style={styles.publicLabel}>Public post</Text>
            </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 27,
    marginBottom: 13,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '800',
  },
  postCount: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    gap: 9,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 5,
    marginBottom: 3,
  },
  postCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 17,
    padding: 14,
    marginBottom: 15,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  smallAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthor: {
    flex: 1,
    marginLeft: 10,
  },
  postAuthorName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '800',
  },
  postDate: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 3,
  },
  postContent: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  mediaContainer: {
    gap: 9,
  },
  mediaItem: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 13,
    backgroundColor: theme.panel2,
  },
  postImage: {
    width: '100%',
    height: 230,
  },
  videoPreview: {
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.blueDark,
  },
  videoLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 5,
  },
  mediaUnavailable: {
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 11,
    marginTop: 12,
    gap: 6,
  },
  publicLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '600',
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

export default withThemeBackground(PublicProfileScreen);
