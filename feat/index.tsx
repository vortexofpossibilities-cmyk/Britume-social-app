import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';

import {
  fetchPublicPosts,
  fetchPostInteractions,
  fetchCommentsForPost,
  createComment,
  toggleLike,
  toggleSave,
  type FeedPost,
  type PostComment,
} from '../../src/lib/posts';

import { supabase } from '../../src/lib/supabase';
import { ClayLogo } from '../../src/components/ClayUI';
import { useAppTheme } from '../../src/contexts/ThemeContext';

type Interaction = {
  liked: boolean;
  saved: boolean;
  likesCount: number;
  commentsCount: number;
};

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 15000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Request timed out. Please try again.'));
    }, timeoutMs);

    promise
      .then(result => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function MediaVideo({
  uri,
  videoStyle,
}: {
  uri: string;
  videoStyle: any;
}) {
  const player = useVideoPlayer(uri, instance => {
    instance.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={videoStyle}
      nativeControls
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

function VideoPost({ post }: { post: FeedPost }) {
  const { theme, isDark } = useAppTheme();

  const styles = useMemo(
    () => createStyles(theme, isDark),
    [theme, isDark],
  );

  const video = post.media?.find(
    item => item.media_type === 'video',
  );

  if (!video) return null;

  const author =
    post.author?.display_name ||
    post.author?.username ||
    'BRITUME member';

  return (
    <View style={styles.videoPostCard}>
      <View style={styles.videoPostHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={theme.cyan} />
        </View>

        <View style={styles.videoAuthor}>
          <Text style={styles.authorName} numberOfLines={1}>
            {author}
          </Text>

          <Text style={styles.postDate}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Ionicons name="videocam" size={20} color={theme.purple} />
      </View>

      <MediaVideo
        uri={video.url}
        videoStyle={styles.videoPlayer}
      />

      {post.content ? (
        <Text style={styles.videoCaption} numberOfLines={3}>
          {post.content}
        </Text>
      ) : null}
    </View>
  );
}

export default function HomeScreen() {
  const { theme, isDark } = useAppTheme();

  const styles = useMemo(
    () => createStyles(theme, isDark),
    [theme, isDark],
  );

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [userId, setUserId] = useState<string | null>(null);

  const [interactions, setInteractions] = useState<
    Record<string, Interaction>
  >({});

  const [busyPosts, setBusyPosts] = useState<string[]>([]);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const loadPosts = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      let currentUserId: string | null = null;

      try {
        if (supabase) {
          const { data } = await withTimeout(
            supabase.auth.getUser(),
            10000,
          );

          currentUserId = data.user?.id ?? null;
        }
      } catch (authError) {
        console.warn('BRITUME authentication:', authError);
      }

      setUserId(currentUserId);

      const freshPosts = await withTimeout(fetchPublicPosts());

      setPosts(freshPosts);
      setLoading(false);

      try {
        const result = await withTimeout(
          fetchPostInteractions(
            freshPosts.map(post => post.id),
            currentUserId ?? undefined,
          ),
        );

        setInteractions(result);
      } catch (interactionError) {
        console.error('BRITUME interactions:', interactionError);
        setInteractions({});
      }
    } catch (e) {
      console.error('BRITUME feed:', e);

      setError(
        e instanceof Error
          ? e.message
          : 'Could not load BRITUME posts.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts]),
  );

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return posts;

    return posts.filter(post => {
      const content = (post.content ?? '').toLowerCase();
      const author = post.author?.display_name?.toLowerCase() ?? '';
      const username = post.author?.username?.toLowerCase() ?? '';

      return (
        content.includes(q) ||
        author.includes(q) ||
        username.includes(q)
      );
    });
  }, [posts, search]);

  const photoPosts = useMemo(
    () =>
      filteredPosts.filter(
        post =>
          post.post_type === 'text' ||
          post.post_type === 'photo',
      ),
    [filteredPosts],
  );

  const videoPosts = useMemo(
    () => filteredPosts.filter(post => post.post_type === 'video'),
    [filteredPosts],
  );

  const reelPosts = useMemo(
    () => filteredPosts.filter(post => post.post_type === 'reel'),
    [filteredPosts],
  );

  const refreshInteractions = async () => {
    if (!posts.length) return;

    const result = await withTimeout(
      fetchPostInteractions(
        posts.map(post => post.id),
        userId ?? undefined,
      ),
    );

    setInteractions(result);
  };

  const handleLike = async (postId: string) => {
    if (!userId) {
      Alert.alert(
        'Sign in required',
        'Please sign in to like posts.',
      );
      return;
    }

    if (busyPosts.includes(postId)) return;

    setBusyPosts(items => [...items, postId]);

    try {
      await toggleLike(
        postId,
        userId,
        interactions[postId]?.liked ?? false,
      );

      await refreshInteractions();
    } catch (e) {
      Alert.alert(
        'Like failed',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setBusyPosts(items => items.filter(id => id !== postId));
    }
  };

  const handleSave = async (postId: string) => {
    if (!userId) {
      Alert.alert(
        'Sign in required',
        'Please sign in to save posts.',
      );
      return;
    }

    if (busyPosts.includes(postId)) return;

    setBusyPosts(items => [...items, postId]);

    try {
      await toggleSave(
        postId,
        userId,
        interactions[postId]?.saved ?? false,
      );

      await refreshInteractions();
    } catch (e) {
      Alert.alert(
        'Save failed',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setBusyPosts(items => items.filter(id => id !== postId));
    }
  };

  const sharePost = async (post: FeedPost) => {
    const mediaLinks = (post.media ?? [])
      .map(item => item.url)
      .join('\n');

    try {
      await Share.share({
        message:
          `BRITUME - Vortex of Possibilities\n\n` +
          `${post.content ?? ''}\n${mediaLinks}`,
      });
    } catch {
      Alert.alert('Sharing unavailable', 'Please try again.');
    }
  };

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentText('');
    setComments([]);
    setCommentsLoading(true);

    try {
      const result = await withTimeout(
        fetchCommentsForPost(postId),
      );

      setComments(result);
    } catch (e) {
      Alert.alert(
        'Comments',
        e instanceof Error ? e.message : 'Could not load comments.',
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!activePostId || !userId) {
      Alert.alert(
        'Sign in required',
        'Please sign in to comment.',
      );
      return;
    }

    const content = commentText.trim();

    if (!content) return;

    setSendingComment(true);

    try {
      await withTimeout(
        createComment(activePostId, userId, content),
      );

      setCommentText('');

      const result = await withTimeout(
        fetchCommentsForPost(activePostId),
      );

      setComments(result);
      await refreshInteractions();
    } catch (e) {
      Alert.alert(
        'Comment failed',
        e instanceof Error ? e.message : 'Please try again.',
      );
    } finally {
      setSendingComment(false);
    }
  };

  // HOME HEADER

  const Header = (
    <View>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.logoHolder}
        >
          <ClayLogo size={52} />
        </Pressable>

        <Pressable
          style={styles.brandText}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.brandName}>BRITUME</Text>
          <Text style={styles.tagline}>Vortex of Possibilities</Text>
          <Text style={styles.byline}>by brilliant mere</Text>
        </Pressable>

        <Pressable
          style={styles.topButtonLight}
          onPress={() => router.push('/(tabs)/discover')}
          accessibilityLabel="Discover people"
        >
          <Ionicons name="search" size={22} color={theme.cyan} />
        </Pressable>

        <Pressable
          style={styles.topButtonLight}
          onPress={() => router.push('/notifications')}
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={theme.cyan}
          />
        </Pressable>

        <Pressable
          style={styles.topButtonLight}
          onPress={() => router.push('/(tabs)/more')}
          accessibilityLabel="More menu"
        >
          <Ionicons name="menu" size={25} color={theme.cyan} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={21}
          color={theme.cyan}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search people, posts and communities..."
          placeholderTextColor={theme.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />

        <Pressable
          onPress={() => router.push('/(tabs)/discover')}
          accessibilityLabel="Search filters"
        >
          <Ionicons
            name="options-outline"
            size={22}
            color={theme.purple}
          />
        </Pressable>
      </View>

      <View style={styles.sectionHeading}>
        <View style={styles.headingWithIcon}>
          <Ionicons
            name="aperture-outline"
            size={23}
            color={theme.cyan}
          />
          <Text style={styles.sectionTitle}>Stories</Text>
        </View>

        <Pressable
          style={styles.seeAll}
          onPress={() => router.push('/stories')}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.cyan}
          />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storiesScroll}
        contentContainerStyle={styles.storiesContent}
      >
        <Pressable
          style={[styles.storyCard, styles.yourStoryCard]}
          onPress={() => router.push('/(tabs)/create')}
        >
          <View style={styles.storyCardTop}>
            <View style={styles.storyAvatar}>
              <Ionicons
                name="person"
                size={25}
                color={theme.cyan}
              />
            </View>

            <View style={styles.storyStatus}>
              <Ionicons name="add" size={17} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.storyCardBottom}>
            <Text style={styles.storyCardTitle}>Your Story</Text>
            <Text style={styles.storyCardSubtitle}>
              Share a moment
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      <View style={styles.sectionHeading}>
        <View style={styles.headingWithIcon}>
          <Ionicons
            name="grid-outline"
            size={22}
            color={theme.cyan}
          />
          <Text style={styles.sectionTitle}>Posts</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadPosts()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  // POST CARD

  const renderPost = ({ item }: { item: FeedPost }) => {
    const interaction = interactions[item.id];

    const liked = interaction?.liked ?? false;
    const saved = interaction?.saved ?? false;

    const author =
      item.author?.display_name ||
      item.author?.username ||
      'BRITUME member';

    const images = (item.media ?? []).filter(
      media => media.media_type === 'image',
    );

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={19}
              color={theme.cyan}
            />
          </View>

          <View style={styles.postAuthor}>
            <Text style={styles.authorName} numberOfLines={1}>
              {author}
            </Text>

            <Text style={styles.postDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert('Post options', 'Choose an action.', [
                {
                  text: 'Share',
                  onPress: () => void sharePost(item),
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
              ])
            }
          >
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={theme.muted}
            />
          </Pressable>
        </View>

        {item.content ? (
          <Text style={styles.postContent}>{item.content}</Text>
        ) : null}

        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroller}
          >
            {images.map(media => (
              <Image
                key={media.id}
                source={{ uri: media.url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.postActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => void handleLike(item.id)}
            disabled={busyPosts.includes(item.id)}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={20}
              color={liked ? '#FF5478' : theme.cyan}
            />

            <Text style={styles.actionCount}>
              {interaction?.likesCount ?? 0}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => void openComments(item.id)}
          >
            <Ionicons
              name="chatbubble-outline"
              size={19}
              color={theme.cyan}
            />

            <Text style={styles.actionCount}>
              {interaction?.commentsCount ?? 0}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => void sharePost(item)}
          >
            <Ionicons
              name="share-social-outline"
              size={19}
              color={theme.cyan}
            />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => void handleSave(item.id)}
            disabled={busyPosts.includes(item.id)}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={19}
              color={saved ? theme.gold : theme.cyan}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  // VIDEO AND REELS

  const renderVideoSection = (
    title: string,
    data: FeedPost[],
    kind: 'video' | 'reel',
  ) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.mediaSection}>
        <View style={styles.sectionHeading}>
          <View style={styles.headingWithIcon}>
            <Ionicons
              name={kind === 'reel' ? 'play-circle' : 'videocam'}
              size={23}
              color={kind === 'reel' ? theme.purple : theme.cyan}
            />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>

        <View style={styles.videoGrid}>
          {data.map(post => (
            <VideoPost key={post.id} post={post} />
          ))}
        </View>
      </View>
    );
  };

  // MAIN SCREEN

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.cyan} />
          <Text style={styles.loadingText}>Loading BRITUME...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.screen}
          contentContainerStyle={styles.content}
          data={photoPosts}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.postRow}
          ListHeaderComponent={Header}
          ListFooterComponent={
            <View>
              {renderVideoSection('Videos', videoPosts, 'video')}
              {renderVideoSection('Reels', reelPosts, 'reel')}
            </View>
          }
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadPosts(true)}
              tintColor={theme.cyan}
              colors={[theme.cyan]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons
                name="images-outline"
                size={43}
                color={theme.cyan}
              />

              <Text style={styles.emptyTitle}>
                {search.trim()
                  ? 'No matching posts'
                  : 'Welcome to BRITUME'}
              </Text>

              <Text style={styles.emptyText}>
                {search.trim()
                  ? 'Try searching for something else.'
                  : 'Your community starts here. Use the Create button to share your first post!'}
              </Text>
            </View>
          }
          renderItem={renderPost}
        />
      )}

      {/* COMMENTS MODAL */}

      <Modal
        visible={activePostId !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActivePostId(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.commentsPanel}>
            <View style={styles.modalHeader}>
              <View style={styles.headingWithIcon}>
                <Ionicons
                  name="chatbubbles"
                  size={23}
                  color={theme.cyan}
                />
                <Text style={styles.modalTitle}>Comments</Text>
              </View>

              <Pressable onPress={() => setActivePostId(null)}>
                <Ionicons
                  name="close-circle"
                  size={29}
                  color={theme.muted}
                />
              </Pressable>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color={theme.cyan} />
            ) : (
              <ScrollView
                style={styles.commentsList}
                keyboardShouldPersistTaps="handled"
              >
                {comments.length === 0 ? (
                  <Text style={styles.noComments}>
                    Be the first to comment.
                  </Text>
                ) : (
                  comments.map(comment => (
                    <View
                      key={comment.id}
                      style={styles.commentCard}
                    >
                      <View style={styles.avatar}>
                        <Ionicons
                          name="person"
                          size={17}
                          color={theme.cyan}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.commentAuthor}>
                          {comment.author?.display_name ||
                            comment.author?.username ||
                            'BRITUME member'}
                        </Text>

                        <Text style={styles.commentContent}>
                          {comment.content}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={theme.muted}
                style={styles.commentInput}
                multiline
                maxLength={2000}
              />

              <Pressable
                style={styles.sendButton}
                onPress={() => void submitComment()}
                disabled={sendingComment || !commentText.trim()}
              >
                {sendingComment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={19} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// DYNAMIC GLOBAL THEME STYLES

function createStyles(theme: any, isDark: boolean) {
  const surface = theme.panel ?? (isDark ? '#1B2B40' : '#FFFFFF');
  const raised = theme.panel2 ?? (isDark ? '#243A52' : '#E4F1FF');
  const border = theme.border ?? (isDark ? '#304A65' : '#D3E6F8');
  const borderStrong =
    theme.borderStrong ?? (isDark ? '#456482' : '#B9D8F5');

  const shadow = isDark ? '#080F19' : '#548BCB';
  const softText = theme.muted ?? (isDark ? '#A9BED3' : '#66829B');

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    content: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 35,
    },

    loading: {
      flex: 1,
      backgroundColor: theme.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },

    loadingText: {
      color: theme.text,
      marginTop: 12,
      fontWeight: '800',
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 19,
    },

    logoHolder: {
      marginRight: 8,
    },

    brandText: {
      flex: 1,
    },

    brandName: {
      color: theme.blueDark ?? '#0756B5',
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 1,
    },

    tagline: {
      color: theme.cyan,
      fontSize: 10,
      fontWeight: '900',
    },

    byline: {
      color: softText,
      fontSize: 9,
      fontWeight: '700',
    },

    topButtonLight: {
      width: 38,
      height: 38,
      borderRadius: 15,
      backgroundColor: surface,
      borderWidth: 2,
      borderColor: border,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 5,
      elevation: isDark ? 2 : 7,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.15 : 0.27,
      shadowRadius: 8,
      shadowOffset: { width: 4, height: 5 },
    },

    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: surface,
      borderRadius: 24,
      borderWidth: 2,
      borderColor: border,
      paddingHorizontal: 15,
      marginBottom: 25,
      elevation: isDark ? 2 : 9,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.15 : 0.28,
      shadowRadius: 12,
      shadowOffset: { width: 6, height: 8 },
    },

    searchInput: {
      flex: 1,
      color: theme.text,
      paddingHorizontal: 10,
      paddingVertical: 15,
      fontSize: 12,
      fontWeight: '700',
    },

    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
      marginTop: 5,
    },

    headingWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '900',
    },

    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: surface,
      borderRadius: 16,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderWidth: 1.5,
      borderColor: border,
      elevation: isDark ? 1 : 5,
    },

    seeAllText: {
      color: theme.cyan,
      fontSize: 11,
      fontWeight: '900',
    },

    storiesScroll: {
      marginBottom: 24,
    },

    storiesContent: {
      paddingHorizontal: 3,
      paddingBottom: 9,
    },

    storyCard: {
      width: 116,
      height: 174,
      borderRadius: 21,
      borderWidth: 3,
      borderColor: border,
      padding: 9,
      justifyContent: 'space-between',
      overflow: 'hidden',
      elevation: isDark ? 2 : 9,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.18 : 0.28,
      shadowRadius: 9,
      shadowOffset: { width: 4, height: 6 },
    },

    yourStoryCard: {
      backgroundColor: isDark ? '#243A52' : '#CDE7FF',
    },

    storyCardTop: {
      alignItems: 'flex-start',
    },

    storyAvatar: {
      width: 49,
      height: 49,
      borderRadius: 18,
      backgroundColor: surface,
      borderWidth: 2,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    storyStatus: {
      position: 'absolute',
      left: 35,
      top: 34,
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: theme.cyan,
      borderWidth: 2,
      borderColor: surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    storyCardBottom: {
      backgroundColor: isDark
        ? 'rgba(16,27,42,0.88)'
        : 'rgba(255,255,255,0.72)',
      borderRadius: 12,
      paddingHorizontal: 7,
      paddingVertical: 8,
    },

    storyCardTitle: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '900',
    },

    storyCardSubtitle: {
      color: softText,
      fontSize: 9,
      fontWeight: '700',
      marginTop: 3,
    },

    postRow: {
      justifyContent: 'space-between',
      gap: 11,
    },

    postCard: {
      flex: 1,
      minWidth: 0,
      backgroundColor: surface,
      borderWidth: 2,
      borderTopColor: border,
      borderLeftColor: border,
      borderRightColor: borderStrong,
      borderBottomColor: borderStrong,
      borderRadius: 24,
      padding: 11,
      marginBottom: 16,
      elevation: isDark ? 2 : 12,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.2 : 0.32,
      shadowRadius: 13,
      shadowOffset: { width: 7, height: 9 },
    },

    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 11,
    },

    avatar: {
      width: 36,
      height: 36,
      borderRadius: 15,
      backgroundColor: raised,
      borderWidth: 2,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
    },

    postAuthor: {
      flex: 1,
      marginLeft: 8,
    },

    authorName: {
      color: theme.text,
      fontWeight: '900',
      fontSize: 11,
    },

    postDate: {
      color: softText,
      fontSize: 9,
      marginTop: 3,
      fontWeight: '600',
    },

    postContent: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 18,
      marginBottom: 9,
    },

    imageScroller: {
      marginHorizontal: -4,
      marginBottom: 8,
    },

    postImage: {
      width: 155,
      height: 170,
      borderRadius: 17,
      marginHorizontal: 3,
      backgroundColor: raised,
      borderWidth: 2,
      borderColor: border,
    },

    postActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: borderStrong,
      paddingTop: 11,
      marginTop: 7,
    },

    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      minWidth: 27,
      minHeight: 29,
      borderRadius: 12,
      backgroundColor: raised,
      paddingHorizontal: 5,
      elevation: isDark ? 1 : 3,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.12 : 0.18,
      shadowRadius: 4,
      shadowOffset: { width: 2, height: 3 },
    },

    actionCount: {
      fontSize: 9,
      color: theme.text,
      fontWeight: '900',
    },

    mediaSection: {
      marginTop: 23,
    },

    videoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },

    videoPostCard: {
      width: '48%',
      backgroundColor: surface,
      borderRadius: 21,
      borderWidth: 2,
      borderColor: border,
      padding: 8,
      marginBottom: 12,
      elevation: isDark ? 2 : 9,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.18 : 0.25,
      shadowRadius: 9,
      shadowOffset: { width: 4, height: 6 },
    },

    videoPostHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 9,
      gap: 7,
    },

    videoAuthor: {
      flex: 1,
      minWidth: 0,
    },

    videoPlayer: {
      width: '100%',
      height: 125,
      backgroundColor: theme.text,
      borderRadius: 14,
      overflow: 'hidden',
    },

    videoCaption: {
      color: theme.text,
      fontSize: 11,
      fontWeight: '700',
      lineHeight: 16,
      marginTop: 9,
    },

    emptyBox: {
      backgroundColor: surface,
      borderWidth: 2,
      borderColor: border,
      borderRadius: 26,
      padding: 25,
      alignItems: 'center',
      marginBottom: 15,
      elevation: isDark ? 2 : 10,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.18 : 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 6, height: 8 },
    },

    emptyTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: '900',
      marginTop: 12,
    },

    emptyText: {
      color: softText,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 7,
    },

    errorBox: {
      backgroundColor: isDark ? '#402633' : '#FFF0F0',
      borderWidth: 1.5,
      borderColor: isDark ? '#744050' : '#FFD0D0',
      padding: 14,
      borderRadius: 18,
      marginBottom: 13,
      elevation: 3,
    },

    errorText: {
      color: isDark ? '#FFB9C5' : '#C52E45',
      marginBottom: 6,
      fontWeight: '700',
    },

    retryText: {
      color: theme.cyan,
      fontWeight: '900',
    },

    modalBackground: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.55)',
    },

    commentsPanel: {
      height: '70%',
      backgroundColor: theme.bg,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      borderTopWidth: 3,
      borderColor: border,
      padding: 17,
      elevation: 18,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },

    modalTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '900',
    },

    commentsList: {
      flex: 1,
      paddingVertical: 13,
    },

    noComments: {
      color: softText,
      textAlign: 'center',
      marginTop: 30,
      fontWeight: '700',
    },

    commentCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: surface,
      borderWidth: 1.5,
      borderColor: border,
      padding: 12,
      borderRadius: 18,
      marginBottom: 11,
      elevation: isDark ? 1 : 5,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.12 : 0.18,
      shadowRadius: 6,
      shadowOffset: { width: 3, height: 4 },
    },

    commentAuthor: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '900',
    },

    commentContent: {
      color: softText,
      fontSize: 13,
      marginTop: 5,
      lineHeight: 19,
    },

    commentInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderTopWidth: 1,
      borderTopColor: border,
      paddingTop: 13,
    },

    commentInput: {
      flex: 1,
      minHeight: 45,
      maxHeight: 90,
      backgroundColor: surface,
      borderWidth: 2,
      borderColor: border,
      borderRadius: 21,
      paddingHorizontal: 14,
      paddingVertical: 10,
      color: theme.text,
      fontWeight: '600',
      elevation: 3,
    },

    sendButton: {
      width: 47,
      height: 47,
      borderRadius: 18,
      backgroundColor: theme.cyan,
      borderWidth: 2,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: theme.blueDark ?? '#0756B5',
      shadowOpacity: isDark ? 0.2 : 0.35,
      shadowRadius: 8,
      shadowOffset: { width: 4, height: 5 },
    },
  });
                                }
