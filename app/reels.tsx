import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
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
  toggleLike,
  toggleSave,
  type FeedPost,
  type PostComment,
} from '../src/lib/posts';

import { supabase } from '../src/lib/supabase';
import { useAppTheme } from '../src/contexts/ThemeContext';

type Interaction = {
  liked: boolean;
  saved: boolean;
  likesCount: number;
  commentsCount: number;
};

const EMPTY_INTERACTION: Interaction = {
  liked: false,
  saved: false,
  likesCount: 0,
  commentsCount: 0,
};

function Reel({
  post,
  active,
  height,
  interaction,
  following,
  theme,
  styles,
  onLike,
  onSave,
  onComment,
  onShare,
  onDownload,
  onFollow,
  onMore,
}: {
  post: FeedPost;
  active: boolean;
  height: number;
  interaction: Interaction;
  following: boolean;
  theme: any;
  styles: ReturnType<typeof createStyles>;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onShare: () => void;
  onDownload: () => void;
  onFollow: () => void;
  onMore: () => void;
}) {
  const media = post.media?.find(
    item => item.media_type === 'video'
  );

  const uri = media?.url || '';

  const [paused, setPaused] = useState(false);

  const player = useVideoPlayer(uri, instance => {
    instance.loop = true;
    instance.muted = false;
  });

  useEffect(() => {
    if (!uri) return;

    if (active && !paused) {
      player.play();
    } else {
      player.pause();
    }

    return () => {
      player.pause();
    };
  }, [active, paused, player, uri]);

  useEffect(() => {
    if (!active) {
      setPaused(false);
    }
  }, [active]);

  const author =
    post.author?.display_name ||
    post.author?.username ||
    'BRITUME member';

  return (
    <View style={[styles.reelPage, { height }]}>
      {uri ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setPaused(value => !value)}
        >
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />

          {paused && (
            <View style={styles.playOverlay}>
              <Ionicons
                name="play"
                size={48}
                color="#FFFFFF"
              />
            </View>
          )}
        </Pressable>
      ) : (
        <View style={styles.noVideo}>
          <Ionicons
            name="videocam-off-outline"
            size={48}
            color="#FFFFFF"
          />

          <Text style={styles.noVideoText}>
            Video unavailable
          </Text>
        </View>
      )}

      <View
        pointerEvents="none"
        style={styles.topShade}
      />

      <View
        pointerEvents="none"
        style={styles.bottomShade}
      />

      <View style={styles.topBar}>
        <Pressable
          style={styles.glassButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#FFFFFF"
          />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>
            BRITUME REELS
          </Text>

          <Text style={styles.brandSubtitle}>
            Vortex of Possibilities
          </Text>
        </View>

        <Pressable
          style={styles.glassButton}
          onPress={onMore}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={23}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.details}>
          <View style={styles.creatorRow}>
            <View style={styles.avatar}>
              <Ionicons
                name="person"
                size={18}
                color={theme.cyan}
              />
            </View>

            <Text
              style={styles.creatorName}
              numberOfLines={1}
            >
              {author}
            </Text>

            <Pressable
              style={styles.followButton}
              onPress={onFollow}
            >
              <Text style={styles.followText}>
                {following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          </View>

          {!!post.content && (
            <Text
              style={styles.caption}
              numberOfLines={3}
            >
              {post.content}
            </Text>
          )}

          <Text style={styles.swipeHint}>
            Swipe up for more videos
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.action}
            onPress={onLike}
          >
            <Ionicons
              name={
                interaction.liked
                  ? 'heart'
                  : 'heart-outline'
              }
              size={30}
              color={
                interaction.liked
                  ? '#FF557B'
                  : '#FFFFFF'
              }
            />

            <Text style={styles.actionText}>
              {interaction.likesCount}
            </Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={onComment}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={28}
              color="#FFFFFF"
            />

            <Text style={styles.actionText}>
              {interaction.commentsCount}
            </Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={onShare}
          >
            <Ionicons
              name="paper-plane-outline"
              size={28}
              color="#FFFFFF"
            />

            <Text style={styles.actionText}>
              Share
            </Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={onSave}
          >
            <Ionicons
              name={
                interaction.saved
                  ? 'bookmark'
                  : 'bookmark-outline'
              }
              size={28}
              color={
                interaction.saved
                  ? '#A99CFF'
                  : '#FFFFFF'
              }
            />

            <Text style={styles.actionText}>
              Save
            </Text>
          </Pressable>

          <Pressable
            style={styles.action}
            onPress={onDownload}
          >
            <Ionicons
              name="download-outline"
              size={28}
              color="#FFFFFF"
            />

            <Text style={styles.actionText}>
              Download
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function VideosScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const { height } = useWindowDimensions();

  const [posts, setPosts] = useState<FeedPost[]>([]);

  const [interactions, setInteractions] = useState<
    Record<string, Interaction>
  >({});

  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activePostId, setActivePostId] = useState<string | null>(
    null
  );

  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const [busyIds, setBusyIds] = useState<string[]>([]);

  const listRef = useRef<FlatList<FeedPost>>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);

    try {
      const allPosts = await fetchPublicPosts();

      const videoPosts = allPosts.filter(post =>
        (
          post.post_type === 'video' ||
          post.post_type === 'reel'
        ) &&
        post.media?.some(
          media =>
            media.media_type === 'video' &&
            !!media.url
        )
      );

      setPosts(videoPosts);

      const userId = session?.user.id;

      const [counts, followsResult] = await Promise.all([
        fetchPostInteractions(
          videoPosts.map(post => post.id),
          userId
        ),

        userId && supabase
          ? supabase
              .from('user_follows')
              .select('following_id')
              .eq('follower_id', userId)
          : Promise.resolve({
              data: [],
              error: null,
            }),
      ]);

      if (followsResult.error) {
        throw followsResult.error;
      }

      setInteractions(
        counts as Record<string, Interaction>
      );

      setFollowing(
        (followsResult.data || []).map(
          (item: { following_id: string }) =>
            item.following_id
        )
      );

      setActiveIndex(0);

      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({
          offset: 0,
          animated: false,
        });
      });
    } catch (error: any) {
      Alert.alert(
        'Videos could not load',
        error?.message || 'Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      void loadVideos();
    }, [loadVideos])
  );

  const markBusy = (
    id: string,
    busy: boolean
  ) => {
    setBusyIds(current =>
      busy
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter(item => item !== id)
    );
  };

  const updateInteraction = (
    id: string,
    patch: Partial<Interaction>
  ) => {
    setInteractions(previous => ({
      ...previous,
      [id]: {
        ...(previous[id] || EMPTY_INTERACTION),
        ...patch,
      },
    }));
  };

  const likeVideo = async (post: FeedPost) => {
    if (!session) {
      Alert.alert(
        'Sign in required',
        'Sign in to like videos.'
      );
      return;
    }

    if (busyIds.includes(post.id)) return;

    const current =
      interactions[post.id] || EMPTY_INTERACTION;

    markBusy(post.id, true);

    try {
      await toggleLike(
        post.id,
        session.user.id,
        current.liked
      );

      updateInteraction(post.id, {
        liked: !current.liked,
        likesCount: Math.max(
          0,
          current.likesCount +
            (current.liked ? -1 : 1)
        ),
      });
    } catch (error: any) {
      Alert.alert(
        'Like failed',
        error?.message || 'Please try again.'
      );
    } finally {
      markBusy(post.id, false);
    }
  };

  const saveVideo = async (post: FeedPost) => {
    if (!session) {
      Alert.alert(
        'Sign in required',
        'Sign in to save videos.'
      );
      return;
    }

    if (busyIds.includes(post.id)) return;

    const current =
      interactions[post.id] || EMPTY_INTERACTION;

    markBusy(post.id, true);

    try {
      await toggleSave(
        post.id,
        session.user.id,
        current.saved
      );

      updateInteraction(post.id, {
        saved: !current.saved,
      });
    } catch (error: any) {
      Alert.alert(
        'Save failed',
        error?.message || 'Please try again.'
      );
    } finally {
      markBusy(post.id, false);
    }
  };

  const followCreator = async (post: FeedPost) => {
    if (!session) {
      Alert.alert(
        'Sign in required',
        'Sign in to follow creators.'
      );
      return;
    }

    if (post.user_id === session.user.id) {
      Alert.alert(
        'Your video',
        'You cannot follow yourself.'
      );
      return;
    }

    if (!supabase || busyIds.includes(post.id)) {
      return;
    }

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

        setFollowing(current =>
          current.includes(post.user_id)
            ? current
            : [...current, post.user_id]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Follow failed',
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
    } catch (error: any) {
      Alert.alert(
        'Could not open video',
        error?.message || 'Please try again.'
      );
    }
  };

  const openComments = async (postId: string) => {
    setActivePostId(postId);
    setComments([]);
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
      Alert.alert(
        'Sign in required',
        'Please sign in to comment.'
      );
      return;
    }

    if (!activePostId || !commentText.trim()) {
      return;
    }

    setSendingComment(true);

    try {
      await createComment(
        activePostId,
        session.user.id,
        commentText.trim()
      );

      setCommentText('');

      setComments(
        await fetchCommentsForPost(activePostId)
      );

      const updated = await fetchPostInteractions(
        posts.map(post => post.id),
        session.user.id
      );

      setInteractions(
        updated as Record<string, Interaction>
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

  const showMenu = (post: FeedPost) => {
    Alert.alert(
      'Reel options',
      'Choose an action',
      [
        {
          text: 'Share',
          onPress: () => void shareVideo(post),
        },
        {
          text: 'Download',
          onPress: () => void downloadVideo(post),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{
        index: number | null;
        isViewable: boolean;
      }>;
    }) => {
      const current = viewableItems.find(
        item =>
          item.isViewable &&
          item.index !== null
      );

      if (
        current?.index !== null &&
        current?.index !== undefined
      ) {
        setActiveIndex(current.index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  const styles = useMemo(
    () => createStyles(theme),
    [theme]
  );

  const renderItem = useCallback(
    ({
      item,
      index,
    }: {
      item: FeedPost;
      index: number;
    }) => {
      const state =
        interactions[item.id] || EMPTY_INTERACTION;

      return (
        <Reel
          post={item}
          active={
            index === activeIndex &&
            activePostId === null
          }
          height={height}
          interaction={state}
          following={following.includes(item.user_id)}
          theme={theme}
          styles={styles}
          onLike={() => void likeVideo(item)}
          onSave={() => void saveVideo(item)}
          onComment={() => void openComments(item.id)}
          onShare={() => void shareVideo(item)}
          onDownload={() => void downloadVideo(item)}
          onFollow={() => void followCreator(item)}
          onMore={() => showMenu(item)}
        />
      );
    },
    [
      activeIndex,
      activePostId,
      height,
      interactions,
      following,
      theme,
      styles,
    ]
  );

  return (
    <View style={styles.screen}>
      <StatusBar hidden />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color="#FFFFFF"
          />

          <Text style={styles.loadingText}>
            Loading BRITUME Reels...
          </Text>
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          ref={listRef}
          style={styles.reelsList}
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          removeClippedSubviews={Platform.OS === 'android'}
          extraData={{
            activeIndex,
            interactions,
            following,
            activePostId,
          }}
        />
      ) : (
        <View style={styles.emptyScreen}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </Pressable>

          <Ionicons
            name="videocam-off-outline"
            size={65}
            color="#FFFFFF"
          />

          <Text style={styles.emptyTitle}>
            No Reels yet
          </Text>

          <Text style={styles.emptyText}>
            Be the first to share a video with the BRITUME community.
          </Text>

          <Pressable
            style={styles.uploadButton}
            onPress={() =>
              router.push('/(tabs)/create')
            }
          >
            <Ionicons
              name="cloud-upload-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.uploadText}>
              Upload a video
            </Text>
          </Pressable>
        </View>
      )}

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
                  <Text style={styles.commentEmpty}>
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
                style={[
                  styles.sendButton,
                  (!commentText.trim() || sendingComment) &&
                    styles.sendButtonDisabled,
                ]}
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

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: '#07111F',
    },

    reelsList: {
      flex: 1,
    },

    reelPage: {
      width: '100%',
      backgroundColor: '#07111F',
      overflow: 'hidden',
    },

    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.16)',
    },

    noVideo: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#17283A',
    },

    noVideoText: {
      color: '#FFFFFF',
      marginTop: 12,
    },

    topShade: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 160,
      backgroundColor: 'rgba(0,0,0,0.24)',
    },

    bottomShade: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 260,
      backgroundColor: 'rgba(0,0,0,0.52)',
    },

    topBar: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 48 : 18,
      left: 15,
      right: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    glassButton: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    brand: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 1,
    },

    brandSubtitle: {
      color: 'rgba(255,255,255,0.78)',
      fontSize: 10,
      marginTop: 3,
    },

    bottomArea: {
      position: 'absolute',
      left: 16,
      right: 13,
      bottom: Platform.OS === 'ios' ? 35 : 25,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    },

    details: {
      flex: 1,
      paddingBottom: 4,
    },

    creatorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },

    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    creatorName: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
      flexShrink: 1,
    },

    followButton: {
      borderWidth: 1,
      borderColor: '#FFFFFF',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },

    followText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },

    caption: {
      color: '#FFFFFF',
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 9,
    },

    swipeHint: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 10,
    },

    actions: {
      width: 49,
      alignItems: 'center',
      gap: 18,
      paddingBottom: 2,
    },

    action: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 45,
      gap: 4,
    },

    actionText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    loading: {
      flex: 1,
      backgroundColor: '#07111F',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },

    loadingText: {
      color: '#FFFFFF',
      fontSize: 13,
    },

    emptyScreen: {
      flex: 1,
      backgroundColor: '#10243A',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
    },

    backButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 48 : 18,
      left: 16,
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyTitle: {
      color: '#FFFFFF',
      fontSize: 23,
      fontWeight: '900',
      marginTop: 18,
    },

    emptyText: {
      color: 'rgba(255,255,255,0.78)',
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 19,
      marginTop: 9,
    },

    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 22,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 22,
      backgroundColor: theme.cyan,
    },

    uploadText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },

    modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.58)',
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

    commentEmpty: {
      color: theme.muted,
      fontSize: 13,
      textAlign: 'center',
      padding: 16,
    },

    commentCard: {
      backgroundColor: theme.panel2,
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
      backgroundColor: theme.panel2,
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

        sendButtonDisabled: {
      opacity: 0.55,
    },
  });
            }
