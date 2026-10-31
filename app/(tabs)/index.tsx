
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

type Interaction = {
  liked: boolean;
  saved: boolean;
  likesCount: number;
  commentsCount: number;
};

function MediaVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
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
  const video = post.media?.find(item => item.media_type === 'video');

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
      </View>

      <MediaVideo uri={video.url} />

      {post.content ? (
        <Text style={styles.videoCaption}>{post.content}</Text>
      ) : null}
    </View>
  );
}

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

  const loadPosts = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      let currentUserId: string | null = null;

      if (supabase) {
        const { data, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        currentUserId = data.user?.id ?? null;
      }

      setUserId(currentUserId);

      const freshPosts = await fetchPublicPosts();
      setPosts(freshPosts);

      const freshInteractions = await fetchPostInteractions(
        freshPosts.map(post => post.id),
        currentUserId ?? undefined,
      );

      setInteractions(freshInteractions);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not load BRITUME posts.',
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
    () => filteredPosts.filter(post =>
      post.post_type === 'text' ||
      post.post_type === 'photo'
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

    const result = await fetchPostInteractions(
      posts.map(post => post.id),
      userId ?? undefined,
    );

    setInteractions(result);
  };

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
      const result = await fetchCommentsForPost(postId);
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
      Alert.alert('Sign in required', 'Please sign in to comment.');
      return;
    }

    const content = commentText.trim();
    if (!content) return;

    setSendingComment(true);

    try {
      await createComment(activePostId, userId, content);
      setCommentText('');

      const result = await fetchCommentsForPost(activePostId);
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

  const Header = (
    <View>
      <View style={styles.topBar}>
        <Pressable
          style={styles.brandMark}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Text style={styles.brandLetter}>B</Text>
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
          <Ionicons name="add-circle" size={27} color={BLUE} />
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
          <Ionicons name="options-outline" size={22} color={BLUE} />
        </Pressable>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Stories</Text>
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
          style={styles.storyItem}
          onPress={() => router.push('/(tabs)/create')}
        >
          <View style={styles.myStoryCircle}>
            <Ionicons name="add" size={29} color="#FFFFFF" />
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
                  { borderColor: index % 2 === 0 ? BLUE : theme.purple },
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
                  color={BLUE}
                />
              </View>
              <Text style={styles.storyLabel}>{label}</Text>
            </Pressable>
          ),
        )}
      </ScrollView>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Posts</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Ionicons name="add-circle" size={26} color={BLUE} />
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
                { text: 'Cancel', style: 'cancel' },
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

        <View style={styles.postActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => void handleLike(item.id)}
            disabled={busyPosts.includes(item.id)}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={21}
              color={liked ? '#E84C75' : theme.muted}
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
              color={saved ? BLUE : theme.muted}
            />
          </Pressable>
        </View>
      </View>
    );
  };

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
            color={BLUE}
          />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        <Pressable
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Ionicons name="add-circle" size={26} color={BLUE} />
        </Pressable>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyMedia}>
          <Ionicons
            name={kind === 'reel' ? 'play-circle-outline' : 'videocam-outline'}
            size={30}
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
        data.map(post => <VideoPost key={post.id} post={post} />)
      )}
    </View>
  );

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
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Create post</Text>
                </Pressable>
              ) : null}
            </View>
          }
          renderItem={renderPost}
        />
      )}

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
              <Text style={styles.modalTitle}>Comments</Text>
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 25 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  loadingText: { color: theme.muted, marginTop: 12 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  brandMark: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  brandText: { flex: 1, marginLeft: 8 },
  brandName: { color: theme.text, fontSize: 17, fontWeight: '900' },
  tagline: { color: theme.muted, fontSize: 9 },
  byline: { color: theme.muted, fontSize: 9 },
  topButton: { padding: 4, marginLeft: 3 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    paddingHorizontal: 9,
    paddingVertical: 12,
    fontSize: 13,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  headingWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { color: theme.text, fontSize: 19, fontWeight: '800' },
  seeAll: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { color: BLUE, fontSize: 12, fontWeight: '700' },
  addButton: { paddingHorizontal: 3 },
  storiesScroll: { marginBottom: 21 },
  storiesContent: { paddingRight: 5, gap: 15 },
  storyItem: { width: 65, alignItems: 'center' },
  myStoryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BLUE,
    borderWidth: 2,
    borderColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyLabel: { color: theme.text, fontSize: 10, marginTop: 5 },
  postRow: { justifyContent: 'space-between', gap: 8 },
  postCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 9,
    marginBottom: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: theme.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthor: { flex: 1, marginLeft: 6 },
  authorName: { color: theme.text, fontWeight: '800', fontSize: 10 },
  postDate: { color: theme.muted, fontSize: 9, marginTop: 2 },
  postContent: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  imageScroller: {
    marginHorizontal: -9,
    marginBottom: 7,
  },
  postImage: {
    width: 155,
    height: 170,
    borderRadius: 10,
    marginHorizontal: 3,
    backgroundColor: theme.panel2,
  },
  mediaGallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 7,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 10,
    marginTop: 7,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionCount: { fontSize: 9, color: theme.muted },
  mediaSection: { marginTop: 20 },
  videoPostCard: {
    backgroundColor: theme.panel,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 10,
    marginBottom: 13,
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
    backgroundColor: '#101820',
    borderRadius: 12,
  },
  videoCaption: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  emptyMedia: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyMediaTitle: {
    color: theme.text,
    fontWeight: '800',
    marginTop: 8,
  },
  emptyMediaText: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 17,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 9,
  },
  emptyText: {
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 13,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  errorBox: {
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: { color: theme.danger, marginBottom: 5 },
  retryText: { color: BLUE, fontWeight: '800' },
  modalBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  commentsPanel: {
    height: '70%',
    backgroundColor: theme.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: { color: theme.text, fontSize: 19, fontWeight: '900' },
  commentsList: { flex: 1, paddingVertical: 12 },
  noComments: { color: theme.muted, textAlign: 'center', marginTop: 30 },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: theme.panel,
    padding: 11,
    borderRadius: 13,
    marginBottom: 9,
  },
  commentAuthor: { color: theme.text, fontSize: 11, fontWeight: '800' },
  commentContent: {
    color: theme.text,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 19,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    minHeight: 43,
    maxHeight: 90,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: theme.text,
  },
  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
