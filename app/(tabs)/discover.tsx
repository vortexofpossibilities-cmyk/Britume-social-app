
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/lib/theme';

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string;
  avatar_url?: string | null;
  is_public?: boolean;
};

type FriendRequest = {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: string;
};

export default function DiscoverScreen() {
  const [myId, setMyId] = useState('');
  const [people, setPeople] = useState<Profile[]>([]);
  const [recent, setRecent] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState(false);

  const nameOf = (person: Profile) =>
    person.display_name?.trim() ||
    person.username ||
    'BRITUME member';

  const loadDiscover = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Connection unavailable', 'Check your Supabase configuration.');
      return;
    }

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const uid = authData.user.id;
      setMyId(uid);

      const [
        peopleResult,
        requestResult,
        followResult,
        pinResult,
        recentResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id,username,display_name,bio,avatar_url,is_public')
          .eq('is_public', true)
          .neq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(50),

        supabase
          .from('friend_requests')
          .select('id,sender_id,recipient_id,status')
          .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`),

        supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', uid),

        supabase
          .from('pinned_profiles')
          .select('profile_id')
          .eq('user_id', uid),

        supabase
          .from('recent_profiles')
          .select('profile_id')
          .eq('user_id', uid)
          .order('viewed_at', { ascending: false })
          .limit(30),
      ]);

      if (peopleResult.error) throw peopleResult.error;
      if (requestResult.error) throw requestResult.error;
      if (followResult.error) throw followResult.error;
      if (pinResult.error) throw pinResult.error;
      if (recentResult.error) throw recentResult.error;

      const allPeople = (peopleResult.data || []) as Profile[];
      const allRequests = (requestResult.data || []) as FriendRequest[];

      setPeople(allPeople);
      setRequests(allRequests);

      setFriends(
        allRequests
          .filter((r) => r.status === 'accepted')
          .map((r) =>
            r.sender_id === uid ? r.recipient_id : r.sender_id
          )
      );

      setFollowing((followResult.data || []).map((r: any) => r.following_id));
      setPinned((pinResult.data || []).map((r: any) => r.profile_id));

      const recentIds = (recentResult.data || []).map(
        (r: any) => r.profile_id
      );

      const recentPeople = recentIds
        .map((id: string) => allPeople.find((p) => p.user_id === id))
        .filter(Boolean) as Profile[];

      setRecent(recentPeople);
    } catch (error: any) {
      Alert.alert(
        'Discover could not load',
        error?.message || 'Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDiscover();
  }, [loadDiscover]);

  const searchPeople = async () => {
    const term = search.trim();

    if (!term || !supabase) {
      setPeople([]);
      return;
    }

    setSearching(true);

    try {
      const safeTerm = term.replace(/[%_,()]/g, ' ').trim();

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id,username,display_name,bio,avatar_url,is_public')
        .eq('is_public', true)
        .neq('user_id', myId)
        .or(
          `display_name.ilike.%${safeTerm}%,username.ilike.%${safeTerm}%`
        )
        .limit(30);

      if (error) throw error;

      setPeople((data || []) as Profile[]);
    } catch (error: any) {
      Alert.alert('Search failed', error?.message || 'Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const rememberVisit = async (person: Profile) => {
    if (!supabase || !myId) return;

    try {
      const { error } = await supabase
        .from('recent_profiles')
        .upsert(
          {
            user_id: myId,
            profile_id: person.user_id,
            viewed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,profile_id' }
        );

      if (error) throw error;

      setRecent((previous) => [
        person,
        ...previous.filter((p) => p.user_id !== person.user_id),
      ]);
    } catch (error: any) {
      Alert.alert('Recent history unavailable', error?.message || 'Try again.');
    }
  };

  const openProfile = async (person: Profile) => {
    setSelected(person);
    await rememberVisit(person);
  };

  const sendFriendRequest = async (person: Profile) => {
    if (!supabase || !myId) return;

    if (friends.includes(person.user_id)) {
      Alert.alert('Already friends', 'This person is already your friend.');
      return;
    }

    const existing = requests.find(
      (r) =>
        r.status === 'pending' &&
        ((r.sender_id === myId && r.recipient_id === person.user_id) ||
          (r.recipient_id === myId && r.sender_id === person.user_id))
    );

    if (existing) {
      Alert.alert('Request already exists', 'There is already a pending request between you.');
      return;
    }

    try {
      setWorking(true);

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: myId,
          recipient_id: person.user_id,
          status: 'pending',
        });

      if (error) throw error;

      Alert.alert('Request sent', `Your request was sent to ${nameOf(person)}.`);
      await loadDiscover();
    } catch (error: any) {
      Alert.alert('Could not send request', error?.message || 'Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const toggleFollow = async (person: Profile) => {
    if (!supabase || !myId) return;

    const isFollowing = following.includes(person.user_id);

    try {
      setWorking(true);

      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', myId)
          .eq('following_id', person.user_id);

        if (error) throw error;

        setFollowing((old) => old.filter((id) => id !== person.user_id));
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: myId,
            following_id: person.user_id,
          });

        if (error) throw error;

        setFollowing((old) => [...old, person.user_id]);
      }
    } catch (error: any) {
      Alert.alert('Subscription failed', error?.message || 'Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const togglePin = async (person: Profile) => {
    if (!supabase || !myId) return;

    const isPinned = pinned.includes(person.user_id);

    try {
      setWorking(true);

      if (isPinned) {
        const { error } = await supabase
          .from('pinned_profiles')
          .delete()
          .eq('user_id', myId)
          .eq('profile_id', person.user_id);

        if (error) throw error;

        setPinned((old) => old.filter((id) => id !== person.user_id));
      } else {
        const { error } = await supabase
          .from('pinned_profiles')
          .insert({
            user_id: myId,
            profile_id: person.user_id,
          });

        if (error) throw error;

        setPinned((old) => [...old, person.user_id]);
      }
    } catch (error: any) {
      Alert.alert('Pin action failed', error?.message || 'Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const removeFriend = (person: Profile) => {
    if (!supabase || !myId) return;

    Alert.alert(
      'Remove friend?',
      `Remove ${nameOf(person)} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const request = requests.find(
              (r) =>
                r.status === 'accepted' &&
                ((r.sender_id === myId && r.recipient_id === person.user_id) ||
                  (r.recipient_id === myId && r.sender_id === person.user_id))
            );

            if (!request) return;

            const { error } = await supabase!
              .from('friend_requests')
              .delete()
              .eq('id', request.id);

            if (error) {
              Alert.alert('Could not remove friend', error.message);
              return;
            }

            setFriends((old) => old.filter((id) => id !== person.user_id));
            setRequests((old) => old.filter((r) => r.id !== request.id));
            Alert.alert('Friend removed', `${nameOf(person)} was removed.`);
          },
        },
      ]
    );
  };

  const deleteRecent = async (person: Profile) => {
    if (!supabase || !myId) return;

    const { error } = await supabase
      .from('recent_profiles')
      .delete()
      .eq('user_id', myId)
      .eq('profile_id', person.user_id);

    if (error) {
      Alert.alert('Could not delete recent user', error.message);
      return;
    }

    setRecent((old) => old.filter((p) => p.user_id !== person.user_id));
  };

  const Avatar = ({
    person,
    size = 60,
  }: {
    person: Profile;
    size?: number;
  }) => (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {person.avatar_url ? (
        <Image
          source={{ uri: person.avatar_url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Ionicons name="person" size={size * 0.46} color={theme.blue} />
      )}
    </View>
  );

  const ProfileCard = ({
    person,
    isRecent = false,
  }: {
    person: Profile;
    isRecent?: boolean;
  }) => (
    <View style={styles.personCard}>
      <Pressable
        style={styles.personMain}
        onPress={() => openProfile(person)}
      >
        <Avatar person={person} size={59} />
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>
            {nameOf(person)}
          </Text>
          <Text style={styles.username} numberOfLines={1}>
            {person.username ? `@${person.username}` : 'BRITUME member'}
          </Text>
          <Text style={styles.bio} numberOfLines={1}>
            {person.bio || 'Discover this BRITUME member'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.muted} />
      </Pressable>

      <View style={styles.cardActions}>
        <Pressable
          style={styles.smallAction}
          onPress={() => openProfile(person)}
        >
          <Ionicons name="person-outline" size={16} color={theme.blue} />
          <Text style={styles.smallActionText}>View</Text>
        </Pressable>

        {friends.includes(person.user_id) ? (
          <Pressable
            style={styles.smallAction}
            onPress={() => removeFriend(person)}
          >
            <Ionicons name="person-remove-outline" size={16} color={theme.danger} />
            <Text style={[styles.smallActionText, { color: theme.danger }]}>
              Remove
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.smallAction}
            onPress={() => sendFriendRequest(person)}
          >
            <Ionicons name="person-add-outline" size={16} color={theme.blue} />
            <Text style={styles.smallActionText}>Add</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.smallAction}
          onPress={() => toggleFollow(person)}
        >
          <Ionicons
            name={following.includes(person.user_id) ? 'checkmark-circle' : 'star-outline'}
            size={16}
            color={theme.purple}
          />
          <Text style={[styles.smallActionText, { color: theme.purple }]}>
            {following.includes(person.user_id) ? 'Subscribed' : 'Subscribe'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.iconAction}
          onPress={() => togglePin(person)}
        >
          <Ionicons
            name={pinned.includes(person.user_id) ? 'pin' : 'pin-outline'}
            size={18}
            color={theme.blue}
          />
        </Pressable>

        {isRecent && (
          <Pressable
            style={styles.iconAction}
            onPress={() => deleteRecent(person)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
          </Pressable>
        )}
      </View>
    </View>
  );

  const pinnedPeople = people.filter((person) =>
    pinned.includes(person.user_id)
  );

  const sortedPeople = [
    ...pinnedPeople,
    ...people.filter((person) => !pinned.includes(person.user_id)),
  ];

  const filteredPeople = sortedPeople.filter((person) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return (
      (person.display_name || '').toLowerCase().includes(term) ||
      (person.username || '').toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.blue} />
        <Text style={styles.loadingText}>Discovering BRITUME members...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDiscover();
            }}
            tintColor={theme.blue}
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <View>
              <Text style={styles.brandName}>BRITUME</Text>
              <Text style={styles.tagline}>Vortex of Possibilities</Text>
            </View>
          </View>

          <Pressable
            style={styles.headerButton}
            onPress={() => {
              setSearch('');
              setPeople([]);
            }}
          >
            <Ionicons name="refresh" size={22} color={theme.blueDark} />
          </Pressable>
        </View>

        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>
          Find people, creators and new connections.
        </Text>

        {/* ICON ACTIONS */}
        <View style={styles.toolsRow}>
          <Pressable
            style={styles.tool}
            onPress={() => {
              setSearch('');
              setPeople([]);
            }}
          >
            <Ionicons name="search" size={24} color={theme.blue} />
            <Text style={styles.toolText}>Search</Text>
          </Pressable>

          <Pressable
            style={styles.tool}
            onPress={() => {
              Alert.alert('Add people', 'Search for a BRITUME member below and tap Add.');
            }}
          >
            <Ionicons name="person-add" size={24} color={theme.success} />
            <Text style={styles.toolText}>Add</Text>
          </Pressable>

          <Pressable
            style={styles.tool}
            onPress={() => {
              if (!selected) {
                Alert.alert('Remove', 'Open a profile to remove a friend.');
              } else {
                removeFriend(selected);
              }
            }}
          >
            <Ionicons name="person-remove" size={24} color={theme.danger} />
            <Text style={styles.toolText}>Remove</Text>
          </Pressable>

          <Pressable
            style={styles.tool}
            onPress={() => {
              if (recent.length === 0) {
                Alert.alert('Recent users', 'There are no recent profiles to delete.');
                return;
              }
              Alert.alert('Clear recent users?', 'Delete all your recent profile visits?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete all',
                  style: 'destructive',
                  onPress: async () => {
                    if (!supabase) return;
                    const { error } = await supabase
                      .from('recent_profiles')
                      .delete()
                      .eq('user_id', myId);
                    if (error) {
                      Alert.alert('Could not delete', error.message);
                    } else {
                      setRecent([]);
                    }
                  },
                },
              ]);
            }}
          >
            <Ionicons name="trash" size={24} color={theme.danger} />
            <Text style={styles.toolText}>Delete</Text>
          </Pressable>
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color={theme.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={searchPeople}
            placeholder="Search people or usernames..."
            placeholderTextColor={theme.muted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
          />
          <Pressable style={styles.searchButton} onPress={searchPeople}>
            {searching ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="search" size={19} color="#FFFFFF" />
            )}
          </Pressable>
        </View>

        {/* PINNED */}
        {pinnedPeople.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <View style={styles.headingIcon}>
                <Ionicons name="pin" size={19} color={theme.blue} />
              </View>
              <Text style={styles.sectionTitle}>Pinned profiles</Text>
            </View>

            {pinnedPeople.map((person) => (
              <ProfileCard key={person.user_id} person={person} />
            ))}
          </View>
        )}

        {/* RECENT USERS */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.headingIcon}>
              <Ionicons name="time" size={19} color={theme.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Recent users</Text>
              <Text style={styles.sectionSubtitle}>
                Profiles you have recently visited
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (recent.length === 0) return;
                Alert.alert('Delete recent users?', 'Clear your recent profile history?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      if (!supabase) return;
                      const { error } = await supabase
                        .from('recent_profiles')
                        .delete()
                        .eq('user_id', myId);
                      if (error) Alert.alert('Error', error.message);
                      else setRecent([]);
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>

          {recent.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={35} color={theme.blue} />
              <Text style={styles.emptyTitle}>No recent users yet</Text>
              <Text style={styles.emptyText}>
                Open a profile from Discover and it will appear here.
              </Text>
            </View>
          ) : (
            recent.map((person) => (
              <ProfileCard
                key={person.user_id}
                person={person}
                isRecent
              />
            ))
          )}
        </View>

        {/* ALL PEOPLE */}
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.headingIcon}>
              <Ionicons name="people" size={19} color={theme.blue} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>People on BRITUME</Text>
              <Text style={styles.sectionSubtitle}>
                Discover public member profiles
              </Text>
            </View>
          </View>

          {filteredPeople.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={37} color={theme.blue} />
              <Text style={styles.emptyTitle}>No profiles found</Text>
              <Text style={styles.emptyText}>
                Try another name or username. Public profiles will appear here.
              </Text>
            </View>
          ) : (
            filteredPeople.map((person) => (
              <ProfileCard key={person.user_id} person={person} />
            ))
          )}
        </View>

        <Text style={styles.footer}>
          BRITUME • Vortex of Possibilities
        </Text>
      </ScrollView>

      {/* PUBLIC PROFILE VIEW */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalHeading}>Member profile</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => setSelected(null)}
              >
                <Ionicons name="close" size={23} color={theme.text} />
              </Pressable>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileCenter}>
                  <Avatar person={selected} size={105} />
                  <Text style={styles.profileName}>
                    {nameOf(selected)}
                  </Text>
                  <Text style={styles.profileUsername}>
                    {selected.username ? `@${selected.username}` : 'BRITUME member'}
                  </Text>
                  <Text style={styles.profileBio}>
                    {selected.bio || 'This member has not added a bio yet.'}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    disabled={working}
                    style={styles.modalPrimary}
                    onPress={() => toggleFollow(selected)}
                  >
                    <Ionicons
                      name={following.includes(selected.user_id) ? 'checkmark-circle' : 'star'}
                      size={19}
                      color="#FFFFFF"
                    />
                    <Text style={styles.modalPrimaryText}>
                      {following.includes(selected.user_id) ? 'Subscribed' : 'Subscribe'}
                    </Text>
                  </Pressable>

                  <Pressable
                    disabled={working}
                    style={styles.modalSecondary}
                    onPress={() => togglePin(selected)}
                  >
                    <Ionicons
                      name={pinned.includes(selected.user_id) ? 'pin' : 'pin-outline'}
                      size={19}
                      color={theme.blue}
                    />
                    <Text style={styles.modalSecondaryText}>
                      {pinned.includes(selected.user_id) ? 'Unpin' : 'Pin'}
                    </Text>
                  </Pressable>
                </View>

                {friends.includes(selected.user_id) ? (
                  <Pressable
                    style={styles.modalSecondary}
                    onPress={() => removeFriend(selected)}
                  >
                    <Ionicons name="person-remove-outline" size={19} color={theme.danger} />
                    <Text style={[styles.modalSecondaryText, { color: theme.danger }]}>
                      Remove friend
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    disabled={working}
                    style={styles.modalPrimary}
                    onPress={() => sendFriendRequest(selected)}
                  >
                    <Ionicons name="person-add" size={19} color="#FFFFFF" />
                    <Text style={styles.modalPrimaryText}>Add friend</Text>
                  </Pressable>
                )}

                <Text style={styles.modalNote}>
                  Profile information is shown according to the member's public profile settings.
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingHorizontal: 17,
    paddingTop: 16,
    paddingBottom: 45,
  },
  loading: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.muted,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: theme.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  brandName: {
    color: theme.text,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  tagline: {
    color: theme.muted,
    fontSize: 9,
    marginTop: 2,
  },
  headerButton: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  title: {
    color: theme.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 21,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 20,
  },
  tool: {
    flex: 1,
    backgroundColor: theme.panel,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  toolText: {
    color: theme.text,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 7,
  },
  searchBox: {
    minHeight: 55,
    borderRadius: 19,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 10,
    ...theme.clayRaised,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    fontSize: 13,
    paddingVertical: 12,
  },
  searchButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: theme.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 27,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  headingIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
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
  clearText: {
    color: theme.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  personCard: {
    backgroundColor: theme.panel,
    borderRadius: 23,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    ...theme.clayShadow,
  },
  personMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...theme.clayRaised,
  },
  personInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 7,
  },
  personName: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
  },
  username: {
    color: theme.blue,
    fontSize: 11,
    marginTop: 4,
  },
  bio: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 5,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: 13,
    paddingTop: 11,
    gap: 5,
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
  },
  smallActionText: {
    color: theme.blue,
    fontSize: 10,
    fontWeight: '800',
  },
  iconAction: {
    width: 32,
    height: 32,
    borderRadius: 11,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: theme.panel,
    borderRadius: 23,
    padding: 25,
    alignItems: 'center',
    ...theme.clayShadow,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 13,
  },
  emptyText: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },
  footer: {
    color: theme.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 30,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(25,51,77,0.42)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 21,
    paddingBottom: 35,
    maxHeight: '85%',
  },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  modalHeading: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
  },
  closeButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  profileCenter: {
    alignItems: 'center',
    paddingVertical: 13,
  },
  profileName: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 15,
  },
  profileUsername: {
    color: theme.blue,
    fontSize: 13,
    marginTop: 5,
  },
  profileBio: {
    color: theme.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 13,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    marginBottom: 10,
  },
  modalPrimary: {
    minHeight: 49,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.blue,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginTop: 9,
    ...theme.clayRaised,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  modalSecondary: {
    minHeight: 49,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.panel,
    borderRadius: 16,
    paddingHorizontal: 12,
    marginTop: 9,
    ...theme.clayRaised,
  },
  modalSecondaryText: {
    color: theme.blue,
    fontWeight: '900',
    fontSize: 12,
  },
  modalNote: {
    color: theme.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 18,
  },
});
