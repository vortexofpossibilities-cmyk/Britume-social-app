
import { supabase, supabaseConfigured } from './supabase';

export type ProfileSummary = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  is_public: boolean;
};

export type PostType = 'text' | 'photo' | 'video' | 'reel';

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
  post_type: PostType;
  visibility: 'public' | 'private';
  created_at: string;
  author?: ProfileSummary | null;
  media?: PostMedia[];
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: ProfileSummary | null;
};

const MEDIA_BUCKET = 'britume-media';
const SIGNED_URL_SECONDS = 60 * 60;

function ensureSupabase() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Check your .env variables.'
    );
  }

  return supabase;
}

function attachAuthorProfiles<T extends { user_id: string }>(
  rows: T[],
  profileMap: Map<string, ProfileSummary>
) {
  return rows.map((row) => ({
    ...row,
    author: profileMap.get(row.user_id) ?? null,
  }));
}

/**
 * Loads author profiles and media for a group of posts.
 * Media URLs are signed because the britume-media bucket is private.
 */
async function enrichPosts(
  posts: Omit<FeedPost, 'author' | 'media'>[]
): Promise<FeedPost[]> {
  const client = ensureSupabase();

  if (posts.length === 0) return [];

  const postIds = posts.map((post) => post.id);
  const authorIds = [...new Set(posts.map((post) => post.user_id))];

  const [profilesResult, mediaResult] = await Promise.all([
    client
      .from('profiles')
      .select('user_id, display_name, username, is_public')
      .in('user_id', authorIds),

    client
      .from('post_media')
      .select(
        'id, post_id, user_id, storage_path, media_type, mime_type, position'
      )
      .in('post_id', postIds)
      .order('position', { ascending: true }),
  ]);

  if (profilesResult.error) {
    throw new Error(
      `Could not load post authors: ${profilesResult.error.message}`
    );
  }

  if (mediaResult.error) {
    throw new Error(
      `Could not load post media: ${mediaResult.error.message}`
    );
  }

  const profileMap = new Map<string, ProfileSummary>();

  for (const profile of profilesResult.data ?? []) {
    profileMap.set(profile.user_id, profile as ProfileSummary);
  }

  const mediaByPost = new Map<string, PostMedia[]>();

  const mediaWithUrls = await Promise.all(
    (mediaResult.data ?? []).map(async (item) => {
      const { data, error } = await client.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(item.storage_path, SIGNED_URL_SECONDS);

      if (error) {
        throw new Error(
          `Could not open media file: ${error.message}`
        );
      }

      return {
        ...item,
        url: data.signedUrl,
      } as PostMedia;
    })
  );

  for (const media of mediaWithUrls) {
    const existing = mediaByPost.get(media.post_id) ?? [];
    existing.push(media);
    mediaByPost.set(media.post_id, existing);
  }

  return posts.map((post) => ({
    ...post,
    author: profileMap.get(post.user_id) ?? null,
    media: mediaByPost.get(post.id) ?? [],
  }));
}

/**
 * Fetch public feed posts, including photos, videos and Reels.
 */
export async function fetchPublicPosts(): Promise<FeedPost[]> {
  const client = ensureSupabase();

  const { data, error } = await client
    .from('posts')
    .select(
      'id, user_id, content, post_type, visibility, created_at'
    )
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Could not load feed: ${error.message}`);
  }

  return enrichPosts((data ?? []) as Omit<FeedPost, 'author' | 'media'>[]);
}

/**
 * Fetch posts belonging to a particular user.
 */
export async function fetchPostsForUser(
  userId: string,
  options?: { includePrivate?: boolean }
): Promise<FeedPost[]> {
  if (!supabaseConfigured || !supabase) return [];

  let query = supabase
    .from('posts')
    .select(
      'id, user_id, content, post_type, visibility, created_at'
    )
    .eq('user_id', userId);

  if (!options?.includePrivate) {
    query = query.eq('visibility', 'public');
  }

  const { data, error } = await query.order('created_at', {
    ascending: false,
  });

  if (error) {
    throw new Error(`Could not load posts for user: ${error.message}`);
  }

  return enrichPosts((data ?? []) as Omit<FeedPost, 'author' | 'media'>[]);
}

/**
 * Fetch comments and attach their authors.
 */
export async function fetchCommentsForPost(
  postId: string
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

  const comments = (data ?? []) as PostComment[];

  if (comments.length === 0) return [];

  const authorIds = [...new Set(comments.map((comment) => comment.user_id))];

  const { data: profilesData, error: profilesError } = await client
    .from('profiles')
    .select('user_id, display_name, username, is_public')
    .in('user_id', authorIds);

  if (profilesError) {
    throw new Error(
      `Could not load comment authors: ${profilesError.message}`
    );
  }

  const profileMap = new Map<string, ProfileSummary>();

  for (const profile of profilesData ?? []) {
    profileMap.set(profile.user_id, profile as ProfileSummary);
  }

  return attachAuthorProfiles(comments, profileMap) as PostComment[];
}

/**
 * Create a comment.
 */
export async function createComment(
  postId: string,
  userId: string,
  content: string
): Promise<void> {
  const client = ensureSupabase();
  const text = content.trim();

  if (!text) throw new Error('Comment cannot be empty.');

  const { error } = await client.from('comments').insert({
    post_id: postId,
    user_id: userId,
    content: text,
  });

  if (error) {
    throw new Error(`Could not create comment: ${error.message}`);
  }
}

/**
 * Delete one of the current user's comments.
 */
export async function deleteComment(
  commentId: string,
  userId: string
): Promise<void> {
  const client = ensureSupabase();

  const { error } = await client
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Could not delete comment: ${error.message}`);
  }
}

/**
 * Fetch like, save and comment counts for one or more posts.
 */
export async function fetchPostInteractions(
  postId: string | string[],
  userId?: string
): Promise<
  Record<
    string,
    {
      liked: boolean;
      saved: boolean;
      likesCount: number;
      commentsCount: number;
    }
  >
> {
  if (!supabaseConfigured || !supabase) return {};

  const ids = Array.isArray(postId) ? postId : [postId];

  if (ids.length === 0) return {};

  const client = supabase;

  const aggregate: Record<
    string,
    {
      liked: boolean;
      saved: boolean;
      likesCount: number;
      commentsCount: number;
    }
  > = {};

  const [likesResult, savesResult, commentsResult] = await Promise.all([
    client
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', ids),

    client
      .from('post_saves')
      .select('post_id, user_id')
      .in('post_id', ids),

    client
      .from('comments')
      .select('post_id, id')
      .in('post_id', ids),
  ]);

  if (likesResult.error) {
    throw new Error(`Could not load likes: ${likesResult.error.message}`);
  }

  if (savesResult.error) {
    throw new Error(`Could not load saves: ${savesResult.error.message}`);
  }

  if (commentsResult.error) {
    throw new Error(
      `Could not load comments: ${commentsResult.error.message}`
    );
  }

  for (const id of ids) {
    const likes = (likesResult.data ?? []).filter(
      (entry) => entry.post_id === id
    );

    const saves = (savesResult.data ?? []).filter(
      (entry) => entry.post_id === id
    );

    const comments = (commentsResult.data ?? []).filter(
      (entry) => entry.post_id === id
    );

    aggregate[id] = {
      liked: userId
        ? likes.some((entry) => entry.user_id === userId)
        : false,

      saved: userId
        ? saves.some((entry) => entry.user_id === userId)
        : false,

      likesCount: likes.length,
      commentsCount: comments.length,
    };
  }

  return aggregate;
}

/**
 * Like or unlike a post.
 */
export async function toggleLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  const client = ensureSupabase();

  if (currentlyLiked) {
    const { error } = await client
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Could not unlike post: ${error.message}`);
    }

    return;
  }

  const { error } = await client.from('post_likes').insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) {
    throw new Error(`Could not like post: ${error.message}`);
  }
}

/**
 * Save or unsave a post.
 */
export async function toggleSave(
  postId: string,
  userId: string,
  currentlySaved: boolean
): Promise<void> {
  const client = ensureSupabase();

  if (currentlySaved) {
    const { error } = await client
      .from('post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Could not remove save: ${error.message}`);
    }

    return;
  }

  const { error } = await client.from('post_saves').insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) {
    throw new Error(`Could not save post: ${error.message}`);
  }
}

/**
 * Older interaction helper retained for compatibility.
 */
export async function fetchPostInteractionsLegacy(
  postId: string,
  userId?: string
): Promise<{
  likes: number;
  saves: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
}> {
  if (!supabaseConfigured || !supabase) {
    return {
      likes: 0,
      saves: 0,
      comments: 0,
      isLiked: false,
      isSaved: false,
    };
  }

  const client = supabase;

  const [likeResult, saveResult, commentResult] = await Promise.all([
    client
      .from('post_likes')
      .select('user_id', { count: 'exact', head: true })
      .eq('post_id', postId),

    client
      .from('post_saves')
      .select('user_id', { count: 'exact', head: true })
      .eq('post_id', postId),

    client
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId),
  ]);

  const likeCount = likeResult.count ?? 0;
  const saveCount = saveResult.count ?? 0;
  const commentCount = commentResult.count ?? 0;

  let isLiked = false;
  let isSaved = false;

  if (userId) {
    const [likedCheck, savedCheck] = await Promise.all([
      client
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle(),

      client
        .from('post_saves')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    isLiked = Boolean(likedCheck.data);
    isSaved = Boolean(savedCheck.data);
  }

  return {
    likes: likeCount,
    saves: saveCount,
    comments: commentCount,
    isLiked,
    isSaved,
  };
}
