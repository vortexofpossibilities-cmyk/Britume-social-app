// src/lib/communityPosts.ts

import { supabase, supabaseConfigured } from './supabase';

export type CommunityPostType =
  | 'text'
  | 'photo'
  | 'video'
  | 'link';

export type CommunityPost = {
  id: string;
  community_id: string;
  user_id: string;
  content: string | null;
  post_type: CommunityPostType;
  link_url: string | null;
  is_announcement: boolean;
  created_at: string;
  updated_at: string;
  author?: {
    user_id: string;
    display_name: string | null;
    username: string | null;
  } | null;
  media: CommunityPostMedia[];
  like_count: number;
  comment_count: number;
  is_liked: boolean;
};

export type CommunityPostMedia = {
  id: string;
  post_id: string;
  user_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  mime_type: string | null;
  position: number;
  url: string | null;
};

export type CommunityPostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    user_id: string;
    display_name: string | null;
    username: string | null;
  } | null;
};

const MEDIA_BUCKET = 'britume-media';

function getClient() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(
      'BRITUME is not connected to Supabase. Check your environment variables.'
    );
  }

  return supabase;
}

async function getCurrentUserId(): Promise<string> {
  const client = getClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error('Please sign in to continue.');
  }

  return data.user.id;
}

// =====================================================
// FETCH COMMUNITY POSTS
// =====================================================

export async function fetchCommunityPosts(
  communityId: string
): Promise<CommunityPost[]> {
  const client = getClient();
  const userId = await getCurrentUserId();

  const { data: posts, error } = await client
    .from('community_posts')
    .select('*')
    .eq('community_id', communityId)
    .order('is_announcement', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!posts?.length) return [];

  const postIds = posts.map((post) => post.id);
  const userIds = [...new Set(posts.map((post) => post.user_id))];

  const [
    { data: media, error: mediaError },
    { data: likes, error: likesError },
    { data: comments, error: commentsError },
    { data: profiles, error: profilesError },
  ] = await Promise.all([
    client
      .from('community_post_media')
      .select('*')
      .in('post_id', postIds)
      .order('position', { ascending: true }),

    client
      .from('community_post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds),

    client
      .from('community_post_comments')
      .select('post_id')
      .in('post_id', postIds),

    client
      .from('profiles')
      .select('user_id, display_name, username')
      .in('user_id', userIds),
  ]);

  if (mediaError) throw mediaError;
  if (likesError) throw likesError;
  if (commentsError) throw commentsError;

  const profileMap = new Map(
    (profilesError ? [] : profiles || []).map((profile) => [
      profile.user_id,
      profile,
    ])
  );

  const mediaWithUrls: CommunityPostMedia[] = await Promise.all(
    (media || []).map(async (item) => {
      const { data } = await client.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(item.storage_path, 60 * 60);

      return {
        ...item,
        url: data?.signedUrl || null,
      };
    })
  );

  return posts.map((post) => {
    const postLikes = (likes || []).filter(
      (like) => like.post_id === post.id
    );

    const postComments = (comments || []).filter(
      (comment) => comment.post_id === post.id
    );

    return {
      ...post,
      author: profileMap.get(post.user_id) || null,
      media: mediaWithUrls.filter(
        (item) => item.post_id === post.id
      ),
      like_count: postLikes.length,
      comment_count: postComments.length,
      is_liked: postLikes.some(
        (like) => like.user_id === userId
      ),
    };
  });
}

// =====================================================
// CREATE COMMUNITY POST
// =====================================================

export async function createCommunityPost(input: {
  communityId: string;
  content?: string;
  postType?: CommunityPostType;
  linkUrl?: string;
  isAnnouncement?: boolean;
}) {
  const client = getClient();
  const userId = await getCurrentUserId();

  const content = input.content?.trim() || null;
  const linkUrl = input.linkUrl?.trim() || null;
  const postType = input.postType || 'text';

  if (!content && !linkUrl && postType !== 'photo' && postType !== 'video') {
    throw new Error('Please add text, a link, or media to your post.');
  }

  if (content && content.length > 10000) {
    throw new Error('Your post is too long. Maximum is 10,000 characters.');
  }

  if (linkUrl) {
    try {
      const parsed = new URL(linkUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error();
      }
    } catch {
      throw new Error('Please enter a valid website link.');
    }
  }

  const { data: membership, error: membershipError } = await client
    .from('community_members')
    .select('id')
    .eq('community_id', input.communityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membershipError) throw membershipError;

  if (!membership) {
    throw new Error('Join this community before publishing.');
  }

  const { data, error } = await client
    .from('community_posts')
    .insert({
      community_id: input.communityId,
      user_id: userId,
      content,
      post_type: postType,
      link_url: linkUrl,
      is_announcement: input.isAnnouncement === true,
    })
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

// =====================================================
// ADD MEDIA RECORD TO A COMMUNITY POST
// Upload the file first, then call this function.
// =====================================================

export async function addCommunityPostMedia(input: {
  postId: string;
  storagePath: string;
  mediaType: 'image' | 'video';
  mimeType?: string;
  position?: number;
}) {
  const client = getClient();
  const userId = await getCurrentUserId();

  if (!input.storagePath.trim()) {
    throw new Error('Media storage path is required.');
  }

  const { data, error } = await client
    .from('community_post_media')
    .insert({
      post_id: input.postId,
      user_id: userId,
      storage_path: input.storagePath,
      media_type: input.mediaType,
      mime_type: input.mimeType || null,
      position: input.position ?? 0,
    })
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

// =====================================================
// DELETE COMMUNITY POST
// =====================================================

export async function deleteCommunityPost(postId: string) {
  const client = getClient();

  const { error } = await client
    .from('community_posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;

  return true;
}

// =====================================================
// LIKE / UNLIKE COMMUNITY POST
// =====================================================

export async function toggleCommunityPostLike(
  postId: string
): Promise<boolean> {
  const client = getClient();
  const userId = await getCurrentUserId();

  const { data: existing, error: checkError } = await client
    .from('community_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existing) {
    const { error } = await client
      .from('community_post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) throw error;

    return false;
  }

  const { error } = await client
    .from('community_post_likes')
    .insert({
      post_id: postId,
      user_id: userId,
    });

  if (error) throw error;

  return true;
}

// =====================================================
// FETCH COMMUNITY POST COMMENTS
// =====================================================

export async function fetchCommunityPostComments(
  postId: string
): Promise<CommunityPostComment[]> {
  const client = getClient();

  const { data: comments, error } = await client
    .from('community_post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!comments?.length) return [];

  const userIds = [...new Set(comments.map((item) => item.user_id))];

  const { data: profiles, error: profileError } = await client
    .from('profiles')
    .select('user_id, display_name, username')
    .in('user_id', userIds);

  const profileMap = new Map(
    (profileError ? [] : profiles || []).map((profile) => [
      profile.user_id,
      profile,
    ])
  );

  return comments.map((comment) => ({
    ...comment,
    author: profileMap.get(comment.user_id) || null,
  }));
}

// =====================================================
// CREATE COMMUNITY POST COMMENT
// =====================================================

export async function createCommunityPostComment(input: {
  postId: string;
  content: string;
}) {
  const client = getClient();
  const userId = await getCurrentUserId();

  const content = input.content.trim();

  if (!content) {
    throw new Error('Please write a comment.');
  }

  if (content.length > 2000) {
    throw new Error('Comments cannot exceed 2,000 characters.');
  }

  const { data, error } = await client
    .from('community_post_comments')
    .insert({
      post_id: input.postId,
      user_id: userId,
      content,
    })
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

// =====================================================
// DELETE COMMUNITY POST COMMENT
// =====================================================

export async function deleteCommunityPostComment(
  commentId: string
) {
  const client = getClient();

  const { error } = await client
    .from('community_post_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;

  return true;
}

// =====================================================
// UPDATE COMMUNITY POST
// =====================================================

export async function updateCommunityPost(input: {
  postId: string;
  content: string;
  linkUrl?: string | null;
}) {
  const client = getClient();

  const content = input.content.trim() || null;
  const linkUrl = input.linkUrl?.trim() || null;

  if (!content && !linkUrl) {
    throw new Error('A post cannot be completely empty.');
  }

  if (content && content.length > 10000) {
    throw new Error('Your post is too long.');
  }

  const { data, error } = await client
    .from('community_posts')
    .update({
      content,
      link_url: linkUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.postId)
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

// =====================================================
// FETCH COMMUNITY POST COUNTS
// =====================================================

export async function fetchCommunityPostCounts(postId: string) {
  const client = getClient();

  const [
    { count: likes, error: likesError },
    { count: comments, error: commentsError },
  ] = await Promise.all([
    client
      .from('community_post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId),

    client
      .from('community_post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId),
  ]);

  if (likesError) throw likesError;
  if (commentsError) throw commentsError;

  return {
    likes: likes || 0,
    comments: comments || 0,
  };
    }
