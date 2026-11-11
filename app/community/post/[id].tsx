
// app/community/post/[id].tsx

import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { supabase } from '../../../src/lib/supabase';

import {
  fetchCommunityPostComments,
  createCommunityPostComment,
  deleteCommunityPostComment,
  fetchCommunityPosts,
} from '../../../src/lib/communityPosts';

type CommentItem = {
  id: string;
  content?: string;
  user_id?: string;
  created_at?: string;
  author?: {
    display_name?: string;
    username?: string;
  };
  profile?: {
    display_name?: string;
    username?: string;
  };
};

type PostItem = {
  id: string;
  content?: string | null;
  post_type?: string;
  link_url?: string | null;
  created_at?: string;
  author?: {
    display_name?: string;
    username?: string;
  };
  like_count?: number;
  comment_count?: number;
};

export default function CommunityPostScreen() {
  const params = useLocalSearchParams<{
    id: string;
    communityId?: string;
  }>();

  const postId = String(params.id || '');
  const communityId = String(params.communityId || '');

  const [post, setPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!postId) {
      setLoading(false);
      return;
    }

    try {
      const [postResult, commentResult, userResult] =
        await Promise.all([
          communityId
            ? fetchCommunityPosts(communityId)
            : Promise.resolve([]),
          fetchCommunityPostComments(postId),
          supabase?.auth.getUser(),
        ]);

      const foundPost = Array.isArray(postResult)
        ? postResult.find((item: PostItem) => item.id === postId)
        : null;

      setPost(foundPost || null);
      setComments(Array.isArray(commentResult) ? commentResult : []);
      setCurrentUserId(userResult?.data.user?.id || null);
    } catch (error: any) {
      Alert.alert(
        'BRITUME',
        error?.message || 'Could not load this post.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, communityId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = () => {
    setRefreshing(true);
    loadData();
  };

  const sendComment = async () => {
    const message = commentText.trim();

    if (!message) {
      Alert.alert('BRITUME', 'Write a comment first.');
      return;
    }

    if (message.length > 3000) {
      Alert.alert(
        'BRITUME',
        'Your comment cannot exceed 3,000 characters.'
      );
      return;
    }

    try {
      setSending(true);

      await createCommunityPostComment({
        postId,
        content: message,
      });

      setCommentText('');
      await loadData();
    } catch (error: any) {
      Alert.alert(
        'BRITUME',
        error?.message || 'Could not publish your comment.'
      );
    } finally {
      setSending(false);
    }
  };

  const deleteComment = (comment: CommentItem) => {
    Alert.alert(
      'Delete comment',
      'Are you sure you want to delete this comment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCommunityPostComment(comment.id);
              await loadData();
            } catch (error: any) {
              Alert.alert(
                'BRITUME',
                error?.message || 'Could not delete this comment.'
              );
            }
          },
        },
      ]
    );
  };

  const getAuthorName = (comment: CommentItem) => {
    return (
      comment.author?.display_name ||
      comment.profile?.display_name ||
      comment.author?.username ||
      comment.profile?.username ||
      'BRITUME member'
    );
  };

  const formatDate = (date?: string) => {
    if (!date) return '';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return '';

    return parsed.toLocaleString();
  };

  const renderComment = ({ item }: { item: CommentItem }) => {
    const canDelete =
      !!currentUserId && item.user_id === currentUserId;

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentAvatar}>
          <Ionicons
            name="person"
            size={18}
            color="#6759D8"
          />
        </View>

        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>
              {getAuthorName(item)}
            </Text>
            <Text style={styles.commentDate}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          <Text style={styles.commentText}>
            {item.content || ''}
          </Text>

          {canDelete && (
            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteComment(item)}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color="#D94A5B"
              />
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6759D8" />
        <Text style={styles.loadingText}>
          Loading discussion...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 85 : 0}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#222222"
          />
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Discussion</Text>
          <Text style={styles.headerSubtitle}>
            {comments.length} comments
          </Text>
        </View>

        <Pressable
          onPress={refresh}
          style={styles.refreshButton}
        >
          <Ionicons
            name="refresh-outline"
            size={22}
            color="#555555"
          />
        </Pressable>
      </View>

      {!post ? (
        <View style={styles.center}>
          <Ionicons
            name="document-text-outline"
            size={48}
            color="#AAAAAA"
          />
          <Text style={styles.emptyTitle}>
            Post not found
          </Text>
          <Text style={styles.emptyDescription}>
            This post may have been deleted or is no longer available.
          </Text>
        </View>
      ) : (
        <>
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor="#6759D8"
              />
            }
            ListHeaderComponent={
              <View style={styles.postCard}>
                <View style={styles.postAuthorRow}>
                  <View style={styles.postAvatar}>
                    <Ionicons
                      name="person"
                      size={21}
                      color="#6759D8"
                    />
                  </View>

                  <View style={styles.postAuthorInfo}>
                    <Text style={styles.postAuthor}>
                      {post.author?.display_name ||
                        post.author?.username ||
                        'BRITUME member'}
                    </Text>
                    <Text style={styles.postDate}>
                      {formatDate(post.created_at)}
                    </Text>
                  </View>
                </View>

                {!!post.content && (
                  <Text style={styles.postContent}>
                    {post.content}
                  </Text>
                )}

                {!!post.link_url && (
                  <Text style={styles.postLink}>
                    {post.link_url}
                  </Text>
                )}

                <View style={styles.postStats}>
                  <Text style={styles.statText}>
                    {post.like_count || 0} likes
                  </Text>
                  <Text style={styles.statText}>
                    {comments.length} comments
                  </Text>
                </View>

                <View style={styles.discussionHeading}>
                  <Text style={styles.discussionTitle}>
                    Comments
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={40}
                  color="#AAAAAA"
                />
                <Text style={styles.emptyTitle}>
                  No comments yet
                </Text>
                <Text style={styles.emptyDescription}>
                  Start the conversation.
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />

          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#999999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={3000}
              editable={!sending}
            />

            <Pressable
              style={[
                styles.sendButton,
                sending && styles.disabledButton,
              ]}
              onPress={sendComment}
              disabled={sending || !commentText.trim()}
            >
              {sending ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons
                  name="send"
                  size={19}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    paddingTop: Platform.OS === 'android' ? 35 : 55,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  loadingText: {
    color: '#777777',
    fontSize: 13,
    marginTop: 12,
  },
  header: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAF0',
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#888888',
    fontSize: 11,
    marginTop: 3,
  },
  refreshButton: {
    padding: 7,
  },
  listContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
  },
  postAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  postAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#EFEDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthorInfo: {
    marginLeft: 10,
    flex: 1,
  },
  postAuthor: {
    color: '#222222',
    fontSize: 13,
    fontWeight: '800',
  },
  postDate: {
    color: '#999999',
    fontSize: 10,
    marginTop: 4,
  },
  postContent: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 22,
  },
  postLink: {
    color: '#6759D8',
    fontSize: 13,
    marginTop: 10,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF2',
    marginTop: 15,
    paddingTop: 12,
  },
  statText: {
    color: '#888888',
    fontSize: 11,
  },
  discussionHeading: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEF2',
    marginTop: 14,
    paddingTop: 14,
  },
  discussionTitle: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '900',
  },
  commentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 9,
    borderRadius: 12,
    gap: 10,
  },
  commentAvatar: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#EFEDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 5,
  },
  commentAuthor: {
    color: '#292929',
    fontSize: 12,
    fontWeight: '800',
  },
  commentDate: {
    color: '#999999',
    fontSize: 9,
  },
  commentText: {
    color: '#444444',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 9,
  },
  deleteText: {
    color: '#D94A5B',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 25,
  },
  emptyTitle: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptyDescription: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  commentComposer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAF0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 43,
    maxHeight: 110,
    backgroundColor: '#F5F6FA',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#222222',
    fontSize: 13,
  },
  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#6759D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.55,
  },
});
