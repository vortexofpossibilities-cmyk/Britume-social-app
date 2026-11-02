import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';

import { useAuth } from '../src/auth/AuthProvider';
import {
  fetchPublicPosts,
  fetchPostInteractions,
  fetchCommentsForPost,
  createComment,
  toggleSave,
  type FeedPost,
  type PostComment,
} from '../src/lib/posts';

import { supabase } from '../src/lib/supabase';
import { theme } from '../src/lib/theme';

type Interaction = {
  liked: boolean;
  saved: boolean;
  likesCount: number;
  commentsCount: number;
};

function VideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, instance => {
    instance.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.player}
      nativeControls
      contentFit="contain"
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      style={styles.actionButton}
      onPress={onPress}
    >
      <View
        style={[
          styles.actionIcon,
          active && styles.actionIconActive,
        ]}
      >
        <Ionicons
          name={icon}
          size={19}
          color={active ? theme.blueDark : theme.cyan}
        />
      </View>

      <Text style={styles.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={23} color={theme.cyan} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons
        name="videocam-off-outline"
        size={35}
        color={theme.cyan}
      />

      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export default function VideosScreen() {
  const { session } = useAuth();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [interactions, setInteractions] = useState<
    Record<string, Interaction>
  >({});

  const [following, setFollowing] = useState<string[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [likedOnly, setLikedOnly] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const [busyIds, setBusyIds] = useState<string[]>([]);

  const loadVideos = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const allPosts = await fetchPublicPosts();

      const videoPosts = allPosts.filter(post =>
        (post.post_type === 'video' ||
          post.post_type === 'reel') &&
        post.media?.some(media => media.media_type === 'video')
      );

      setPosts(videoPosts);

      const userId = session?.user.id;

      const [counts, likesResult, followsResult] = await Promise.all([
        fetchPostInteractions(
          videoPosts.map(post => post.id),
          userId
        ),

        userId && supabase
          ? supabase
              .from('post_likes')
              .select('post_id')
              .eq('user_id', userId)
          : Promise.resolve({ data: [], error: null }),

        userId && supabase
          ? supabase
              .from('user_follows')
              .select('following_id')
              .eq('follower_id', userId)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (likesResult.error) throw likesResult.error;
      if (followsResult.error) throw followsResult.error;

      setInteractions(
        counts as Record<string, Interaction>
      );

      setLikedIds(
        (likesResult.data || []).map(
          (item: { post_id: string }) => item.post_id
        )
      );

      setFollowing(
        (followsResult.data || []).map(
          (item: { following_id: string }) => item.following_id
        )
      );
    } catch (error: any) {
      Alert.alert(
        'Videos could not load',
        error?.message || 'Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      void loadVideos();
    }, [loadVideos])
  );

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return posts.filter(post => {
      const author =
        post.author?.display_name ||
        post.author?.username ||
        '';

      const matchesSearch =
        !query ||
        (post.content || '').toLowerCase().includes(query) ||
        author.toLowerCase().includes(query);

      const matchesLiked =
        !likedOnly || likedIds.includes(post.id);

      return matchesSearch && matchesLiked;
    });
  }, [posts, search, likedOnly, likedIds]);

  const reels = visiblePosts.filter(
    post => post.post_type === 'reel'
  );

  const videos = visiblePosts.filter(
    post => post.post_type === 'video'
  );

  const markBusy = (id: string, busy: boolean) => {
    setBusyIds(current =>
      busy
        ? [...current, id]
        : current.filter(item => item !== id)
    );
  };

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentsLoading(true);

    try {
      const result = await fetchCommentsForPost(postId);
      setComments(result);
    } catch (error: any) {
      Alert.alert(
        'Comments unavailable',
        error?.message || 'Please try again.'
      );
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendComment = async () => {
    if (!session) {
      Alert.alert('Sign in required', 'Please sign in to comment.');
      return;
    }

    if (!activePostId || !commentText.trim()) return;

    setSendingComment(true);

    try {
      await createComment(
        activePostId,
        session.user.id,
        commentText
      );

      setCommentText('');

      const updatedComments =
        await fetchCommentsForPost(activePostId);

      setComments(updatedComments);

      const updatedCounts = await fetchPostInteractions(
        posts.map(post => post.id),
        session.user.id
      );

      setInteractions(
        updatedCounts as Record<string, Interaction>
      );
    } catch (error: any) {
      Alert.alert(
        'Comment failed',
        error?.message || 'Please try again.'
      );
    } finally {
      setSendingComment(false);
    }
  };

  const saveVideo = async (post: FeedPost) => {
    if (!session) {
      Alert.alert('Sign in required', 'Sign in to save videos.');
      return;
    }

    const current = interactions[post.id] || {
      liked: false,
      saved: false,
      likesCount: 0,
      commentsCount: 0,
    };

    if (busyIds.includes(post.id)) return;

    markBusy(post.id, true);

    try {
      await toggleSave(
        post.id,
        session.user.id,
        current.saved
      );

      setInteractions(previous => ({
        ...previous,
        [post.id]: {
          ...current,
          saved: !current.saved,
        },
      }));
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message || 'Please try again.'
      );
    } finally {
      markBusy(post.id, false);
    }
  };

  const subscribeToCreator = async (post: FeedPost) => {
    if (!session) {
      Alert.alert(
        'Sign in required',
        'Sign in to subscribe to creators.'
      );
      return;
    }

    if (post.user_id === session.user.id) {
      Alert.alert(
        'Your video',
        'You cannot subscribe to your own account.'
      );
      return;
    }

    if (!supabase) return;
    if (busyIds.includes(post.id)) return;

    const isFollowing = following.includes(post.user_id);

    markBusy(post.id, true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('following_id', post.user_id);

        if (error) throw error;

        setFollowing(current =>
          current.filter(id => id !== post.user_id)
        );
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: session.user.id,
            following_id: post.user_id,
          });

        if (error) throw error;

        setFollowing(current => [
          ...current,
          post.user_id,
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        'Subscription failed',
        error?.message || 'Please try again.'
      );
    } finally {
      markBusy(post.id, false);
    }
  };

  const shareVideo = async (post: FeedPost) => {
    const media = post.media?.find(
      item => item.media_type === 'video'
    );

    try {
      await Share.share({
        message: [
          post.content || 'Watch this video on BRITUME!',
          media?.url || '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      });
    } catch (error: any) {
      Alert.alert(
        'Share failed',
        error?.message || 'Please try again.'
      );
    }
  };

  const downloadVideo = async (post: FeedPost) => {
    const media = post.media?.find(
      item => item.media_type === 'video'
    );

    if (!media?.url) return;

    try {
      await Linking.openURL(media.url);

      Alert.alert(
        'Video opened',
        'Your video has opened. Use the browser or video player download option if available.'
      );
    } catch (error: any) {
      Alert.alert(
        'Could not open video',
        error?.message || 'Please try again.'
      );
    }
  };

  const renderVideo = (
    post: FeedPost,
    isReel: boolean
  ) => {
    const media = post.media?.find(
      item => item.media_type === 'video'
    );

    if (!media) return null;

    const author =
      post.author?.display_name ||
      post.author?.username ||
      'BRITUME member';

    const state = interactions[post.id];

    const isFollowing = following.includes(post.user_id);

    const busy = busyIds.includes(post.id);

    return (
      <View key={post.id} style={styles.videoCard}>
        {isReel ? (
          <View style={styles.reelLayout}>
            <View style={styles.actionRail}>
              <ActionButton
                icon="download-outline"
                label="Download"
                onPress={() => void downloadVideo(post)}
              />

              <ActionButton
                icon="share-social-outline"
                label="Share"
                onPress={() => void shareVideo(post)}
              />

              <ActionButton
                icon={
                  state?.saved
                    ? 'bookmark'
                    : 'bookmark-outline'
                }
                label="Save"
                active={!!state?.saved}
                onPress={() => void saveVideo(post)}
              />

              <ActionButton
                icon="chatbubble-ellipses-outline"
                label="Comment"
                onPress={() => void openComments(post.id)}
              />

              <ActionButton
                icon={
                  isFollowing
                    ? 'checkmark-circle'
                    : 'person-add-outline'
                }
                label={isFollowing ? 'Subscribed' : 'Subscribe'}
                active={isFollowing}
                onPress={() => void subscribeToCreator(post)}
              />
            </View>

            <View style={styles.reelContent}>
              <VideoPlayer uri={media.url} />

              <Text style={styles.creatorName}>
                {author}
              </Text>

              {!!post.content && (
                <Text style={styles.caption}>
                  {post.content}
                </Text>
              )}

              {busy && (
                <ActivityIndicator
                  color={theme.cyan}
                  style={{ marginTop: 7 }}
                />
              )}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.videoHeader}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person"
                  size={18}
                  color={theme.cyan}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.creatorName}>
                  {author}
                </Text>

                <Text style={styles.date}>
                  {new Date(
                    post.created_at
                  ).toLocaleDateString()}
                </Text>
              </View>

              <Pressable
                style={styles.headerIcon}
                onPress={() => void shareVideo(post)}
              >
                <Ionicons
                  name="share-social-outline"
                  size={20}
                  color={theme.cyan}
                />
              </Pressable>
            </View>

            <VideoPlayer uri={media.url} />

            {!!post.content && (
              <Text style={styles.videoCaption}>
                {post.content}
              </Text>
            )}

            <View style={styles.videoActions}>
              <ActionButton
                icon="download-outline"
                label="Download"
                onPress={() => void downloadVideo(post)}
              />

              <ActionButton
                icon="chatbubble-ellipses-outline"
                label={String(state?.commentsCount || 0)}
                onPress={() => void openComments(post.id)}
              />

              <ActionButton
                icon={
                  state?.saved
                    ? 'bookmark'
                    : 'bookmark-outline'
                }
                label="Save"
                active={!!state?.saved}
                onPress={() => void saveVideo(post)}
              />

              <ActionButton
                icon={
                  isFollowing
                    ? 'checkmark-circle'
                    : 'person-add-outline'
                }
                label={isFollowing ? 'Subscribed' : 'Subscribe'}
                active={isFollowing}
                onPress={() => void subscribeToCreator(post)}
              />
            </View>

            {busy && (
              <ActivityIndicator
                color={theme.cyan}
                style={{ marginTop: 7 }}
              />
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={[]}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadVideos(true)}
            tintColor={theme.cyan}
          />
        }
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {/* HEADER */}

            <View style={styles.header}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>B</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  BRITUME Videos
                </Text>

                <Text style={styles.subtitle}>
                  Vortex of Possibilities
                </Text>
              </View>

              <Pressable
                style={styles.headerButton}
                onPress={() =>
                  router.push('/(tabs)/create')
                }
              >
                <Ionicons
                  name="add"
                  size={26}
                  color={theme.cyan}
                />
              </Pressable>
            </View>

            {/* ONE LARGE CLAY TOOLBAR */}

            <View style={styles.toolbar}>
              <View style={styles.searchBox}>
                <Ionicons
                  name="search-outline"
                  size={19}
                  color={theme.muted}
                />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search videos and creators..."
                  placeholderTextColor={theme.muted}
                  style={styles.searchInput}
                />
              </View>

              <Pressable
                style={styles.toolButton}
                onPress={() =>
                  router.push('/(tabs)/create')
                }
              >
                <Ionicons
                  name="cloud-upload-outline"
                  size={21}
                  color={theme.cyan}
                />
                <Text style={styles.toolLabel}>
                  Upload
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.toolButton,
                  likedOnly && styles.toolActive,
                ]}
                onPress={() =>
                  setLikedOnly(value => !value)
                }
              >
                <Ionicons
                  name={
                    likedOnly
                      ? 'heart'
                      : 'heart-outline'
                  }
                  size={21}
                  color={
                    likedOnly
                      ? '#E84D78'
                      : theme.cyan
                  }
                />

                <Text style={styles.toolLabel}>
                  Liked
                </Text>
              </Pressable>
            </View>

            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator
                  size="large"
                  color={theme.cyan}
                />

                <Text style={styles.muted}>
                  Loading BRITUME videos...
                </Text>
              </View>
            ) : (
              <>
                <SectionHeading
                  title="Reels"
                  subtitle="Short moments from creators"
                  icon="play-circle"
                />

                {reels.length > 0 ? (
                  reels.map(post =>
                    renderVideo(post, true)
                  )
                ) : (
                  <EmptyState
                    text={
                      likedOnly
                        ? 'No liked Reels found.'
                        : 'No Reels yet. Upload your first Reel!'
                    }
                  />
                )}

                <SectionHeading
                  title="Videos"
                  subtitle="Videos from the BRITUME community"
                  icon="videocam"
                />

                {videos.length > 0 ? (
                  videos.map(post =>
                    renderVideo(post, false)
                  )
                ) : (
                  <EmptyState
                    text={
                      likedOnly
                        ? 'No liked videos found.'
                        : 'No videos yet. Share your first video!'
                    }
                  />
                )}

                {visiblePosts.length === 0 &&
                  search.trim().length > 0 && (
                    <EmptyState
                      text="No videos match your search. Try another name or keyword."
                    />
                  )}
              </>
            )}

            <Pressable
              style={styles.refreshButton}
              onPress={() => void loadVideos(true)}
            >
              <Ionicons
                name="refresh"
                size={18}
                color={theme.cyan}
              />

              <Text style={styles.refreshText}>
                Refresh videos
              </Text>
            </Pressable>
          </View>
        }
      />

      {/* COMMENTS MODAL */}

      <Modal
        visible={activePostId !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActivePostId(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackground}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Comments
              </Text>

              <Pressable
                onPress={() => setActivePostId(null)}
              >
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
              <FlatList
                data={comments}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <Text style={styles.muted}>
                    Be the first to comment.
                  </Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.commentCard}>
                    <Text style={styles.commentAuthor}>
                      {item.author?.display_name ||
                        item.author?.username ||
                        'BRITUME member'}
                    </Text>

                    <Text style={styles.commentText}>
                      {item.content}
                    </Text>
                  </View>
                )}
              />
            )}

            <View style={styles.commentComposer}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={theme.muted}
                style={styles.commentInput}
                multiline
                maxLength={500}
              />

              <Pressable
                style={styles.sendButton}
                onPress={() => void sendComment()}
                disabled={
                  sendingComment ||
                  !commentText.trim()
                }
              >
                {sendingComment ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name="send"
                    size={19}
                    color="#FFFFFF"
                  />
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
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  content: {
    padding: 15,
    paddingBottom: 45,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 20,
  },

  logo: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },

  logoText: {
    color: theme.cyan,
    fontSize: 30,
    fontWeight: '900',
  },

  title: {
    color: theme.text,
    fontSize: 21,
    fontWeight: '900',
  },

  subtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 3,
  },

  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    borderRadius: 22,
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginBottom: 23,
    ...theme.clayShadow,
  },

  searchBox: {
    flex: 1,
    minWidth: 80,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
  },

  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 11,
    paddingLeft: 7,
    paddingVertical: 8,
  },

  toolButton: {
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 5,
    borderRadius: 13,
  },

  toolActive: {
    backgroundColor: '#FFFFFF',
    ...theme.clayPressedStyle,
  },

  toolLabel: {
    color: theme.text,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 13,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },

  sectionTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 2,
  },

  videoCard: {
    padding: 11,
    borderRadius: 23,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginBottom: 19,
    ...theme.clayShadow,
  },

  reelLayout: {
    flexDirection: 'row',
    gap: 8,
    minHeight: 260,
  },

  actionRail: {
    width: 58,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },

  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 49,
    minHeight: 48,
  },

  actionIcon: {
    width: 35,
    height: 35,
    borderRadius: 13,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },

  actionIconActive: {
    backgroundColor: theme.clayPurple,
  },

  actionLabel: {
    color: theme.muted,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },

  reelContent: {
    flex: 1,
    minWidth: 0,
  },

  player: {
    width: '100%',
    height: 270,
    borderRadius: 17,
    overflow: 'hidden',
    backgroundColor: '#D5E6F5',
  },

  creatorName: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 9,
  },

  caption: {
    color: theme.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
  },

  avatar: {
    width: 37,
    height: 37,
    borderRadius: 14,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  date: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 2,
  },

  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  videoCaption: {
    color: theme.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },

  videoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },

  loading: {
    alignItems: 'center',
    padding: 35,
    gap: 10,
  },

  muted: {
    color: theme.muted,
    fontSize: 12,
    textAlign: 'center',
    padding: 12,
  },

  emptyCard: {
    minHeight: 105,
    borderRadius: 19,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 17,
    marginBottom: 17,
    gap: 8,
    ...theme.clayRaised,
  },

  emptyText: {
    color: theme.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  refreshButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 13,
  },

  refreshText: {
    color: theme.cyan,
    fontWeight: '800',
    fontSize: 12,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(15,35,55,0.38)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    maxHeight: '78%',
    minHeight: '48%',
    backgroundColor: theme.panel,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 18,
    gap: 12,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  modalTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '900',
  },

  commentCard: {
    backgroundColor: theme.clayBlue,
    borderRadius: 14,
    padding: 11,
    marginBottom: 9,
  },

  commentAuthor: {
    color: theme.text,
    fontWeight: '900',
    fontSize: 12,
  },

  commentText: {
    color: theme.text,
    fontSize: 13,
    marginTop: 4,
  },

  commentComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  commentInput: {
    flex: 1,
    minHeight: 43,
    maxHeight: 90,
    backgroundColor: theme.clayBlue,
    borderRadius: 14,
    padding: 11,
    color: theme.text,
  },

  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
