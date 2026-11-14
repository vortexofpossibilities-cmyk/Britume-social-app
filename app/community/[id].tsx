import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { fetchCommunities } from '../../src/lib/communities';
import {
  fetchCommunityPosts,
  toggleCommunityPostLike,
  fetchCommunityPostComments,
  createCommunityPostComment,
  deleteCommunityPost,
  type CommunityPost,
  type CommunityPostComment,
} from '../../src/lib/communityPosts';

import { supabase } from '../../src/lib/supabase';

import { withThemeBackground } from '../../src/components/ThemeScreen';

function CommunityFeedScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();

  const communityId = String(params.id || '');
  const communityName = String(params.name || 'Community');

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommunityPostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commenting, setCommenting] = useState(false);

  const loadFeed = useCallback(async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    try {
      const userResult = await supabase?.auth.getUser();
      setCurrentUserId(userResult?.data.user?.id || null);

      const [communityList, postList] = await Promise.all([
        fetchCommunities(),
        fetchCommunityPosts(communityId),
      ]);

      const community = communityList.find(
        (item) => item.id === communityId
      );

      setIsMember(Boolean(community?.is_member));
      setPosts(postList);
    } catch (error: any) {
      Alert.alert(
        'Community',
        error?.message || 'Could not load this community.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const handleLike = async (postId: string) => {
    try {
      const liked = await toggleCommunityPostLike(postId);

      setPosts((previous) =>
        previous.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked: liked,
                like_count: Math.max(
                  0,
                  post.like_count + (liked ? 1 : -1)
                ),
              }
            : post
        )
      );
    } catch (error: any) {
      Alert.alert('Like', error?.message || 'Could not update like.');
    }
  };

  const openComments = async (postId: string) => {
    setCommentsPostId(postId);
    setComments([]);
    setCommentsLoading(true);

    try {
      const result = await fetchCommunityPostComments(postId);
      setComments(result);
    } catch (error: any) {
      Alert.alert('Comments', error?.message || 'Could not load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!commentsPostId || !commentText.trim()) return;

    try {
      setCommenting(true);

      await createCommunityPostComment({
        postId: commentsPostId,
        content: commentText,
      });

      setCommentText('');

      const result = await fetchCommunityPostComments(commentsPostId);
      setComments(result);

      setPosts((previous) =>
        previous.map((post) =>
          post.id === commentsPostId
            ? { ...post, comment_count: post.comment_count + 1 }
            : post
        )
      );
    } catch (error: any) {
      Alert.alert('Comment', error?.message || 'Could not publish comment.');
    } finally {
      setCommenting(false);
    }
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
              setPosts((previous) =>
                previous.filter((item) => item.id !== post.id)
              );
            } catch (error: any) {
              Alert.alert(
                'Delete failed',
                error?.message || 'Could not delete post.'
              );
            }
          },
        },
      ]
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
    const isOwner = currentUserId === item.user_id;

    return (
      <View style={styles.postCard}>
        {item.is_announcement && (
          <View style={styles.announcement}>
            <Ionicons name="megaphone" size={15} color="#8B6500" />
            <Text style={styles.announcementText}>Announcement</Text>
          </View>
        )}

        <View style={styles.postHeader}>
          <Pressable style={styles.avatar}>
            <Ionicons name="person" size={21} color="#6759D8" />
          </Pressable>

          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {item.author?.display_name ||
                item.author?.username ||
                'BRITUME member'}
            </Text>
            <Text style={styles.postDate}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </View>

          {isOwner && (
            <Pressable onPress={() => handleDelete(item)}>
              <Ionicons
                name="ellipsis-horizontal"
                size={23}
                color="#777777"
              />
            </Pressable>
          )}
        </View>

        {!!item.content && (
          <Text style={styles.postContent}>{item.content}</Text>
        )}

        {!!item.link_url && (
          <Pressable
            style={styles.linkCard}
            onPress={() => openLink(item.link_url!)}
          >
            <Ionicons name="link" size={21} color="#6759D8" />
            <Text style={styles.linkText} numberOfLines={2}>
              {item.link_url}
            </Text>
            <Ionicons name="open-outline" size={17} color="#6759D8" />
          </Pressable>
        )}

        {item.media.map((media) => (
          <View key={media.id} style={styles.mediaContainer}>
            {media.media_type === 'image' && media.url ? (
              <Image
                source={{ uri: media.url }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Ionicons
                  name="videocam"
                  size={38}
                  color="#6759D8"
                />
                <Text style={styles.videoText}>
                  Video attached
                </Text>
                <Text style={styles.videoNote}>
                  Video playback will be connected in the next update.
                </Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.postActions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={item.is_liked ? 'heart' : 'heart-outline'}
              size={21}
              color={item.is_liked ? '#E44862' : '#555555'}
            />
            <Text style={styles.actionText}>
              {item.like_count}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => openComments(item.id)}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color="#555555"
            />
            <Text style={styles.actionText}>
              {item.comment_count}
            </Text>
          </Pressable>

          <View style={styles.postType}>
            <Text style={styles.postTypeText}>
              {item.post_type}
            </Text>
          </View>
        </View>

        {commentsPostId === item.id && (
          <View style={styles.commentsPanel}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <Pressable onPress={() => setCommentsPostId(null)}>
                <Ionicons name="close" size={22} color="#555555" />
              </Pressable>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color="#6759D8" />
            ) : comments.length === 0 ? (
              <Text style={styles.noComments}>
                No comments yet.
              </Text>
            ) : (
              comments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>
                    {comment.author?.display_name ||
                      comment.author?.username ||
                      'Member'}
                  </Text>
                  <Text style={styles.commentContent}>
                    {comment.content}
                  </Text>
                </View>
              ))
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#888888"
                value={commentText}
                onChangeText={setCommentText}
                maxLength={2000}
              />

              <Pressable
                style={styles.sendComment}
                disabled={commenting || !commentText.trim()}
                onPress={submitComment}
              >
                {commenting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons
                    name="send"
                    size={17}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>
          </View>
        )}
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
          <Text style={styles.headerTitle} numberOfLines={1}>
            {communityName}
          </Text>
          <Text style={styles.headerSubtitle}>Community feed</Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: '/community/create-post',
              params: {
                communityId,
                communityName,
              },
            })
          }
          disabled={!isMember}
          style={[
            styles.addButton,
            !isMember && styles.disabledAddButton,
          ]}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {!isMember && (
        <View style={styles.joinNotice}>
          <Ionicons name="information-circle-outline" size={20} color="#6759D8" />
          <Text style={styles.joinNoticeText}>
            Join this community to publish, like and comment.
          </Text>
        </View>
      )}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadFeed();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color="#999999"
            />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyDescription}>
              Be the first to share something with this community.
            </Text>
          </View>
        }
      />

      {commentsPostId && (
        <View style={styles.bottomSpace} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    paddingTop: 42,
  },
  header: {
    height: 68,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAF0',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#222222',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#888888',
    fontSize: 12,
    marginTop: 3,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#6759D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledAddButton: {
    opacity: 0.4,
  },
  joinNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    margin: 12,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#EFEDFF',
  },
  joinNoticeText: {
    flex: 1,
    color: '#5547B8',
    fontSize: 12,
  },
  feedContent: {
    padding: 12,
    paddingBottom: 35,
    flexGrow: 1,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#EAEAF0',
  },
  announcement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4D8',
    padding: 9,
    borderRadius: 9,
    marginBottom: 12,
  },
  announcementText: {
    color: '#8B6500',
    fontWeight: '700',
    fontSize: 12,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFEDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#222222',
    fontSize: 14,
    fontWeight: '800',
  },
  postDate: {
    color: '#999999',
    fontSize: 11,
    marginTop: 3,
  },
  postContent: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#F5F4FF',
    borderRadius: 11,
    padding: 12,
    marginBottom: 12,
  },
  linkText: {
    flex: 1,
    color: '#5547B8',
    fontSize: 13,
  },
  mediaContainer: {
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 230,
    borderRadius: 12,
    backgroundColor: '#EEEEEE',
  },
  videoPlaceholder: {
    minHeight: 170,
    backgroundColor: '#EFEDFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  videoText: {
    color: '#5547B8',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  videoNote: {
    color: '#777777',
    fontSize: 11,
    marginTop: 5,
    textAlign: 'center',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF2',
    paddingTop: 12,
    gap: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    color: '#555555',
    fontSize: 13,
  },
  postType: {
    marginLeft: 'auto',
    backgroundColor: '#F0F0F5',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  postTypeText: {
    color: '#777777',
    fontSize: 10,
    textTransform: 'capitalize',
  },
  commentsPanel: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEF2',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentsTitle: {
    color: '#222222',
    fontSize: 15,
    fontWeight: '800',
  },
  noComments: {
    color: '#888888',
    fontSize: 12,
    paddingVertical: 12,
  },
  commentItem: {
    backgroundColor: '#F5F6FA',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  commentAuthor: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  commentContent: {
    color: '#555555',
    fontSize: 13,
    lineHeight: 19,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 42,
    backgroundColor: '#F5F6FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    color: '#222222',
    fontSize: 13,
  },
  sendComment: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#6759D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 65,
  },
  emptyTitle: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 14,
  },
  emptyDescription: {
    color: '#777777',
    fontSize: 13,
    marginTop: 7,
    textAlign: 'center',
    paddingHorizontal: 25,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#777777',
    marginTop: 12,
    fontSize: 13,
  },
  bottomSpace: {
    height: 8,
  },
});

export default withThemeBackground(CommunityFeedScreen);
