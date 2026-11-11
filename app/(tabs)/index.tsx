import t, { useCallback, useMemo, useState } from 'react';
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

import {
  fetchPostRestrictions,
  hidePost,
  reportPost,
  blockUser,
  proposePost,
  deleteOwnPost,
} from '../../src/lib/postModeration';

import {
  fetchCommunities,
  joinCommunity,
  leaveCommunity,
  type Community,
} from '../../src/lib/communities';

import { supabase } from '../../src/lib/supabase';
import { ClayLogo } from '../../src/components/ClayUI';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

type AppTheme = ReturnType<typeof useAppTheme>['theme'];

type Interaction = {
  liked: boolean;
  saved: boolean;
  likesCount: number;
  commentsCount: number;
};

type ActiveMedia = {
  uri: string;
  type: 'image' | 'video';
} | null;

type FeedRow =
  | { type: 'post'; id: string; post: FeedPost }
  | { type: 'community'; id: string; community: Community };

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

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Please try again.';
}

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
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

export default function HomeScreen() {
  const { theme: appTheme, isDark } = useAppTheme();
  const { t } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();

  const theme = useMemo(
    () =>
      isDark
        ? {
            ...appTheme,
            bg: '#000000',
            panel: '#000000',
            panel2: '#050505',
            border: '#FFFFFF',
            borderStrong: '#FFFFFF',
            text: '#FFFFFF',
            muted: '#C9C9C9',
            cyan: '#FFFFFF',
            purple: '#FFFFFF',
            gold: '#FFFFFF',
            blueDark: '#FFFFFF',
          }
        : appTheme,
    [appTheme, isDark],
  );

  const styles = useMemo(
    () => createStyles(theme, isDark),
    [theme, isDark],
  );

  const mediaWidth = Math.max(240, windowWidth - 48);
  const mediaHeight = Math.min(
    520,
    Math.max(320, windowWidth * 1.05),
  );

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [expandedPostIds, setExpandedPostIds] = useState<string[]>([]);
  const [blurredPostIds, setBlurredPostIds] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [userId, setUserId] = useState<string | null>(null);

  const [interactions, setInteractions] = useState<
    Record<string, Interaction>
  >({});

  const [busyPosts, setBusyPosts] = useState<string[]>([]);
  const [busyCommunities, setBusyCommunities] = useState<string[]>([]);

  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const [activeMedia, setActiveMedia] = useState<ActiveMedia>(null);
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);

  const closePostOptions = () => {
    setSelectedPost(null);
  };

  const runPostAction = (action: () => void) => {
    setSelectedPost(null);
    setTimeout(action, 200);
  };

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

      const restrictions = currentUserId
        ? await withTimeout(fetchPostRestrictions(currentUserId))
        : {
            hiddenPostIds: [],
            blockedUserIds: [],
          };

      const homeFeedPosts = freshPosts.filter(
        post =>
          post.post_type !== 'reel' &&
          !restrictions.hiddenPostIds.includes(post.id) &&
          !restrictions.blockedUserIds.includes(post.user_id),
      );

      setPosts(homeFeedPosts);

      try {
        const freshCommunities = await withTimeout(fetchCommunities());
        setCommunities(shuffleArray(freshCommunities));
      } catch (communityError) {
        console.error('BRITUME communities:', communityError);
        setCommunities([]);
      }

      try {
        const result = await withTimeout(
          fetchPostInteractions(
            homeFeedPosts.map(post => post.id),
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
      setError(errorMessage(e));
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

  const filteredCommunities = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return communities;

    return communities.filter(community =>
      community.name.toLowerCase().includes(q) ||
      (community.description ?? '').toLowerCase().includes(q),
    );
  }, [communities, search]);

  // Mix community cards into the post list instead of showing
  // all communities in a separate section.
  const feedRows = useMemo<FeedRow[]>(() => {
    const rows: FeedRow[] = [];
    let communityIndex = 0;

    filteredPosts.forEach((post, index) => {
      rows.push({
        type: 'post',
        id: `post-${post.id}`,
        post,
      });

      if (
        (index + 1) % 4 === 0 &&
        communityIndex < filteredCommunities.length
      ) {
        const community = filteredCommunities[communityIndex++];

        rows.push({
          type: 'community',
          id: `community-${community.id}`,
          community,
        });
      }
    });

    // Show community suggestions even when there are fewer than
    // four posts or when the feed has no posts.
    if (rows.length === 0 && filteredCommunities.length > 0) {
      filteredCommunities.slice(0, 3).forEach(community => {
        rows.push({
          type: 'community',
          id: `community-${community.id}`,
          community,
        });
      });
    }

    return rows;
  }, [filteredPosts, filteredCommunities]);

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

  const requireSignedIn = () => {
    if (!userId) {
      Alert.alert(
        t('signInRequired'),
        'Please sign in to use this feature.',
      );

      return false;
    }

    return true;
  };

  const openAuthorProfile = (post: FeedPost) => {
    const username = post.author?.username?.trim();

    if (!username || post.author?.is_public === false) {
      Alert.alert(
        'Profile unavailable',
        'This member does not have a public profile available.',
      );
      return;
    }

    router.push({
      pathname: '/profile/[username]',
      params: { username },
    });
  };

  const openCommentAuthorProfile = (comment: PostComment) => {
    const username = comment.author?.username?.trim();

    if (!username || comment.author?.is_public === false) {
      return;
    }

    router.push({
      pathname: '/profile/[username]',
      params: { username },
    });
  };

  const handleLike = async (postId: string) => {
    if (!userId) {
      Alert.alert(t('signInRequired'), t('signInToLike'));
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
      Alert.alert(t('likeFailed'), errorMessage(e));
    } finally {
      setBusyPosts(items => items.filter(id => id !== postId));
    }
  };

  const handleSave = async (postId: string) => {
    if (!userId) {
      Alert.alert(t('signInRequired'), t('signInToSave'));
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
      Alert.alert(t('saveFailed'), errorMessage(e));
    } finally {
      setBusyPosts(items => items.filter(id => id !== postId));
    }
  };

  const handleCommunityMembership = async (
    community: Community,
  ) => {
    if (!requireSignedIn()) return;

    if (busyCommunities.includes(community.id)) return;

    setBusyCommunities(items => [...items, community.id]);

    const wasMember = community.is_member === true;

    // Update the interface immediately while the request is processed.
    setCommunities(current =>
      current.map(item =>
        item.id === community.id
          ? {
              ...item,
              is_member: !wasMember,
              member_count: Math.max(
                0,
                (item.member_count ?? 0) + (wasMember ? -1 : 1),
              ),
            }
          : item,
      ),
    );

    try {
      if (wasMember) {
        await leaveCommunity(community.id);
      } else {
        await joinCommunity(community.id);
      }
    } catch (e) {
      // Restore the original state if Supabase rejects the request.
      setCommunities(current =>
        current.map(item =>
          item.id === community.id
            ? {
                ...item,
                is_member: wasMember,
                member_count: Math.max(
                  0,
                  (item.member_count ?? 0) + (wasMember ? 1 : -1),
                ),
              }
            : item,
        ),
      );

      Alert.alert(
        wasMember ? 'Could not leave community' : 'Could not join community',
        errorMessage(e),
      );
    } finally {
      setBusyCommunities(items =>
        items.filter(id => id !== community.id),
      );
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
      Alert.alert(
        t('sharingUnavailable'),
        t('pleaseTryAgain'),
      );
    }
  };

  const handleHidePost = async (post: FeedPost) => {
    if (!requireSignedIn()) return;

    try {
      await hidePost(userId!, post.id);

      setPosts(current =>
        current.filter(item => item.id !== post.id),
      );

      Alert.alert('Post hidden');
    } catch (e) {
      Alert.alert('Could not hide post', errorMessage(e));
    }
  };

  const handleReportPost = (post: FeedPost) => {
    if (!requireSignedIn()) return;

    Alert.alert('Report post', 'Choose a reason for this report.', [
      ...[
        'spam',
        'harassment',
        'inappropriate',
        'misinformation',
        'other',
      ].map(reason => ({
        text: reason.charAt(0).toUpperCase() + reason.slice(1),
        onPress: () => {
          void reportPost(userId!, post.id, reason)
            .then(() => {
              Alert.alert(
                'Report submitted',
                'Thank you. Your report has been sent for review.',
              );
            })
            .catch(e => {
              Alert.alert('Report failed', errorMessage(e));
            });
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleBlockAccount = async (post: FeedPost) => {
    if (!requireSignedIn()) return;

    if (post.user_id === userId) {
      Alert.alert('You cannot block your own account.');
      return;
    }

    try {
      await blockUser(userId!, post.user_id);
      await loadPosts(true);

      Alert.alert(
        'Account blocked',
        'Posts from this account have been removed from your feed.',
      );
    } catch (e) {
      Alert.alert('Block failed', errorMessage(e));
    }
  };

  const handleProposePost = async (post: FeedPost) => {
    if (!requireSignedIn()) return;

    try {
      await proposePost(userId!, post.id);

      Alert.alert(
        'Proposal submitted',
        'Your suggestion has been sent to BRITUME administrators.',
      );
    } catch (e) {
      Alert.alert('Proposal failed', errorMessage(e));
    }
  };

  const handleDeletePost = (post: FeedPost) => {
    if (!userId || post.user_id !== userId) {
      Alert.alert('Only the post owner can delete this post.');
      return;
    }

    Alert.alert(
      'Delete your post?',
      'This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteOwnPost(userId, post.id)
              .then(() => {
                setPosts(current =>
                  current.filter(item => item.id !== post.id),
                );

                Alert.alert('Post deleted');
              })
              .catch(e => {
                Alert.alert('Delete failed', errorMessage(e));
              });
          },
        },
      ],
    );
  };

  const togglePostBlur = (postId: string) => {
    setBlurredPostIds(current =>
      current.includes(postId)
        ? current.filter(id => id !== postId)
        : [...current, postId],
    );
  };

  const openPostOptions = (post: FeedPost) => {
    setSelectedPost(post);
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
      Alert.alert(t('comments'), errorMessage(e));
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!activePostId || !userId) {
      Alert.alert(t('signInRequired'), t('signInToComment'));
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
      Alert.alert(t('commentFailed'), errorMessage(e));
    } finally {
      setSendingComment(false);
    }
  };

  const renderCommunity = (community: Community) => {
    const isBusy = busyCommunities.includes(community.id);
    const isMember = community.is_member === true;

    return (
      <View style={styles.communityCard}>
        <View style={styles.communityTop}>
          <View style={styles.communityIcon}>
            {community.image_url ? (
              <Image
                source={{ uri: community.image_url }}
                style={styles.communityImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name="people"
                size={27}
                color={theme.cyan}
              />
            )}
          </View>

          <View style={styles.communityInfo}>
            <Text style={styles.communityName} numberOfLines={1}>
              {community.name}
            </Text>

            <Text style={styles.communityMembers}>
              {community.member_count ?? 0} members
            </Text>
          </View>

          <View style={styles.communityLabel}>
            <Ionicons
              name="people-circle-outline"
              size={18}
              color={theme.cyan}
            />
            <Text style={styles.communityLabelText}>Community</Text>
          </View>
        </View>

        {community.description ? (
          <Text style={styles.communityDescription} numberOfLines={3}>
            {community.description}
          </Text>
        ) : (
          <Text style={styles.communityDescriptionMuted}>
            A place to connect with people who share your interests.
          </Text>
        )}

        <View style={styles.communityBottom}>
          <Text style={styles.communityInvite}>
            Discover this community
          </Text>

          <Pressable
            style={[
              styles.communityJoinButton,
              isMember && styles.communityJoinedButton,
            ]}
            onPress={() => void handleCommunityMembership(community)}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={
              isMember ? 'Leave community' : 'Join community'
            }
          >
            {isBusy ? (
              <ActivityIndicator
                size="small"
                color={isMember ? theme.text : '#000000'}
              />
            ) : (
              <>
                <Ionicons
                  name={isMember ? 'checkmark' : 'add'}
                  size={18}
                  color={isMember ? theme.text : '#000000'}
                />
                <Text
                  style={[
                    styles.communityJoinText,
                    isMember && styles.communityJoinedText,
                  ]}
                >
                  {isMember ? 'Joined' : 'Join'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

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
          <Text style={styles.tagline}>{t('tagline')}</Text>
          <Text style={styles.byline}>by brilliant mere</Text>
        </Pressable>

        <Pressable
          style={styles.topButtonLight}
          onPress={() => router.push('/(tabs)/discover')}
          accessibilityLabel={t('discoverPeople')}
        >
          <Ionicons name="search" size={23} color={theme.cyan} />
        </Pressable>

        <Pressable
          style={styles.topButtonLight}
          onPress={() => router.push('/notifications')}
          accessibilityLabel={t('notifications')}
        >
          <Ionicons
            name="notifications-outline"
            size={23}
            color={theme.cyan}
          />
        </Pressable>

        <Pressable
          style={styles.topButtonLight}
          onPress={() => router.push('/(tabs)/more')}
          accessibilityLabel={t('moreMenu')}
        >
          <Ionicons name="menu" size={26} color={theme.cyan} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons
          name="search-outline"
          size={22}
          color={theme.cyan}
        />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={theme.muted}
          style={styles.searchInput}
          returnKeyType="search"
        />

        <Pressable
          onPress={() => router.push('/(tabs)/discover')}
          accessibilityLabel={t('searchFilters')}
          hitSlop={8}
        >
          <Ionicons
            name="options-outline"
            size={23}
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
          <Text style={styles.sectionTitle}>{t('stories')}</Text>
        </View>

        <Pressable
          style={styles.seeAll}
          onPress={() => router.push('/stories')}
        >
          <Text style={styles.seeAllText}>{t('seeAll')}</Text>
          <Ionicons
            name="chevron-forward"
            size={17}
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
          style={styles.storyCircleItem}
          onPress={() => router.push('/(tabs)/create')}
          accessibilityLabel={t('yourStory')}
        >
          <View style={styles.storyCircleOuter}>
            <View style={styles.storyCircleInner}>
              <Ionicons
                name="person"
                size={25}
                color={theme.cyan}
              />
            </View>

            <View style={styles.storyAddBadge}>
              <Ionicons name="add" size={16} color="#000000" />
            </View>
          </View>

          <Text style={styles.storyCircleLabel} numberOfLines={1}>
            {t('yourStory')}
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.sectionHeading}>
        <View style={styles.headingWithIcon}>
          <Ionicons
            name="grid-outline"
            size={23}
            color={theme.cyan}
          />
          <Text style={styles.sectionTitle}>{t('posts')}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadPosts()}>
            <Text style={styles.retryText}>{t('tryAgain')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const renderPost = (item: FeedPost) => {
    const interaction = interactions[item.id];

    const liked = interaction?.liked ?? false;
    const saved = interaction?.saved ?? false;
    const expanded = expandedPostIds.includes(item.id);
    const isPostBlurred = blurredPostIds.includes(item.id);

    const author =
      item.author?.display_name ||
      (item.author?.username
        ? `@${item.author.username}`
        : t('britumeMember'));

    const images = (item.media ?? []).filter(
      media => media.media_type === 'image',
    );

    const video = (item.media ?? []).find(
      media => media.media_type === 'video',
    );

    const isVideoPost = item.post_type === 'video';
    const canOpenProfile =
      !!item.author?.username?.trim() &&
      item.author?.is_public !== false;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Pressable
            style={styles.avatar}
            onPress={() => openAuthorProfile(item)}
            disabled={!canOpenProfile}
            accessibilityRole="button"
            accessibilityLabel={`Open ${author}'s profile`}
          >
            <Ionicons
              name="person"
              size={20}
              color={theme.cyan}
            />
          </Pressable>

          <Pressable
            style={styles.postAuthor}
            onPress={() => openAuthorProfile(item)}
            disabled={!canOpenProfile}
            accessibilityRole="button"
          >
            <Text style={styles.authorName} numberOfLines={1}>
              {author}
            </Text>

            <Text style={styles.postDate}>
              {new Date(item.created_at).toLocaleDateString()}
              {isVideoPost ? '  •  Video' : ''}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openPostOptions(item)}
            accessibilityLabel={t('postOptions')}
            accessibilityRole="button"
            hitSlop={12}
            style={styles.moreButton}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={22}
              color={theme.muted}
            />
          </Pressable>
        </View>

        {item.content ? (
          <View style={styles.postCaptionWrap}>
            <Text
              style={[
                styles.postContent,
                isPostBlurred && styles.blurredContent,
              ]}
              numberOfLines={expanded ? undefined : 5}
              ellipsizeMode="tail"
            >
              {item.content}
            </Text>

            {item.content.length > 180 ? (
              <Pressable
                onPress={() =>
                  setExpandedPostIds(current =>
                    current.includes(item.id)
                      ? current.filter(id => id !== item.id)
                      : [...current, item.id],
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={expanded ? 'See less' : 'See more'}
                hitSlop={8}
              >
                <Text style={styles.seeMoreText}>
                  {expanded ? 'See less' : 'See more'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {video ? (
          <View style={styles.videoMediaWrap}>
            <MediaVideo
              uri={video.url}
              videoStyle={styles.videoPlayer}
            />

            {isPostBlurred ? (
              <View
                pointerEvents="none"
                style={styles.blurOverlay}
              >
                <Ionicons
                  name="eye-off"
                  size={32}
                  color="#FFFFFF"
                />
                <Text style={styles.blurOverlayText}>
                  Media hidden
                </Text>
              </View>
            ) : null}

            <Pressable
              style={styles.videoExpandButton}
              onPress={() =>
                setActiveMedia({
                  uri: video.url,
                  type: 'video',
                })
              }
              accessibilityLabel="Open video full screen"
            >
              <Ionicons
                name="expand-outline"
                size={22}
                color="#FFFFFF"
              />
            </Pressable>
          </View>
        ) : null}

        {images.length > 0 ? (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroller}
            contentContainerStyle={styles.mediaGallery}
          >
            {images.map(media => (
              <Pressable
                key={media.id}
                onPress={() => {
                  if (!isPostBlurred) {
                    setActiveMedia({
                      uri: media.url,
                      type: 'image',
                    });
                  }
                }}
                style={[
                  styles.imageCard,
                  { width: mediaWidth },
                ]}
                accessibilityLabel="Open full image"
              >
                <Image
                  source={{ uri: media.url }}
                  style={[
                    styles.postImage,
                    {
                      width: mediaWidth,
                      height: mediaHeight,
                    },
                  ]}
                  resizeMode="contain"
                />

                {isPostBlurred ? (
                  <View
                    pointerEvents="none"
                    style={styles.blurOverlay}
                  >
                    <Ionicons
                      name="eye-off"
                      size={32}
                      color="#FFFFFF"
                    />
                    <Text style={styles.blurOverlayText}>
                      Media hidden
                    </Text>
                  </View>
                ) : (
                  <View style={styles.imageExpandHint}>
                    <Ionicons
                      name="expand-outline"
                      size={17}
                      color="#FFFFFF"
                    />
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={styles.postActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => void handleLike(item.id)}
            disabled={busyPosts.includes(item.id)}
            accessibilityLabel={t('likeFailed')}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={23}
              color={liked ? '#FF5478' : theme.cyan}
            />

            <Text style={styles.actionCount}>
              {interaction?.likesCount ?? 0}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => void openComments(item.id)}
            accessibilityLabel={t('comments')}
          >
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={theme.cyan}
            />

            <Text style={styles.actionCount}>
              {interaction?.commentsCount ?? 0}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => void sharePost(item)}
            accessibilityLabel={t('share')}
          >
            <Ionicons
              name="share-social-outline"
              size={22}
              color={theme.cyan}
            />
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => void handleSave(item.id)}
            disabled={busyPosts.includes(item.id)}
            accessibilityLabel={t('saveFailed')}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={saved ? theme.gold : theme.cyan}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  const renderFeedRow = ({ item }: { item: FeedRow }) => {
    if (item.type === 'community') {
      return renderCommunity(item.community);
    }

    return renderPost(item.post);
  };

  const hasFeedRows = feedRows.length > 0;

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#000000' : theme.bg}
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.cyan} />
          <Text style={styles.loadingText}>
            {t('homeLoading')}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.screen}
          contentContainerStyle={styles.content}
          data={feedRows}
          keyExtractor={item => item.id}
          numColumns={1}
          ListHeaderComponent={Header}
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
            !hasFeedRows ? (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="images-outline"
                  size={48}
                  color={theme.cyan}
                />

                <Text style={styles.emptyTitle}>
                  {search.trim()
                    ? 'No matching posts or communities'
                    : t('welcomeToBritume')}
                </Text>

                <Text style={styles.emptyText}>
                  {search.trim()
                    ? 'Try searching for another name or topic.'
                    : t('communityStarts')}
                </Text>
              </View>
            ) : null
          }
          renderItem={renderFeedRow}
        />
      )}

      {isDark ? (
        <View
          pointerEvents="none"
          style={styles.screenNeonFrame}
        >
          <View style={styles.screenNeonInner} />
        </View>
      ) : null}

      <Modal
        visible={selectedPost !== null}
        transparent
        animationType="slide"
        onRequestClose={closePostOptions}
        statusBarTranslucent
      >
        <Pressable
          style={styles.postMenuBackground}
          onPress={closePostOptions}
        >
          <Pressable
            style={styles.postMenuPanel}
            onPress={() => {}}
          >
            <View style={styles.postMenuHandle} />

            <View style={styles.postMenuHeader}>
              <Text style={styles.postMenuTitle}>
                Post options
              </Text>

              <Pressable
                onPress={closePostOptions}
                hitSlop={12}
                accessibilityLabel="Close post options"
              >
                <Ionicons
                  name="close-circle"
                  size={29}
                  color={theme.muted}
                />
              </Pressable>
            </View>

            {selectedPost ? (
              <ScrollView
                style={styles.postMenuScroll}
                showsVerticalScrollIndicator={false}
              >
                <Pressable
                  style={styles.postMenuItem}
                  onPress={() =>
                    runPostAction(() => void sharePost(selectedPost))
                  }
                >
                  <Ionicons
                    name="share-social-outline"
                    size={22}
                    color={theme.cyan}
                  />
                  <Text style={styles.postMenuText}>Share post</Text>
                </Pressable>

                <Pressable
                  style={styles.postMenuItem}
                  onPress={() =>
                    runPostAction(() => void handleHidePost(selectedPost))
                  }
                >
                  <Ionicons
                    name="eye-off-outline"
                    size={22}
                    color={theme.cyan}
                  />
                  <Text style={styles.postMenuText}>Hide post</Text>
                </Pressable>

                <Pressable
                  style={styles.postMenuItem}
                  onPress={() =>
                    runPostAction(() => togglePostBlur(selectedPost.id))
                  }
                >
                  <Ionicons
                    name="eye-outline"
                    size={22}
                    color={theme.cyan}
                  />
                  <Text style={styles.postMenuText}>
                    {blurredPostIds.includes(selectedPost.id)
                      ? 'Remove blur'
                      : 'Blur it'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.postMenuItem}
                  onPress={() =>
                    runPostAction(() => handleReportPost(selectedPost))
                  }
                >
                  <Ionicons
                    name="flag-outline"
                    size={22}
                    color="#E6A23C"
                  />
                  <Text style={styles.postMenuText}>Report post</Text>
                </Pressable>

                <Pressable
                  style={styles.postMenuItem}
                  onPress={() =>
                    runPostAction(() => void handleProposePost(selectedPost))
                  }
                >
                  <Ionicons
                    name="star-outline"
                    size={22}
                    color={theme.gold}
                  />
                  <Text style={styles.postMenuText}>
                    Propose for featuring
                  </Text>
                </Pressable>

                {selectedPost.user_id === userId ? (
                  <Pressable
                    style={styles.postMenuItem}
                    onPress={() =>
                      runPostAction(() => handleDeletePost(selectedPost))
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={22}
                      color="#FF5252"
                    />
                    <Text style={styles.postMenuDangerText}>
                      Delete my post
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.postMenuItem}
                    onPress={() =>
                      runPostAction(() => {
                        Alert.alert(
                          'Block this account?',
                          'Posts from this account will disappear from your feed.',
                          [
                            {
                              text: 'Cancel',
                              style: 'cancel',
                            },
                            {
                              text: 'Block',
                              style: 'destructive',
                              onPress: () =>
                                void handleBlockAccount(selectedPost),
                            },
                          ],
                        );
                      })
                    }
                  >
                    <Ionicons
                      name="ban-outline"
                      size={22}
                      color="#FF5252"
                    />
                    <Text style={styles.postMenuDangerText}>
                      Block account
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
            ) : null}

            <Pressable
              style={styles.postMenuCancel}
              onPress={closePostOptions}
            >
              <Text style={styles.postMenuCancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={activeMedia !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMedia(null)}
        statusBarTranslucent
      >
        <View style={styles.fullMediaBackground}>
          <StatusBar hidden />

          <Pressable
            style={styles.closeMediaButton}
            onPress={() => setActiveMedia(null)}
            accessibilityLabel="Close media viewer"
          >
            <Ionicons
              name="close"
              size={29}
              color="#FFFFFF"
            />
          </Pressable>

          {activeMedia?.type === 'image' ? (
            <Image
              source={{ uri: activeMedia.uri }}
              style={styles.fullMediaImage}
              resizeMode="contain"
            />
          ) : null}

          {activeMedia?.type === 'video' ? (
            <MediaVideo
              uri={activeMedia.uri}
              videoStyle={styles.fullMediaVideo}
            />
          ) : null}
        </View>
      </Modal>

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
                  size={24}
                  color={theme.cyan}
                />
                <Text style={styles.modalTitle}>
                  {t('comments')}
                </Text>
              </View>

              <Pressable
                onPress={() => setActivePostId(null)}
                accessibilityLabel={t('cancel')}
                hitSlop={10}
              >
                <Ionicons
                  name="close-circle"
                  size={30}
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
                  comments.map(comment => {
                    const commentAuthor =
                      comment.author?.display_name ||
                      (comment.author?.username
                        ? `@${comment.author.username}`
                        : t('britumeMember'));

                    const canOpenCommentProfile =
                      !!comment.author?.username?.trim() &&
                      comment.author?.is_public !== false;

                    return (
                      <View
                        key={comment.id}
                        style={styles.commentCard}
                      >
                        <Pressable
                          style={styles.avatar}
                          disabled={!canOpenCommentProfile}
                          onPress={() =>
                            openCommentAuthorProfile(comment)
                          }
                        >
                          <Ionicons
                            name="person"
                            size={18}
                            color={theme.cyan}
                          />
                        </Pressable>

                        <View style={{ flex: 1 }}>
                          <Pressable
                            disabled={!canOpenCommentProfile}
                            onPress={() =>
                              openCommentAuthorProfile(comment)
                            }
                          >
                            <Text style={styles.commentAuthor}>
                              {commentAuthor}
                            </Text>
                          </Pressable>

                          <Text style={styles.commentContent}>
                            {comment.content}
                          </Text>
                        </View>
                      </View>
                    );
                  })
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
                maxLength={500}
              />

              <Pressable
                style={styles.sendButton}
                onPress={() => void submitComment()}
                disabled={sendingComment || !commentText.trim()}
                accessibilityLabel={t('comments')}
              >
                {sendingComment ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Ionicons name="send" size={20} color="#000000" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function createStyles(theme: AppTheme, isDark: boolean) {
  const surface = theme.panel ?? (isDark ? '#000000' : '#FFFFFF');
  const raised = theme.panel2 ?? (isDark ? '#050505' : '#E4F1FF');
  const border = theme.border ?? (isDark ? '#FFFFFF' : '#D3E6F8');
  const borderStrong =
    theme.borderStrong ?? (isDark ? '#FFFFFF' : '#B9D8F5');

  const shadow = isDark ? '#FFFFFF' : '#548BCB';
  const softText = theme.muted ?? (isDark ? '#C9C9C9' : '#66829B');

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : theme.bg,
    },

    content: {
      paddingHorizontal: 12,
      paddingTop: 13,
      paddingBottom: 45,
    },

    loading: {
      flex: 1,
      backgroundColor: isDark ? '#000000' : theme.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },

    loadingText: {
      color: theme.text,
      marginTop: 13,
      fontWeight: '800',
      fontSize: 15,
    },

    screenNeonFrame: {
      position: 'absolute',
      top: 4,
      left: 4,
      right: 4,
      bottom: 4,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      borderRadius: 22,
      shadowColor: '#FFFFFF',
      shadowOpacity: 0.95,
      shadowRadius: 13,
      shadowOffset: { width: 0, height: 0 },
      elevation: 12,
    },

    screenNeonInner: {
      position: 'absolute',
      top: 3,
      left: 3,
      right: 3,
      bottom: 3,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.42)',
      borderRadius: 17,
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 19,
    },

    logoHolder: {
      marginRight: 9,
    },

    brandText: {
      flex: 1,
    },

    brandName: {
      color: theme.blueDark ?? '#0756B5',
      fontSize: 20,
      fontWeight: '900',
      letterSpacing: 1.2,
    },

    tagline: {
      color: theme.cyan,
      fontSize: 11,
      fontWeight: '900',
    },

    byline: {
      color: softText,
      fontSize: 10,
      fontWeight: '700',
    },

    topButtonLight: {
      width: 41,
      height: 41,
      borderRadius: 15,
      backgroundColor: surface,
      borderWidth: isDark ? 1.5 : 2,
      borderColor: border,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 5,
      elevation: isDark ? 8 : 7,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.85 : 0.27,
      shadowRadius: isDark ? 9 : 8,
      shadowOffset: { width: 0, height: 0 },
    },

    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: surface,
      borderRadius: 25,
      borderWidth: isDark ? 1.5 : 2,
      borderColor: border,
      paddingHorizontal: 15,
      marginBottom: 24,
      elevation: isDark ? 8 : 9,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.85 : 0.28,
      shadowRadius: isDark ? 10 : 12,
      shadowOffset: { width: 0, height: 0 },
    },

    searchInput: {
      flex: 1,
      color: theme.text,
      paddingHorizontal: 11,
      paddingVertical: 15,
      fontSize: 15,
      fontWeight: '700',
    },

    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 13,
      marginTop: 5,
    },

    headingWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '900',
    },

    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: surface,
      borderRadius: 17,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1.5,
      borderColor: border,
      elevation: isDark ? 6 : 5,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.8 : 0.15,
      shadowRadius: 6,
    },

    seeAllText: {
      color: theme.cyan,
      fontSize: 12,
      fontWeight: '900',
    },

    storiesScroll: {
      marginBottom: 19,
    },

    storiesContent: {
      paddingHorizontal: 4,
      paddingTop: 3,
      paddingBottom: 8,
      alignItems: 'flex-start',
    },

    storyCircleItem: {
      width: 76,
      alignItems: 'center',
      marginRight: 13,
    },

    storyCircleOuter: {
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 2.5,
      borderColor: isDark ? '#FFFFFF' : borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: surface,
      elevation: isDark ? 9 : 5,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.95 : 0.2,
      shadowRadius: isDark ? 10 : 6,
      shadowOffset: { width: 0, height: 0 },
    },

    storyCircleInner: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: raised,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: border,
    },

    storyAddBadge: {
      position: 'absolute',
      right: -2,
      bottom: -1,
      width: 23,
      height: 23,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 2,
      borderColor: isDark ? '#000000' : surface,
      alignItems: 'center',
      justifyContent: 'center',
    },

    storyCircleLabel: {
      color: theme.text,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 7,
      maxWidth: 76,
      textAlign: 'center',
    },

    postCard: {
      width: '100%',
      minWidth: 0,
      backgroundColor: surface,
      borderWidth: isDark ? 1.5 : 2,
      borderColor: border,
      borderRadius: 23,
      padding: 12,
      marginBottom: 18,
      elevation: isDark ? 9 : 12,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.9 : 0.32,
      shadowRadius: isDark ? 10 : 13,
      shadowOffset: { width: 0, height: 0 },
    },

    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },

    avatar: {
      width: 41,
      height: 41,
      borderRadius: 21,
      backgroundColor: raised,
      borderWidth: 1.5,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: isDark ? 5 : 3,
    },

    postAuthor: {
      flex: 1,
      marginLeft: 10,
    },

    authorName: {
      color: theme.text,
      fontWeight: '900',
      fontSize: 14,
    },

    postDate: {
      color: softText,
      fontSize: 11,
      marginTop: 4,
      fontWeight: '600',
    },

    moreButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
    },

    postCaptionWrap: {
      marginBottom: 11,
    },

    postContent: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 24,
    },

    blurredContent: {
      opacity: 0.12,
    },

    seeMoreText: {
      color: theme.cyan,
      fontSize: 14,
      fontWeight: '900',
      marginTop: 6,
    },

    imageScroller: {
      marginHorizontal: -12,
      marginBottom: 9,
    },

    mediaGallery: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    imageCard: {
      height: 420,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },

    postImage: {
      backgroundColor: '#000000',
    },

    imageExpandHint: {
      position: 'absolute',
      right: 12,
      bottom: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    blurOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.88)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 4,
    },

    blurOverlayText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 13,
      marginTop: 8,
    },

    videoMediaWrap: {
      width: '100%',
      marginBottom: 9,
      borderRadius: 15,
      overflow: 'hidden',
      backgroundColor: '#000000',
      borderWidth: isDark ? 1 : 0,
      borderColor: border,
      elevation: isDark ? 7 : 0,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.75 : 0,
      shadowRadius: 8,
      position: 'relative',
    },

    videoPlayer: {
      width: '100%',
      height: 420,
      backgroundColor: '#000000',
    },

    videoExpandButton: {
      position: 'absolute',
      right: 12,
      bottom: 12,
      width: 39,
      height: 39,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.75)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },

    postActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: borderStrong,
      paddingTop: 12,
      marginTop: 7,
    },

    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minWidth: 48,
      minHeight: 42,
      borderRadius: 15,
      backgroundColor: raised,
      paddingHorizontal: 9,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? border : 'transparent',
      elevation: isDark ? 5 : 3,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.65 : 0.18,
      shadowRadius: 5,
      shadowOffset: { width: 0, height: 0 },
    },

    actionCount: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.text,
    },

    communityCard: {
      width: '100%',
      backgroundColor: surface,
      borderWidth: isDark ? 1.5 : 2,
      borderColor: border,
      borderRadius: 22,
      padding: 15,
      marginBottom: 18,
      elevation: isDark ? 8 : 8,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.8 : 0.22,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
    },

    communityTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    communityIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: raised,
      borderWidth: 1,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },

    communityImage: {
      width: '100%',
      height: '100%',
    },

    communityInfo: {
      flex: 1,
      marginLeft: 11,
    },

    communityName: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '900',
    },

    communityMembers: {
      color: softText,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 4,
    },

    communityLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: raised,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 6,
    },

    communityLabelText: {
      color: theme.cyan,
      fontSize: 10,
      fontWeight: '900',
    },

    communityDescription: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 13,
    },

    communityDescriptionMuted: {
      color: softText,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 13,
    },

    communityBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: border,
    },

    communityInvite: {
      color: softText,
      fontSize: 11,
      fontWeight: '700',
    },

    communityJoinButton: {
      minWidth: 95,
      minHeight: 38,
      borderRadius: 13,
      paddingHorizontal: 13,
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },

    communityJoinedButton: {
      backgroundColor: raised,
      borderWidth: 1,
      borderColor: border,
    },

    communityJoinText: {
      color: '#000000',
      fontSize: 13,
      fontWeight: '900',
    },

    communityJoinedText: {
      color: theme.text,
    },

    emptyBox: {
      backgroundColor: surface,
      borderWidth: 1.5,
      borderColor: border,
      borderRadius: 25,
      padding: 27,
      alignItems: 'center',
      marginBottom: 17,
      elevation: isDark ? 8 : 10,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.85 : 0.3,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
    },

    emptyTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '900',
      marginTop: 13,
      textAlign: 'center',
    },

    emptyText: {
      color: softText,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: 8,
      fontSize: 14,
    },

    errorBox: {
      backgroundColor: isDark ? '#160000' : '#FFF0F0',
      borderWidth: 1.5,
      borderColor: isDark ? '#FFFFFF' : '#FFD0D0',
      padding: 15,
      borderRadius: 18,
      marginBottom: 14,
      elevation: isDark ? 5 : 3,
    },

    errorText: {
      color: isDark ? '#FFFFFF' : '#C52E45',
      marginBottom: 7,
      fontWeight: '700',
      fontSize: 14,
    },

    retryText: {
      color: theme.cyan,
      fontWeight: '900',
      fontSize: 14,
    },

    postMenuBackground: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.72)',
    },

    postMenuPanel: {
      backgroundColor: surface,
      borderTopLeftRadius: 27,
      borderTopRightRadius: 27,
      borderWidth: 1.5,
      borderColor: border,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 30,
      maxHeight: '85%',
    },

    postMenuHandle: {
      width: 44,
      height: 5,
      borderRadius: 3,
      backgroundColor: softText,
      alignSelf: 'center',
      marginBottom: 15,
      opacity: 0.7,
    },

    postMenuHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingBottom: 13,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },

    postMenuTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '900',
    },

    postMenuScroll: {
      flexGrow: 0,
    },

    postMenuItem: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },

    postMenuText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '700',
    },

    postMenuDangerText: {
      color: '#FF5252',
      fontSize: 15,
      fontWeight: '800',
    },

    postMenuCancel: {
      marginTop: 15,
      padding: 14,
      borderRadius: 15,
      backgroundColor: raised,
      alignItems: 'center',
    },

    postMenuCancelText: {
      color: theme.cyan,
      fontSize: 15,
      fontWeight: '900',
    },

    fullMediaBackground: {
      flex: 1,
      backgroundColor: '#000000',
      justifyContent: 'center',
      alignItems: 'center',
    },

    fullMediaImage: {
      width: '100%',
      height: '100%',
    },

    fullMediaVideo: {
      width: '100%',
      height: '100%',
      backgroundColor: '#000000',
    },

    closeMediaButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 55 : 38,
      right: 18,
      zIndex: 20,
      width: 45,
      height: 45,
      borderRadius: 23,
      backgroundColor: 'rgba(40,40,40,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalBackground: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.78)',
    },

    commentsPanel: {
      height: '72%',
      backgroundColor: isDark ? '#000000' : theme.bg,
      borderTopLeftRadius: 29,
      borderTopRightRadius: 29,
      borderTopWidth: 2,
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
      fontSize: 21,
      fontWeight: '900',
    },

    commentsList: {
      flex: 1,
      paddingVertical: 14,
    },

    noComments: {
      color: softText,
      textAlign: 'center',
      marginTop: 30,
      fontWeight: '700',
      fontSize: 14,
    },

    commentCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 11,
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: border,
      padding: 13,
      borderRadius: 17,
      marginBottom: 11,
      elevation: isDark ? 4 : 5,
      shadowColor: shadow,
      shadowOpacity: isDark ? 0.6 : 0.18,
      shadowRadius: 6,
    },

    commentAuthor: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '900',
    },

    commentContent: {
      color: softText,
      fontSize: 14,
      marginTop: 5,
      lineHeight: 21,
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
      minHeight: 47,
      maxHeight: 95,
      backgroundColor: surface,
      borderWidth: 1.5,
      borderColor: border,
      borderRadius: 21,
      paddingHorizontal: 15,
      paddingVertical: 11,
      color: theme.text,
      fontWeight: '600',
      fontSize: 14,
      elevation: isDark ? 4 : 3,
    },

    sendButton: {
      width: 49,
      height: 49,
      borderRadius: 18,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: isDark ? '#FFFFFF' : border,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: isDark ? 8 : 5,
      shadowColor: '#FFFFFF',
      shadowOpacity: isDark ? 0.8 : 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 0 },
    },
  });
}
