import { supabase } from './supabase';

// =====================================================
// BRITUME ADVERTISING SERVICE
// =====================================================

export type AdvertiserType = 'individual' | 'business';

export type AdCreativeType = 'text' | 'image' | 'video';

export type AdCategory =
  | 'education'
  | 'technology'
  | 'fashion'
  | 'food'
  | 'entertainment'
  | 'sports'
  | 'home'
  | 'business'
  | 'community'
  | 'other';

export type AdCampaignStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'paused'
  | 'completed';

export type AdCampaign = {
  id: string;
  advertiser_id: string;
  advertiser_type: AdvertiserType;
  business_name: string | null;
  title: string;
  description: string;
  creative_type: AdCreativeType;
  creative_url: string | null;
  destination_url: string | null;
  category: AdCategory;
  budget_total: number;
  daily_budget: number | null;
  amount_spent: number;
  impressions: number;
  clicks: number;
  starts_at: string | null;
  ends_at: string | null;
  status: AdCampaignStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicAdCampaign = {
  id: string;
  advertiser_type: AdvertiserType;
  business_name: string | null;
  title: string;
  description: string;
  creative_type: AdCreativeType;
  creative_url: string | null;
  destination_url: string | null;
  category: AdCategory;
  starts_at: string | null;
  ends_at: string | null;
};

export type CreateAdCampaignInput = {
  advertiser_type: AdvertiserType;
  business_name?: string | null;
  title: string;
  description: string;
  creative_type: AdCreativeType;
  creative_url?: string | null;
  destination_url?: string | null;
  category: AdCategory;
  budget_total: number;
  daily_budget?: number | null;
  starts_at?: string | null;
  ends_at?: string | null;
};

export type UpdateAdCampaignInput = Partial<
  Omit<
    CreateAdCampaignInput,
    'budget_total'
  > & {
    budget_total: number;
  }
>;

const CAMPAIGN_COLUMNS = `
  id,
  advertiser_id,
  advertiser_type,
  business_name,
  title,
  description,
  creative_type,
  creative_url,
  destination_url,
  category,
  budget_total,
  daily_budget,
  amount_spent,
  impressions,
  clicks,
  starts_at,
  ends_at,
  status,
  review_note,
  reviewed_by,
  reviewed_at,
  created_at,
  updated_at
`;

function getClient() {
  if (!supabase) {
    throw new Error(
      'BRITUME is not connected to Supabase. Please try again later.',
    );
  }

  return supabase;
}

function validateCampaignInput(
  input: CreateAdCampaignInput,
) {
  if (input.title.trim().length < 3) {
    throw new Error(
      'Advertisement title must contain at least 3 characters.',
    );
  }

  if (input.title.trim().length > 100) {
    throw new Error(
      'Advertisement title cannot exceed 100 characters.',
    );
  }

  if (!input.description.trim()) {
    throw new Error(
      'Please enter an advertisement description.',
    );
  }

  if (input.description.trim().length > 1000) {
    throw new Error(
      'Advertisement description cannot exceed 1,000 characters.',
    );
  }

  if (
    !Number.isFinite(input.budget_total) ||
    input.budget_total <= 0
  ) {
    throw new Error(
      'Please enter a valid campaign budget.',
    );
  }

  if (
    input.daily_budget !== null &&
    input.daily_budget !== undefined &&
    (
      !Number.isFinite(input.daily_budget) ||
      input.daily_budget <= 0
    )
  ) {
    throw new Error(
      'Daily budget must be greater than zero.',
    );
  }

  if (
    input.daily_budget &&
    input.daily_budget > input.budget_total
  ) {
    throw new Error(
      'Daily budget cannot exceed the total campaign budget.',
    );
  }

  if (
    input.advertiser_type === 'business' &&
    !input.business_name?.trim()
  ) {
    throw new Error(
      'Please enter your business name.',
    );
  }

  if (
    input.destination_url &&
    !input.destination_url.startsWith('https://')
  ) {
    throw new Error(
      'Advertisement destination links must use HTTPS.',
    );
  }

  if (
    input.creative_url &&
    !input.creative_url.startsWith('https://')
  ) {
    throw new Error(
      'Advertisement media links must use HTTPS.',
    );
  }

  if (
    input.starts_at &&
    input.ends_at &&
    new Date(input.ends_at).getTime() <=
      new Date(input.starts_at).getTime()
  ) {
    throw new Error(
      'The campaign end date must be after its start date.',
    );
  }

  if (
    input.creative_type !== 'text' &&
    !input.creative_url
  ) {
    throw new Error(
      'Please provide the advertisement image or video first.',
    );
  }
}

async function requireSignedInUser(): Promise<string> {
  const client = getClient();

  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    throw new Error(
      'Please sign in before managing advertisements.',
    );
  }

  return user.id;
}

// =====================================================
// LOAD THE SIGNED-IN ADVERTISER'S CAMPAIGNS
// =====================================================

export async function fetchMyAdCampaigns(): Promise<AdCampaign[]> {
  const client = getClient();
  const userId = await requireSignedInUser();

  const { data, error } = await client
    .from('ad_campaigns')
    .select(CAMPAIGN_COLUMNS)
    .eq('advertiser_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(
      `Could not load your advertisements: ${error.message}`,
    );
  }

  return (data || []) as AdCampaign[];
}

// =====================================================
// LOAD APPROVED PUBLIC ADVERTISEMENTS
// =====================================================

export async function fetchActiveAdCampaigns(): Promise<
  PublicAdCampaign[]
> {
  const client = getClient();

  const { data, error } = await client
    .from('active_ad_campaigns')
    .select(`
      id,
      advertiser_type,
      business_name,
      title,
      description,
      creative_type,
      creative_url,
      destination_url,
      category,
      starts_at,
      ends_at
    `);

  if (error) {
    throw new Error(
      `Could not load approved advertisements: ${error.message}`,
    );
  }

  return (data || []) as PublicAdCampaign[];
}

// =====================================================
// CREATE AN ADVERTISEMENT DRAFT
// =====================================================

export async function createAdCampaignDraft(
  input: CreateAdCampaignInput,
): Promise<AdCampaign> {
  const client = getClient();
  const userId = await requireSignedInUser();

  validateCampaignInput(input);

  const { data, error } = await client
    .from('ad_campaigns')
    .insert({
      advertiser_id: userId,
      advertiser_type: input.advertiser_type,
      business_name:
        input.advertiser_type === 'business'
          ? input.business_name?.trim() || null
          : null,
      title: input.title.trim(),
      description: input.description.trim(),
      creative_type: input.creative_type,
      creative_url: input.creative_url || null,
      destination_url: input.destination_url || null,
      category: input.category,
      budget_total: input.budget_total,
      daily_budget: input.daily_budget ?? null,
      starts_at: input.starts_at || null,
      ends_at: input.ends_at || null,
    })
    .select(CAMPAIGN_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(
      `Could not create advertisement draft: ${
        error?.message || 'No campaign was returned.'
      }`,
    );
  }

  return data as AdCampaign;
}

// =====================================================
// UPDATE AN EXISTING DRAFT
// =====================================================

export async function updateAdCampaignDraft(
  campaignId: string,
  changes: UpdateAdCampaignInput,
): Promise<AdCampaign> {
  const client = getClient();
  const userId = await requireSignedInUser();

  if (!campaignId) {
    throw new Error('Campaign ID is missing.');
  }

  const { data: existing, error: existingError } =
    await client
      .from('ad_campaigns')
      .select(CAMPAIGN_COLUMNS)
      .eq('id', campaignId)
      .eq('advertiser_id', userId)
      .maybeSingle();

  if (existingError) {
    throw new Error(
      `Could not check campaign: ${existingError.message}`,
    );
  }

  if (!existing) {
    throw new Error(
      'Advertisement campaign not found.',
    );
  }

  if (
    existing.status !== 'draft' &&
    existing.status !== 'rejected'
  ) {
    throw new Error(
      'Only draft or rejected campaigns can be edited.',
    );
  }

  const merged: CreateAdCampaignInput = {
    advertiser_type:
      changes.advertiser_type ?? existing.advertiser_type,
    business_name:
      changes.business_name ?? existing.business_name,
    title: changes.title ?? existing.title,
    description:
      changes.description ?? existing.description,
    creative_type:
      changes.creative_type ?? existing.creative_type,
    creative_url:
      changes.creative_url ?? existing.creative_url,
    destination_url:
      changes.destination_url ?? existing.destination_url,
    category: changes.category ?? existing.category,
    budget_total:
      changes.budget_total ?? Number(existing.budget_total),
    daily_budget:
      changes.daily_budget === undefined
        ? existing.daily_budget
        : changes.daily_budget,
    starts_at:
      changes.starts_at === undefined
        ? existing.starts_at
        : changes.starts_at,
    ends_at:
      changes.ends_at === undefined
        ? existing.ends_at
        : changes.ends_at,
  };

  validateCampaignInput(merged);

  const { data, error } = await client
    .from('ad_campaigns')
    .update({
      advertiser_type: merged.advertiser_type,
      business_name:
        merged.advertiser_type === 'business'
          ? merged.business_name?.trim() || null
          : null,
      title: merged.title.trim(),
      description: merged.description.trim(),
      creative_type: merged.creative_type,
      creative_url: merged.creative_url || null,
      destination_url: merged.destination_url || null,
      category: merged.category,
      budget_total: merged.budget_total,
      daily_budget: merged.daily_budget ?? null,
    })
    .eq('id', campaignId)
    .eq('advertiser_id', userId)
    .select(CAMPAIGN_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(
      `Could not update advertisement: ${
        error?.message || 'No campaign was returned.'
      }`,
    );
  }

  return data as AdCampaign;
}

// =====================================================
// SUBMIT A CAMPAIGN FOR ADMIN REVIEW
// =====================================================

export async function submitAdCampaignForReview(
  campaignId: string,
): Promise<string> {
  const client = getClient();
  await requireSignedInUser();

  if (!campaignId) {
    throw new Error('Campaign ID is missing.');
  }

  const { data, error } = await client.rpc(
    'submit_ad_campaign',
    {
      p_campaign_id: campaignId,
    },
  );

  if (error) {
    throw new Error(
      `Could not submit advertisement: ${error.message}`,
    );
  }

  return data as string;
}

// =====================================================
// CAMPAIGN STATUS LABELS
// =====================================================

export function getAdCampaignStatusLabel(
  status: AdCampaignStatus,
): string {
  switch (status) {
    case 'draft':
      return 'Draft';

    case 'pending':
      return 'Awaiting admin review';

    case 'approved':
      return 'Approved';

    case 'rejected':
      return 'Needs changes';

    case 'paused':
      return 'Paused';

    case 'completed':
      return 'Completed';

    default:
      return 'Unknown';
  }
}
