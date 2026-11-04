
export async function fetchPostsForUser(
  userId: string,
  options: { includePrivate?: boolean } = {},
): Promise<FeedPost[]> {
  const client = ensureSupabase();

  if (!userId) {
    throw new Error('A user ID is required to load posts.');
  }

  let data;
  let error;

  if (options.includePrivate) {
    const result = await client
      .from('posts')
      .select('id, user_id, content, post_type, visibility, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);

    data = result.data;
    error = result.error;
  } else {
    const result = await client
      .from('posts')
      .select('id, user_id, content, post_type, visibility, created_at')
      .eq('user_id', userId)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(40);

    data = result.data;
    error = result.error;
  }

  if (error) {
    throw new Error(`Could not load user posts: ${error.message}`);
  }

  return enrichPosts(
    (data ?? []) as Omit<FeedPost, 'author' | 'media'>[],
  );
}

import { supabase } from './supabase';

const MEDIA_BUCKET = 'britume-media';
const SIGNED_URL_SECONDS = 60 * 60;

function ensureSupabase() {
  if (!supabase) {
    throw new Error(
      'BRITUME is not connected to Supabase. Check your Supabase configuration.',
    );
  }

  return supabase;
}

export type ProfileSummary = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  is_public?: boolean;
};

export type PostMedia = {
  id: string;
  post_id: string;
  user_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  mime_type: string | null;
  position: number;
  url: string;
};

export type FeedPost = {
  id: string;
  user_id: string;
  content: string | null;
  post_type: 'text' | 'photo' | 'video' | 'reel';
  visibility: 'public' | 'private';
  created_at: string;
  author: ProfileSummary | null;
  media: PostMedia[];
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: ProfileSummary | null;
};

export type PostInteractions = {
  [postId: string]: {
    liked: boolean;
    saved: boolean;
    likesCount: number;
    commentsCount: number;
  };
};

async function enrichPosts(
  posts: Omit<FeedPost, 'author' | 'media'>[],
): Promise<FeedPost[]> {
  const client = ensureSupabase();

  if (posts.length === 0) return [];

  const postIds = posts.map(post => post.id);
  const authorIds = [...new Set(posts.map(post => post.user_id))];

  const [profilesResult, mediaResult] = await Promise.all([
    client
      .from('profiles')
      .select('user_id, display_name, username, is_public')
      .in('user_id', authorIds),

    client
      .from('post_media')
      .select(
        'id, post_id, user_id, storage_path, media_type, mime_type, position',
      )
      .in('post_id', postIds)
      .order('position', { ascending: true }),
  ]);

  if (profilesResult.error) {
    throw new Error(
      `Could not load post authors: ${profilesResult.error.message}`,
    );
  }

  if (mediaResult.error) {
    throw new Error(
      `Could not load post media: ${mediaResult.error.message}`,
    );
  }

  const profileMap = new Map<string, ProfileSummary>();

  for (const profile of profilesResult.data ?? []) {
    profileMap.set(profile.user_id, profile as ProfileSummary);
  }

  const mediaByPost = new Map<string, PostMedia[]>();

  for (const item of mediaResult.data ?? []) {
    const { data, error } = await client.storage
      .from(MEDIA_BUCKET)
      .createSignedUrl(item.storage_path, SIGNED_URL_SECONDS);

    if (error || !data?.signedUrl) {
      console.warn(
        'BRITUME media link could not be created:',
        item.storage_path,
        error?.message,
      );
      continue;
    }

    const mediaItem: PostMedia = {
      ...item,
      url: data.signedUrl,
    } as PostMedia;

    const existing = mediaByPost.get(item.post_id) ?? [];
    existing.push(mediaItem);
    mediaByPost.set(item.post_id, existing);
  }

  return posts.map(post => ({
    ...post,
    author: profileMap.get(post.user_id) ?? null,
    media: mediaByPost.get(post.id) ?? [],
  }));
}

export async function fetchPublicPosts(): Promise<FeedPost[]> {
  const client = ensureSupabase();

  const { data, error } = await client
    .from('posts')
    .select(
      'id, user_id, content, post_type, visibility, created_at',
    )
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error) {
    throw new Error(`Could not load posts: ${error.message}`);
  }

  return enrichPosts((data ?? []) as Omit<FeedPost, 'author' | 'media'>[]);
}

export async function fetchPostInteractions(
  postIds: string[],
  currentUserId?: string,
): Promise<PostInteractions> {
  const client = ensureSupabase();
  const result: PostInteractions = {};

  if (postIds.length === 0) return result;

  for (const postId of postIds) {
    result[postId] = {
      liked: false,
      saved: false,
      likesCount: 0,
      commentsCount: 0,
    };
  }

  const [likesResult, savesResult, commentsResult] = await Promise.all([
    client
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', postIds),

    client
      .from('post_saves')
      .select('post_id, user_id')
      .in('post_id', postIds),

    client
      .from('comments')
      .select('post_id')
      .in('post_id', postIds),
  ]);

  if (likesResult.error) {
    throw new Error(`Could not load likes: ${likesResult.error.message}`);
  }

  if (savesResult.error) {
    throw new Error(`Could not load saves: ${savesResult.error.message}`);
  }

  if (commentsResult.error) {
    throw new Error(
      `Could not load comment counts: ${commentsResult.error.message}`,
    );
  }

  for (const like of likesResult.data ?? []) {
    const item = result[like.post_id];
    if (!item) continue;

    item.likesCount += 1;

    if (currentUserId && like.user_id === currentUserId) {
      item.liked = true;
    }
  }

  for (const save of savesResult.data ?? []) {
    const item = result[save.post_id];
    if (!item) continue;

    if (currentUserId && save.user_id === currentUserId) {
      item.saved = true;
    }
  }

  for (const comment of commentsResult.data ?? []) {
    const item = result[comment.post_id];
    if (item) item.commentsCount += 1;
  }

  return result;
}

export async function toggleLike(
  postId: string,
  userId: string,
  isLiked: boolean,
): Promise<void> {
  const client = ensureSupabase();

  if (!userId) {
    throw new Error('Please sign in before liking a post.');
  }

  if (isLiked) {
    const { error } = await client
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Could not remove like: ${error.message}`);
    }
  } else {
    const { error } = await client
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: userId,
      });

    if (error) {
      throw new Error(`Could not like post: ${error.message}`);
    }
  }
}

export async function toggleSave(
  postId: string,
  userId: string,
  isSaved: boolean,
): Promise<void> {
  const client = ensureSupabase();

  if (!userId) {
    throw new Error('Please sign in before saving a post.');
  }

  if (isSaved) {
    const { error } = await client
      .from('post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Could not remove saved post: ${error.message}`);
    }
  } else {
    const { error } = await client
      .from('post_saves')
      .insert({
        post_id: postId,
        user_id: userId,
      });

    if (error) {
      throw new Error(`Could not save post: ${error.message}`);
    }
  }
}

export async function fetchCommentsForPost(
  postId: string,
): Promise<PostComment[]> {
  const client = ensureSupabase();

  const { data, error } = await client
    .from('comments')
    .select('id, post_id, user_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Could not load comments: ${error.message}`);
  }

  const comments = data ?? [];

  if (comments.length === 0) return [];

  const userIds = [...new Set(comments.map(comment => comment.user_id))];

  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('user_id, display_name, username, is_public')
    .in('user_id', userIds);

  if (profilesError) {
    throw new Error(
      `Could not load comment authors: ${profilesError.message}`,
    );
  }

  const profileMap = new Map<string, ProfileSummary>();

  for (const profile of profiles ?? []) {
    profileMap.set(profile.user_id, profile as ProfileSummary);
  }

  return comments.map(comment => ({
    ...comment,
    author: profileMap.get(comment.user_id) ?? null,
  })) as PostComment[];
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
): Promise<void> {
  const client = ensureSupabase();
  const cleanContent = content.trim();

  if (!userId) {
    throw new Error('Please sign in before commenting.');
  }

  if (!cleanContent) {
    throw new Error('Write a comment first.');
  }

  if (cleanContent.length > 500) {
    throw new Error('Comments must be 500 characters or less.');
  }

  const { error } = await client
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content: cleanContent,
    });

  if (error) {
    throw new Error(`Could not publish comment: ${error.message}`);
  }
            }
