
import { supabase, supabaseConfigured } from './supabase';

export type Community = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  image_url: string | null;

  // Added community information.
  member_count?: number;
  is_member?: boolean;
};

const COMMUNITY_SELECT =
  'id, owner_id, name, description, created_at, image_url';

function getClient() {
  const client = supabase;

  if (!supabaseConfigured || !client) {
    throw new Error(
      'BRITUME is not connected to Supabase. Check your environment variables.'
    );
  }

  return client;
}

async function getCurrentUserId(): Promise<string> {
  const client = getClient();

  const { data, error } = await client.auth.getUser();

  if (error || !data.user) {
    throw new Error('Please sign in to continue.');
  }

  return data.user.id;
}

/**
 * Fetch communities with member counts and
 * the current user's membership status.
 */
export async function fetchCommunities(): Promise<Community[]> {
  const client = getClient();

  const { data, error } = await client
    .from('communities')
    .select(COMMUNITY_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Could not load communities: ${error.message}`);
  }

  const communities = (data ?? []) as Community[];

  if (communities.length === 0) {
    return [];
  }

  const { data: userData } = await client.auth.getUser();
  const currentUserId = userData.user?.id ?? null;

  // Membership information is available to authenticated users.
  if (!currentUserId) {
    return communities.map((community) => ({
      ...community,
      member_count: 0,
      is_member: false,
    }));
  }

  const { data: memberships, error: membershipError } = await client
    .from('community_members')
    .select('community_id, user_id');

  if (membershipError) {
    throw new Error(
      `Could not load community memberships: ${membershipError.message}`
    );
  }

  const counts = new Map<string, number>();
  const joinedCommunities = new Set<string>();

  for (const membership of memberships ?? []) {
    const communityId = membership.community_id;

    counts.set(
      communityId,
      (counts.get(communityId) ?? 0) + 1
    );

    if (membership.user_id === currentUserId) {
      joinedCommunities.add(communityId);
    }
  }

  return communities.map((community) => ({
    ...community,
    member_count: counts.get(community.id) ?? 0,
    is_member: joinedCommunities.has(community.id),
  }));
}

/**
 * Create a new community.
 */
export async function createCommunity(input: {
  name: string;
  description?: string;
}): Promise<Community> {
  const client = getClient();

  const name = input.name.trim();
  const description = input.description?.trim() ?? '';

  if (name.length < 3 || name.length > 60) {
    throw new Error('Community name must be 3–60 characters.');
  }

  if (description.length > 500) {
    throw new Error(
      'Description must be 500 characters or fewer.'
    );
  }

  const userId = await getCurrentUserId();

  const { data, error } = await client
    .from('communities')
    .insert({
      name,
      description: description || null,
      owner_id: userId,
    })
    .select(COMMUNITY_SELECT)
    .single();

  if (error) {
    throw new Error(
      `Could not create community: ${error.message}`
    );
  }

  if (!data) {
    throw new Error(
      'Community creation did not return a saved community.'
    );
  }

  return {
    ...(data as Community),
    member_count: 0,
    is_member: false,
  };
}

/**
 * Join a community.
 * Repeated calls will not create duplicate memberships.
 */
export async function joinCommunity(
  communityId: string
): Promise<void> {
  const client = getClient();
  const userId = await getCurrentUserId();

  if (!communityId?.trim()) {
    throw new Error('Invalid community.');
  }

  const { error } = await client
    .from('community_members')
    .upsert(
      {
        community_id: communityId,
        user_id: userId,
      },
      {
        onConflict: 'community_id,user_id',
        ignoreDuplicates: true,
      }
    );

  if (error) {
    throw new Error(`Could not join community: ${error.message}`);
  }
}

/**
 * Leave a community.
 */
export async function leaveCommunity(
  communityId: string
): Promise<void> {
  const client = getClient();
  const userId = await getCurrentUserId();

  if (!communityId?.trim()) {
    throw new Error('Invalid community.');
  }

  const { error } = await client
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Could not leave community: ${error.message}`);
  }
}

/**
 * Check whether the signed-in user has joined a community.
 */
export async function isCommunityMember(
  communityId: string
): Promise<boolean> {
  const client = getClient();
  const userId = await getCurrentUserId();

  if (!communityId?.trim()) {
    return false;
  }

  const { data, error } = await client
    .from('community_members')
    .select('community_id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not check community membership: ${error.message}`
    );
  }

  return !!data;
}

/**
 * Get the number of members in one community.
 */
export async function fetchCommunityMemberCount(
  communityId: string
): Promise<number> {
  const client = getClient();

  if (!communityId?.trim()) {
    throw new Error('Invalid community.');
  }

  const { count, error } = await client
    .from('community_members')
    .select('community_id', {
      count: 'exact',
      head: true,
    })
    .eq('community_id', communityId);

  if (error) {
    throw new Error(
      `Could not load community member count: ${error.message}`
    );
  }

  return count ?? 0;
}
