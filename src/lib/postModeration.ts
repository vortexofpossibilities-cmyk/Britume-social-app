
import { supabase } from './supabase';

function client() {
  if (!supabase) {
    throw new Error('BRITUME is not connected to Supabase.');
  }

  return supabase;
}

export type PostRestrictions = {
  hiddenPostIds: string[];
  blockedUserIds: string[];
};

export async function fetchPostRestrictions(
  userId: string,
): Promise<PostRestrictions> {
  if (!userId) {
    return { hiddenPostIds: [], blockedUserIds: [] };
  }

  const db = client();

  const [hidden, blocked] = await Promise.all([
    db
      .from('hidden_posts')
      .select('post_id')
      .eq('user_id', userId),

    db
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', userId),
  ]);

  if (hidden.error) {
    throw new Error(hidden.error.message);
  }

  if (blocked.error) {
    throw new Error(blocked.error.message);
  }

  return {
    hiddenPostIds: (hidden.data ?? []).map(row => row.post_id),
    blockedUserIds: (blocked.data ?? []).map(row => row.blocked_id),
  };
}

export async function hidePost(
  userId: string,
  postId: string,
): Promise<void> {
  const { error } = await client()
    .from('hidden_posts')
    .upsert(
      { user_id: userId, post_id: postId },
      { onConflict: 'user_id,post_id' },
    );

  if (error) throw new Error(error.message);
}

export async function reportPost(
  userId: string,
  postId: string,
  reason: string,
  details = '',
): Promise<void> {
  const allowedReasons = [
    'spam',
    'harassment',
    'inappropriate',
    'misinformation',
    'other',
  ];

  if (!allowedReasons.includes(reason)) {
    throw new Error('Please select a valid report reason.');
  }

  const { error } = await client()
    .from('post_reports')
    .insert({
      reporter_id: userId,
      post_id: postId,
      reason,
      details: details.trim().slice(0, 1000) || null,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already reported this post.');
    }

    throw new Error(error.message);
  }
}

export async function blockUser(
  userId: string,
  blockedUserId: string,
): Promise<void> {
  if (userId === blockedUserId) {
    throw new Error('You cannot block your own account.');
  }

  const { error } = await client()
    .from('user_blocks')
    .upsert(
      {
        blocker_id: userId,
        blocked_id: blockedUserId,
      },
      { onConflict: 'blocker_id,blocked_id' },
    );

  if (error) throw new Error(error.message);
}

export async function proposePost(
  userId: string,
  postId: string,
  message = '',
): Promise<void> {
  const { error } = await client()
    .from('post_feature_proposals')
    .insert({
      proposer_id: userId,
      post_id: postId,
      message: message.trim().slice(0, 500) || null,
    });

  if (error) {
    if (error.code === '23505') {
      throw new Error('You have already proposed this post.');
    }

    throw new Error(error.message);
  }
}

export async function deleteOwnPost(
  userId: string,
  postId: string,
): Promise<void> {
  const { data, error } = await client()
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId)
    .select('id');

  if (error) throw new Error(error.message);

  if (!data?.length) {
    throw new Error(
      'The post could not be deleted. Only its owner can delete it.',
    );
  }
}
