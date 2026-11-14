
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAppTheme } from '../../src/contexts/ThemeContext';

import { withThemeBackground } from '../../src/components/ThemeScreen';

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

type ReportReason =
  | 'spam'
  | 'harassment'
  | 'impersonation'
  | 'inappropriate_content'
  | 'scam'
  | 'other';

const REPORT_REASONS: ReportReason[] = [
  'spam',
  'harassment',
  'impersonation',
  'inappropriate_content',
  'scam',
  'other',
];

// CROSS-PLATFORM CONFIRMATION
function showDestructiveConfirmation(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void
) {
  if (Platform.OS === 'web') {
    if (
      typeof window !== 'undefined' &&
      window.confirm(`${title}\n\n${message}`)
    ) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    {
      text: 'Cancel',
      style: 'cancel',
    },
    {
      text: confirmLabel,
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}

function DiscoverScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [myId, setMyId] = useState('');
  const [people, setPeople] = useState<Profile[]>([]);
  const [recent, setRecent] = useState<Profile[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [pinned, setPinned] = useState<string[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [menuPerson, setMenuPerson] = useState<Profile | null>(null);
  const [reportPerson, setReportPerson] = useState<Profile | null>(null);
  const [reportReason, setReportReason] =
    useState<ReportReason>('other');
  const [reportDetails, setReportDetails] = useState('');

  const [activeSection, setActiveSection] = useState<
    'people' | 'friends' | 'following' | 'requests' | 'blocked'
  >('people');

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState(false);

  const nameOf = (person: Profile) =>
    person.display_name?.trim() ||
    person.username ||
    'BRITUME member';

  const getError = (error: any) =>
    error?.message || 'Please try again.';

  // LOAD DISCOVER DATA
  const loadDiscover = useCallback(async () => {
    const db = supabase;

    if (!db) {
      setLoading(false);
      setRefreshing(false);
      Alert.alert(
        'Connection unavailable',
        'Check your Supabase configuration.'
      );
      return;
    }

    try {
      const { data: authData, error: authError } =
        await db.auth.getUser();

      if (authError) throw authError;

      if (!authData.user) {
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
        blockedResult,
      ] = await Promise.all([
        db.from('profiles')
          .select(
            'user_id,username,display_name,bio,avatar_url,is_public'
          )
          .eq('is_public', true)
          .neq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(100),

        db.from('friend_requests')
          .select('id,sender_id,recipient_id,status')
          .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`),

        db.from('user_follows')
          .select('following_id')
          .eq('follower_id', uid),

        db.from('pinned_profiles')
          .select('profile_id')
          .eq('user_id', uid),

        db.from('recent_profiles')
          .select('profile_id')
          .eq('user_id', uid)
          .order('viewed_at', { ascending: false })
          .limit(30),

        db.from('blocked_users')
          .select('blocked_user_id')
          .eq('user_id', uid),
      ]);

      if (peopleResult.error) throw peopleResult.error;
      if (requestResult.error) throw requestResult.error;
      if (followResult.error) throw followResult.error;
      if (pinResult.error) throw pinResult.error;
      if (recentResult.error) throw recentResult.error;
      if (blockedResult.error) throw blockedResult.error;

      const allPeople = (peopleResult.data || []) as Profile[];
      const allRequests = (requestResult.data || []) as FriendRequest[];

      const blockedIds = (blockedResult.data || []).map(
        (r: any) => r.blocked_user_id
      );

      const visiblePeople = allPeople.filter(
        (person) => !blockedIds.includes(person.user_id)
      );

      setPeople(visiblePeople);
      setBlocked(blockedIds);
      setRequests(allRequests);

      setFriends(
        allRequests
          .filter((r) => r.status === 'accepted')
          .map((r) =>
            r.sender_id === uid ? r.recipient_id : r.sender_id
          )
      );

      setFollowing(
        (followResult.data || []).map((r: any) => r.following_id)
      );

      setPinned(
        (pinResult.data || []).map((r: any) => r.profile_id)
      );

      const recentIds = (recentResult.data || []).map(
        (r: any) => r.profile_id
      );

      setRecent(
        recentIds
          .map((id: string) =>
            visiblePeople.find((p) => p.user_id === id)
          )
          .filter(Boolean) as Profile[]
      );
    } catch (error: any) {
      Alert.alert('Discover could not load', getError(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDiscover();
  }, [loadDiscover]);

  const refresh = async () => {
    setRefreshing(true);
    await loadDiscover();
  };

  // SEARCH
  const searchPeople = async () => {
    const term = search.trim();
    const db = supabase;

    if (!term) {
      await loadDiscover();
      return;
    }

    if (!db || !myId) return;

    setSearching(true);

    try {
      const safeTerm = term.replace(/[%_,()]/g, ' ').trim();

      const { data, error } = await db
        .from('profiles')
        .select(
          'user_id,username,display_name,bio,avatar_url,is_public'
        )
        .eq('is_public', true)
        .neq('user_id', myId)
        .or(
          `display_name.ilike.%${safeTerm}%,username.ilike.%${safeTerm}%`
        )
        .limit(50);

      if (error) throw error;

      setPeople(
        ((data || []) as Profile[]).filter(
          (p) => !blocked.includes(p.user_id)
        )
      );

      setActiveSection('people');
    } catch (error: any) {
      Alert.alert('Search failed', getError(error));
    } finally {
      setSearching(false);
    }
  };

  // SAVE PROFILE VISIT IN BACKGROUND
  const rememberVisit = async (person: Profile) => {
    const db = supabase;
    if (!db || !myId) return;

    setRecent((old) => [
      person,
      ...old.filter((p) => p.user_id !== person.user_id),
    ]);

    try {
      const { error } = await db
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
    } catch (error: any) {
      console.warn('Recent profile save failed:', getError(error));
    }
  };

  const openProfile = (person: Profile) => {
    setSelected(person);
    void rememberVisit(person);
  };

  // SEND FRIEND REQUEST
  const sendFriendRequest = async (person: Profile) => {
    const db = supabase;
    if (!db || !myId) return;

    if (friends.includes(person.user_id)) {
      Alert.alert('Already friends', 'You are already friends.');
      return;
    }

    const existing = requests.find(
      (r) =>
        r.status === 'pending' &&
        (
          (r.sender_id === myId &&
            r.recipient_id === person.user_id) ||
          (r.recipient_id === myId &&
            r.sender_id === person.user_id)
        )
    );

    if (existing) {
      Alert.alert(
        'Request already exists',
        existing.sender_id === myId
          ? 'You have already sent a request.'
          : 'This person has already sent you a request.'
      );
      return;
    }

    const temporaryId = `temporary-${person.user_id}`;
    const optimisticRequest: FriendRequest = {
      id: temporaryId,
      sender_id: myId,
      recipient_id: person.user_id,
      status: 'pending',
    };

    setRequests((old) => [...old, optimisticRequest]);

    try {
      const { data, error } = await db
        .from('friend_requests')
        .insert({
          sender_id: myId,
          recipient_id: person.user_id,
          status: 'pending',
        })
        .select('id,sender_id,recipient_id,status')
        .single();

      if (error) throw error;

      setRequests((old) =>
        old.map((r) =>
          r.id === temporaryId ? data as FriendRequest : r
        )
      );
    } catch (error: any) {
      setRequests((old) =>
        old.filter((r) => r.id !== temporaryId)
      );
      Alert.alert('Could not send request', getError(error));
    }
  };

  // ACCEPT OR REJECT REQUEST
  const respondToRequest = async (
    request: FriendRequest,
    status: 'accepted' | 'rejected'
  ) => {
    const db = supabase;
    if (!db || !myId) return;

    const previousRequests = requests;
    const previousFriends = friends;

    setRequests((old) =>
      old.map((r) =>
        r.id === request.id ? { ...r, status } : r
      )
    );

    if (status === 'accepted') {
      const friendId = request.sender_id;
      setFriends((old) =>
        old.includes(friendId) ? old : [...old, friendId]
      );
    } else {
      setFriends((old) =>
        old.filter((id) => id !== request.sender_id)
      );
    }

    try {
      const { data, error } = await db
        .from('friend_requests')
        .update({ status })
        .eq('id', request.id)
        .eq('recipient_id', myId)
        .eq('status', 'pending')
        .select('id');

      if (error) throw error;
      if (!data?.length) {
        throw new Error(
          'This request has already changed. Refresh Discover.'
        );
      }
    } catch (error: any) {
      setRequests(previousRequests);
      setFriends(previousFriends);
      Alert.alert('Request update failed', getError(error));
    }
  };

  // CANCEL SENT REQUEST
  const cancelRequest = async (request: FriendRequest) => {
    const db = supabase;
    if (!db || !myId) return;

    showDestructiveConfirmation(
      'Cancel friend request?',
      'This will cancel your pending request.',
      'Cancel request',
      async () => {
        const previousRequests = requests;

        setRequests((old) =>
          old.filter((r) => r.id !== request.id)
        );

        try {
          const { error } = await db
            .from('friend_requests')
            .delete()
            .eq('id', request.id)
            .eq('sender_id', myId)
            .eq('status', 'pending');

          if (error) throw error;
        } catch (error: any) {
          setRequests(previousRequests);
          Alert.alert('Could not cancel', getError(error));
        }
      }
    );
  };

  // FOLLOW / UNFOLLOW
  const toggleFollow = async (person: Profile) => {
    const db = supabase;
    if (!db || !myId) return;

    const isFollowing = following.includes(person.user_id);
    const previousFollowing = following;

    setFollowing((old) =>
      isFollowing
        ? old.filter((id) => id !== person.user_id)
        : [...old, person.user_id]
    );

    try {
      if (isFollowing) {
        const { error } = await db
          .from('user_follows')
          .delete()
          .eq('follower_id', myId)
          .eq('following_id', person.user_id);

        if (error) throw error;
      } else {
        const { error } = await db.from('user_follows').insert({
          follower_id: myId,
          following_id: person.user_id,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      setFollowing(previousFollowing);
      Alert.alert('Follow action failed', getError(error));
    }
  };

  // PIN / UNPIN
  const togglePin = async (person: Profile) => {
    const db = supabase;
    if (!db || !myId) return;

    const isPinned = pinned.includes(person.user_id);
    const previousPinned = pinned;

    setPinned((old) =>
      isPinned
        ? old.filter((id) => id !== person.user_id)
        : [...old, person.user_id]
    );

    try {
      if (isPinned) {
        const { error } = await db
          .from('pinned_profiles')
          .delete()
          .eq('user_id', myId)
          .eq('profile_id', person.user_id);

        if (error) throw error;
      } else {
        const { error } = await db.from('pinned_profiles').insert({
          user_id: myId,
          profile_id: person.user_id,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      setPinned(previousPinned);
      Alert.alert('Pin action failed', getError(error));
    }
  };

  // REMOVE FRIEND
  const removeFriend = (person: Profile) => {
    const db = supabase;
    if (!db || !myId) return;

    const request = requests.find(
      (r) =>
        r.status === 'accepted' &&
        (
          (r.sender_id === myId &&
            r.recipient_id === person.user_id) ||
          (r.recipient_id === myId &&
            r.sender_id === person.user_id)
        )
    );

    if (!request) {
      Alert.alert(
        'Friend not found',
        'Refresh Discover and try again.'
      );
      return;
    }

    showDestructiveConfirmation(
      'Remove friend?',
      `Remove ${nameOf(person)} from your friends?`,
      'Remove',
      async () => {
        const previousFriends = friends;
        const previousRequests = requests;

        setFriends((old) =>
          old.filter((id) => id !== person.user_id)
        );

        setRequests((old) =>
          old.filter((r) => r.id !== request.id)
        );

        try {
          const { error } = await db
            .from('friend_requests')
            .delete()
            .eq('id', request.id);

          if (error) throw error;
        } catch (error: any) {
          setFriends(previousFriends);
          setRequests(previousRequests);
          Alert.alert(
            'Could not remove friend',
            getError(error)
          );
        }
      }
    );
  };

  // BLOCK MEMBER
  const blockPerson = (person: Profile) => {
    const db = supabase;
    if (!db || !myId) return;

    showDestructiveConfirmation(
      'Block member?',
      `${nameOf(person)} will be added to your blocked list.`,
      'Block',
      async () => {
        const previousBlocked = blocked;
        const previousPeople = people;
        const previousRecent = recent;
        const previousFriends = friends;
        const previousFollowing = following;
        const previousPinned = pinned;
        const previousRequests = requests;
        const previousSelected = selected;
        const previousMenu = menuPerson;

        setBlocked((old) =>
          old.includes(person.user_id)
            ? old
            : [...old, person.user_id]
        );

        setPeople((old) =>
          old.filter((p) => p.user_id !== person.user_id)
        );

        setRecent((old) =>
          old.filter((p) => p.user_id !== person.user_id)
        );

        setFriends((old) =>
          old.filter((id) => id !== person.user_id)
        );

        setFollowing((old) =>
          old.filter((id) => id !== person.user_id)
        );

        setPinned((old) =>
          old.filter((id) => id !== person.user_id)
        );

        setRequests((old) =>
          old.filter(
            (r) =>
              r.sender_id !== person.user_id &&
              r.recipient_id !== person.user_id
          )
        );

        setSelected(null);
        setMenuPerson(null);

        try {
          const { error } = await db
            .from('blocked_users')
            .insert({
              user_id: myId,
              blocked_user_id: person.user_id,
            });

          if (error) throw error;
        } catch (error: any) {
          setBlocked(previousBlocked);
          setPeople(previousPeople);
          setRecent(previousRecent);
          setFriends(previousFriends);
          setFollowing(previousFollowing);
          setPinned(previousPinned);
          setRequests(previousRequests);
          setSelected(previousSelected);
          setMenuPerson(previousMenu);

          Alert.alert(
            'Could not block member',
            getError(error)
          );
        }
      }
    );
  };

  // UNBLOCK MEMBER
  const unblockPerson = async (personId: string) => {
    const db = supabase;
    if (!db || !myId) return;

    const previousBlocked = blocked;

    setBlocked((old) =>
      old.filter((id) => id !== personId)
    );

    try {
      const { error } = await db
        .from('blocked_users')
        .delete()
        .eq('user_id', myId)
        .eq('blocked_user_id', personId);

      if (error) throw error;

      const { data, error: profileError } = await db
        .from('profiles')
        .select(
          'user_id,username,display_name,bio,avatar_url,is_public'
        )
        .eq('user_id', personId)
        .eq('is_public', true)
        .maybeSingle();

      if (profileError) throw profileError;

      if (data) {
        setPeople((old) =>
          old.some((p) => p.user_id === personId)
            ? old
            : [data as Profile, ...old]
        );
      }
    } catch (error: any) {
      setBlocked(previousBlocked);
      Alert.alert('Could not unblock member', getError(error));
    }
  };

  // REPORT MEMBER
  const submitReport = async () => {
    const db = supabase;
    if (!db || !myId || !reportPerson) return;

    try {
      setWorking(true);

      const { error } = await db.from('profile_reports').insert({
        reporter_id: myId,
        reported_user_id: reportPerson.user_id,
        reason: reportReason,
        details: reportDetails.trim(),
        status: 'pending',
      });

      if (error) throw error;

      setReportPerson(null);
      setReportDetails('');
      setReportReason('other');
      setMenuPerson(null);

      Alert.alert(
        'Report submitted',
        'Thank you. Your report has been submitted for review.'
      );
    } catch (error: any) {
      Alert.alert('Report failed', getError(error));
    } finally {
      setWorking(false);
    }
  };

  // DELETE RECENT PROFILE
  const deleteRecent = async (person: Profile) => {
    const db = supabase;
    if (!db || !myId) return;

    const previousRecent = recent;

    setRecent((old) =>
      old.filter((p) => p.user_id !== person.user_id)
    );

    try {
      const { error } = await db
        .from('recent_profiles')
        .delete()
        .eq('user_id', myId)
        .eq('profile_id', person.user_id);

      if (error) throw error;
    } catch (error: any) {
      setRecent(previousRecent);
      Alert.alert('Could not delete recent user', getError(error));
    }
  };

  // CLEAR RECENT HISTORY
  const clearRecent = () => {
    if (!recent.length) {
      Alert.alert(
        'Recent users',
        'There are no recent profiles to delete.'
      );
      return;
    }

    showDestructiveConfirmation(
      'Clear recent users?',
      'Delete all your recent profile visits?',
      'Delete all',
      async () => {
        const db = supabase;
        if (!db) return;

        const previousRecent = recent;
        setRecent([]);

        try {
          const { error } = await db
            .from('recent_profiles')
            .delete()
            .eq('user_id', myId);

          if (error) throw error;
        } catch (error: any) {
          setRecent(previousRecent);
          Alert.alert('Could not delete', getError(error));
        }
      }
    );
  };

  const shareProfile = async (person: Profile) => {
    try {
      await Share.share({
        message: `Find ${nameOf(person)} on BRITUME${person.username ? ` (@${person.username})` : ''}.`,
      });
    } catch (error: any) {
      Alert.alert('Sharing failed', getError(error));
    }
  };

  const openReport = (person: Profile) => {
    setMenuPerson(null);
    setReportPerson(person);
    setReportReason('other');
    setReportDetails('');
  };

  // AVATAR
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
          size={size * 0.46}
          color={theme.blue}
        />
      )}
    </View>
  );

  // SECTION BUTTON
  const SectionButton = ({
    label,
    icon,
    value,
    selectedValue,
    onPress,
  }: {
    label: string;
    icon: any;
    value: string;
    selectedValue: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.sectionButton,
        selectedValue === value && styles.sectionButtonActive,
      ]}
    >
      <Ionicons
        name={icon}
        size={17}
        color={selectedValue === value ? '#FFFFFF' : theme.blue}
      />
      <Text
        style={[
          styles.sectionButtonText,
          selectedValue === value && styles.sectionButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  // PROFILE CARD
  const ProfileCard = ({
    person,
    isRecent = false,
  }: {
    person: Profile;
    isRecent?: boolean;
  }) => {
    const isFollowing = following.includes(person.user_id);
    const isPinned = pinned.includes(person.user_id);
    const isFriend = friends.includes(person.user_id);

    const outgoing = requests.some(
      (r) =>
        r.sender_id === myId &&
        r.recipient_id === person.user_id &&
        r.status === 'pending'
    );

    const incoming = requests.some(
      (r) =>
        r.recipient_id === myId &&
        r.sender_id === person.user_id &&
        r.status === 'pending'
    );

    return (
      <View style={styles.personCard}>
        <View style={styles.personMain}>
          <Pressable
            style={styles.personIdentity}
            onPress={() => openProfile(person)}
          >
            <Avatar person={person} size={57} />

            <View style={styles.personInfo}>
              <Text style={styles.personName} numberOfLines={1}>
                {nameOf(person)}
              </Text>
              <Text style={styles.username} numberOfLines={1}>
                {person.username
                  ? `@${person.username}`
                  : 'BRITUME member'}
              </Text>
              <Text style={styles.bio} numberOfLines={2}>
                {person.bio || 'Discover this BRITUME member'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.menuButton}
            onPress={() => setMenuPerson(person)}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={21}
              color={theme.text}
            />
          </Pressable>
        </View>

        <View style={styles.cardActions}>
          {isFriend ? (
            <Pressable
              style={styles.smallAction}
              onPress={() => removeFriend(person)}
            >
              <Ionicons
                name="person-remove-outline"
                size={16}
                color={theme.danger}
              />
              <Text style={[styles.smallActionText, { color: theme.danger }]}>
                Remove
              </Text>
            </Pressable>
          ) : incoming ? (
            <Pressable
              style={styles.smallAction}
              onPress={() => setActiveSection('requests')}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={theme.success}
              />
              <Text style={[styles.smallActionText, { color: theme.success }]}>
                Respond
              </Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={outgoing}
              style={styles.smallAction}
              onPress={() => sendFriendRequest(person)}
            >
              <Ionicons
                name={outgoing ? 'time-outline' : 'person-add-outline'}
                size={16}
                color={theme.blue}
              />
              <Text style={styles.smallActionText}>
                {outgoing ? 'Requested' : 'Add'}
              </Text>
            </Pressable>
          )}

          <Pressable
            style={styles.smallAction}
            onPress={() => toggleFollow(person)}
          >
            <Ionicons
              name={isFollowing ? 'checkmark-circle' : 'star-outline'}
              size={16}
              color={theme.purple}
            />
            <Text style={[styles.smallActionText, { color: theme.purple }]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.iconAction}
            onPress={() => togglePin(person)}
          >
            <Ionicons
              name={isPinned ? 'pin' : 'pin-outline'}
              size={18}
              color={theme.blue}
            />
          </Pressable>

          {isRecent && (
            <Pressable
              style={styles.iconAction}
              onPress={() => deleteRecent(person)}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.danger}
              />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  // REQUEST CARD
  const RequestCard = ({
    request,
    incoming,
  }: {
    request: FriendRequest;
    incoming: boolean;
  }) => {
    const personId = incoming
      ? request.sender_id
      : request.recipient_id;

    const person = people.find((p) => p.user_id === personId);

    return (
      <View style={styles.personCard}>
        <View style={styles.personMain}>
          {person ? (
            <Pressable
              style={styles.personIdentity}
              onPress={() => openProfile(person)}
            >
              <Avatar person={person} size={53} />
              <View style={styles.personInfo}>
                <Text style={styles.personName}>
                  {nameOf(person)}
                </Text>
                <Text style={styles.username}>
                  {person.username
                    ? `@${person.username}`
                    : 'BRITUME member'}
                </Text>
                <Text style={styles.bio}>
                  {incoming
                    ? 'Sent you a friend request'
                    : 'Request awaiting response'}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.personInfo}>
              <Text style={styles.personName}>BRITUME member</Text>
              <Text style={styles.bio}>
                {incoming
                  ? 'Incoming friend request'
                  : 'Outgoing friend request'}
              </Text>
            </View>
          )}
        </View>

        {incoming ? (
          <View style={styles.requestActions}>
            <Pressable
              style={styles.acceptButton}
              onPress={() => respondToRequest(request, 'accepted')}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>

            <Pressable
              style={styles.rejectButton}
              onPress={() => respondToRequest(request, 'rejected')}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.rejectButton}
            onPress={() => cancelRequest(request)}
          >
            <Text style={styles.rejectText}>Cancel request</Text>
          </Pressable>
        )}
      </View>
    );
  };

  const pinnedPeople = people.filter((p) =>
    pinned.includes(p.user_id)
  );

  const sortedPeople = [
    ...pinnedPeople,
    ...people.filter((p) => !pinned.includes(p.user_id)),
  ];

  const filteredPeople = sortedPeople.filter((person) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return (
      (person.display_name || '').toLowerCase().includes(term) ||
      (person.username || '').toLowerCase().includes(term)
    );
  });

  const friendPeople = people.filter((p) =>
    friends.includes(p.user_id)
  );

  const followingPeople = people.filter((p) =>
    following.includes(p.user_id)
  );

  const incomingRequests = requests.filter(
    (r) => r.recipient_id === myId && r.status === 'pending'
  );

  const outgoingRequests = requests.filter(
    (r) => r.sender_id === myId && r.status === 'pending'
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.blue} />
        <Text style={styles.loadingText}>
          Discovering BRITUME members...
        </Text>
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
            onRefresh={refresh}
            tintColor={theme.blue}
          />
        }
      >
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

          <Pressable style={styles.headerButton} onPress={refresh}>
            <Ionicons name="refresh" size={22} color={theme.blue} />
          </Pressable>
        </View>

        <Text style={styles.title}>Discover</Text>
        <Text style={styles.subtitle}>
          Find people, creators and new connections.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={21}
            color={theme.muted}
          />

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

          {search.length > 0 && (
            <Pressable
              onPress={() => {
                setSearch('');
                void loadDiscover();
              }}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.muted}
              />
            </Pressable>
          )}

          <Pressable
            style={styles.searchButton}
            onPress={searchPeople}
          >
            {searching ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="search" size={19} color="#FFFFFF" />
            )}
          </Pressable>
        </View>

        <View style={styles.navigation}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navigationContent}
          >
            <SectionButton
              label="People"
              icon="people-outline"
              value="people"
              selectedValue={activeSection}
              onPress={() => setActiveSection('people')}
            />
            <SectionButton
              label="Friends"
              icon="people"
              value="friends"
              selectedValue={activeSection}
              onPress={() => setActiveSection('friends')}
            />
            <SectionButton
              label="Following"
              icon="star-outline"
              value="following"
              selectedValue={activeSection}
              onPress={() => setActiveSection('following')}
            />
            <SectionButton
              label={`Requests ${incomingRequests.length ? `(${incomingRequests.length})` : ''}`}
              icon="mail-outline"
              value="requests"
              selectedValue={activeSection}
              onPress={() => setActiveSection('requests')}
            />
            <SectionButton
              label="Blocked"
              icon="ban-outline"
              value="blocked"
              selectedValue={activeSection}
              onPress={() => setActiveSection('blocked')}
            />
          </ScrollView>
        </View>

        {activeSection === 'people' && (
          <>
            {pinnedPeople.length > 0 && !search.trim() && (
              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Ionicons name="pin" size={20} color={theme.blue} />
                  <Text style={styles.sectionTitle}>Pinned profiles</Text>
                </View>

                {pinnedPeople.map((person) => (
                  <ProfileCard key={person.user_id} person={person} />
                ))}
              </View>
            )}

            {!search.trim() && (
              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <Ionicons name="time" size={20} color={theme.blue} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>Recent users</Text>
                    <Text style={styles.sectionSubtitle}>
                      Profiles you have recently visited
                    </Text>
                  </View>

                  <Pressable onPress={clearRecent}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </Pressable>
                </View>

                {recent.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons
                      name="time-outline"
                      size={34}
                      color={theme.blue}
                    />
                    <Text style={styles.emptyTitle}>No recent users</Text>
                    <Text style={styles.emptyText}>
                      Profiles you visit will appear here.
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
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <Ionicons name="people" size={20} color={theme.blue} />
                <View>
                  <Text style={styles.sectionTitle}>
                    {search.trim() ? 'Search results' : 'People on BRITUME'}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {filteredPeople.length} members found
                  </Text>
                </View>
              </View>

              {filteredPeople.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons
                    name="people-outline"
                    size={38}
                    color={theme.blue}
                  />
                  <Text style={styles.emptyTitle}>No profiles found</Text>
                  <Text style={styles.emptyText}>
                    Try another name or username. Public profiles appear here.
                  </Text>
                </View>
              ) : (
                filteredPeople.map((person) => (
                  <ProfileCard key={person.user_id} person={person} />
                ))
              )}
            </View>
          </>
        )}

        {activeSection === 'friends' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your friends</Text>
            <Text style={styles.sectionSubtitle}>
              {friendPeople.length} friends
            </Text>

            {friendPeople.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No friends yet"
                message="Send friend requests to connect with members."
                styles={styles}
                color={theme.blue}
              />
            ) : (
              friendPeople.map((person) => (
                <ProfileCard key={person.user_id} person={person} />
              ))
            )}
          </View>
        )}

        {activeSection === 'following' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Following</Text>
            <Text style={styles.sectionSubtitle}>
              {followingPeople.length} followed members
            </Text>

            {followingPeople.length === 0 ? (
              <EmptyState
                icon="star-outline"
                title="Not following anyone"
                message="Follow members to keep track of their profiles."
                styles={styles}
                color={theme.blue}
              />
            ) : (
              followingPeople.map((person) => (
                <ProfileCard key={person.user_id} person={person} />
              ))
            )}
          </View>
        )}

        {activeSection === 'requests' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend requests</Text>

            <Text style={styles.sectionSubtitle}>
              Incoming requests
            </Text>

            {incomingRequests.length === 0 ? (
              <EmptyState
                icon="mail-open-outline"
                title="No incoming requests"
                message="New friend requests will appear here."
                styles={styles}
                color={theme.blue}
              />
            ) : (
              incomingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  incoming
                />
              ))
            )}

            <Text style={[styles.sectionSubtitle, { marginTop: 23 }]}>
              Sent requests
            </Text>

            {outgoingRequests.length === 0 ? (
              <EmptyState
                icon="paper-plane-outline"
                title="No pending sent requests"
                message="Requests you send will appear here."
                styles={styles}
                color={theme.blue}
              />
            ) : (
              outgoingRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  incoming={false}
                />
              ))
            )}
          </View>
        )}

        {activeSection === 'blocked' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blocked members</Text>
            <Text style={styles.sectionSubtitle}>
              Manage members you have blocked.
            </Text>

            {blocked.length === 0 ? (
              <EmptyState
                icon="shield-checkmark-outline"
                title="No blocked members"
                message="Members you block will appear here."
                styles={styles}
                color={theme.blue}
              />
            ) : (
              blocked.map((id) => (
                <View key={id} style={styles.blockedCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>Blocked member</Text>
                    <Text style={styles.username}>
                      Member ID: {id.slice(0, 8)}...
                    </Text>
                  </View>

                  <Pressable
                    style={styles.unblockButton}
                    onPress={() => unblockPerson(id)}
                  >
                    <Text style={styles.unblockText}>Unblock</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        <Text style={styles.footer}>
          BRITUME • Vortex of Possibilities
        </Text>
      </ScrollView>

      {/* MEMBER PROFILE MODAL */}
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
                  <Avatar person={selected} size={108} />
                  <Text style={styles.profileName}>
                    {nameOf(selected)}
                  </Text>
                  <Text style={styles.profileUsername}>
                    {selected.username
                      ? `@${selected.username}`
                      : 'BRITUME member'}
                  </Text>
                  <Text style={styles.profileBio}>
                    {selected.bio || 'This member has not added a bio yet.'}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalPrimary}
                    onPress={() => toggleFollow(selected)}
                  >
                    <Ionicons
                      name={
                        following.includes(selected.user_id)
                          ? 'checkmark-circle'
                          : 'star'
                      }
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.modalPrimaryText}>
                      {following.includes(selected.user_id)
                        ? 'Following'
                        : 'Follow'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalSecondary}
                    onPress={() => togglePin(selected)}
                  >
                    <Ionicons
                      name={
                        pinned.includes(selected.user_id)
                          ? 'pin'
                          : 'pin-outline'
                      }
                      size={18}
                      color={theme.blue}
                    />
                    <Text style={styles.modalSecondaryText}>
                      {pinned.includes(selected.user_id) ? 'Unpin' : 'Pin'}
                    </Text>
                  </Pressable>
                </View>

                {friends.includes(selected.user_id) ? (
                  <Pressable
                    style={styles.modalDanger}
                    onPress={() => removeFriend(selected)}
                  >
                    <Ionicons
                      name="person-remove-outline"
                      size={18}
                      color={theme.danger}
                    />
                    <Text style={styles.modalDangerText}>Remove friend</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.modalPrimary}
                    onPress={() => sendFriendRequest(selected)}
                  >
                    <Ionicons
                      name="person-add"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.modalPrimaryText}>Add friend</Text>
                  </Pressable>
                )}

                <Pressable
                  style={styles.modalSecondary}
                  onPress={() => shareProfile(selected)}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color={theme.blue}
                  />
                  <Text style={styles.modalSecondaryText}>
                    Share profile
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalDanger}
                  onPress={() => blockPerson(selected)}
                >
                  <Ionicons
                    name="ban-outline"
                    size={18}
                    color={theme.danger}
                  />
                  <Text style={styles.modalDangerText}>Block member</Text>
                </Pressable>

                <Pressable
                  style={styles.modalDanger}
                  onPress={() => openReport(selected)}
                >
                  <Ionicons
                    name="flag-outline"
                    size={18}
                    color={theme.danger}
                  />
                  <Text style={styles.modalDangerText}>Report member</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* THREE-DOT ACTION MENU */}
      <Modal
        visible={!!menuPerson}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuPerson(null)}
      >
        <Pressable
          style={styles.menuBackground}
          onPress={() => setMenuPerson(null)}
        >
          <View style={styles.actionMenu}>
            <Text style={styles.modalHeading}>
              {menuPerson ? nameOf(menuPerson) : 'Member actions'}
            </Text>

            {menuPerson && (
              <>
                <MenuAction
                  icon="person-outline"
                  label="View profile"
                  onPress={() => {
                    const person = menuPerson;
                    setMenuPerson(null);
                    openProfile(person);
                  }}
                  styles={styles}
                />

                <MenuAction
                  icon="share-social-outline"
                  label="Share profile"
                  onPress={() => shareProfile(menuPerson)}
                  styles={styles}
                />

                <MenuAction
                  icon="pin-outline"
                  label={
                    pinned.includes(menuPerson.user_id)
                      ? 'Unpin profile'
                      : 'Pin profile'
                  }
                  onPress={() => {
                    const person = menuPerson;
                    setMenuPerson(null);
                    void togglePin(person);
                  }}
                  styles={styles}
                />

                <MenuAction
                  icon="ban-outline"
                  label="Block member"
                  danger
                  onPress={() => blockPerson(menuPerson)}
                  styles={styles}
                />

                <MenuAction
                  icon="flag-outline"
                  label="Report member"
                  danger
                  onPress={() => openReport(menuPerson)}
                  styles={styles}
                />
              </>
            )}

            <Pressable
              style={styles.cancelMenu}
              onPress={() => setMenuPerson(null)}
            >
              <Text style={styles.cancelMenuText}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* REPORT MODAL */}
      <Modal
        visible={!!reportPerson}
        transparent
        animationType="slide"
        onRequestClose={() => setReportPerson(null)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalHeading}>Report member</Text>
              <Pressable
                onPress={() => setReportPerson(null)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color={theme.text} />
              </Pressable>
            </View>

            <Text style={styles.sectionSubtitle}>
              Why are you reporting {reportPerson ? nameOf(reportPerson) : 'this member'}?
            </Text>

            {REPORT_REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={styles.reasonOption}
                onPress={() => setReportReason(reason)}
              >
                <Ionicons
                  name={
                    reportReason === reason
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={20}
                  color={theme.blue}
                />
                <Text style={styles.reasonText}>
                  {reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </Text>
              </Pressable>
            ))}

            <TextInput
              value={reportDetails}
              onChangeText={setReportDetails}
              placeholder="Additional details (optional)"
              placeholderTextColor={theme.muted}
              multiline
              style={styles.reportInput}
            />

            <Pressable
              disabled={working}
              style={styles.submitReport}
              onPress={submitReport}
            >
              {working ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitReportText}>
                  Submit report
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// EMPTY STATE
function EmptyState({
  icon,
  title,
  message,
  styles,
  color,
}: {
  icon: any;
  title: string;
  message: string;
  styles: any;
  color: string;
}) {
  return (
    <View style={styles.emptyCard}>
      <Ionicons name={icon} size={37} color={color} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// MENU ACTION
function MenuAction({
  icon,
  label,
  onPress,
  styles,
  danger = false,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  styles: any;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.menuAction} onPress={onPress}>
      <Ionicons
        name={icon}
        size={20}
        color={danger ? '#D9534F' : '#3988E8'}
      />
      <Text
        style={[
          styles.menuActionText,
          danger && { color: '#D9534F' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// DISCOVER STYLES
function createStyles(theme: any) {
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
    navigation: {
      marginTop: 17,
      marginHorizontal: -17,
    },
    navigationContent: {
      paddingHorizontal: 17,
      gap: 8,
      paddingBottom: 5,
    },
    sectionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 13,
      paddingVertical: 11,
      borderRadius: 15,
      backgroundColor: theme.panel,
      ...theme.clayRaised,
    },
    sectionButtonActive: {
      backgroundColor: theme.blue,
    },
    sectionButtonText: {
      color: theme.text,
      fontSize: 11,
      fontWeight: '800',
    },
    sectionButtonTextActive: {
      color: '#FFFFFF',
    },
    section: {
      marginTop: 25,
    },
    sectionHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '900',
    },
    sectionSubtitle: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 4,
      marginBottom: 10,
    },
    clearText: {
      color: theme.danger,
      fontSize: 11,
      fontWeight: '900',
    },
    personCard: {
      backgroundColor: theme.panel,
      borderRadius: 23,
      padding: 13,
      marginBottom: 13,
      borderWidth: 1,
      borderColor: theme.glassBorder,
      ...theme.clayShadow,
    },
    personMain: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    personIdentity: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
    },
    avatar: {
      backgroundColor: theme.clayBlue,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.border,
      ...theme.clayRaised,
    },
    personInfo: {
      flex: 1,
      marginLeft: 12,
      marginRight: 7,
      minWidth: 0,
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
    menuButton: {
      width: 35,
      height: 35,
      borderRadius: 12,
      backgroundColor: theme.clayBlue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: theme.border,
      marginTop: 13,
      paddingTop: 10,
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
    requestActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    acceptButton: {
      flex: 1,
      minHeight: 42,
      backgroundColor: theme.blue,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    acceptText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },
    rejectButton: {
      flex: 1,
      minHeight: 42,
      backgroundColor: theme.clayBlue,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    rejectText: {
      color: theme.danger,
      fontSize: 12,
      fontWeight: '900',
    },
    blockedCard: {
      backgroundColor: theme.panel,
      borderRadius: 18,
      padding: 15,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      ...theme.clayShadow,
    },
    unblockButton: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.clayBlue,
    },
    unblockText: {
      color: theme.blue,
      fontWeight: '900',
      fontSize: 11,
    },
    footer: {
      color: theme.muted,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 30,
    },
    modalBackground: {
      flex: 1,
      backgroundColor: 'rgba(25,51,77,0.55)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: theme.bg,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 21,
      paddingBottom: 35,
      maxHeight: '90%',
    },
    modalTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18,
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
      marginTop: 20,
    },
    modalPrimary: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.blue,
      borderRadius: 15,
      paddingHorizontal: 12,
      marginTop: 10,
      ...theme.clayRaised,
    },
    modalPrimaryText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 12,
    },
    modalSecondary: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.panel,
      borderRadius: 15,
      paddingHorizontal: 12,
      marginTop: 10,
      ...theme.clayRaised,
    },
    modalSecondaryText: {
      color: theme.blue,
      fontWeight: '900',
      fontSize: 12,
    },
    modalDanger: {
      minHeight: 47,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.panel,
      borderRadius: 15,
      paddingHorizontal: 12,
      marginTop: 10,
      ...theme.clayRaised,
    },
    modalDangerText: {
      color: theme.danger,
      fontWeight: '900',
      fontSize: 12,
    },
    menuBackground: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: 22,
    },
    actionMenu: {
      backgroundColor: theme.bg,
      borderRadius: 23,
      padding: 19,
    },
    menuAction: {
      minHeight: 49,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    menuActionText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
    },
    cancelMenu: {
      marginTop: 13,
      minHeight: 43,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.panel,
      borderRadius: 13,
    },
    cancelMenuText: {
      color: theme.text,
      fontWeight: '900',
    },
    reasonOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    reasonText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '700',
    },
    reportInput: {
      minHeight: 95,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel,
      color: theme.text,
      textAlignVertical: 'top',
      padding: 13,
      marginTop: 17,
    },
    submitReport: {
      minHeight: 49,
      backgroundColor: theme.blue,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
    },
    submitReportText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 13,
    },
  });
}

export default withThemeBackground(DiscoverScreen);
