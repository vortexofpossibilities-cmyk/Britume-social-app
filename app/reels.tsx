
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView,
  Linking, Modal, Platform, Pressable, Share, StatusBar,
  StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useAuth } from '../src/auth/AuthProvider';
import {
  fetchPublicPosts, fetchPostInteractions, fetchCommentsForPost,
  createComment, toggleLike, toggleSave,
  type FeedPost, type PostComment,
} from '../src/lib/posts';
import { supabase } from '../src/lib/supabase';
import { useAppTheme } from '../src/contexts/ThemeContext';

type Interaction = {
  liked: boolean;
  saved: boolean;
  likesCount: number;
  commentsCount: number;
};

const EMPTY: Interaction = {
  liked: false, saved: false, likesCount: 0, commentsCount: 0,
};

function ReelCard({
  post, active, height, interaction, following, theme,
  onLike, onSave, onComment, onShare, onDownload, onFollow, onMore,
}: {
  post: FeedPost;
  active: boolean;
  height: number;
  interaction: Interaction;
  following: boolean;
  theme: any;
  onLike: () => void;
  onSave: () => void;
  onComment: () => void;
  onShare: () => void;
  onDownload: () => void;
  onFollow: () => void;
  onMore: () => void;
}) {
  const uri = post.media?.find(m =>
    m.media_type === 'video' && !!m.url
  )?.url || '';

  const [paused, setPaused] = useState(false);
  const player = useVideoPlayer(uri, p => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (active && !paused && uri) player.play();
    else player.pause();

    return () => player.pause();
  }, [active, paused, player, uri]);

  useEffect(() => {
    if (!active) setPaused(false);
  }, [active]);

  const author =
    post.author?.display_name ||
    post.author?.username ||
    'BRITUME member';

  return (
    <View style={[s.page, { height }]}>
      {uri ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused(v => !v)}>
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
          {paused && (
            <View style={s.playOverlay}>
              <Ionicons name="play" size={55} color="#fff" />
            </View>
          )}
        </Pressable>
      ) : (
        <View style={s.noVideo}>
          <Ionicons name="videocam-off-outline" size={48} color="#fff" />
          <Text style={s.white}>Video unavailable</Text>
        </View>
      )}

      <View pointerEvents="none" style={s.topShade} />
      <View pointerEvents="none" style={s.bottomShade} />

      <View style={s.topBar}>
        <Pressable style={s.glass} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.brand}>BRITUME REELS</Text>
          <Text style={s.subtitle}>Vortex of Possibilities</Text>
        </View>
        <Pressable style={s.glass} onPress={onMore}>
          <Ionicons name="ellipsis-vertical" size={23} color="#fff" />
        </Pressable>
      </View>

      <View style={s.bottom}>
        <View style={{ flex: 1 }}>
          <View style={s.creator}>
            <View style={s.avatar}>
              <Ionicons name="person" size={18} color={theme.cyan} />
            </View>
            <Text style={s.creatorName} numberOfLines={1}>{author}</Text>
            <Pressable style={s.follow} onPress={onFollow}>
              <Text style={s.followText}>{following ? 'Following' : 'Follow'}</Text>
            </Pressable>
          </View>

          {!!post.content && (
            <Text style={s.caption} numberOfLines={3}>{post.content}</Text>
          )}
          <Text style={s.hint}>Swipe up for the next reel</Text>
        </View>

        <View style={s.actions}>
          <Action
            icon={interaction.liked ? 'heart' : 'heart-outline'}
            color={interaction.liked ? '#FF557B' : '#fff'}
            label={String(interaction.likesCount)}
            onPress={onLike}
          />
          <Action icon="chatbubble-ellipses-outline" label={String(interaction.commentsCount)} onPress={onComment} />
          <Action icon="paper-plane-outline" label="Share" onPress={onShare} />
          <Action
            icon={interaction.saved ? 'bookmark' : 'bookmark-outline'}
            color={interaction.saved ? '#A99CFF' : '#fff'}
            label="Save"
            onPress={onSave}
          />
          <Action icon="download-outline" label="Download" onPress={onDownload} />
        </View>
      </View>
    </View>
  );
}

function Action({
  icon, label, onPress, color = '#fff',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable style={s.action} onPress={onPress}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={s.actionText}>{label}</Text>
    </Pressable>
  );
}

export default function VideosScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const { height } = useWindowDimensions();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [interactions, setInteractions] = useState<Record<string, Interaction>>({});
  const [following, setFollowing] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState<string[]>([]);

  const listRef = useRef<FlatList<FeedPost>>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const all = await fetchPublicPosts();

      // Include videos from ordinary posts as well as reels.
      const videos = all.filter(post =>
        post.media?.some(m =>
          m.media_type?.toLowerCase() === 'video' &&
          typeof m.url === 'string' &&
          m.url.trim().length > 0
        )
      );

      setPosts(videos);

      const userId = session?.user.id;
      const counts = await fetchPostInteractions(
        videos.map(p => p.id), userId
      );

      setInteractions(counts as Record<string, Interaction>);

      if (userId && supabase) {
        const { data, error } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', userId);

        if (error) throw error;
        setFollowing((data || []).map(row => row.following_id));
      } else {
        setFollowing([]);
      }

      setActiveIndex(0);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    } catch (error: any) {
      Alert.alert('Reels could not load', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useFocusEffect(useCallback(() => {
    void loadVideos();
  }, [loadVideos]));

  const markBusy = (id: string, value: boolean) => {
    setBusy(current => value
      ? current.includes(id) ? current : [...current, id]
      : current.filter(x => x !== id)
    );
  };

  const patchInteraction = (id: string, patch: Partial<Interaction>) => {
    setInteractions(old => ({
      ...old,
      [id]: { ...(old[id] || EMPTY), ...patch },
    }));
  };

  const like = async (post: FeedPost) => {
    if (!session) {
      Alert.alert('Sign in required', 'Sign in to like videos.');
      return;
    }
    if (busy.includes(post.id)) return;

    const current = interactions[post.id] || EMPTY;
    markBusy(post.id, true);
    try {
      await toggleLike(post.id, session.user.id, current.liked);
      patchInteraction(post.id, {
        liked: !current.liked,
        likesCount: Math.max(0, current.likesCount + (current.liked ? -1 : 1)),
      });
    } catch (e: any) {
      Alert.alert('Like failed', e?.message || 'Please try again.');
    } finally {
      markBusy(post.id, false);
    }
  };

  const save = async (post: FeedPost) => {
    if (!session) {
      Alert.alert('Sign in required', 'Sign in to save videos.');
      return;
    }
    if (busy.includes(post.id)) return;

    const current = interactions[post.id] || EMPTY;
    markBusy(post.id, true);
    try {
      await toggleSave(post.id, session.user.id, current.saved);
      patchInteraction(post.id, { saved: !current.saved });
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Please try again.');
    } finally {
      markBusy(post.id, false);
    }
  };

  const follow = async (post: FeedPost) => {
    if (!session) {
      Alert.alert('Sign in required', 'Sign in to follow creators.');
      return;
    }
    if (post.user_id === session.user.id) {
      Alert.alert('Your video', 'You cannot follow yourself.');
      return;
    }
    if (!supabase || busy.includes(post.id)) return;

    const isFollowing = following.includes(post.user_id);
    markBusy(post.id, true);
    try {
      const query = supabase.from('user_follows');
      const result = isFollowing
        ? await query.delete()
            .eq('follower_id', session.user.id)
            .eq('following_id', post.user_id)
        : await query.insert({
            follower_id: session.user.id,
            following_id: post.user_id,
          });

      if (result.error) throw result.error;

      setFollowing(old => isFollowing
        ? old.filter(id => id !== post.user_id)
        : [...new Set([...old, post.user_id])]
      );
    } catch (e: any) {
      Alert.alert('Follow failed', e?.message || 'Please try again.');
    } finally {
      markBusy(post.id, false);
    }
  };

  const share = async (post: FeedPost) => {
    const url = post.media?.find(m => m.media_type === 'video')?.url;
    try {
      await Share.share({
        message: [post.content || 'Watch this video on BRITUME!', url].filter(Boolean).join('\n\n'),
      });
    } catch (e: any) {
      Alert.alert('Share failed', e?.message || 'Please try again.');
    }
  };

  const download = async (post: FeedPost) => {
    const url = post.media?.find(m => m.media_type === 'video')?.url;
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Could not open video', e?.message || 'Please try again.');
    }
  };

  const openComments = async (id: string) => {
    setActivePostId(id);
    setComments([]);
    setCommentsLoading(true);
    try {
      setComments(await fetchCommentsForPost(id));
    } catch (e: any) {
      Alert.alert('Comments unavailable', e?.message || 'Please try again.');
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

    setSending(true);
    try {
      await createComment(activePostId, session.user.id, commentText.trim());
      setCommentText('');
      setComments(await fetchCommentsForPost(activePostId));

      const updated = await fetchPostInteractions(
        posts.map(p => p.id), session.user.id
      );
      setInteractions(updated as Record<string, Interaction>);
    } catch (e: any) {
      Alert.alert('Comment failed', e?.message || 'Please try again.');
    } finally {
      setSending(false);
    }
  };

  const more = (post: FeedPost) => {
    Alert.alert('Reel options', 'Choose an action', [
      { text: 'Share', onPress: () => void share(post) },
      { text: 'Download', onPress: () => void download(post) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
    minimumViewTime: 100,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const current = viewableItems.find((item: any) =>
      item.isViewable && item.index !== null
    );
    if (current?.index !== undefined && current?.index !== null) {
      setActiveIndex(current.index);
    }
  }).current;

  const renderItem = ({ item, index }: { item: FeedPost; index: number }) => (
    <ReelCard
      post={item}
      active={index === activeIndex && activePostId === null}
      height={height}
      interaction={interactions[item.id] || EMPTY}
      following={following.includes(item.user_id)}
      theme={theme}
      onLike={() => void like(item)}
      onSave={() => void save(item)}
      onComment={() => void openComments(item.id)}
      onShare={() => void share(item)}
      onDownload={() => void download(item)}
      onFollow={() => void follow(item)}
      onMore={() => more(item)}
    />
  );

  return (
    <View style={s.screen}>
      <StatusBar hidden />

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.white}>Loading BRITUME Reels...</Text>
        </View>
      ) : posts.length ? (
        <FlatList
          ref={listRef}
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          extraData={{ activeIndex, interactions, following, activePostId }}
          pagingEnabled
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(_, index) => ({
            length: height, offset: height * index, index,
          })}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          removeClippedSubviews={false}
        />
      ) : (
        <View style={s.empty}>
          <Pressable style={s.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Ionicons name="videocam-off-outline" size={60} color="#fff" />
          <Text style={s.emptyTitle}>No Reels yet</Text>
          <Text style={s.emptyText}>
            Share a video to be the first in the BRITUME community.
          </Text>
          <Pressable style={s.upload} onPress={() => router.push('/(tabs)/create')}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={s.white}>Upload a video</Text>
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
          style={s.modalBg}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modal, { backgroundColor: theme.panel }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text }]}>Comments</Text>
              <Pressable onPress={() => setActivePostId(null)}>
                <Ionicons name="close-circle" size={29} color={theme.muted} />
              </Pressable>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color={theme.cyan} />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <Text style={{ color: theme.muted, textAlign: 'center', padding: 16 }}>
                    Be the first to comment.
                  </Text>
                }
                renderItem={({ item }) => (
                  <View style={[s.comment, { backgroundColor: theme.panel2 }]}>
                    <Text style={{ color: theme.text, fontWeight: '900' }}>
                      {item.author?.display_name || item.author?.username || 'BRITUME member'}
                    </Text>
                    <Text style={{ color: theme.text, marginTop: 4 }}>{item.content}</Text>
                  </View>
                )}
              />
            )}

            <View style={s.composer}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={theme.muted}
                style={[s.input, { backgroundColor: theme.panel2, color: theme.text }]}
                multiline
                maxLength={500}
              />
              <Pressable
                style={[s.send, { backgroundColor: theme.cyan }]}
                disabled={sending || !commentText.trim()}
                onPress={() => void sendComment()}
              >
                {sending
                  ? <ActivityIndicator color="#fff" />
                  : <Ionicons name="send" size={19} color="#fff" />}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07111F' },
  page: { width: '100%', backgroundColor: '#07111F', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#07111F' },
  white: { color: '#fff' },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0003' },
  noVideo: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17283A', gap: 10 },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 150, backgroundColor: '#0004' },
  bottomShade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 270, backgroundColor: '#0008' },
  topBar: { position: 'absolute', top: Platform.OS === 'ios' ? 48 : 18, left: 15, right: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  glass: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#0006', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#fffc', fontSize: 10, marginTop: 3 },
  bottom: { position: 'absolute', left: 16, right: 13, bottom: Platform.OS === 'ios' ? 35 : 25, flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  creator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  creatorName: { color: '#fff', fontSize: 14, fontWeight: '900', flexShrink: 1 },
  follow: { borderWidth: 1, borderColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  followText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  caption: { color: '#fff', fontSize: 13, lineHeight: 19, marginBottom: 9 },
  hint: { color: '#fffc', fontSize: 10 },
  actions: { width: 49, alignItems: 'center', gap: 18, paddingBottom: 2 },
  action: { alignItems: 'center', justifyContent: 'center', minWidth: 45, gap: 4 },
  actionText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  empty: { flex: 1, backgroundColor: '#10243A', alignItems: 'center', justifyContent: 'center', padding: 28 },
  back: { position: 'absolute', top: Platform.OS === 'ios' ? 48 : 18, left: 16, width: 43, height: 43, borderRadius: 22, backgroundColor: '#0006', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: '#fff', fontSize: 23, fontWeight: '900', marginTop: 18 },
  emptyText: { color: '#fffc', fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 9 },
  upload: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, backgroundColor: '#168FC5' },
  modalBg: { flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end' },
  modal: { maxHeight: '78%', minHeight: '48%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 18, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  comment: { borderRadius: 14, padding: 11, marginBottom: 9 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: { flex: 1, minHeight: 43, maxHeight: 90, borderRadius: 14, padding: 11 },
  send: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
