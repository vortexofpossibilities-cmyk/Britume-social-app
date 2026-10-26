
import { supabase, supabaseConfigured } from './supabase';

export type FeedPost = {
  id: string;
  user_id: string;
  content: string;
  visibility: 'public' | 'private';
  created_at: string;
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
