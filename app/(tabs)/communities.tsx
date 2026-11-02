import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../src/auth/AuthProvider';
import {
  createCommunity,
  fetchCommunities,
  type Community,
} from '../../src/lib/communities';
import { supabase, supabaseConfigured } from '../../src/lib/supabase';
import { theme } from '../../src/lib/theme';

type CommunityStats = {
  members: number;
  joined: boolean;
};

const getCommunityIcon = (
  name: string
): React.ComponentProps<typeof Ionicons>['name'] => {
  const value = name.toLowerCase();

  if (value.includes('tech') || value.includes('computer')) return 'laptop-outline';
  if (value.includes('game')) return 'game-controller-outline';
  if (value.includes('music')) return 'musical-notes-outline';
  if (value.includes('sport') || value.includes('fitness')) return 'football-outline';
  if (value.includes('art') || value.includes('design')) return 'color-palette-outline';
  if (value.includes('business') || value.includes('entrepreneur')) return 'briefcase-outline';
  if (value.includes('book') || value.includes('study') || value.includes('school')) return 'book-outline';
  if (value.includes('photo') || value.includes('video')) return 'camera-outline';
  if (value.includes('travel')) return 'airplane-outline';
  if (value.includes('food') || value.includes('cook')) return 'restaurant-outline';
  if (value.includes('faith') || value.includes('spiritual')) return 'heart-outline';

  return 'people-outline';
};

export default function CommunitiesScreen() {
  const { session } = useAuth();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [stats, setStats] = useState<Record<string, CommunityStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyIds, setBusyIds] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');

  const loadCommunities = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const list = await fetchCommunities();
      setCommunities(list);

      if (!supabase || !session?.user.id || list.length === 0) {
        setStats({});
        return;
      }

      // The membership table is added by the SQL migration.
      // Use a loose client type until Supabase types are regenerated.
      const db = supabase as any;
      const ids = list.map(item => item.id);

      const [membersResult, mineResult] = await Promise.all([
        db
          .from('community_members')
          .select('community_id')
          .in('community_id', ids),

        db
          .from('community_members')
          .select('community_id')
          .eq('user_id', session.user.id)
          .in('community_id', ids),
      ]);

      if (membersResult.error) throw membersResult.error;
      if (mineResult.error) throw mineResult.error;

      const counts: Record<string, CommunityStats> = {};

      list.forEach(community => {
        counts[community.id] = {
          members: 0,
          joined: false,
        };
      });

      (membersResult.data || []).forEach(
        (row: { community_id: string }) => {
          if (counts[row.community_id]) {
            counts[row.community_id].members += 1;
          }
        }
      );

      (mineResult.data || []).forEach(
        (row: { community_id: string }) => {
          if (counts[row.community_id]) {
            counts[row.community_id].joined = true;
          }
        }
      );

      setStats(counts);
    } catch (error) {
      Alert.alert(
        'Communities',
        error instanceof Error
          ? error.message
          : 'Could not load communities. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  const visibleCommunities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return communities;

    return communities.filter(community =>
      community.name.toLowerCase().includes(query) ||
      (community.description || '').toLowerCase().includes(query)
    );
  }, [communities, search]);

  const submitCommunity = async () => {
    if (saving) return;

    if (!session) {
      Alert.alert(
        'Sign in required',
        'Please sign in before creating a community.'
      );
      return;
    }

    if (name.trim().length < 3) {
      Alert.alert(
        'Community name',
        'Please enter at least 3 characters.'
      );
      return;
    }

    setSaving(true);

    try {
      const created = await createCommunity({
        name,
        description,
      });

      // Automatically make the creator the first member.
      if (supabase) {
        const db = supabase as any;
        const { error } = await db
          .from('community_members')
          .insert({
            community_id: created.id,
            user_id: session.user.id,
          });

        if (error) throw error;
      }

      setName('');
      setDescription('');
      setCreating(false);

      await loadCommunities(true);

      Alert.alert(
        'Community created',
        'Your BRITUME community is ready!'
      );
    } catch (error) {
      Alert.alert(
        'Could not create community',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
      await loadCommunities(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleMembership = async (community: Community) => {
    if (!session) {
      Alert.alert(
        'Sign in required',
        'Please sign in to join a community.'
      );
      return;
    }

    if (!supabase) return;
    if (busyIds.includes(community.id)) return;

    const current = stats[community.id] || {
      members: 0,
      joined: false,
    };

    setBusyIds(items => [...items, community.id]);

    // Optimistic update, reverted if Supabase rejects the action.
    setStats(previous => ({
      ...previous,
      [community.id]: {
        members: Math.max(
          0,
          current.members + (current.joined ? -1 : 1)
        ),
        joined: !current.joined,
      },
    }));

    try {
      const db = supabase as any;

      if (current.joined) {
        const { error } = await db
          .from('community_members')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', session.user.id);

        if (error) throw error;
      } else {
        const { error } = await db
          .from('community_members')
          .insert({
            community_id: community.id,
            user_id: session.user.id,
          });

        if (error) throw error;
      }
    } catch (error) {
      setStats(previous => ({
        ...previous,
        [community.id]: current,
      }));

      Alert.alert(
        'Membership not updated',
        error instanceof Error
          ? error.message
          : 'Please try again.'
      );
    } finally {
      setBusyIds(items =>
        items.filter(id => id !== community.id)
      );
    }
  };

  const renderCommunity = (community: Community) => {
    const state = stats[community.id] || {
      members: 0,
      joined: false,
    };

    const busy = busyIds.includes(community.id);
    const icon = getCommunityIcon(community.name);

    return (
      <View key={community.id} style={styles.communityCard}>
        <View style={styles.cardTop}>
          {community.image_url ? (
            <Image
              source={{ uri: community.image_url }}
              style={styles.communityPhoto}
            />
          ) : (
            <View style={styles.communityIcon}>
              <Ionicons
                name={icon}
                size={29}
                color={theme.cyan}
              />
            </View>
          )}

          <View style={styles.communityInfo}>
            <Text style={styles.communityName} numberOfLines={2}>
              {community.name}
            </Text>

            <Text style={styles.creatorText} numberOfLines={1}>
              BRITUME Community
            </Text>
          </View>

          <View style={styles.memberBadge}>
            <Ionicons
              name="people"
              size={14}
              color={theme.cyan}
            />
            <Text style={styles.memberCount}>
              {state.members.toLocaleString()}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          {community.description || 'A place to connect and share with people who have similar interests.'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.memberLabel}>
            <Ionicons
              name="people-outline"
              size={16}
              color={theme.muted}
            />
            <Text style={styles.memberLabelText}>
              {state.members === 1
                ? '1 member'
                : `${state.members.toLocaleString()} members`}
            </Text>
          </View>

          <Pressable
            onPress={() => void toggleMembership(community)}
            disabled={busy}
            style={[
              styles.joinButton,
              state.joined && styles.joinedButton,
              busy && styles.disabled,
            ]}
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color={state.joined ? theme.cyan : '#FFFFFF'}
              />
            ) : (
              <>
                <Ionicons
                  name={state.joined ? 'checkmark' : 'add'}
                  size={17}
                  color={state.joined ? theme.cyan : '#FFFFFF'}
                />
                <Text
                  style={[
                    styles.joinButtonText,
                    state.joined && styles.joinedButtonText,
                  ]}
                >
                  {state.joined ? 'Joined' : 'Join'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadCommunities(true)}
          tintColor={theme.cyan}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoB}>B</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Communities</Text>
          <Text style={styles.subtitle}>
            Find your people. Build something together.
          </Text>
        </View>

        <Pressable
          style={styles.createIconButton}
          onPress={() => setCreating(value => !value)}
        >
          <Ionicons
            name={creating ? 'close' : 'add'}
            size={25}
            color={theme.cyan}
          />
        </Pressable>
      </View>

      {!supabaseConfigured && (
        <Text style={styles.notice}>
          BRITUME is not connected to Supabase. Check your environment variables.
        </Text>
      )}

      <View style={styles.searchCard}>
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.muted}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search communities..."
          placeholderTextColor={theme.muted}
          style={styles.searchInput}
        />
        {!!search && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons
              name="close-circle"
              size={19}
              color={theme.muted}
            />
          </Pressable>
        )}
      </View>

      {creating && (
        <View style={styles.form}>
          <View style={styles.formHeading}>
            <View style={styles.formTitleRow}>
              <Ionicons
                name="people-circle-outline"
                size={24}
                color={theme.cyan}
              />
              <Text style={styles.sectionTitle}>
                Create a community
              </Text>
            </View>

            <Pressable onPress={() => setCreating(false)}>
              <Ionicons
                name="close-circle"
                size={24}
                color={theme.muted}
              />
            </Pressable>
          </View>

          <Text style={styles.label}>Community name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gaborone Tech"
            placeholderTextColor={theme.muted}
            maxLength={60}
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What is this community about?"
            placeholderTextColor={theme.muted}
            maxLength={500}
            multiline
            style={[styles.input, styles.descriptionInput]}
          />

          <Text style={styles.photoHint}>
            <Ionicons name="image-outline" size={14} /> Community photos can be displayed using the community image URL.
          </Text>

          <Pressable
            disabled={saving || name.trim().length < 3}
            onPress={() => void submitCommunity()}
            style={[
              styles.primaryButton,
              (saving || name.trim().length < 3) && styles.disabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#FFFFFF"
              />
            )}
            <Text style={styles.buttonText}>
              {saving ? 'Creating...' : 'Create community'}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Discover communities
          </Text>
          <Text style={styles.sectionSubtitle}>
            Connect with people who share your interests
          </Text>
        </View>

        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>
            {communities.length}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.cyan} />
          <Text style={styles.subtitle}>
            Loading communities...
          </Text>
        </View>
      ) : visibleCommunities.length > 0 ? (
        <View style={styles.communityList}>
          {visibleCommunities.map(renderCommunity)}
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="people-outline"
              size={37}
              color={theme.cyan}
            />
          </View>

          <Text style={styles.emptyTitle}>
            {search
              ? 'No communities found'
              : 'Your community space starts here'}
          </Text>

          <Text style={styles.emptyText}>
            {search
              ? 'Try another search term.'
              : 'Create the first BRITUME community and bring people together around a shared interest.'}
          </Text>

          {!search && (
            <Pressable
              onPress={() => setCreating(true)}
              style={styles.primaryButton}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.buttonText}>
                Create your first community
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  content: {
    padding: 16,
    paddingBottom: 45,
    gap: 19,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  logo: {
    width: 53,
    height: 53,
    borderRadius: 18,
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },

  logoB: {
    color: theme.cyan,
    fontSize: 30,
    fontWeight: '900',
  },

  title: {
    color: theme.text,
    fontSize: 23,
    fontWeight: '900',
  },

  subtitle: {
    color: theme.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  createIconButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },

  notice: {
    padding: 13,
    borderRadius: 14,
    backgroundColor: theme.panel2,
    color: theme.text,
    fontSize: 12,
  },

  searchCard: {
    minHeight: 49,
    borderRadius: 17,
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 9,
    ...theme.clayRaised,
  },

  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 13,
    paddingVertical: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 3,
  },

  totalBadge: {
    minWidth: 35,
    height: 35,
    borderRadius: 13,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },

  totalBadgeText: {
    color: theme.cyan,
    fontWeight: '900',
    fontSize: 13,
  },

  communityList: {
    gap: 15,
  },

  communityCard: {
    padding: 15,
    borderRadius: 22,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    gap: 13,
    ...theme.clayShadow,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  communityPhoto: {
    width: 57,
    height: 57,
    borderRadius: 19,
    backgroundColor: theme.clayBlue,
  },

  communityIcon: {
    width: 57,
    height: 57,
    borderRadius: 19,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },

  communityInfo: {
    flex: 1,
    minWidth: 0,
  },

  communityName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '900',
  },

  creatorText: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 4,
  },

  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: theme.clayBlue,
  },

  memberCount: {
    color: theme.text,
    fontSize: 11,
    fontWeight: '900',
  },

  description: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: 11,
  },

  memberLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  memberLabelText: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '700',
  },

  joinButton: {
    minWidth: 95,
    minHeight: 37,
    borderRadius: 13,
    backgroundColor: theme.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 12,
    ...theme.clayRaised,
  },

  joinedButton: {
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: theme.border,
  },

  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  joinedButtonText: {
    color: theme.cyan,
  },

  disabled: {
    opacity: 0.55,
  },

  form: {
    padding: 17,
    backgroundColor: theme.panel,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    gap: 11,
    ...theme.clayShadow,
  },

  formHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },

  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  label: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '800',
  },

  input: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 13,
    paddingHorizontal: 13,
    color: theme.text,
    backgroundColor: theme.bg,
    fontSize: 13,
  },

  descriptionInput: {
    minHeight: 85,
    paddingTop: 12,
    textAlignVertical: 'top',
  },

  photoHint: {
    color: theme.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  primaryButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: theme.cyan,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  loading: {
    alignItems: 'center',
    padding: 35,
    gap: 12,
  },

  empty: {
    alignItems: 'center',
    padding: 23,
    gap: 13,
    backgroundColor: theme.panel,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.clayRaised,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 25,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  emptyText: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
});
