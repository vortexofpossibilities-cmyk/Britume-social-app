import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

type NotificationItem = {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  entity_id: string | null;
  message: string;
  read_at: string | null;
  created_at: string;
  actor?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
};

const BLUE = '#168BFF';

function timeAgo(date: string) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 1000),
  );

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(date).toLocaleDateString();
}

function notificationIcon(type: string) {
  switch (type) {
    case 'like':
      return { name: 'heart' as const, color: '#E84D75' };
    case 'comment':
      return { name: 'chatbubble-ellipses' as const, color: BLUE };
    case 'follow':
      return { name: 'person-add' as const, color: '#8C83FF' };
    case 'community':
      return { name: 'people' as const, color: '#20B878' };
    case 'mention':
      return { name: 'at' as const, color: '#E9A928' };
    default:
      return { name: 'notifications' as const, color: BLUE };
  }
}

export default function NotificationsScreen() {
  const { session } = useAuth();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const unreadCount = items.filter(item => !item.read_at).length;

  const loadNotifications = useCallback(async (refresh = false) => {
    if (!supabase || !session?.user?.id) {
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
          'id, recipient_id, actor_id, type, entity_id, message, read_at, created_at',
        )
        .eq('recipient_id', session.user.id)
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

      let profiles: any[] = [];

      if (actorIds.length > 0) {
        const { data: profileData, error: profileError } =
          await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url')
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
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  const markAsRead = async (item: NotificationItem) => {
    if (!supabase || !session?.user?.id || item.read_at) return;

    setWorkingId(item.id);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('id', item.id)
        .eq('recipient_id', session.user.id);

      if (error) throw error;

      setItems(current =>
        current.map(notification =>
          notification.id === item.id
            ? { ...notification, read_at: now }
            : notification,
        ),
      );
    } catch (error) {
      Alert.alert(
        'Could not update',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setWorkingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (!supabase || !session?.user?.id || unreadCount === 0) return;

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: now })
        .eq('recipient_id', session.user.id)
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
      'This notification will be removed from your list.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!supabase || !session?.user?.id) return;

            setWorkingId(item.id);

            try {
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', item.id)
                .eq('recipient_id', session.user.id);

              if (error) throw error;

              setItems(current =>
                current.filter(notification => notification.id !== item.id),
              );
            } catch (error) {
              Alert.alert(
                'Delete failed',
                error instanceof Error ? error.message : 'Please try again.',
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

    if (item.type === 'follow') {
      router.push('/(tabs)/discover');
    } else if (item.type === 'like' || item.type === 'comment') {
      router.push('/(tabs)');
    } else {
      router.push('/(tabs)/communities');
    }
  };

  const renderNotification = (item: NotificationItem) => {
    const icon = notificationIcon(item.type);
    const actorName =
      item.actor?.display_name ||
      item.actor?.username ||
      'A BRITUME member';

    return (
      <Pressable
        key={item.id}
        onPress={() => void openNotification(item)}
        style={[
          styles.notificationCard,
          !item.read_at && styles.unreadCard,
        ]}
      >
        <View style={styles.avatarWrap}>
          {item.actor?.avatar_url ? (
            <Image
              source={{ uri: item.actor.avatar_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="person" size={23} color={BLUE} />
            </View>
          )}

          <View style={[styles.typeBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.notificationBody}>
          <Text style={styles.notificationText}>
            <Text style={styles.actorName}>{actorName}</Text>
            {' '}{item.message}
          </Text>

          <Text style={styles.notificationTime}>
            {timeAgo(item.created_at)}
          </Text>

          {!item.read_at ? (
            <Text style={styles.newLabel}>NEW</Text>
          ) : null}
        </View>

        <View style={styles.cardActions}>
          {!item.read_at ? (
            <Pressable
              hitSlop={10}
              onPress={() => void markAsRead(item)}
              accessibilityLabel="Mark as read"
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={21}
                color={BLUE}
              />
            </Pressable>
          ) : null}

          <Pressable
            hitSlop={10}
            onPress={() => deleteNotification(item)}
            accessibilityLabel="Delete notification"
          >
            <Ionicons
              name="close-circle-outline"
              size={21}
              color={theme.muted}
            />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  if (!session?.user?.id) {
    return (
      <View style={styles.centerScreen}>
        <Ionicons name="notifications-outline" size={54} color={BLUE} />
        <Text style={styles.emptyTitle}>Sign in to see notifications</Text>
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
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              Your BRITUME activity, all in one place
            </Text>
          </View>

          <View style={styles.bellButton}>
            <Ionicons
              name="notifications"
              size={23}
              color={BLUE}
            />
            {unreadCount > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="sparkles" size={24} color={BLUE} />
          </View>

          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>
              You're all caught up?
            </Text>
            <Text style={styles.summarySubtitle}>
              {unreadCount === 0
                ? 'You have no unread notifications.'
                : `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`}
            </Text>
          </View>

          {unreadCount > 0 ? (
            <Pressable onPress={() => void markAllAsRead()}>
              <Text style={styles.markAllText}>Read all</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <Text style={styles.sectionCount}>{items.length}</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={styles.loadingText}>
              Loading your notifications...
            </Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="notifications-off-outline"
                size={42}
                color={BLUE}
              />
            </View>

            <Text style={styles.emptyTitle}>Nothing to see yet</Text>
            <Text style={styles.emptyText}>
              When someone likes or comments on your posts, follows you,
              or interacts with your communities, you'll see it here.
            </Text>

            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.primaryButtonText}>Explore BRITUME</Text>
            </Pressable>
          </View>
        ) : (
          items.map(renderNotification)
        )}

        <Text style={styles.footer}>
          BRITUME • Vortex of Possibilities
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
    paddingHorizontal: 17,
    paddingTop: 18,
    paddingBottom: 45,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    gap: 12,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: '900',
    color: theme.text,
  },
  subtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 3,
  },
  bellButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayRaised,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: '#E84D75',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.panel,
    borderRadius: 21,
    padding: 14,
    marginBottom: 27,
    gap: 11,
    ...theme.clayRaised,
  },
  summaryIcon: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '900',
  },
  summarySubtitle: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 4,
  },
  markAllText: {
    color: BLUE,
    fontWeight: '900',
    fontSize: 11,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    gap: 9,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '900',
  },
  sectionCount: {
    color: BLUE,
    backgroundColor: theme.clayBlue,
    overflow: 'hidden',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '900',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.panel,
    borderRadius: 20,
    padding: 13,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 11,
    ...theme.clayRaised,
  },
  unreadCard: {
    borderColor: '#8CC8FF',
    backgroundColor: '#F7FBFF',
  },
  avatarWrap: {
    width: 49,
    height: 49,
    position: 'relative',
  },
  avatar: {
    width: 47,
    height: 47,
    borderRadius: 17,
    backgroundColor: theme.clayBlue,
  },
  avatarFallback: {
    width: 47,
    height: 47,
    borderRadius: 17,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    right: -4,
    bottom: -3,
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
  },
  notificationText: {
    color: theme.text,
    fontSize: 12,
    lineHeight: 18,
  },
  actorName: {
    fontWeight: '900',
  },
  notificationTime: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 5,
  },
  newLabel: {
    color: BLUE,
    fontSize: 9,
    fontWeight: '900',
    marginTop: 5,
  },
  cardActions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingLeft: 3,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: theme.panel,
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    ...theme.clayShadow,
  },
  emptyIcon: {
    width: 83,
    height: 83,
    borderRadius: 28,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 17,
  },
  emptyText: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: BLUE,
    borderRadius: 15,
    paddingHorizontal: 21,
    paddingVertical: 13,
    marginTop: 19,
    ...theme.clayRaised,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  footer: {
    color: theme.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 28,
  },
});
