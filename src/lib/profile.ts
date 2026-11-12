import { supabase, supabaseConfigured } from './supabase';

export type ProfileRecord = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string;
  avatar_path: string | null;
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

const PROFILE_SELECT =
  'user_id, username, display_name, bio, avatar_path, is_public, created_at, updated_at';

const usernamePattern = /^[A-Za-z0-9_]{3,30}$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getClient() {
  const client = supabase;

  if (!supabaseConfigured || !client) {
    throw new Error(
      'Supabase is not configured. Check your environment variables.'
    );
  }

  return client;
}

function normalizeProfile(
  profile: Partial<ProfileRecord> | null
): ProfileRecord | null {
  if (!profile || typeof profile.user_id !== 'string' || !profile.user_id) {
    return null;
  }

  const fallbackDate = new Date(0).toISOString();

  return {
    user_id: profile.user_id,
    username:
      typeof profile.username === 'string' ? profile.username : null,
    display_name:
      typeof profile.display_name === 'string'
        ? profile.display_name
        : null,
    bio: typeof profile.bio === 'string' ? profile.bio : '',
    avatar_path:
      typeof profile.avatar_path === 'string'
        ? profile.avatar_path
        : null,
    is_public:
      typeof profile.is_public === 'boolean' ? profile.is_public : true,
    created_at:
      typeof profile.created_at === 'string'
        ? profile.created_at
        : fallbackDate,
    updated_at:
      typeof profile.updated_at === 'string'
        ? profile.updated_at
        : fallbackDate,
  };
}

function cleanUsername(username: string): string {
  return typeof username === 'string' ? username.trim() : '';
}

export async function fetchCurrentUserProfile(
  userId: string
): Promise<ProfileRecord | null> {
  const cleanUserId = typeof userId === 'string' ? userId.trim() : '';

  if (!cleanUserId) return null;

  const client = getClient();

  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('user_id', cleanUserId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load profile: ${error.message}`);
  }

  return normalizeProfile(data);
}

export async function fetchProfileByUsername(
  username: string
): Promise<ProfileRecord | null> {
  const clean = cleanUsername(username);
  const isUserId = uuidPattern.test(clean);

  if (!isUserId && !usernamePattern.test(clean)) {
    return null;
  }

  const client = getClient();

  const query = client
    .from('profiles')
    .select(PROFILE_SELECT);

  const { data, error } = isUserId
    ? await query.eq('user_id', clean).maybeSingle()
    : await query.ilike('username', clean).maybeSingle();

  if (error) {
    throw new Error(`Could not load profile: ${error.message}`);
  }

  return normalizeProfile(data);
}

export async function fetchPublicProfileByUsername(
  username: string
): Promise<ProfileRecord | null> {
  const clean = cleanUsername(username);
  const isUserId = uuidPattern.test(clean);

  if (!isUserId && !usernamePattern.test(clean)) {
    return null;
  }

  const client = getClient();

  const query = client
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('is_public', true);

  const { data, error } = isUserId
    ? await query.eq('user_id', clean).maybeSingle()
    : await query.ilike('username', clean).maybeSingle();

  if (error) {
    throw new Error(
      `Could not load public profile: ${error.message}`
    );
  }

  return normalizeProfile(data);
}

export async function updateOwnProfile(input: {
  userId: string;
  username?: string | null;
  display_name?: string | null;
  bio?: string;
  avatar_path?: string | null;
  is_public?: boolean;
}): Promise<ProfileRecord> {
  if (!input || typeof input.userId !== 'string' || !input.userId.trim()) {
    throw new Error('A valid user ID is required.');
  }

  const client = getClient();

  const {
    data: userData,
    error: userError,
  } = await client.auth.getUser();

  if (userError || !userData.user) {
    throw new Error('Please sign in before updating your profile.');
  }

  const userId = input.userId.trim();

  if (userData.user.id !== userId) {
    throw new Error('You can only update your own profile.');
  }

  const username =
    typeof input.username === 'string'
      ? input.username.trim()
      : null;

  const displayName =
    typeof input.display_name === 'string'
      ? input.display_name.trim()
      : null;

  const bio =
    typeof input.bio === 'string'
      ? input.bio.trim()
      : '';

  if (username && !usernamePattern.test(username)) {
    throw new Error(
      'Username must be 3–30 characters using letters, numbers, or underscores.'
    );
  }

  if (displayName && displayName.length > 60) {
    throw new Error('Display name must be 60 characters or fewer.');
  }

  if (bio.length > 500) {
    throw new Error('Bio must be 500 characters or fewer.');
  }

  const { data: existingProfile, error: existingError } =
    await client
      .from('profiles')
      .select('avatar_path, is_public')
      .eq('user_id', userId)
      .maybeSingle();

  if (existingError) {
    throw new Error(
      `Could not check existing profile: ${existingError.message}`
    );
  }

  const avatarPath =
    input.avatar_path !== undefined
      ? input.avatar_path
      : existingProfile?.avatar_path ?? null;

  const isPublic =
    typeof input.is_public === 'boolean'
      ? input.is_public
      : typeof existingProfile?.is_public === 'boolean'
        ? existingProfile.is_public
        : true;

  const payload = {
    user_id: userId,
    username: username || null,
    display_name: displayName || null,
    bio,
    avatar_path: avatarPath,
    is_public: isPublic,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    throw new Error(`Could not save profile: ${error.message}`);
  }

  const profile = normalizeProfile(data);

  if (!profile) {
    throw new Error(
      'Profile was saved, but no valid profile record was returned.'
    );
  }

  return profile;
}

export function getProfileName(
  profile: Partial<ProfileRecord> | null | undefined
): string {
  if (!profile) return 'BRITUME member';

  if (profile.display_name?.trim()) {
    return profile.display_name.trim();
  }

  if (profile.username?.trim()) {
    return `@${profile.username.trim()}`;
  }

  return 'BRITUME member';
    }
