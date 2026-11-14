import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../src/auth/AuthProvider';
import { useAppTheme } from '../src/contexts/ThemeContext';

import {
  createAdCampaignDraft,
  fetchMyAdCampaigns,
  submitAdCampaignForReview,
  getAdCampaignStatusLabel,
  type AdCampaign,
  type AdCategory,
  type AdvertiserType,
  type AdCreativeType,
} from '../src/lib/advertising';

import { withThemeBackground } from '../src/components/ThemeScreen';

const CATEGORIES: AdCategory[] = [
  'education',
  'technology',
  'fashion',
  'food',
  'entertainment',
  'sports',
  'home',
  'business',
  'community',
  'other',
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatAmount(value: number | string | null) {
  const amount = Number(value || 0);

  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AdvertiseScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const [advertiserType, setAdvertiserType] =
    useState<AdvertiserType>('individual');

  const [businessName, setBusinessName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creativeType, setCreativeType] =
    useState<AdCreativeType>('text');

  const [creativeUrl, setCreativeUrl] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [category, setCategory] = useState<AdCategory>('other');
  const [budget, setBudget] = useState('');
  const [dailyBudget, setDailyBudget] = useState('');

  const loadCampaigns = useCallback(async () => {
    if (!session?.user?.id) {
      setCampaigns([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const result = await fetchMyAdCampaigns();

      setCampaigns(result);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not load your campaigns.',
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const resetForm = () => {
    setAdvertiserType('individual');
    setBusinessName('');
    setTitle('');
    setDescription('');
    setCreativeType('text');
    setCreativeUrl('');
    setDestinationUrl('');
    setCategory('other');
    setBudget('');
    setDailyBudget('');
  };

  const createDraft = async () => {
    if (saving) return;

    if (!session?.user?.id) {
      setMessage('Please sign in before creating an advertisement.');
      return;
    }

    const total = Number(budget);
    const daily = dailyBudget.trim()
      ? Number(dailyBudget)
      : null;

    if (!Number.isFinite(total) || total <= 0) {
      setMessage('Enter a valid total campaign budget.');
      return;
    }

    if (
      daily !== null &&
      (!Number.isFinite(daily) || daily <= 0)
    ) {
      setMessage('Enter a valid daily budget or leave it blank.');
      return;
    }

    if (daily !== null && daily > total) {
      setMessage('Daily budget cannot exceed the total budget.');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      await createAdCampaignDraft({
        advertiser_type: advertiserType,
        business_name:
          advertiserType === 'business'
            ? businessName.trim()
            : null,
        title: title.trim(),
        description: description.trim(),
        creative_type: creativeType,
        creative_url: creativeUrl.trim() || null,
        destination_url: destinationUrl.trim() || null,
        category,
        budget_total: total,
        daily_budget: daily,
      });

      resetForm();

      setMessage(
        'Your advertisement draft was created. Review it below and submit it when ready.',
      );

      await loadCampaigns();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not create your advertisement.',
      );
    } finally {
      setSaving(false);
    }
  };

  const submitCampaign = (campaign: AdCampaign) => {
    Alert.alert(
      'Submit advertisement?',
      'Your campaign will be sent to BRITUME administrators for review. It will not appear publicly until it is approved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            void (async () => {
              try {
                setSubmittingId(campaign.id);
                setMessage('');

                await submitAdCampaignForReview(campaign.id);

                setMessage('Your advertisement is now awaiting admin review.');

                await loadCampaigns();
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : 'Could not submit your campaign.',
                );
              } finally {
                setSubmittingId(null);
              }
            })();
          },
        },
      ],
    );
  };

  const renderChoice = <T extends string>(
    value: T,
    selected: T,
    label: string,
    onSelect: (next: T) => void,
  ) => (
    <Pressable
      key={value}
      onPress={() => onSelect(value)}
      style={[
        styles.choice,
        selected === value && styles.choiceSelected,
      ]}
    >
      <Text
        style={[
          styles.choiceText,
          selected === value && styles.choiceTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const renderCampaign = (campaign: AdCampaign) => {
    const canSubmit =
      campaign.status === 'draft' ||
      campaign.status === 'rejected';

    return (
      <View key={campaign.id} style={styles.campaignCard}>
        <View style={styles.campaignTop}>
          <View style={styles.campaignIcon}>
            <Ionicons
              name="megaphone-outline"
              size={22}
              color={theme.cyan}
            />
          </View>

          <View style={styles.campaignHeading}>
            <Text style={styles.campaignTitle}>
              {campaign.title}
            </Text>

            <Text style={styles.campaignDate}>
              Created {formatDate(campaign.created_at)}
            </Text>
          </View>
        </View>

        <Text style={styles.campaignDescription}>
          {campaign.description}
        </Text>

        <View style={styles.campaignInfo}>
          <Text style={styles.infoText}>
            Budget: {formatAmount(campaign.budget_total)}
          </Text>

          <Text style={styles.infoText}>
            Category: {campaign.category}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>

          <Text style={styles.statusValue}>
            {getAdCampaignStatusLabel(campaign.status)}
          </Text>
        </View>

        {campaign.review_note ? (
          <View style={styles.reviewNote}>
            <Text style={styles.reviewNoteTitle}>
              Administrator feedback
            </Text>

            <Text style={styles.reviewNoteText}>
              {campaign.review_note}
            </Text>
          </View>
        ) : null}

        {canSubmit ? (
          <Pressable
            disabled={submittingId === campaign.id}
            onPress={() => submitCampaign(campaign)}
            style={[
              styles.submitButton,
              submittingId === campaign.id &&
                styles.disabledButton,
            ]}
          >
            {submittingId === campaign.id ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="send-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>
                  Submit for review
                </Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={theme.text}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Advertise on BRITUME
          </Text>
          <Text style={styles.headerSubtitle}>
            Create and manage your campaigns
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.introCard}>
          <Ionicons
            name="megaphone"
            size={30}
            color={theme.cyan}
          />

          <Text style={styles.introTitle}>
            Reach the BRITUME community
          </Text>

          <Text style={styles.introDescription}>
            Individuals and businesses can submit advertisements.
            Every campaign must pass administrator review before
            it can be displayed.
          </Text>
        </View>

        {!session?.user?.id ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              Please sign in to create and manage advertisements.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Create an advertisement
              </Text>

              <Text style={styles.fieldLabel}>
                Advertiser type
              </Text>

              <View style={styles.choiceRow}>
                {renderChoice(
                  'individual',
                  advertiserType,
                  'Individual',
                  setAdvertiserType,
                )}

                {renderChoice(
                  'business',
                  advertiserType,
                  'Business',
                  setAdvertiserType,
                )}
              </View>

              {advertiserType === 'business' ? (
                <>
                  <Text style={styles.fieldLabel}>
                    Business name
                  </Text>

                  <TextInput
                    value={businessName}
                    onChangeText={setBusinessName}
                    placeholder="Enter your business name"
                    placeholderTextColor={theme.muted}
                    style={styles.input}
                    maxLength={120}
                  />
                </>
              ) : null}

              <Text style={styles.fieldLabel}>
                Advertisement title
              </Text>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What are you advertising?"
                placeholderTextColor={theme.muted}
                style={styles.input}
                maxLength={100}
              />

              <Text style={styles.fieldLabel}>
                Description
              </Text>

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your advertisement..."
                placeholderTextColor={theme.muted}
                style={[styles.input, styles.multiline]}
                multiline
                maxLength={1000}
                textAlignVertical="top"
              />

              <Text style={styles.fieldLabel}>
                Advertisement format
              </Text>

              <View style={styles.choiceRow}>
                {renderChoice(
                  'text',
                  creativeType,
                  'Text',
                  setCreativeType,
                )}

                {renderChoice(
                  'image',
                  creativeType,
                  'Image',
                  setCreativeType,
                )}

                {renderChoice(
                  'video',
                  creativeType,
                  'Video',
                  setCreativeType,
                )}
              </View>

              {creativeType !== 'text' ? (
                <>
                  <Text style={styles.fieldLabel}>
                    Secure media URL
                  </Text>

                  <TextInput
                    value={creativeUrl}
                    onChangeText={setCreativeUrl}
                    placeholder="https://..."
                    placeholderTextColor={theme.muted}
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="url"
                  />

                  <Text style={styles.helperText}>
                    This field currently accepts an HTTPS media
                    URL. Media upload will be added separately.
                  </Text>
                </>
              ) : null}

              <Text style={styles.fieldLabel}>
                Destination link (optional)
              </Text>

              <TextInput
                value={destinationUrl}
                onChangeText={setDestinationUrl}
                placeholder="https://your-website.com"
                placeholderTextColor={theme.muted}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="url"
              />

              <Text style={styles.fieldLabel}>
                Advertisement category
              </Text>

              <View style={styles.categoryGrid}>
                {CATEGORIES.map(item =>
                  renderChoice(
                    item,
                    category,
                    item.charAt(0).toUpperCase() + item.slice(1),
                    setCategory,
                  ),
                )}
              </View>

              <Text style={styles.fieldLabel}>
                Total campaign budget
              </Text>

              <TextInput
                value={budget}
                onChangeText={setBudget}
                placeholder="Enter total budget"
                placeholderTextColor={theme.muted}
                style={styles.input}
                keyboardType="decimal-pad"
              />

              <Text style={styles.helperText}>
                Enter the budget in the currency configured for
                BRITUME advertising. Confirm the currency before
                launching paid campaigns.
              </Text>

              <Text style={styles.fieldLabel}>
                Daily budget (optional)
              </Text>

              <TextInput
                value={dailyBudget}
                onChangeText={setDailyBudget}
                placeholder="Enter daily budget"
                placeholderTextColor={theme.muted}
                style={styles.input}
                keyboardType="decimal-pad"
              />

              <Pressable
                disabled={saving}
                onPress={createDraft}
                style={[
                  styles.primaryButton,
                  saving && styles.disabledButton,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={19}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryButtonText}>
                      Save advertisement draft
                    </Text>
                  </>
                )}
              </Pressable>
            </View>

            {message ? (
              <View style={styles.messageCard}>
                <Text style={styles.messageText}>
                  {message}
                </Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>
                  My advertisements
                </Text>

                <Pressable
                  onPress={() => void loadCampaigns()}
                  style={styles.refreshButton}
                >
                  <Ionicons
                    name="refresh"
                    size={19}
                    color={theme.cyan}
                  />
                </Pressable>
              </View>

              {loading ? (
                <ActivityIndicator
                  color={theme.cyan}
                  style={styles.loader}
                />
              ) : campaigns.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons
                    name="document-text-outline"
                    size={34}
                    color={theme.muted}
                  />

                  <Text style={styles.emptyTitle}>
                    No advertisements yet
                  </Text>

                  <Text style={styles.emptyText}>
                    Your saved campaigns will appear here.
                  </Text>
                </View>
              ) : (
                campaigns.map(renderCampaign)
              )}
            </View>
          </>
        )}

        <View style={styles.footerNotice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color={theme.cyan}
          />

          <Text style={styles.footerText}>
            Advertisements are subject to BRITUME moderation.
            Saving a draft or submitting a campaign does not
            guarantee approval or public display.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 12,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
    },
    headerTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '800',
    },
    headerSubtitle: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 3,
    },
    content: {
      padding: 16,
      paddingBottom: 50,
      gap: 16,
    },
    introCard: {
      backgroundColor: theme.panel,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 18,
      gap: 9,
    },
    introTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '800',
    },
    introDescription: {
      color: theme.muted,
      fontSize: 14,
      lineHeight: 21,
    },
    section: {
      backgroundColor: theme.panel,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      gap: 12,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      flex: 1,
    },
    fieldLabel: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
      marginTop: 5,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bg,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 12,
      color: theme.text,
      fontSize: 14,
    },
    multiline: {
      minHeight: 110,
    },
    helperText: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    choiceRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    choice: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bg,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 12,
    },
    choiceSelected: {
      borderColor: theme.cyan,
      backgroundColor: theme.panel2,
    },
    choiceText: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    choiceTextSelected: {
      color: theme.cyan,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    primaryButton: {
      minHeight: 50,
      backgroundColor: theme.cyan,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      marginTop: 8,
      paddingHorizontal: 14,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },
    disabledButton: {
      opacity: 0.55,
    },
    messageCard: {
      padding: 13,
      borderRadius: 12,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
    },
    messageText: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 19,
    },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    refreshButton: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loader: {
      padding: 25,
    },
    emptyCard: {
      alignItems: 'center',
      padding: 22,
      gap: 8,
    },
    emptyTitle: {
      color: theme.text,
      fontWeight: '800',
      fontSize: 15,
    },
    emptyText: {
      color: theme.muted,
      fontSize: 13,
      textAlign: 'center',
    },
    campaignCard: {
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.bg,
      borderRadius: 16,
      padding: 14,
      gap: 11,
    },
    campaignTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    campaignIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    campaignHeading: {
      flex: 1,
    },
    campaignTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
    },
    campaignDate: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 3,
    },
    campaignDescription: {
      color: theme.muted,
      fontSize: 13,
      lineHeight: 19,
    },
    campaignInfo: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    infoText: {
      color: theme.muted,
      fontSize: 11,
    },
    statusRow: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingTop: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    statusLabel: {
      color: theme.muted,
      fontSize: 12,
    },
    statusValue: {
      color: theme.cyan,
      fontWeight: '800',
      fontSize: 12,
    },
    reviewNote: {
      backgroundColor: theme.panel,
      borderRadius: 10,
      padding: 11,
      gap: 5,
    },
    reviewNoteTitle: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '800',
    },
    reviewNoteText: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    submitButton: {
      minHeight: 44,
      backgroundColor: theme.cyan,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
    },
    noticeCard: {
      padding: 16,
      backgroundColor: theme.panel,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    noticeText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
    },
    footerNotice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 14,
      borderRadius: 14,
      backgroundColor: theme.panel,
    },
    footerText: {
      flex: 1,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
  });
}

export default withThemeBackground(AdvertiseScreen);
