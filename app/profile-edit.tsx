import { supabase, supabaseConfigured } from '../../src/lib/supabase';

export type ProfileSummary = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  is_public: boolean;
};

export type FeedPost = {
  id: string;
  user_id: string;
  content: string;
  visibility: 'public' | 'private';
  created_at: string;
  author?: ProfileSummary | null;
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: ProfileSummary | null;
};

function attachAuthorProfiles<T extends { user_id: string }>(rows: T[], profileMap: Map<string, ProfileSummary>) {
  return rows.map((row) => ({
    ...row,
    author: profileMap.get(row.user_id) ?? null,
  }));
}

export async function fetchPublicPosts(): Promise<FeedPost[]> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('id, user_id, content, visibility, created_at')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50);

  if (postsError) {
    throw new Error(`Could not load feed: ${postsError.message}`);
  }

  const posts = (postsData ?? []) as FeedPost[];

  if (posts.length === 0) {
    return [];
  }

  const authorIds = [...new Set(posts.map((post) => post.user_id))];

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, username, is_public')
    .in('user_id', authorIds);

  if (profilesError) {
    throw new Error(`Could not load post authors: ${profilesError.message}`);
  }

  const profileMap = new Map<string, ProfileSummary>();
  for (const profile of profilesData ?? []) {
    profileMap.set(profile.user_id, profile as ProfileSummary);
  }

  return attachAuthorProfiles(posts, profileMap) as FeedPost[];
}

export async function fetchPostsForUser(
  userId: string,
  options?: { includePrivate?: boolean }
): Promise<FeedPost[]> {
  if (!supabaseConfigured || !supabase) {
    return [];
  }

  let query = supabase
    .from('posts')
    .select('id, user_id, content, visibility, created_at')
    .eq('user_id', userId);

  if (!options?.includePrivate) {
    query = query.eq('visibility', 'public');
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Could not load posts for user: ${error.message}`);
  }

  const posts = (data ?? []) as FeedPost[];
  if (posts.length === 0) {
    return [];
  }

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('user_id, display_name, username, is_public')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not load profile for posts: ${profileError.message}`);
  }

  const profileMap = new Map<string, ProfileSummary>();
  if (profileData) {
    profileMap.set(profileData.user_id, profileData as ProfileSummary);
  }

  return attachAuthorProfiles(posts, profileMap) as FeedPost[];
}

export async function fetchCommentsForPost(postId: string): Promise<PostComment[]> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  const { data, error } = await supabase
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

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, display_name, username, is_public')
    .in('user_id', authorIds);

  if (profilesError) {
    throw new Error(`Could not load comment authors: ${profilesError.message}`);
  }

  const profileMap = new Map<string, ProfileSummary>();
  for (const profile of profilesData ?? []) {
    profileMap.set(profile.user_id, profile as ProfileSummary);
  }

  return attachAuthorProfiles(comments, profileMap) as PostComment[];
}

export async function createComment(
  postId: string,
  userId: string,
  content: string
): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  const text = content.trim();
  if (!text) {
    throw new Error('Comment cannot be empty.');
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: userId,
    content: text,
  });

  if (error) {
    throw new Error(`Could not create comment: ${error.message}`);
  }
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Could not delete comment: ${error.message}`);
  }
}

export async function fetchPostInteractions(postId: string | string[], userId?: string): Promise<Record<string, {
  liked: boolean;
  saved: boolean;
  likesCount: number;
  commentsCount: number;
}>> {
  if (!supabaseConfigured || !supabase) {
    return {};
  }

  const ids = Array.isArray(postId) ? postId : [postId];
  if (ids.length === 0) {
    return {};
  }

  const aggregate = {} as Record<string, { liked: boolean; saved: boolean; likesCount: number; commentsCount: number }>;

  const [likesResult, savesResult, commentsResult] = await Promise.all([
    supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', ids),
    supabase
      .from('post_saves')
      .select('post_id, user_id')
      .in('post_id', ids),
    supabase
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
    throw new Error(`Could not load comments: ${commentsResult.error.message}`);
  }

  for (const id of ids) {
    const likes = (likesResult.data ?? []).filter((entry) => entry.post_id === id);
    const saves = (savesResult.data ?? []).filter((entry) => entry.post_id === id);
    const comments = (commentsResult.data ?? []).filter((entry) => entry.post_id === id);

    let liked = false;
    let saved = false;

    if (userId) {
      liked = likes.some((entry) => entry.user_id === userId);
      saved = saves.some((entry) => entry.user_id === userId);
    }

    aggregate[id] = {
      liked,
      saved,
      likesCount: likes.length,
      commentsCount: comments.length,
    };
  }

  return aggregate;
}

export async function toggleLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  if (currentlyLiked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Could not unlike post: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from('post_likes').insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) {
    throw new Error(`Could not like post: ${error.message}`);
  }
}

export async function toggleSave(
  postId: string,
  userId: string,
  currentlySaved: boolean
): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  if (currentlySaved) {
    const { error } = await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Could not remove save: ${error.message}`);
    }
    return;
  }

  const { error } = await supabase.from('post_saves').insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) {
    throw new Error(`Could not save post: ${error.message}`);
  }
}

export async function fetchPostInteractionsLegacy(postId: string, userId?: string): Promise<{
  likes: number;
  saves: number;
  comments: number;
  isLiked: boolean;
  isSaved: boolean;
}> {
  if (!supabaseConfigured || !supabase) {
    return { likes: 0, saves: 0, comments: 0, isLiked: false, isSaved: false };
  }

  const [likeResult, saveResult, commentResult] = await Promise.all([
    supabase
      .from('post_likes')
      .select('user_id', { count: 'exact', head: true })
      .eq('post_id', postId),
    supabase
      .from('post_saves')
      .select('user_id', { count: 'exact', head: true })
      .eq('post_id', postId),
    supabase
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
      supabase
        .from('post_likes')
        .select('post_id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
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
