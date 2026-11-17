import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';

import {
  fetchCommunities,
  joinCommunity,
  leaveCommunity,
} from '../../src/lib/communities';
import {
  fetchCommunityPosts,
  toggleCommunityPostLike,
  deleteCommunityPost,
  type CommunityPost,
} from '../../src/lib/communityPosts';
import { supabase } from '../../src/lib/supabase';
import { withThemeBackground } from '../../src/components/ThemeScreen';

function CommunityVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, instance => {
    instance.loop = false;
    instance.muted = false;
    instance.volume = 1;
  });

  return (
    <VideoView
      player={player}
      style={styles.postVideo}
      contentFit="contain"
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

function CommunityFeedScreen() {
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const communityId = String(params.id || '');
  const communityName = String(params.name || 'Community');

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [membershipBusy, setMembershipBusy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (!communityId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [communityList, postList, userResult] = await Promise.all([
        fetchCommunities(),
        fetchCommunityPosts(communityId),
        supabase?.auth.getUser(),
      ]);

      const community = communityList.find(item => item.id === communityId);
      setIsMember(Boolean(community?.is_member));
      setIsOwner(Boolean(community?.is_owner));
      setCurrentUserId(userResult?.data.user?.id || null);
      setPosts(postList);
    } catch (error: any) {
      Alert.alert('Community', error?.message || 'Could not load this community.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  const handleMembership = async () => {
    try {
      setMembershipBusy(true);
      if (isMember) {
        if (isOwner) return;
        await leaveCommunity(communityId);
      } else {
        await joinCommunity(communityId);
      }
      await loadFeed();
    } catch (error: any) {
      Alert.alert('Community', error?.message || 'Could not update membership.');
    } finally {
      setMembershipBusy(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const liked = await toggleCommunityPostLike(postId);
      setPosts(previous => previous.map(post =>
        post.id === postId
          ? {
              ...post,
              is_liked: liked,
              like_count: Math.max(0, post.like_count + (liked ? 1 : -1)),
            }
          : post
      ));
    } catch (error: any) {
      Alert.alert('Like', error?.message || 'Could not update like.');
    }
  };

  const openComments = (post: CommunityPost) => {
    router.push({
      pathname: '/community/post/[id]',
      params: { id: post.id, communityId },
    });
  };

  const handleDelete = (post: CommunityPost) => {
    Alert.alert(
      'Delete post',
      'Are you sure you want to delete this community post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommunityPost(post.id);
              setPosts(previous => previous.filter(item => item.id !== post.id));
            } catch (error: any) {
              Alert.alert('Delete failed', error?.message || 'Could not delete post.');
            }
          },
        },
      ],
    );
  };

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Link', 'Could not open this website.');
    }
  };

  const renderPost = ({ item }: { item: CommunityPost }) => {
    const isAuthor = currentUserId === item.user_id;

    return (
      <View style={styles.postCard}>
        {item.is_announcement && (
          <View style={styles.announcement}>
            <Ionicons name="megaphone" size={15} color="#8B6500" />
            <Text style={styles.announcementText}>Announcement</Text>
          </View>
        )}

        <View style={styles.postHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={21} color="#6759D8" />
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {item.author?.display_name || item.author?.username || 'BRITUME member'}
            </Text>
            <Text style={styles.postDate}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
          {isAuthor && (
            <Pressable onPress={() => handleDelete(item)} accessibilityLabel="Delete your post">
              <Ionicons name="ellipsis-horizontal" size={23} color="#777777" />
            </Pressable>
          )}
        </View>

        {!!item.content && <Text style={styles.postContent}>{item.content}</Text>}

        {!!item.link_url && (
          <Pressable style={styles.linkCard} onPress={() => void openLink(item.link_url!)}>
            <Ionicons name="link" size={21} color="#6759D8" />
            <Text style={styles.linkText} numberOfLines={2}>{item.link_url}</Text>
            <Ionicons name="open-outline" size={17} color="#6759D8" />
          </Pressable>
        )}

        {item.media.map(media => (
          <View key={media.id} style={styles.mediaContainer}>
            {media.media_type === 'image' && media.url ? (
              <Image source={{ uri: media.url }} style={styles.postImage} resizeMode="contain" />
            ) : media.media_type === 'video' && media.url ? (
              <CommunityVideo uri={media.url} />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="alert-circle-outline" size={32} color="#6759D8" />
                <Text style={styles.videoText}>Media unavailable</Text>
                <Text style={styles.videoNote}>Refresh the community to try loading it again.</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.postActions}>
          <Pressable style={styles.actionButton} onPress={() => void handleLike(item.id)} disabled={!isMember}>
            <Ionicons
              name={item.is_liked ? 'heart' : 'heart-outline'}
              size={21}
              color={item.is_liked ? '#E44862' : '#555555'}
            />
            <Text style={styles.actionText}>{item.like_count}</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={() => openComments(item)} disabled={!isMember}>
            <Ionicons name="chatbubble-outline" size={20} color="#555555" />
            <Text style={styles.actionText}>{item.comment_count}</Text>
          </Pressable>

          <View style={styles.postType}>
            <Text style={styles.postTypeText}>{item.post_type}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#6759D8" />
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={25} color="#222222" />
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{communityName}</Text>
          <Text style={styles.headerSubtitle}>Community feed</Text>
        </View>

        {isOwner ? (
          <View style={styles.ownerPill}>
            <Ionicons name="shield-checkmark" size={14} color="#5547B8" />
            <Text style={styles.ownerPillText}>Owner</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.membershipButton, isMember && styles.leaveButton]}
            onPress={() => void handleMembership()}
            disabled={membershipBusy}
          >
            {membershipBusy ? (
              <ActivityIndicator size="small" color={isMember ? '#333333' : '#FFFFFF'} />
            ) : (
              <Text style={[styles.membershipText, isMember && styles.leaveText]}>
                {isMember ? 'Leave' : 'Join'}
              </Text>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push({
            pathname: '/community/create-post',
            params: { communityId, communityName },
          })}
          disabled={!isMember}
          style={[styles.addButton, !isMember && styles.disabledAddButton]}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {!isMember && (
        <View style={styles.joinNotice}>
          <Ionicons name="information-circle-outline" size={20} color="#6759D8" />
          <Text style={styles.joinNoticeText}>Join this community to publish, like and comment.</Text>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadFeed();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#999999" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyDescription}>
              {isMember
                ? 'Be the first to share something with this community.'
                : 'Join this community to see and share its posts.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6FA', paddingTop: 42 },
  header: { minHeight: 68, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, borderBottomWidth: 1, borderBottomColor: '#EAEAF0' },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#222222', fontSize: 16, fontWeight: '800' },
  headerSubtitle: { color: '#888888', fontSize: 11, marginTop: 3 },
  ownerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFEDFF', paddingHorizontal: 8, paddingVertical: 7, borderRadius: 9 },
  ownerPillText: { color: '#5547B8', fontSize: 11, fontWeight: '800' },
  membershipButton: { minWidth: 58, height: 36, paddingHorizontal: 10, borderRadius: 9, backgroundColor: '#6759D8', alignItems: 'center', justifyContent: 'center' },
  leaveButton: { backgroundColor: '#EEEEF4' },
  membershipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  leaveText: { color: '#333333' },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6759D8', alignItems: 'center', justifyContent: 'center' },
  disabledAddButton: { opacity: 0.4 },
  joinNotice: { flexDirection: 'row', alignItems: 'center', gap: 9, margin: 12, padding: 13, borderRadius: 12, backgroundColor: '#EFEDFF' },
  joinNoticeText: { flex: 1, color: '#5547B8', fontSize: 12 },
  feedContent: { padding: 12, paddingBottom: 35, flexGrow: 1 },
  postCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 13, borderWidth: 1, borderColor: '#EAEAF0' },
  announcement: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF4D8', padding: 9, borderRadius: 9, marginBottom: 12 },
  announcementText: { color: '#8B6500', fontWeight: '700', fontSize: 12 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEDFF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  authorInfo: { flex: 1 },
  authorName: { color: '#222222', fontSize: 14, fontWeight: '800' },
  postDate: { color: '#999999', fontSize: 11, marginTop: 3 },
  postContent: { color: '#333333', fontSize: 14, lineHeight: 22, marginBottom: 12 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#F5F4FF', borderRadius: 11, padding: 12, marginBottom: 12 },
  linkText: { flex: 1, color: '#5547B8', fontSize: 13 },
  mediaContainer: { marginBottom: 12 },
  postImage: { width: '100%', height: 280, borderRadius: 12, backgroundColor: '#EEEEEE' },
  postVideo: { width: '100%', height: 260, borderRadius: 12, backgroundColor: '#000000' },
  videoPlaceholder: { minHeight: 150, backgroundColor: '#EFEDFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 15 },
  videoText: { color: '#5547B8', fontSize: 14, fontWeight: '700', marginTop: 8 },
  videoNote: { color: '#777777', fontSize: 11, marginTop: 5, textAlign: 'center' },
  postActions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEEEF2', paddingTop: 12, gap: 22 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#555555', fontSize: 13 },
  postType: { marginLeft: 'auto', backgroundColor: '#F0F0F5', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  postTypeText: { color: '#777777', fontSize: 10, textTransform: 'capitalize' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 65 },
  emptyTitle: { color: '#333333', fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptyDescription: { color: '#777777', fontSize: 13, marginTop: 7, textAlign: 'center', paddingHorizontal: 25 },
  loadingScreen: { flex: 1, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#777777', marginTop: 12, fontSize: 13 },
});

export default withThemeBackground(CommunityFeedScreen);
