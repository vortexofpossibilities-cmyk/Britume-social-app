import { supabase, supabaseConfigured } from './supabase';
import { MEDIA_BUCKET } from './mediaUpload';

export type Community = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  image_url: string | null;
  is_public: boolean;
  member_count: number;
  is_member: boolean;
  is_owner: boolean;
};

const COMMUNITY_SELECT =
  'id, owner_id, name, description, created_at, image_url, is_public';

function getClient() {
  if (!supabaseConfigured || !supabase) {
    throw new Error(
      'BRITUME is not connected to Supabase. Check your environment variables.',
    );
  }
  return supabase;
}

async function getCurrentUserId(): Promise<string> {
  const client = getClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in to continue.');
  return data.user.id;
}

export async function fetchCommunities(): Promise<Community[]> {
  const client = getClient();
  const { data, error } = await client
    .from('communities')
    .select(COMMUNITY_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Could not load communities: ${error.message}`);

  const communities = (data || []) as Omit<
    Community,
    'member_count' | 'is_member' | 'is_owner'
  >[];

  if (!communities.length) return [];

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  const currentUserId = userData.user?.id || null;

  if (!currentUserId) {
    return communities.map(community => ({
      ...community,
      member_count: 0,
      is_member: false,
      is_owner: false,
    }));
  }

  const communityIds = communities.map(community => community.id);
  const [
    { data: memberships, error: membershipError },
    { data: countRows, error: countError },
  ] = await Promise.all([
    client
      .from('community_members')
      .select('community_id')
      .eq('user_id', currentUserId)
      .in('community_id', communityIds),
    client.rpc('get_community_member_counts', {
      p_community_ids: communityIds,
    }),
  ]);

  if (membershipError) {
    throw new Error(`Could not load your community memberships: ${membershipError.message}`);
  }
  if (countError) {
    throw new Error(
      `Could not load accurate community member counts. Run the BRITUME community update SQL first: ${countError.message}`,
    );
  }

  const joined = new Set((memberships || []).map(row => row.community_id));
  const counts = new Map<string, number>(
    (countRows || []).map((row: { community_id: string; member_count: number | string }) => [
      row.community_id,
      Number(row.member_count) || 0,
    ]),
  );

  return communities.map(community => ({
    ...community,
    member_count: counts.get(community.id) ?? 0,
    is_member: joined.has(community.id),
    is_owner: community.owner_id === currentUserId,
  }));
}

export async function createCommunity(input: {
  name: string;
  description?: string;
}): Promise<Community> {
  const client = getClient();
  const userId = await getCurrentUserId();
  const name = input.name.trim();
  const description = input.description?.trim() ?? '';

  if (name.length < 3 || name.length > 60) {
    throw new Error('Community name must be 3–60 characters.');
  }
  if (description.length > 500) {
    throw new Error('Description must be 500 characters or fewer.');
  }

  const { data, error } = await client
    .from('communities')
    .insert({
      name,
      description: description || '',
      owner_id: userId,
    })
    .select(COMMUNITY_SELECT)
    .single();

  if (error) throw new Error(`Could not create community: ${error.message}`);
  if (!data) throw new Error('Community creation did not return a saved community.');

  // The existing database trigger adds the creator as the owner-member.
  return {
    ...(data as Omit<Community, 'member_count' | 'is_member' | 'is_owner'>),
    member_count: 1,
    is_member: true,
    is_owner: true,
  };
}

export async function updateCommunity(input: {
  communityId: string;
  name: string;
  description?: string;
}): Promise<Community> {
  const client = getClient();
  const userId = await getCurrentUserId();
  const name = input.name.trim();
  const description = input.description?.trim() ?? '';

  if (!input.communityId?.trim()) throw new Error('Invalid community.');
  if (name.length < 3 || name.length > 60) {
    throw new Error('Community name must be 3–60 characters.');
  }
  if (description.length > 500) {
    throw new Error('Description must be 500 characters or fewer.');
  }

  const { data, error } = await client
    .from('communities')
    .update({
      name,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.communityId)
    .eq('owner_id', userId)
    .select(COMMUNITY_SELECT)
    .single();

  if (error) throw new Error(`Could not update community: ${error.message}`);

  return {
    ...(data as Omit<Community, 'member_count' | 'is_member' | 'is_owner'>),
    member_count: 0,
    is_member: true,
    is_owner: true,
  };
}

export async function deleteCommunity(communityId: string): Promise<void> {
  const client = getClient();
  const userId = await getCurrentUserId();
  if (!communityId?.trim()) throw new Error('Invalid community.');

  const { data: posts, error: postsError } = await client
    .from('community_posts')
    .select('id')
    .eq('community_id', communityId);

  if (postsError) {
    throw new Error(`Could not prepare community deletion: ${postsError.message}`);
  }

  const postIds = (posts || []).map(post => post.id);
  if (postIds.length) {
    const { data: media, error: mediaError } = await client
      .from('community_post_media')
      .select('storage_path')
      .in('post_id', postIds);

    if (mediaError) {
      throw new Error(`Could not prepare community media cleanup: ${mediaError.message}`);
    }

    const paths = (media || []).map(item => item.storage_path).filter(Boolean);
    if (paths.length) {
      const { error: storageError } = await client.storage
        .from(MEDIA_BUCKET)
        .remove(paths);
      if (storageError) {
        throw new Error(`Could not remove community media: ${storageError.message}`);
      }
    }
  }

  const { error } = await client
    .from('communities')
    .delete()
    .eq('id', communityId)
    .eq('owner_id', userId);

  if (error) throw new Error(`Could not delete community: ${error.message}`);
}

export async function joinCommunity(communityId: string): Promise<void> {
  const client = getClient();
  const userId = await getCurrentUserId();
  if (!communityId?.trim()) throw new Error('Invalid community.');

  const { error } = await client
    .from('community_members')
    .upsert(
      { community_id: communityId, user_id: userId },
      { onConflict: 'community_id,user_id', ignoreDuplicates: true },
    );

  if (error) throw new Error(`Could not join community: ${error.message}`);
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const client = getClient();
  const userId = await getCurrentUserId();
  if (!communityId?.trim()) throw new Error('Invalid community.');

  const { data: community, error: communityError } = await client
    .from('communities')
    .select('owner_id')
    .eq('id', communityId)
    .maybeSingle();

  if (communityError) throw communityError;
  if (community?.owner_id === userId) {
    throw new Error('The community owner cannot leave their own community.');
  }

  const { error } = await client
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId);

  if (error) throw new Error(`Could not leave community: ${error.message}`);
}

export async function isCommunityMember(communityId: string): Promise<boolean> {
  const client = getClient();
  const userId = await getCurrentUserId();
  if (!communityId?.trim()) return false;

  const { data, error } = await client
    .from('community_members')
    .select('community_id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Could not check community membership: ${error.message}`);
  return !!data;
}

export async function fetchCommunityMemberCount(communityId: string): Promise<number> {
  const client = getClient();
  if (!communityId?.trim()) throw new Error('Invalid community.');

  const { data, error } = await client.rpc('get_community_member_counts', {
    p_community_ids: [communityId],
  });

  if (error) throw new Error(`Could not load community member count: ${error.message}`);

  const row = (data || []).find(
    (item: { community_id: string; member_count: number | string }) =>
      item.community_id === communityId,
  );
  return Number(row?.member_count) || 0;
}
