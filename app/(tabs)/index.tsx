
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
import { theme } from '../../src/lib/theme';

const BLUE = '#168BFF';
const GOLD = '#FFD447';
const PURPLE = '#895CFF';
const WHITE = '#FFFFFF';

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

// VIDEO PLAYER
function MediaVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, instance => {
    instance.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.videoPlayer}
      nativeControls
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

// VIDEO POST
function VideoPost({ post }: { post: FeedPost }) {
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
          <Ionicons name="person" size={19} color={BLUE} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{author}</Text>
          <Text style={styles.postDate}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Ionicons name="videocam" size={20} color={GOLD} />
      </View>

      <MediaVideo uri={video.url} />

      {post.content ? (
        <Text style={styles.videoCaption}>{post.content}</Text>
      ) : null}
    </View>
  );
}

// MAIN HOME SCREEN
export default function HomeScreen() {
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

  // LOAD POSTS
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
        console.warn('BRITUME authentication check:', authError);
      }

      setUserId(currentUserId);

      const freshPosts = await withTimeout(fetchPublicPosts(), 15000);

      setPosts(freshPosts);
      setLoading(false);

      try {
        const freshInteractions = await withTimeout(
          fetchPostInteractions(
            freshPosts.map(post => post.id),
            currentUserId ?? undefined,
          ),
          15000,
        );

        setInteractions(freshInteractions);
      } catch (interactionError) {
        console.error('BRITUME interactions error:', interactionError);
        setInteractions({});
      }
    } catch (e) {
      console.error('BRITUME feed error:', e);

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

  // SEARCH POSTS
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

  // SEPARATE POST TYPES
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

  // REFRESH INTERACTIONS
  const refreshInteractions = async () => {
    if (!posts.length) return;

    const result = await withTimeout(
      fetchPostInteractions(
        posts.map(post => post.id),
        userId ?? undefined,
      ),
      15000,
    );

    setInteractions(result);
  };

  // LIKE POST
  const handleLike = async (postId: string) => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to like posts.');
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

  // SAVE POST
  const handleSave = async (postId: string) => {
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to save posts.');
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

  // SHARE POST
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

  // OPEN COMMENTS
  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentText('');
    setComments([]);
    setCommentsLoading(true);

    try {
      const result = await withTimeout(
        fetchCommentsForPost(postId),
        15000,
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

  // SEND COMMENT
  const submitComment = async () => {
    if (!activePostId || !userId) {
      Alert.alert('Sign in required', 'Please sign in to comment.');
      return;
    }

    const content = commentText.trim();
    if (!content) return;

    setSendingComment(true);

    try {
      await withTimeout(
        createComment(activePostId, userId, content),
        15000,
      );

      setCommentText('');

      const result = await withTimeout(
        fetchCommentsForPost(activePostId),
        15000,
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
          style={styles.brandMark}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.brandLetter}>B</Text>
          <View style={styles.brandCrown}>
            <Ionicons name="sparkles" size={11} color={GOLD} />
          </View>
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
          style={styles.topButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Ionicons name="add-circle" size={27} color={GOLD} />
        </Pressable>

        <Pressable
          style={styles.topButton}
          onPress={() => router.push('/(tabs)/discover')}
        >
          <Ionicons name="people-outline" size={24} color={theme.text} />
        </Pressable>

        <Pressable
          style={styles.topButton}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={theme.text}
          />
        </Pressable>

        <Pressable
          style={styles.topButton}
          onPress={() => router.push('/(tabs)/more')}
        >
          <Ionicons name="menu" size={27} color={theme.text} />
        </Pressable>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={21} color={theme.muted} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search BRITUME..."
          placeholderTextColor={theme.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />

        <Pressable onPress={() => router.push('/(tabs)/discover')}>
          <Ionicons name="options-outline" size={22} color={GOLD} />
        </Pressable>
      </View>

      {/* STORIES */}
      <View style={styles.sectionHeading}>
        <View style={styles.headingWithIcon}>
          <Ionicons name="aperture-outline" size={21} color={GOLD} />
          <Text style={styles.sectionTitle}>Stories</Text>
        </View>

        <Pressable
          style={styles.seeAll}
          onPress={() => router.push('/stories')}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={16} color={GOLD} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storiesScroll}
        contentContainerStyle={styles.storiesContent}
      >
        <Pressable
          style={styles.storyItem}
          onPress={() => router.push('/(tabs)/create')}
        >
          <View style={styles.myStoryCircle}>
            <Ionicons name="add" size={29} color={WHITE} />
          </View>
          <Text style={styles.storyLabel}>Your Story</Text>
        </Pressable>

        {['Friends', 'Creators', 'Community', 'Explore'].map(
          (label, index) => (
            <Pressable
              key={label}
              style={styles.storyItem}
              onPress={() => router.push('/stories')}
            >
              <View
                style={[
                  styles.storyCircle,
                  {
                    borderColor: index % 2 === 0 ? BLUE : PURPLE,
                  },
                ]}
              >
                <Ionicons
                  name={
                    index === 0
                      ? 'person'
                      : index === 1
                        ? 'star'
                        : index === 2
                          ? 'people'
                          : 'compass'
                  }
                  size={23}
                  color={index % 2 === 0 ? BLUE : PURPLE}
                />
              </View>

              <Text style={styles.storyLabel}>{label}</Text>
            </Pressable>
          ),
        )}
      </ScrollView>

      {/* POSTS HEADING */}
      <View style={styles.sectionHeading}>
        <View style={styles.headingWithIcon}>
          <Ionicons name="grid-outline" size={21} color={GOLD} />
          <Text style={styles.sectionTitle}>Posts</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Ionicons name="add-circle" size={27} color={GOLD} />
        </Pressable>
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

  // RENDER INDIVIDUAL POST
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
            <Ionicons name="person" size={19} color={BLUE} />
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
              size={19}
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

        {/* POST ACTIONS */}
        <View style={styles.postActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => void handleLike(item.id)}
            disabled={busyPosts.includes(item.id)}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={21}
              color={liked ? '#FF5478' : theme.muted}
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
              size={20}
              color={theme.muted}
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
              size={20}
              color={theme.muted}
            />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => void handleSave(item.id)}
            disabled={busyPosts.includes(item.id)}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? GOLD : theme.muted}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  // VIDEO AND REEL SECTIONS
  const renderVideoSection = (
    title: string,
    data: FeedPost[],
    kind: 'video' | 'reel',
  ) => (
    <View style={styles.mediaSection}>
      <View style={styles.sectionHeading}>
        <View style={styles.headingWithIcon}>
          <Ionicons
            name={kind === 'reel' ? 'play-circle' : 'videocam'}
            size={22}
            color={kind === 'reel' ? PURPLE : BLUE}
          />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Ionicons name="add-circle" size={27} color={GOLD} />
        </Pressable>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyMedia}>
          <Ionicons
            name={
              kind === 'reel'
                ? 'play-circle-outline'
                : 'videocam-outline'
            }
            size={30}
            color={kind === 'reel' ? PURPLE : BLUE}
          />

          <Text style={styles.emptyMediaTitle}>
            No {kind === 'reel' ? 'Reels' : 'videos'} yet
          </Text>

          <Text style={styles.emptyMediaText}>
            Be the first to share one with BRITUME.
          </Text>
        </View>
      ) : (
        data.map(post => <VideoPost key={post.id} post={post} />)
      )}
    </View>
  );

  // MAIN SCREEN
  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Loading BRITUME...</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void loadPosts()}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null}
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
              tintColor={BLUE}
              colors={[BLUE]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="images-outline" size={40} color={BLUE} />

              <Text style={styles.emptyTitle}>
                {search.trim() ? 'No matching posts' : 'Welcome to BRITUME'}
              </Text>

              <Text style={styles.emptyText}>
                {search.trim()
                  ? 'Try searching for something else.'
                  : 'Your community starts here. Share your first post!'}
              </Text>

              {!search.trim() ? (
                <Pressable
                  style={styles.primaryButton}
                  onPress={() => router.push('/(tabs)/create')}
                >
                  <Ionicons name="add" size={22} color={WHITE} />
                  <Text style={styles.primaryButtonText}>Create post</Text>
                </Pressable>
              ) : null}
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
                <Ionicons name="chatbubbles" size={22} color={GOLD} />
                <Text style={styles.modalTitle}>Comments</Text>
              </View>

              <Pressable onPress={() => setActivePostId(null)}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={theme.muted}
                />
              </Pressable>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color={BLUE} />
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
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.avatar}>
                        <Ionicons name="person" size={16} color={BLUE} />
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
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Ionicons name="send" size={19} color={WHITE} />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// =========================================
// BRITUME — ELECTRIC AI GLASS STYLES
// =========================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070B1B',
  },

  content: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 30,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#070B1B',
    padding: 20,
  },

  loadingText: {
    color: '#A8B6D1',
    marginTop: 12,
    fontWeight: '600',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  brandMark: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#102C53',
    borderWidth: 1.5,
    borderColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  brandLetter: {
    color: WHITE,
    fontSize: 25,
    fontWeight: '900',
  },

  brandCrown: {
    position: 'absolute',
    top: -6,
    right: -5,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#242345',
    borderWidth: 1,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: {
    flex: 1,
    marginLeft: 9,
  },

  brandName: {
    color: WHITE,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },

  tagline: {
    color: '#45B5FF',
    fontSize: 9,
    fontWeight: '700',
  },

  byline: {
    color: '#A8B6D1',
    fontSize: 9,
  },

  topButton: {
    padding: 5,
    marginLeft: 2,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 39, 71, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(69, 181, 255, 0.35)',
    borderRadius: 18,
    paddingHorizontal: 12,
    marginBottom: 22,
    shadowColor: BLUE,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },

  searchInput: {
    flex: 1,
    color: WHITE,
    paddingHorizontal: 9,
    paddingVertical: 12,
    fontSize: 13,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  headingWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  sectionTitle: {
    color: WHITE,
    fontSize: 19,
    fontWeight: '800',
  },

  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  seeAllText: {
    color: GOLD,
    fontSize: 12,
    fontWeight: '700',
  },

  addButton: {
    paddingHorizontal: 3,
  },

  storiesScroll: {
    marginBottom: 23,
  },

  storiesContent: {
    paddingRight: 5,
    gap: 15,
  },

  storyItem: {
    width: 65,
    alignItems: 'center',
  },

  myStoryCircle: {
    width: 59,
    height: 59,
    borderRadius: 30,
    backgroundColor: '#1256A0',
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },

  storyCircle: {
    width: 59,
    height: 59,
    borderRadius: 30,
    borderWidth: 2,
    backgroundColor: '#111C38',
    alignItems: 'center',
    justifyContent: 'center',
  },

  storyLabel: {
    color: '#DCE8F0',
    fontSize: 10,
    marginTop: 6,
  },

  postRow: {
    justifyContent: 'space-between',
    gap: 9,
  },

  postCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(24, 39, 71, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(69, 181, 255, 0.30)',
    borderRadius: 19,
    padding: 10,
    marginBottom: 11,
    shadowColor: BLUE,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  avatar: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#182D51',
    borderWidth: 1,
    borderColor: 'rgba(69, 181, 255, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  postAuthor: {
    flex: 1,
    marginLeft: 7,
  },

  authorName: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 10,
  },

  postDate: {
    color: '#A8B6D1',
    fontSize: 9,
    marginTop: 2,
  },

  postContent: {
    color: '#F1F5FF',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },

  imageScroller: {
    marginHorizontal: -10,
    marginBottom: 7,
  },

  postImage: {
    width: 155,
    height: 170,
    borderRadius: 11,
    marginHorizontal: 3,
    backgroundColor: '#182747',
  },

  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(168, 182, 209, 0.18)',
    paddingTop: 10,
    marginTop: 7,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  actionCount: {
    fontSize: 9,
    color: '#A8B6D1',
  },

  mediaSection: {
    marginTop: 21,
  },

  videoPostCard: {
    backgroundColor: 'rgba(24, 39, 71, 0.84)',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(137, 92, 255, 0.38)',
    padding: 11,
    marginBottom: 14,
    shadowColor: PURPLE,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },

  videoPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },

  videoPlayer: {
    width: '100%',
    height: 230,
    backgroundColor: '#050916',
    borderRadius: 13,
  },

  videoCaption: {
    color: '#F1F5FF',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },

  emptyMedia: {
    backgroundColor: 'rgba(24, 39, 71, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(137, 92, 255, 0.32)',
    borderRadius: 18,
    padding: 23,
    alignItems: 'center',
    marginBottom: 11,
  },

  emptyMediaTitle: {
    color: WHITE,
    fontWeight: '800',
    marginTop: 8,
  },

  emptyMediaText: {
    color: '#A8B6D1',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },

  emptyBox: {
    backgroundColor: 'rgba(24, 39, 71, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(69, 181, 255, 0.30)',
    borderRadius: 19,
    padding: 22,
    alignItems: 'center',
    marginBottom: 13,
  },

  emptyTitle: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },

  emptyText: {
    color: '#A8B6D1',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },

  primaryButton: {
    backgroundColor: BLUE,
    borderWidth: 1,
    borderColor: '#65C3FF',
    borderRadius: 23,
    paddingHorizontal: 19,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 14,
    shadowColor: BLUE,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },

  primaryButtonText: {
    color: WHITE,
    fontWeight: '800',
  },

  errorBox: {
    backgroundColor: 'rgba(255, 91, 110, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 91, 110, 0.35)',
    padding: 12,
    borderRadius: 13,
    marginBottom: 12,
  },

  errorText: {
    color: '#FF8795',
    marginBottom: 5,
  },

  retryText: {
    color: GOLD,
    fontWeight: '800',
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },

  commentsPanel: {
    height: '70%',
    backgroundColor: '#0C142A',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 1,
    borderColor: 'rgba(69, 181, 255, 0.45)',
    padding: 16,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(168, 182, 209, 0.20)',
  },

  modalTitle: {
    color: WHITE,
    fontSize: 19,
    fontWeight: '900',
  },

  commentsList: {
    flex: 1,
    paddingVertical: 12,
  },

  noComments: {
    color: '#A8B6D1',
    textAlign: 'center',
    marginTop: 30,
  },

  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: 'rgba(24, 39, 71, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(69, 181, 255, 0.20)',
    padding: 11,
    borderRadius: 14,
    marginBottom: 9,
  },

  commentAuthor: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
  },

  commentContent: {
    color: '#DCE8F0',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },

  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(168, 182, 209, 0.20)',
    paddingTop: 12,
  },

  commentInput: {
    flex: 1,
    minHeight: 43,
    maxHeight: 90,
    backgroundColor: '#182747',
    borderWidth: 1,
    borderColor: 'rgba(69, 181, 255, 0.35)',
    borderRadius: 19,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: WHITE,
  },

  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: BLUE,
    borderWidth: 1,
    borderColor: '#65C3FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
});
