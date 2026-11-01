
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

const BLUE = '#168BFF';
const DARK_BLUE = '#0756B5';
const GOLD = '#FFD447';
const PURPLE = '#8C83FF';
const WHITE = '#FFFFFF';

const C = {
  bg: '#F2F8FF',
  panel: '#E4F1FF',
  text: '#19334D',
  muted: '#66829B',
  border: '#D3E6F8',
};

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
          <Ionicons name="person" size={20} color={BLUE} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{author}</Text>
          <Text style={styles.postDate}>
            {new Date(post.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Ionicons name="videocam" size={24} color={PURPLE} />
      </View>

      <MediaVideo uri={video.url} />

      {post.content ? (
        <Text style={styles.videoCaption}>{post.content}</Text>
      ) : null}
    </View>
  );
}

const storyCards = [
  {
    label: 'Friends',
    subtitle: 'Your people',
    icon: 'people-outline' as const,
    backgroundColor: '#DCEEFF',
    iconColor: BLUE,
  },
  {
    label: 'Creators',
    subtitle: 'Creative moments',
    icon: 'star-outline' as const,
    backgroundColor: '#EAE5FF',
    iconColor: PURPLE,
  },
  {
    label: 'Community',
    subtitle: 'Together',
    icon: 'globe-outline' as const,
    backgroundColor: '#DDF7F0',
    iconColor: '#229B83',
  },
  {
    label: 'Explore',
    subtitle: 'Discover more',
    icon: 'compass-outline' as const,
    backgroundColor: '#FFF0D9',
    iconColor: '#D58B20',
  },
];

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

  // SEARCH

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
    );

    setInteractions(result);
  };

  // LIKE

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

  // SAVE

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

  // SHARE

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

  // COMMENTS

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
          <Ionicons name="search" size={22} color={BLUE} />
        </Pressable>

        <Pressable
          style={styles.topButtonLight}
          onPress={() => router.push('/notifications')}
          accessibilityLabel="Notifications"
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={BLUE}
          />
        </Pressable>

        <Pressable
          style={styles.topButtonLight}
          onPress={() => router.push('/(tabs)/more')}
          accessibilityLabel="More menu"
        >
          <Ionicons name="menu" size={25} color={BLUE} />
        </Pressable>
      </View>

      {/* SEARCH */}

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={21} color={BLUE} />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search people, posts and communities..."
          placeholderTextColor={C.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />

        <Pressable
          onPress={() => router.push('/(tabs)/discover')}
          accessibilityLabel="Search filters"
        >
          <Ionicons name="options-outline" size={22} color={PURPLE} />
        </Pressable>
      </View>

      {/* LARGE STORY CARDS */}

      <View style={styles.sectionHeading}>
        <View style={styles.headingWithIcon}>
          <Ionicons name="aperture-outline" size={23} color={BLUE} />
          <Text style={styles.sectionTitle}>Stories</Text>
        </View>

        <Pressable
          style={styles.seeAll}
          onPress={() => router.push('/stories')}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={16} color={BLUE} />
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
              <Ionicons name="person" size={25} color={BLUE} />
            </View>
            <View style={styles.storyStatus}>
              <Ionicons name="add" size={17} color={WHITE} />
            </View>
          </View>

          <View style={styles.storyCardBottom}>
            <Text style={styles.storyCardTitle}>Your Story</Text>
            <Text style={styles.storyCardSubtitle}>
              Share a moment
            </Text>
          </View>
        </Pressable>

        {storyCards.map(card => (
          <Pressable
            key={card.label}
            style={[
              styles.storyCard,
              { backgroundColor: card.backgroundColor },
            ]}
            onPress={() => router.push('/stories')}
          >
            <View style={styles.storyCardTop}>
              <View
                style={[
                  styles.storyIconCircle,
                  { borderColor: WHITE },
                ]}
              >
                <Ionicons
                  name={card.icon}
                  size={31}
                  color={card.iconColor}
                />
              </View>
            </View>

            <View style={styles.storyCardBottom}>
              <Text style={styles.storyCardTitle}>{card.label}</Text>
              <Text style={styles.storyCardSubtitle}>
                {card.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* POSTS HEADING */}

      <View style={styles.sectionHeading}>
        <View style={styles.headingWithIcon}>
          <Ionicons name="grid-outline" size={22} color={BLUE} />
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
              size={20}
              color={C.muted}
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
              color={liked ? '#FF5478' : BLUE}
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
              color={BLUE}
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
              color={BLUE}
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
              color={saved ? GOLD : BLUE}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  // VIDEO AND REELS SECTIONS

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
            size={23}
            color={kind === 'reel' ? PURPLE : BLUE}
          />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyMedia}>
          <Ionicons
            name={
              kind === 'reel'
                ? 'play-circle-outline'
                : 'videocam-outline'
            }
            size={34}
            color={BLUE}
          />

          <Text style={styles.emptyMediaTitle}>
            No {kind === 'reel' ? 'Reels' : 'videos'} yet
          </Text>

          <Text style={styles.emptyMediaText}>
            Be the first to share one with BRITUME.
          </Text>
        </View>
      ) : (
        data.map(post => (
          <VideoPost key={post.id} post={post} />
        ))
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
              <Ionicons
                name="images-outline"
                size={43}
                color={BLUE}
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
                  color={BLUE}
                />
                <Text style={styles.modalTitle}>Comments</Text>
              </View>

              <Pressable onPress={() => setActivePostId(null)}>
                <Ionicons
                  name="close-circle"
                  size={29}
                  color={C.muted}
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
                    <View
                      key={comment.id}
                      style={styles.commentCard}
                    >
                      <View style={styles.avatar}>
                        <Ionicons
                          name="person"
                          size={17}
                          color={BLUE}
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
                placeholderTextColor={C.muted}
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

// STYLES

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 35,
  },

  loading: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    color: C.text,
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
    color: DARK_BLUE,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },

  tagline: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '900',
  },

  byline: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '700',
  },

  topButtonLight: {
    width: 38,
    height: 38,
    borderRadius: 15,
    backgroundColor: C.panel,
    borderWidth: 2,
    borderColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    elevation: 7,
    shadowColor: '#548BCB',
    shadowOpacity: 0.27,
    shadowRadius: 8,
    shadowOffset: { width: 4, height: 5 },
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.panel,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: WHITE,
    paddingHorizontal: 15,
    marginBottom: 25,
    elevation: 9,
    shadowColor: '#548BCB',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 6, height: 8 },
  },

  searchInput: {
    flex: 1,
    color: C.text,
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
    color: C.text,
    fontSize: 19,
    fontWeight: '900',
  },

  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.panel,
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: WHITE,
    elevation: 5,
  },

  seeAllText: {
    color: BLUE,
    fontSize: 11,
    fontWeight: '900',
  },

  storiesScroll: {
    marginBottom: 24,
  },

  storiesContent: {
    paddingHorizontal: 3,
    paddingBottom: 9,
    gap: 12,
  },

  storyCard: {
    width: 116,
    height: 174,
    borderRadius: 21,
    borderWidth: 3,
    borderColor: WHITE,
    padding: 9,
    justifyContent: 'space-between',
    overflow: 'hidden',
    elevation: 9,
    shadowColor: '#548BCB',
    shadowOpacity: 0.28,
    shadowRadius: 9,
    shadowOffset: { width: 4, height: 6 },
  },

  yourStoryCard: {
    backgroundColor: '#CDE7FF',
  },

  storyCardTop: {
    alignItems: 'flex-start',
  },

  storyAvatar: {
    width: 49,
    height: 49,
    borderRadius: 18,
    backgroundColor: WHITE,
    borderWidth: 2,
    borderColor: WHITE,
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
    backgroundColor: BLUE,
    borderWidth: 2,
    borderColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  storyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  storyCardBottom: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 8,
  },

  storyCardTitle: {
    color: C.text,
    fontSize: 12,
    fontWeight: '900',
  },

  storyCardSubtitle: {
    color: C.muted,
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
    backgroundColor: C.panel,
    borderWidth: 2,
    borderTopColor: WHITE,
    borderLeftColor: WHITE,
    borderRightColor: '#C7E0FA',
    borderBottomColor: '#BDD9F5',
    borderRadius: 24,
    padding: 11,
    marginBottom: 16,
    elevation: 12,
    shadowColor: '#548BCB',
    shadowOpacity: 0.32,
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
    backgroundColor: '#D6EAFF',
    borderWidth: 2,
    borderColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },

  postAuthor: {
    flex: 1,
    marginLeft: 8,
  },

  authorName: {
    color: C.text,
    fontWeight: '900',
    fontSize: 11,
  },

  postDate: {
    color: C.muted,
    fontSize: 9,
    marginTop: 3,
    fontWeight: '600',
  },

  postContent: {
    color: C.text,
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
    backgroundColor: '#D6EAFF',
    borderWidth: 2,
    borderColor: WHITE,
  },

  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#C7DFF5',
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
    backgroundColor: '#EFF7FF',
    paddingHorizontal: 5,
    elevation: 3,
    shadowColor: '#548BCB',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 3 },
  },

  actionCount: {
    fontSize: 9,
    color: C.text,
    fontWeight: '900',
  },

  mediaSection: {
    marginTop: 23,
  },

  videoPostCard: {
    backgroundColor: C.panel,
    borderRadius: 25,
    borderWidth: 2,
    borderTopColor: WHITE,
    borderLeftColor: WHITE,
    borderRightColor: '#C7E0FA',
    borderBottomColor: '#BDD9F5',
    padding: 13,
    marginBottom: 16,
    elevation: 12,
    shadowColor: '#548BCB',
    shadowOpacity: 0.3,
    shadowRadius: 13,
    shadowOffset: { width: 7, height: 9 },
  },

  videoPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 9,
  },

  videoPlayer: {
    width: '100%',
    height: 230,
    backgroundColor: C.text,
    borderRadius: 19,
    overflow: 'hidden',
  },

  videoCaption: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 12,
  },

  emptyMedia: {
    backgroundColor: C.panel,
    borderWidth: 2,
    borderColor: WHITE,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    marginBottom: 14,
    elevation: 9,
    shadowColor: '#548BCB',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 5, height: 7 },
  },

  emptyMediaTitle: {
    color: C.text,
    fontWeight: '900',
    marginTop: 10,
  },

  emptyMediaText: {
    color: C.muted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },

  emptyBox: {
    backgroundColor: C.panel,
    borderWidth: 2,
    borderColor: WHITE,
    borderRadius: 26,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 10,
    shadowColor: '#548BCB',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 6, height: 8 },
  },

  emptyTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
  },

  emptyText: {
    color: C.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },

  errorBox: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1.5,
    borderColor: '#FFD0D0',
    padding: 14,
    borderRadius: 18,
    marginBottom: 13,
    elevation: 3,
  },

  errorText: {
    color: '#C52E45',
    marginBottom: 6,
    fontWeight: '700',
  },

  retryText: {
    color: BLUE,
    fontWeight: '900',
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(25, 51, 77, 0.48)',
  },

  commentsPanel: {
    height: '70%',
    backgroundColor: C.bg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderTopWidth: 3,
    borderColor: WHITE,
    padding: 17,
    elevation: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  modalTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '900',
  },

  commentsList: {
    flex: 1,
    paddingVertical: 13,
  },

  noComments: {
    color: C.muted,
    textAlign: 'center',
    marginTop: 30,
    fontWeight: '700',
  },

  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: C.panel,
    borderWidth: 1.5,
    borderColor: WHITE,
    padding: 12,
    borderRadius: 18,
    marginBottom: 11,
    elevation: 5,
    shadowColor: '#548BCB',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 3, height: 4 },
  },

  commentAuthor: {
    color: C.text,
    fontSize: 12,
    fontWeight: '900',
  },

  commentContent: {
    color: '#45647F',
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },

  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 13,
  },

  commentInput: {
    flex: 1,
    minHeight: 45,
    maxHeight: 90,
    backgroundColor: C.panel,
    borderWidth: 2,
    borderColor: WHITE,
    borderRadius: 21,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.text,
    fontWeight: '600',
    elevation: 4,
  },

  sendButton: {
    width: 47,
    height: 47,
    borderRadius: 18,
    backgroundColor: BLUE,
    borderWidth: 2,
    borderColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 9,
    shadowColor: DARK_BLUE,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 4, height: 5 },
  },
});
