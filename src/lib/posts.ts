import { supabase, supabaseConfigured } from './supabase';

export type FeedPost = {
  id: string;
  user_id: string;
  content: string;
  visibility: 'public' | 'private';
  created_at: string;
};

export type PostComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type PostEngagement = {
  liked: boolean;
  saved: boolean;
  likesCount: number;
  commentsCount: number;
};

export async function fetchPublicPosts(): Promise<FeedPost[]> {
  if (!supabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Check your .env variables.'
    );
  }

  const { data, error } = await supabase
    .from('posts')
    .select('id, user_id, content, visibility, created_at')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Could not load feed: ${error.message}`);
  }

  return (data ?? []) as FeedPost[];
}

export async function fetchPostInteractions(
  postIds: string[],
  userId?: string,
): Promise<Record<string, PostEngagement>> {
  const normalizedIds = [...new Set(postIds.filter(Boolean))];
  const result: Record<string, PostEngagement> = {};

  for (const postId of normalizedIds) {
    result[postId] = {
      liked: false,
      saved: false,
      likesCount: 0,
      commentsCount: 0,
    };
  }

  if (!supabaseConfigured || !supabase || normalizedIds.length === 0) {
    return result;
  }

  const [likesResponse, savesResponse, commentsResponse] = await Promise.all([
    supabase
      .from('post_likes')
      .select('post_id, user_id')
      .in('post_id', normalizedIds),
    supabase
      .from('post_saves')
      .select('post_id, user_id')
      .in('post_id', normalizedIds),
    supabase
      .from('comments')
      .select('post_id')
      .in('post_id', normalizedIds),
  ]);

  if (likesResponse.error) {
    throw new Error(`Could not load likes: ${likesResponse.error.message}`);
  }

  if (savesResponse.error) {
    throw new Error(`Could not load saves: ${savesResponse.error.message}`);
  }

  if (commentsResponse.error) {
    throw new Error(`Could not load comments: ${commentsResponse.error.message}`);
  }

  for (const like of likesResponse.data ?? []) {
    const postId = like.post_id as string;
    if (!result[postId]) continue;
    result[postId].likesCount += 1;
    if (userId && like.user_id === userId) {
      result[postId].liked = true;
    }
  }

  for (const save of savesResponse.data ?? []) {
    const postId = save.post_id as string;
    if (!result[postId]) continue;
    if (userId && save.user_id === userId) {
      result[postId].saved = true;
    }
  }

  for (const comment of commentsResponse.data ?? []) {
    const postId = comment.post_id as string;
    if (!result[postId]) continue;
    result[postId].commentsCount += 1;
  }

  return result;
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

  return (data ?? []) as PostComment[];
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
): Promise<void> {
  const cleanContent = content.trim();

  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  if (!cleanContent) {
    throw new Error('Comment cannot be empty.');
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: userId,
    content: cleanContent,
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

export async function toggleLike(
  postId: string,
  userId: string,
  liked: boolean,
): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  if (liked) {
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
    if (error.code === '23505') {
      return;
    }
    throw new Error(`Could not like post: ${error.message}`);
  }
}

export async function toggleSave(
  postId: string,
  userId: string,
  saved: boolean,
): Promise<void> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  if (saved) {
    const { error } = await supabase
      .from('post_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Could not unsave post: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase.from('post_saves').insert({
    post_id: postId,
    user_id: userId,
  });

  if (error) {
    if (error.code === '23505') {
      return;
    }
    throw new Error(`Could not save post: ${error.message}`);
  }
}
