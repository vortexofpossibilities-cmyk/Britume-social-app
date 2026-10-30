
import { supabase, supabaseConfigured } from './supabase';

export type ProfileRecord = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileSummary = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  is_public: boolean;
};

const usernamePattern = /^[A-Za-z0-9_]{3,30}$/;

function normalizeProfile(
  profile: Partial<ProfileRecord> | null
): ProfileRecord | null {
  if (!profile) return null;

  return {
    user_id: profile.user_id ?? '',
    username: typeof profile.username === 'string' ? profile.username : null,
    display_name: typeof profile.display_name === 'string' ? profile.display_name : null,
    bio: typeof profile.bio === 'string' ? profile.bio : '',
    is_public: Boolean(profile.is_public),
    created_at: profile.created_at ?? new Date(0).toISOString(),
    updated_at: profile.updated_at ?? new Date(0).toISOString(),
  };
}

export async function fetchCurrentUserProfile(
  userId: string
): Promise<ProfileRecord | null> {
  if (!supabaseConfigured || !supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, bio, is_public, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`Could not load profile: ${error.message}`);

  return normalizeProfile(data);
}

export async function fetchProfileByUsername(
  username: string
): Promise<ProfileRecord | null> {
  if (!supabaseConfigured || !supabase) return null;

  const clean = username.trim();
  if (!clean) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, bio, is_public, created_at, updated_at')
    .ilike('username', clean)
    .maybeSingle();

  if (error) throw new Error(`Could not load public profile: ${error.message}`);

  return normalizeProfile(data);
}

export async function fetchPublicProfileByUsername(
  username: string
): Promise<ProfileRecord | null> {
  if (!supabaseConfigured || !supabase) return null;

  const clean = username.trim();
  if (!clean) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, display_name, bio, is_public, created_at, updated_at')
    .eq('is_public', true)
    .ilike('username', clean)
    .maybeSingle();

  if (error) throw new Error(`Could not load public profile: ${error.message}`);

  return normalizeProfile(data);
}

export async function updateOwnProfile(input: {
  userId: string;
  username?: string | null;
  display_name?: string | null;
  bio?: string;
  is_public?: boolean;
}): Promise<ProfileRecord> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Check your .env variables.');
  }

  const username =
    typeof input.username === 'string' ? input.username.trim() : null;
  const displayName =
    typeof input.display_name === 'string'
      ? input.display_name.trim()
      : null;
  const bio = typeof input.bio === 'string' ? input.bio.trim() : '';

  if (username && !usernamePattern.test(username)) {
    throw new Error(
      'Username must be 3-30 characters using letters, numbers, or underscores.'
    );
  }

  const payload = {
    user_id: input.userId,
    username: username || null,
    display_name: displayName || null,
    bio,
    is_public: typeof input.is_public === 'boolean' ? input.is_public : true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('user_id, username, display_name, bio, is_public, created_at, updated_at')
    .single();

  if (error) throw new Error(`Could not save profile: ${error.message}`);

  return normalizeProfile(data) as ProfileRecord;
}

export function getProfileName(
  profile: Partial<ProfileRecord> | null | undefined
): string {
  if (!profile) return 'BRITUME member';

  if (profile.display_name?.trim()) return profile.display_name.trim();

  if (profile.username?.trim()) return `@${profile.username.trim()}`;

  return 'BRITUME member';
}
