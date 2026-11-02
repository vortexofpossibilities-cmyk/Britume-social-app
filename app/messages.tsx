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
import { router } from 'expo-router';

import { useAppTheme } from '../src/contexts/ThemeContext';
import { supabase } from '../src/lib/supabase';

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

type FriendRequest = {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
};

export default function MessagesScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [myId, setMyId] = useState('');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessagesData = useCallback(async () => {
    if (!supabase) {
      Alert.alert(
        'Connection unavailable',
        'Please check your Supabase configuration.'
      );
      setLoading(false);
      setRefreshing(false);
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

      const userId = authData.user.id;
      setMyId(userId);

      const { data: requests, error } = await supabase
        .from('friend_requests')
        .select('id,sender_id,recipient_id,status')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

      if (error) throw error;

      const allRequests = (requests || []) as FriendRequest[];

      const accepted = allRequests.filter(
        request => request.status === 'accepted'
      );

      const incomingRequests = allRequests.filter(
        request =>
          request.recipient_id === userId &&
          request.status === 'pending'
      );

      const outgoingRequests = allRequests.filter(
        request =>
          request.sender_id === userId &&
          request.status === 'pending'
      );

      setIncoming(incomingRequests);
      setOutgoing(outgoingRequests);

      const friendIds = accepted.map(request =>
        request.sender_id === userId
          ? request.recipient_id
          : request.sender_id
      );

      const profileIds = [
        ...new Set([
          ...friendIds,
          ...incomingRequests.map(request => request.sender_id),
        ]),
      ];

      if (profileIds.length === 0) {
        setFriends([]);
      } else {
        const { data: friendProfiles, error: profileError } =
          await supabase
            .from('profiles')
            .select('user_id,username,display_name,avatar_url')
            .in('user_id', profileIds);

        if (profileError) throw profileError;

        const people = (friendProfiles || []) as Profile[];

        setFriends(
          people.filter(person =>
            friendIds.includes(person.user_id)
          )
        );

        setProfiles(people);
      }
    } catch (error: any) {
      Alert.alert(
        'Could not load messages',
        error?.message || 'Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadMessagesData();
  }, [loadMessagesData]);

  const searchPeople = async () => {
    const term = search.trim();

    if (!term) {
      setProfiles([]);
      return;
    }

    if (!supabase) return;

    setSearching(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id,username,display_name,avatar_url')
        .or(
          `display_name.ilike.%${term}%,username.ilike.%${term}%`
        )
        .neq('user_id', myId)
        .limit(20);

      if (error) throw error;

      setProfiles((data || []) as Profile[]);
    } catch (error: any) {
      Alert.alert(
        'Search failed',
        error?.message || 'Please try again.'
      );
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (person: Profile) => {
    if (!supabase || !myId) return;

    const existingFriend = friends.some(
      friend => friend.user_id === person.user_id
    );

    if (existingFriend) {
      Alert.alert(
        'Already friends',
        'This person is already your friend.'
      );
      return;
    }

    const alreadySent = outgoing.some(
      request => request.recipient_id === person.user_id
    );

    if (alreadySent) {
      Alert.alert(
        'Request sent',
        'You have already sent this friend request.'
      );
      return;
    }

    const alreadyReceived = incoming.some(
      request => request.sender_id === person.user_id
    );

    if (alreadyReceived) {
      Alert.alert(
        'Friend request received',
        'This person has already sent you a request. Accept it in Friend requests.'
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: myId,
          recipient_id: person.user_id,
          status: 'pending',
        });

      if (error) throw error;

      Alert.alert(
        'Request sent!',
        `Your friend request was sent to ${person.display_name || person.username || 'this person'}.`
      );

      await loadMessagesData();
    } catch (error: any) {
      Alert.alert(
        'Could not send request',
        error?.message || 'Please try again.'
      );
    }
  };

  const respondToRequest = async (
    request: FriendRequest,
    status: 'accepted' | 'rejected'
  ) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id)
        .eq('recipient_id', myId)
        .eq('status', 'pending');

      if (error) throw error;

      Alert.alert(
        status === 'accepted' ? 'Friend added!' : 'Request declined',
        status === 'accepted'
          ? 'You are now connected on BRITUME.'
          : 'The friend request was declined.'
      );

      await loadMessagesData();
    } catch (error: any) {
      Alert.alert(
        'Could not update request',
        error?.message || 'Please try again.'
      );
    }
  };

  const displayName = (person: Profile) =>
    person.display_name || person.username || 'BRITUME member';

  const Avatar = ({
    person,
    size = 58,
  }: {
    person: Profile;
    size?: number;
  }) => (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {person.avatar_url ? (
        <Image
          source={{ uri: person.avatar_url }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <Ionicons
          name="person"
          size={size * 0.48}
          color={theme.cyan}
        />
      )}
    </View>
  );

  const FriendCard = ({ person }: { person: Profile }) => (
    <Pressable
      style={({ pressed }) => [
        styles.friendCard,
        pressed && styles.pressed,
      ]}
      onPress={() => {
        Alert.alert(
          displayName(person),
          'You are connected! The individual chat conversation screen still needs to be connected to the messaging database.'
        );
      }}
    >
      <Avatar person={person} size={57} />

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>
          {displayName(person)}
        </Text>
        <Text style={styles.friendUsername}>
          {person.username ? `@${person.username}` : 'BRITUME friend'}
        </Text>
        <Text style={styles.tapHint}>
          Tap to open conversation
        </Text>
      </View>

      <View style={styles.chatIcon}>
        <Ionicons
          name="chatbubble-ellipses"
          size={23}
          color={theme.cyan}
        />
      </View>
    </Pressable>
  );

  const PersonResult = ({ person }: { person: Profile }) => {
    const sent = outgoing.some(
      request => request.recipient_id === person.user_id
    );

    const isFriend = friends.some(
      friend => friend.user_id === person.user_id
    );

    return (
      <View style={styles.personCard}>
        <Avatar person={person} size={51} />

        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>
            {displayName(person)}
          </Text>
          <Text style={styles.friendUsername}>
            {person.username ? `@${person.username}` : 'BRITUME member'}
          </Text>
        </View>

        <Pressable
          disabled={sent || isFriend}
          style={[
            styles.addButton,
            (sent || isFriend) && styles.disabledButton,
          ]}
          onPress={() => void sendFriendRequest(person)}
        >
          <Ionicons
            name={
              isFriend
                ? 'checkmark'
                : sent
                  ? 'time-outline'
                  : 'person-add'
            }
            size={17}
            color={sent || isFriend ? theme.muted : '#FFFFFF'}
          />
          <Text
            style={[
              styles.addButtonText,
              (sent || isFriend) && styles.disabledButtonText,
            ]}
          >
            {isFriend ? 'Friends' : sent ? 'Sent' : 'Add'}
          </Text>
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.cyan} />
        <Text style={styles.loadingText}>
          Loading your BRITUME friends...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadMessagesData();
            }}
            tintColor={theme.cyan}
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.headerIcon}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={23}
              color={theme.text}
            />
          </Pressable>

          <View style={styles.brand}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>B</Text>
            </View>
            <View>
              <Text style={styles.brandName}>BRITUME</Text>
              <Text style={styles.tagline}>
                Vortex of Possibilities
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.headerIcon}
            onPress={() => {
              setSearch('');
              setProfiles([]);
              Alert.alert(
                'Find friends',
                'Search for BRITUME members below.'
              );
            }}
          >
            <Ionicons
              name="person-add"
              size={22}
              color={theme.text}
            />
          </Pressable>
        </View>

        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>
          Connect, communicate and stay close.
        </Text>

        <View style={styles.shortcuts}>
          <Pressable
            style={styles.shortcut}
            onPress={() =>
              Alert.alert(
                'Chats',
                'Your conversations will appear in this section when messaging is connected.'
              )
            }
          >
            <View style={styles.shortcutIcon}>
              <Ionicons
                name="chatbubbles"
                size={25}
                color={theme.cyan}
              />
            </View>
            <Text style={styles.shortcutText}>Chats</Text>
          </Pressable>

          <Pressable
            style={styles.shortcut}
            onPress={() =>
              Alert.alert('Calls', 'Audio calling is not connected yet.')
            }
          >
            <View style={styles.shortcutIcon}>
              <Ionicons
                name="call"
                size={25}
                color={theme.success}
              />
            </View>
            <Text style={styles.shortcutText}>Calls</Text>
          </Pressable>

          <Pressable
            style={styles.shortcut}
            onPress={() =>
              Alert.alert('Voice', 'Voice messages are not connected yet.')
            }
          >
            <View style={styles.shortcutIcon}>
              <Ionicons
                name="mic"
                size={25}
                color={theme.purple}
              />
            </View>
            <Text style={styles.shortcutText}>Voice</Text>
          </Pressable>

          <Pressable
            style={styles.shortcut}
            onPress={() =>
              Alert.alert('Groups', 'Group conversations are not connected yet.')
            }
          >
            <View style={styles.shortcutIcon}>
              <Ionicons
                name="people"
                size={25}
                color={theme.gold}
              />
            </View>
            <Text style={styles.shortcutText}>Groups</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Find friends</Text>
          <Ionicons
            name="people"
            size={21}
            color={theme.cyan}
          />
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={21}
            color={theme.muted}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or username..."
            placeholderTextColor={theme.muted}
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => void searchPeople()}
            autoCapitalize="none"
          />

          <Pressable
            style={styles.searchButton}
            onPress={() => void searchPeople()}
          >
            {searching ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons
                name="search"
                size={19}
                color="#FFFFFF"
              />
            )}
          </Pressable>
        </View>

        {profiles.length > 0 && (
          <View style={styles.resultsArea}>
            <Text style={styles.smallHeading}>Search results</Text>
            {profiles.map(person => (
              <PersonResult
                key={person.user_id}
                person={person}
              />
            ))}
          </View>
        )}

        {search.trim().length > 0 &&
          profiles.length === 0 &&
          !searching && (
            <Text style={styles.noResults}>
              No results yet. Press the search icon to find people.
            </Text>
          )}

        {incoming.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Friend requests
              </Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {incoming.length}
                </Text>
              </View>
            </View>

            {incoming.map(request => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>
                    New friend request
                  </Text>
                  <Text style={styles.friendUsername}>
                    A BRITUME member wants to connect with you.
                  </Text>
                </View>

                <Pressable
                  style={styles.acceptButton}
                  onPress={() =>
                    void respondToRequest(request, 'accepted')
                  }
                >
                  <Ionicons
                    name="checkmark"
                    color="#FFFFFF"
                    size={19}
                  />
                </Pressable>

                <Pressable
                  style={styles.rejectButton}
                  onPress={() =>
                    void respondToRequest(request, 'rejected')
                  }
                >
                  <Ionicons
                    name="close"
                    color={theme.danger}
                    size={19}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Your friends
              </Text>
              <Text style={styles.sectionSubtitle}>
                People you can connect with
              </Text>
            </View>

            <Pressable
              style={styles.addFriendButton}
              onPress={() => {
                setSearch('');
                setProfiles([]);
                Alert.alert(
                  'Add friends',
                  'Search for a BRITUME member above.'
                );
              }}
            >
              <Ionicons
                name="person-add"
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.addFriendText}>Add</Text>
            </Pressable>
          </View>

          {friends.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="people-outline"
                  size={38}
                  color={theme.cyan}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Your friend list is waiting
              </Text>

              <Text style={styles.emptyText}>
                Search for people on BRITUME and send them a friend request.
                Once they accept, they will appear here.
              </Text>
            </View>
          ) : (
            friends.map(person => (
              <FriendCard
                key={person.user_id}
                person={person}
              />
            ))
          )}
        </View>

        <Text style={styles.footer}>
          BRITUME • Vortex of Possibilities
        </Text>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    content: {
      paddingHorizontal: 17,
      paddingTop: 16,
      paddingBottom: 45,
    },

    loadingScreen: {
      flex: 1,
      backgroundColor: theme.bg,
      justifyContent: 'center',
      alignItems: 'center',
    },

    loadingText: {
      color: theme.muted,
      marginTop: 13,
      fontSize: 13,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 27,
    },

    headerIcon: {
      width: 45,
      height: 45,
      borderRadius: 16,
      backgroundColor: theme.panel,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.clayRaised,
    },

    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    logo: {
      width: 43,
      height: 43,
      borderRadius: 15,
      backgroundColor: theme.cyan,
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.clayRaised,
    },

    logoText: {
      color: '#FFFFFF',
      fontSize: 25,
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

    shortcuts: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 29,
    },

    shortcut: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 19,
      paddingVertical: 13,
      ...theme.clayRaised,
    },

    shortcutIcon: {
      width: 49,
      height: 49,
      borderRadius: 17,
      backgroundColor: theme.clayBlue,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.clayRaised,
    },

    shortcutText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: '800',
      marginTop: 8,
    },

    section: {
      marginTop: 25,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 13,
    },

    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '900',
    },

    sectionSubtitle: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 4,
    },

    searchBox: {
      minHeight: 55,
      borderRadius: 19,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
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
      width: 38,
      height: 38,
      borderRadius: 13,
      backgroundColor: theme.cyan,
      justifyContent: 'center',
      alignItems: 'center',
    },

    resultsArea: {
      marginTop: 17,
    },

    smallHeading: {
      color: theme.text,
      fontWeight: '900',
      marginBottom: 10,
    },

    personCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 21,
      padding: 12,
      marginBottom: 11,
      borderWidth: 1,
      borderColor: theme.border,
      ...theme.clayRaised,
    },

    friendCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 23,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.border,
      ...theme.clayShadow,
    },

    avatar: {
      backgroundColor: theme.clayBlue,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.border,
      ...theme.clayRaised,
    },

    friendInfo: {
      flex: 1,
      marginLeft: 13,
    },

    friendName: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '900',
    },

    friendUsername: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 4,
    },

    tapHint: {
      color: theme.cyan,
      fontSize: 10,
      fontWeight: '700',
      marginTop: 5,
    },

    chatIcon: {
      width: 43,
      height: 43,
      borderRadius: 15,
      backgroundColor: theme.clayBlue,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.clayRaised,
    },

    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.cyan,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 13,
    },

    addButtonText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 11,
    },

    disabledButton: {
      backgroundColor: theme.panel2,
    },

    disabledButtonText: {
      color: theme.muted,
    },

    addFriendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.cyan,
      paddingHorizontal: 13,
      paddingVertical: 10,
      borderRadius: 14,
      ...theme.clayRaised,
    },

    addFriendText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 12,
    },

    emptyCard: {
      backgroundColor: theme.panel,
      borderRadius: 25,
      padding: 23,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      ...theme.clayShadow,
    },

    emptyIcon: {
      width: 83,
      height: 83,
      borderRadius: 28,
      backgroundColor: theme.clayBlue,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.clayRaised,
    },

    emptyTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '900',
      marginTop: 17,
    },

    emptyText: {
      color: theme.muted,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 19,
      marginTop: 8,
    },

    requestCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 19,
      padding: 13,
      marginBottom: 11,
      borderWidth: 1,
      borderColor: theme.border,
      ...theme.clayRaised,
    },

    acceptButton: {
      width: 38,
      height: 38,
      borderRadius: 13,
      backgroundColor: theme.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 7,
    },

    rejectButton: {
      width: 38,
      height: 38,
      borderRadius: 13,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 7,
    },

    countBadge: {
      backgroundColor: theme.cyan,
      minWidth: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },

    countText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },

    noResults: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 12,
    },

    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },

    footer: {
      color: theme.muted,
      textAlign: 'center',
      fontSize: 10,
      marginTop: 30,
    },
  });
            }
