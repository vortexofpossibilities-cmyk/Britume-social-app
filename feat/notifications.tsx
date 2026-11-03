import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/auth/AuthProvider';
import { theme } from '../src/lib/theme';

type FilterType = 'All' | 'Likes' | 'Comments' | 'Followers' | 'Other';

type NotificationItem = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  entity_id: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
  destination_type: string | null;
  destination_id: string | null;
  destination_url: string | null;
  actor?: {
    display_name: string | null;
    username: string | null;
  };
};

const BLUE = '#168BFF';

const filters: FilterType[] = [
  'All',
  'Likes',
  'Comments',
  'Followers',
  'Other',
];

function timeAgo(value: string) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000),
  );

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return new Date(value).toLocaleDateString();
}

function getNotificationStyle(type: string) {
  switch (type.toLowerCase()) {
    case 'like':
      return {
        icon: 'heart' as const,
        color: '#E84D75',
        label: 'POST LIKE',
        source: 'Home feed',
      };
    case 'comment':
      return {
        icon: 'chatbubble-ellipses' as const,
        color: BLUE,
        label: 'COMMENT',
        source: 'Home feed',
      };
    case 'follow':
      return {
        icon: 'person-add' as const,
        color: '#8C83FF',
        label: 'NEW FOLLOWER',
        source: 'Member profile',
      };
    case 'community':
      return {
        icon: 'people' as const,
        color: '#20B878',
        label: 'COMMUNITY',
        source: 'Communities',
      };
    case 'mention':
      return {
        icon: 'at' as const,
        color: '#E9A928',
        label: 'MENTION',
        source: 'BRITUME activity',
      };
    case 'message':
      return {
        icon: 'mail' as const,
        color: '#168BFF',
        label: 'MESSAGE',
        source: 'Messages',
      };
    default:
      return {
        icon: 'notifications' as const,
        color: BLUE,
        label: 'ACTIVITY',
        source: 'BRITUME',
      };
  }
}

function getFilter(type: string): FilterType {
  switch (type.toLowerCase()) {
    case 'like':
      return 'Likes';
    case 'comment':
      return 'Comments';
    case 'follow':
      return 'Followers';
    default:
      return 'Other';
  }
}

function getDestination(item: NotificationItem) {
  if (item.destination_url) {
    return item.destination_url;
  }

  if (item.type === 'follow' && item.actor_id) {
    return `/(tabs)/profile?userId=${item.actor_id}`;
  }

  if (
    (item.type === 'like' || item.type === 'comment') &&
    item.entity_id
  ) {
    return `/(tabs)?postId=${item.entity_id}`;
  }

  if (item.type === 'message') {
    return '/messages';
  }

  if (item.type === 'community') {
    return '/(tabs)/communities';
  }

  return '/(tabs)';
}

export default function NotificationsScreen() {
  const { session } = useAuth();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const userId = session?.user?.id;
  const unreadCount = items.filter(item => !item.read_at).length;

  const filteredItems = useMemo(() => {
    if (filter === 'All') return items;

    return items.filter(
      item => getFilter(item.type) === filter,
    );
  }, [items, filter]);

  const loadNotifications = useCallback(async (refresh = false) => {
    if (!supabase || !userId) {
      setItems([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, recipient_id, actor_id, type, entity_id, message, read_at, created_at, destination_type, destination_id, destination_url',
        )
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const notifications = (data ?? []) as NotificationItem[];

      const actorIds = [
        ...new Set(
          notifications
            .map(item => item.actor_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      let profiles: {
        user_id: string;
        display_name: string | null;
        username: string | null;
      }[] = [];

      if (actorIds.length > 0) {
        const { data: profileData, error: profileError } =
          await supabase
            .from('profiles')
            .select('user_id, display_name, username')
            .in('user_id', actorIds);

        if (profileError) throw profileError;
        profiles = profileData ?? [];
      }

      const profileMap = new Map(
        profiles.map(profile => [profile.user_id, profile]),
      );

      setItems(
        notifications.map(item => ({
          ...item,
          actor: item.actor_id
            ? profileMap.get(item.actor_id)
            : undefined,
        })),
      );
    } catch (error) {
      console.error('BRITUME notifications:', error);
      Alert.alert(
        'Notifications',
        error instanceof Error
          ? error.message
          : 'Could not load notifications.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const markAsRead = async (item: NotificationItem) => {
    if (!supabase || !userId || item.read_at) return;

    const now = new Date().toISOString();

    setItems(current =>
      current.map(value =>
        value.id === item.id
          ? { ...value, read_at: now }
          : value,
      ),
    );

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('id', item.id)
        .eq('recipient_id', userId);

      if (error) throw error;
    } catch (error) {
      setItems(current =>
        current.map(value =>
          value.id === item.id
            ? { ...value, read_at: null }
            : value,
        ),
      );

      Alert.alert(
        'Could not update',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const markAllAsRead = async () => {
    if (!supabase || !userId || unreadCount === 0) return;

    const now = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('recipient_id', userId)
        .is('read_at', null);

      if (error) throw error;

      setItems(current =>
        current.map(item => ({
          ...item,
          read_at: item.read_at ?? now,
        })),
      );
    } catch (error) {
      Alert.alert(
        'Could not update',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const deleteNotification = (item: NotificationItem) => {
    Alert.alert(
      'Delete notification?',
      'This notification will be removed from your activity.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!supabase || !userId) return;

            setWorkingId(item.id);

            try {
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', item.id)
                .eq('recipient_id', userId);

              if (error) throw error;

              setItems(current =>
                current.filter(value => value.id !== item.id),
              );
            } catch (error) {
              Alert.alert(
                'Delete failed',
                error instanceof Error
                  ? error.message
                  : 'Please try again.',
              );
            } finally {
              setWorkingId(null);
            }
          },
        },
      ],
    );
  };

  const openNotification = async (item: NotificationItem) => {
    await markAsRead(item);

    const destination = getDestination(item);

    router.push(destination as any);
  };

  const renderCard = (item: NotificationItem) => {
    const style = getNotificationStyle(item.type);
    const actorName =
      item.actor?.display_name ||
      item.actor?.username ||
      'A BRITUME member';

    const destination = getDestination(item);

    return (
      <Pressable
        key={item.id}
        onPress={() => void openNotification(item)}
        style={[
          styles.notificationCard,
          !item.read_at && styles.unreadCard,
        ]}
      >
        <View style={styles.iconColumn}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={style.icon}
              size={23}
              color={style.color}
            />
          </View>

          {!item.read_at && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <Text style={[styles.category, { color: style.color }]}>
              {style.label}
            </Text>

            <Text style={styles.time}>
              {timeAgo(item.created_at)}
            </Text>
          </View>

          <Text style={styles.message}>
            <Text style={styles.actorName}>{actorName}</Text>
            {' '}{item.message}
          </Text>

          <View style={styles.sourceRow}>
            <Ionicons
              name="git-branch-outline"
              size={13}
              color={theme.muted}
            />
            <Text style={styles.sourceText}>
              Source: {style.source}
            </Text>
          </View>

          <View style={styles.destinationBox}>
            <View style={styles.destinationHeading}>
              <Ionicons
                name="link-outline"
                size={13}
                color={BLUE}
              />
              <Text style={styles.destinationLabel}>
                NOTIFICATION URL
              </Text>
            </View>

            <Text
              style={styles.destinationUrl}
              numberOfLines={2}
            >
              {destination}
            </Text>

            <View style={styles.openRow}>
              <Text style={styles.openText}>Tap to view activity</Text>
              <Ionicons
                name="arrow-forward-circle"
                size={17}
                color={BLUE}
              />
            </View>
          </View>

          <View style={styles.cardBottom}>
            {!item.read_at ? (
              <Text style={styles.newText}>UNREAD</Text>
            ) : (
              <Text style={styles.readText}>READ</Text>
            )}

            <Pressable
              onPress={event => {
                event.stopPropagation();
                deleteNotification(item);
              }}
              hitSlop={10}
              style={styles.deleteButton}
            >
              {workingId === item.id ? (
                <ActivityIndicator size="small" color={theme.muted} />
              ) : (
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={theme.muted}
                />
              )}
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  if (!userId) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.bigIcon}>
          <Ionicons
            name="notifications-outline"
            size={42}
            color={BLUE}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Sign in to see notifications
        </Text>

        <Text style={styles.emptyText}>
          Your BRITUME activity will appear here.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.primaryButtonText}>Sign in</Text>
        </Pressable>
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
            onRefresh={() => void loadNotifications(true)}
            tintColor={BLUE}
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              Your activity vortex
            </Text>
          </View>

          <View style={styles.bellButton}>
            <Ionicons
              name="notifications"
              size={23}
              color={BLUE}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="sparkles"
              size={26}
              color={BLUE}
            />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              Your activity centre
            </Text>
            <Text style={styles.heroSubtitle}>
              {unreadCount === 0
                ? 'You are all caught up!'
                : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
            </Text>
          </View>

          {unreadCount > 0 && (
            <Pressable
              onPress={() => void markAllAsRead()}
              style={styles.readAllButton}
            >
              <Text style={styles.readAllText}>Read all</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.filterHeading}>
          <Text style={styles.sectionTitle}>Activity filters</Text>
          <Text style={styles.totalText}>
            {filteredItems.length} items
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map(value => {
            const selected = filter === value;

            return (
              <Pressable
                key={value}
                onPress={() => setFilter(value)}
                style={[
                  styles.filterChip,
                  selected && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{items.length}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.emptyText}>
              Loading your activity...
            </Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.bigIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={40}
                color={BLUE}
              />
            </View>

            <Text style={styles.emptyTitle}>
              {items.length === 0
                ? 'Nothing here yet'
                : 'No activity in this category'}
            </Text>

            <Text style={styles.emptyText}>
              {items.length === 0
                ? 'Likes, comments, followers and community activity will appear here.'
                : 'Try another filter to see more BRITUME activity.'}
            </Text>

            {items.length === 0 && (
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.primaryButtonText}>
                  Explore BRITUME
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredItems.map(renderCard)
        )}

        <Text style={styles.footer}>
          BRITUME · Vortex of Possibilities
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 50,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: '900',
  },
  subtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 3,
  },
  bellButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: '#E84D75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.panel,
    borderRadius: 23,
    padding: 15,
    marginBottom: 25,
    ...theme.clayShadow,
  },
  heroIcon: {
    width: 49,
    height: 49,
    borderRadius: 18,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayPressedStyle,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
  },
  heroSubtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 4,
  },
  readAllButton: {
    backgroundColor: theme.clayBlue,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 13,
    ...theme.clayPressedStyle,
  },
  readAllText: {
    color: BLUE,
    fontWeight: '900',
    fontSize: 10,
  },
  filterHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '900',
  },
  totalText: {
    color: theme.muted,
    fontSize: 10,
  },
  filters: {
    gap: 9,
    paddingVertical: 5,
    paddingHorizontal: 2,
    marginBottom: 22,
  },
  filterChip: {
    backgroundColor: theme.panel,
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.clayPressedStyle,
  },
  filterChipActive: {
    backgroundColor: theme.clayBlue,
    borderColor: '#A9D5FF',
    ...theme.clayRaised,
  },
  filterText: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  filterTextActive: {
    color: BLUE,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 14,
  },
  countPill: {
    backgroundColor: theme.clayBlue,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  countPillText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '900',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: theme.panel,
    borderRadius: 23,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.border,
    ...theme.clayShadow,
  },
  unreadCard: {
    borderColor: '#A5D3FF',
    backgroundColor: '#F9FCFF',
  },
  iconColumn: {
    width: 43,
    alignItems: 'center',
    paddingTop: 3,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayPressedStyle,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: BLUE,
    marginTop: 9,
  },
  cardContent: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  category: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  time: {
    color: theme.muted,
    fontSize: 9,
  },
  message: {
    color: theme.text,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  actorName: {
    fontWeight: '900',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },
  sourceText: {
    color: theme.muted,
    fontSize: 10,
  },
  destinationBox: {
    backgroundColor: theme.clayBlue,
    borderRadius: 15,
    padding: 11,
    marginTop: 11,
    borderWidth: 1,
    borderColor: '#D0E7FC',
    ...theme.clayPressedStyle,
  },
  destinationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  destinationLabel: {
    color: BLUE,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  destinationUrl: {
    color: theme.liquidText,
    fontSize: 10,
    marginTop: 6,
    lineHeight: 15,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  openText: {
    color: BLUE,
    fontSize: 10,
    fontWeight: '900',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  newText: {
    color: BLUE,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  readText: {
    color: theme.muted,
    fontSize: 8,
    fontWeight: '800',
  },
  deleteButton: {
    width: 31,
    height: 31,
    borderRadius: 11,
    backgroundColor: theme.panel2,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayPressedStyle,
  },
  loadingCard: {
    backgroundColor: theme.panel,
    borderRadius: 23,
    padding: 35,
    alignItems: 'center',
    ...theme.clayShadow,
  },
  emptyCard: {
    backgroundColor: theme.panel,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    ...theme.clayShadow,
  },
  bigIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyText: {
    color: theme.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingHorizontal: 21,
    paddingVertical: 13,
    marginTop: 18,
    ...theme.clayRaised,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  footer: {
    color: theme.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 27,
  },
});
