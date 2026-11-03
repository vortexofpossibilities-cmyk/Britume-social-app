import { supabase, supabaseConfigured } from './supabase';

export type Community = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  image_url: string | null;
};

function getClient() {
  if (!supabaseConfigured || !supabase) {
    throw new Error('BRITUME is not connected to Supabase. Check your environment variables.');
  }

  return supabase;
}

export async function fetchCommunities(): Promise<Community[]> {
  const client = getClient();

  const { data, error } = await client
    .from('communities')
    .select('id, owner_id, name, description, created_at, image_url')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Could not load communities: ${error.message}`);
  }

  return (data ?? []) as Community[];
}

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
    throw new Error('Description must be 500 characters or fewer.');
  }

  const { data: userData, error: userError } =
    await client.auth.getUser();

  if (userError || !userData.user) {
    throw new Error('Please sign in before creating a community.');
  }

  const { data, error } = await client
    .from('communities')
    .insert({
      name,
      description: description || null,
      owner_id: userData.user.id,
    })
    .select('id, owner_id, name, description, created_at, image_url')
    .single();

  if (error) {
    throw new Error(`Could not create community: ${error.message}`);
  }

  return data as Community;
}
