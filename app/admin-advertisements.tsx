import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { supabase } from '../src/lib/supabase';
import { useAppTheme } from '../src/contexts/ThemeContext';

type PendingCampaign = {
  id: string;
  advertiser_id: string;
  advertiser_type: 'individual' | 'business';
  business_name: string | null;
  title: string;
  description: string;
  creative_type: 'text' | 'image' | 'video';
  creative_url: string | null;
  destination_url: string | null;
  category: string;
  budget_total: number;
  daily_budget: number | null;
  amount_spent: number;
  impressions: number;
  clicks: number;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  created_at: string;
};

export default function AdminAdvertisementsScreen() {
  const { theme } = useAppTheme();

  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [busyCampaign, setBusyCampaign] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<
    Record<string, string>
  >({});

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value: string | null) => {
    if (!value) return 'Not scheduled';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleString();
  };

  const checkAdminAccess = useCallback(async () => {
    const client = supabase;

    if (!client) {
      throw new Error('Supabase connection is unavailable.');
    }

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      setIsAdmin(false);
      throw new Error('Please sign in first.');
    }

    const { data, error } = await client.rpc(
      'is_britume_admin',
    );

    if (error) {
      throw new Error(
        `Could not verify administrator access: ${error.message}`,
      );
    }

    const allowed = data === true;

    setIsAdmin(allowed);

    if (!allowed) {
      throw new Error(
        'You do not have permission to access this administrator screen.',
      );
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    const client = supabase;

    if (!client) {
      throw new Error('Supabase connection is unavailable.');
    }

    const { data, error } = await client
      .from('ad_campaigns')
      .select(`
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
        created_at
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(
        `Could not load pending advertisements: ${error.message}`,
      );
    }

    setCampaigns((data || []) as PendingCampaign[]);
  }, []);

  const initialize = useCallback(async () => {
    setCheckingAccess(true);
    setLoading(true);

    try {
      await checkAdminAccess();
      await loadCampaigns();
    } catch (error: any) {
      setIsAdmin(false);

      Alert.alert(
        'Administrator access',
        error?.message || 'Unable to open the review screen.',
      );
    } finally {
      setCheckingAccess(false);
      setLoading(false);
    }
  }, [checkAdminAccess, loadCampaigns]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const refresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await checkAdminAccess();
      await loadCampaigns();
    } catch (error: any) {
      Alert.alert(
        'Refresh failed',
        error?.message || 'Could not refresh campaigns.',
      );
    } finally {
      setRefreshing(false);
    }
  }, [checkAdminAccess, loadCampaigns]);

  const reviewCampaign = async (
    campaign: PendingCampaign,
    decision: 'approved' | 'rejected',
  ) => {
    // Capture a stable client reference for the confirmation callback.
    const client = supabase;

    if (!client || busyCampaign) {
      Alert.alert(
        'Connection unavailable',
        'Please check your Supabase connection and try again.',
      );
      return;
    }

    const note = (
      rejectionNotes[campaign.id] || ''
    ).trim();

    if (decision === 'rejected' && note.length < 5) {
      Alert.alert(
        'Reason required',
        'Please enter a clear reason of at least 5 characters before rejecting this advertisement.',
      );
      return;
    }

    Alert.alert(
      decision === 'approved'
        ? 'Approve advertisement?'
        : 'Reject advertisement?',
      decision === 'approved'
        ? 'This campaign will be marked as approved. Approval does not process payment or guarantee that the campaign is ready to run.'
        : 'This campaign will be rejected and the advertiser will be able to see your review note.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: decision === 'approved' ? 'Approve' : 'Reject',
          style: decision === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            setBusyCampaign(campaign.id);

            try {
              const { error } = await client.rpc(
                'review_ad_campaign',
                {
                  p_campaign_id: campaign.id,
                  p_decision: decision,
                  p_review_note: decision === 'rejected' ? note : '',
                },
              );

              if (error) {
                throw new Error(error.message);
              }

              setCampaigns((current) =>
                current.filter((item) => item.id !== campaign.id),
              );

              setRejectionNotes((current) => {
                const next = { ...current };
                delete next[campaign.id];
                return next;
              });

              Alert.alert(
                'Review saved',
                decision === 'approved'
                  ? 'The campaign has been approved.'
                  : 'The campaign has been rejected.',
              );
            } catch (error: any) {
              Alert.alert(
                'Review failed',
                error?.message ||
                  'The campaign could not be reviewed.',
              );
            } finally {
              setBusyCampaign(null);
            }
          },
        },
      ],
    );
  };

  if (checkingAccess || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={theme.cyan}
        />

        <Text style={styles.loadingText}>
          Verifying administrator access...
        </Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="lock-closed-outline"
          size={52}
          color={theme.muted}
        />

        <Text style={styles.deniedTitle}>
          Access restricted
        </Text>

        <Text style={styles.deniedText}>
          This screen is only available to authorised BRITUME administrators.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={theme.cyan}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.text}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>
            Advertisement Review
          </Text>

          <Text style={styles.subtitle}>
            BRITUME administrator panel
          </Text>
        </View>

        <View style={styles.adminIcon}>
          <Ionicons
            name="shield-checkmark"
            size={24}
            color={theme.cyan}
          />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          Campaigns awaiting review
        </Text>

        <Text style={styles.summaryNumber}>
          {campaigns.length}
        </Text>

        <Text style={styles.summaryHint}>
          Only pending campaigns are shown here.
        </Text>
      </View>

      <View style={styles.notice}>
        <Ionicons
          name="information-circle-outline"
          size={21}
          color={theme.cyan}
        />

        <Text style={styles.noticeText}>
          Review the content, destination link, creative and advertiser details before making a decision. Do not approve prohibited or misleading advertisements.
        </Text>
      </View>

      {campaigns.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={49}
            color={theme.cyan}
          />

          <Text style={styles.emptyTitle}>
            No pending advertisements
          </Text>

          <Text style={styles.emptyText}>
            New submitted campaigns will appear here.
          </Text>

          <Pressable
            style={styles.secondaryButton}
            onPress={refresh}
          >
            <Ionicons
              name="refresh"
              size={17}
              color={theme.cyan}
            />

            <Text style={styles.secondaryButtonText}>
              Refresh
            </Text>
          </Pressable>
        </View>
      ) : (
        campaigns.map((campaign) => {
          const isBusy = busyCampaign === campaign.id;

          return (
            <View
              key={campaign.id}
              style={styles.campaignCard}
            >
              <View style={styles.campaignHeader}>
                <View style={styles.pendingBadge}>
                  <View style={styles.pendingDot} />

                  <Text style={styles.pendingText}>
                    Pending review
                  </Text>
                </View>

                <Text style={styles.dateText}>
                  {formatDate(campaign.created_at)}
                </Text>
              </View>

              <Text style={styles.campaignTitle}>
                {campaign.title}
              </Text>

              <Text style={styles.description}>
                {campaign.description}
              </Text>

              <View style={styles.divider} />

              <Detail
                label="Advertiser type"
                value={campaign.advertiser_type}
                styles={styles}
              />

              {campaign.business_name ? (
                <Detail
                  label="Business name"
                  value={campaign.business_name}
                  styles={styles}
                />
              ) : null}

              <Detail
                label="Advertiser account"
                value={campaign.advertiser_id}
                styles={styles}
              />

              <Detail
                label="Category"
                value={campaign.category}
                styles={styles}
              />

              <Detail
                label="Creative type"
                value={campaign.creative_type}
                styles={styles}
              />

              <Detail
                label="Total budget"
                value={formatMoney(Number(campaign.budget_total))}
                styles={styles}
              />

              <Detail
                label="Daily budget"
                value={
                  campaign.daily_budget === null
                    ? 'Not set'
                    : formatMoney(Number(campaign.daily_budget))
                }
                styles={styles}
              />

              <Detail
                label="Starts"
                value={formatDate(campaign.starts_at)}
                styles={styles}
              />

              <Detail
                label="Ends"
                value={formatDate(campaign.ends_at)}
                styles={styles}
              />

              {campaign.creative_url ? (
                <View style={styles.urlSection}>
                  <Text style={styles.detailLabel}>
                    Creative media URL
                  </Text>

                  <Text style={styles.urlText}>
                    {campaign.creative_url}
                  </Text>
                </View>
              ) : null}

              {campaign.destination_url ? (
                <View style={styles.urlSection}>
                  <Text style={styles.detailLabel}>
                    Destination URL
                  </Text>

                  <Text style={styles.urlText}>
                    {campaign.destination_url}
                  </Text>
                </View>
              ) : null}

              <View style={styles.reviewSection}>
                <Text style={styles.reviewLabel}>
                  Rejection reason
                </Text>

                <TextInput
                  value={rejectionNotes[campaign.id] || ''}
                  onChangeText={(value) =>
                    setRejectionNotes((current) => ({
                      ...current,
                      [campaign.id]: value.slice(0, 1000),
                    }))
                  }
                  placeholder="Explain what needs to be corrected..."
                  placeholderTextColor={theme.muted}
                  multiline
                  textAlignVertical="top"
                  editable={!isBusy}
                  style={styles.noteInput}
                />

                <Text style={styles.noteHint}>
                  Required when rejecting. Maximum 1,000 characters.
                </Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  disabled={isBusy}
                  onPress={() =>
                    reviewCampaign(campaign, 'rejected')
                  }
                  style={[
                    styles.rejectButton,
                    isBusy && styles.disabledButton,
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="close-circle-outline"
                        size={19}
                        color="#FFFFFF"
                      />

                      <Text style={styles.buttonText}>
                        Reject
                      </Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  disabled={isBusy}
                  onPress={() =>
                    reviewCampaign(campaign, 'approved')
                  }
                  style={[
                    styles.approveButton,
                    isBusy && styles.disabledButton,
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.buttonText}>
                    Approve
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function Detail({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

function createStyles(
  theme: ReturnType<typeof useAppTheme>['theme'],
) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    content: {
      padding: 15,
      paddingBottom: 45,
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.bg,
      padding: 25,
    },

    loadingText: {
      color: theme.muted,
      marginTop: 15,
      fontSize: 14,
    },

    deniedTitle: {
      color: theme.text,
      fontSize: 21,
      fontWeight: '900',
      marginTop: 15,
    },

    deniedText: {
      color: theme.muted,
      textAlign: 'center',
      marginTop: 9,
      lineHeight: 21,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 11,
    },

    headerText: {
      flex: 1,
    },

    title: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '900',
    },

    subtitle: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 3,
    },

    adminIcon: {
      width: 43,
      height: 43,
      borderRadius: 15,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },

    summaryCard: {
      backgroundColor: theme.panel,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 19,
      marginBottom: 14,
    },

    summaryLabel: {
      color: theme.muted,
      fontSize: 13,
      fontWeight: '700',
    },

    summaryNumber: {
      color: theme.text,
      fontSize: 39,
      fontWeight: '900',
      marginTop: 5,
    },

    summaryHint: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 4,
    },

    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 13,
      borderRadius: 15,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 17,
    },

    noticeText: {
      flex: 1,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 19,
    },

    emptyCard: {
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 27,
      marginTop: 8,
    },

    emptyTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: '900',
      marginTop: 13,
    },

    emptyText: {
      color: theme.muted,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 7,
    },

    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 17,
      paddingVertical: 11,
      borderRadius: 13,
      backgroundColor: theme.panel2,
      marginTop: 18,
    },

    secondaryButtonText: {
      color: theme.cyan,
      fontWeight: '800',
    },

    campaignCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 15,
      marginBottom: 17,
    },

    campaignHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 13,
    },

    pendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.panel2,
    },

    pendingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#D99A35',
    },

    pendingText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: '800',
    },

    dateText: {
      color: theme.muted,
      fontSize: 10,
    },

    campaignTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '900',
      marginBottom: 8,
    },

    description: {
      color: theme.muted,
      fontSize: 13,
      lineHeight: 21,
    },

    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 15,
    },

    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 7,
    },

    detailLabel: {
      color: theme.muted,
      fontSize: 12,
      flex: 1,
    },

    detailValue: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '700',
      flex: 1.3,
      textAlign: 'right',
    },

    urlSection: {
      marginTop: 10,
      padding: 11,
      backgroundColor: theme.panel2,
      borderRadius: 11,
    },

    urlText: {
      color: theme.cyan,
      fontSize: 11,
      marginTop: 5,
      lineHeight: 17,
    },

    reviewSection: {
      marginTop: 16,
    },

    reviewLabel: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 8,
    },

    noteInput: {
      minHeight: 85,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 11,
      color: theme.text,
      backgroundColor: theme.bg,
      fontSize: 13,
    },

    noteHint: {
      color: theme.muted,
      fontSize: 10,
      marginTop: 6,
    },

    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
    },

    approveButton: {
      flex: 1,
      minHeight: 47,
      borderRadius: 13,
      backgroundColor: '#16865B',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
    },

    rejectButton: {
      flex: 1,
      minHeight: 47,
      borderRadius: 13,
      backgroundColor: '#B83E46',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
    },

    primaryButton: {
      backgroundColor: theme.cyan,
      borderRadius: 13,
      paddingHorizontal: 22,
      paddingVertical: 12,
      marginTop: 20,
    },

    buttonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },

    disabledButton: {
      opacity: 0.55,
    },
  });
}
