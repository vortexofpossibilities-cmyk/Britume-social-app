
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';

import { useAuth } from '../../src/auth/AuthProvider';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import {
  fetchCurrentUserProfile,
  getProfileName,
  updateOwnProfile,
  type ProfileRecord,
} from '../../src/lib/profile';

type ProfileTab = 'Photos' | 'Create' | 'Hosts';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const { language, t } = useLanguage();

  const isSt = language === 'Setswana';

  const words = {
    profile: isSt ? 'Profaele' : 'Profile',
    options: isSt ? 'Dikgetho tsa profaele' : 'Profile options',
    signIn: isSt ? 'Tsena go bona profaele ya gago' : 'Sign in to view your profile',
    goSignIn: isSt ? 'Tsena' : 'Go to sign in',
    loading: isSt ? 'E a laisa...' : 'Loading...',
    usernameHint: isSt ? 'Tlhoma leina la gago mo profaeleng' : 'Set your username in Edit profile',
    bioHint: isSt ? 'Tsenya tlhaloso e khutshwane ka wena.' : 'Add a short personal bio for your public profile.',
    photos: isSt ? 'Ditshwantsho' : 'Photos',
    create: isSt ? 'Dira' : 'Create',
    hosts: isSt ? 'Baamogedi' : 'Hosts',
    personalDetails: isSt ? 'Tshedimosetso ya gago' : 'Personal details',
    editDetails: isSt ? 'Baakanya tshedimosetso ya gago' : 'Edit personal details',
    public: isSt ? 'Phatlalatsa' : 'Public',
    publicProfile: isSt ? 'Profaele ya phatlalatsa' : 'Public profile',
    createLink: isSt ? 'Dira kgokagano ya profaele' : 'Create profile link',
    subscribers: isSt ? 'Balatedi' : 'Subscribers',
    friends: isSt ? 'Ditsala' : 'Friends',
    seeAll: isSt ? 'Bona tsotlhe' : 'See all',
    library: isSt ? 'Laeborari ya me' : 'My library',
    dashboard: isSt ? 'Dashboard' : 'Dashboard',
    videos: isSt ? 'Dibidio' : 'Videos',
    enter: isSt ? 'Tsena' : 'Enter',
    photosMessage: isSt ? 'Ditshwantsho tsa gago di tla bonala fano.' : 'Your photos will appear here.',
    createMessage: isSt ? 'Dilo tse o di dirileng di tla bonala fano.' : 'Your creations will appear here.',
    hostsMessage: isSt ? 'Baamogedi ba gago ba tla bonala fano.' : 'Your hosts will appear here.',
    profileUnavailable: isSt ? 'Profaele ga e teng' : 'Profile unavailable',
    loadFailed: isSt ? 'Ga go a kgonega go laisa profaele ya gago.' : 'Could not load your profile.',
    updateFailed: isSt ? 'Go ntšhwafatsa ga go a atlega' : 'Update failed',
    visibilityFailed: isSt ? 'Ga go a kgonega go fetola ponalo ya gago.' : 'Could not update your visibility.',
    signInRequired: isSt ? 'Tsena pele' : 'Sign in required',
    subscribersMessage: isSt ? 'Lenane la balatedi le tla bonala fa le golagantswe.' : 'Your subscriber list will appear here when subscriber data is connected.',
    friendsMessage: isSt ? 'Lenane la ditsala le tla bonala fa le golagantswe.' : 'Your friends list will appear here when friend data is connected.',
    photosLibraryMessage: isSt ? 'Laeborari ya ditshwantsho e tla bonala fa polokelo e golagantswe.' : 'Your photo library will appear here when media storage is connected.',
    videosLibraryMessage: isSt ? 'Laeborari ya dibidio e tla bonala fa polokelo e golagantswe.' : 'Your video library will appear here when media storage is connected.',
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  const [activeTab, setActiveTab] = useState<ProfileTab>('Photos');
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const nextProfile = await fetchCurrentUserProfile(session.user.id);
      setProfile(nextProfile);
    } catch (error) {
      Alert.alert(
        words.profileUnavailable,
        error instanceof Error ? error.message : words.loadFailed,
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, words.profileUnavailable, words.loadFailed]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleTogglePublic = async (value: boolean) => {
    if (!session?.user?.id || saving) return;

    setSaving(true);

    try {
      const nextProfile = await updateOwnProfile({
        userId: session.user.id,
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        bio: profile?.bio ?? '',
        is_public: value,
      });

      setProfile(nextProfile);
    } catch (error) {
      Alert.alert(
        words.updateFailed,
        error instanceof Error ? error.message : words.visibilityFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const displayName = getProfileName(profile);

  if (!session) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-circle-outline" size={48} color={theme.cyan} />
        <Text style={styles.emptyTitle}>{words.signIn}</Text>
        <Pressable
          style={styles.primaryAction}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.primaryActionText}>{words.goSignIn}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>{words.profile}</Text>
        <Pressable
          accessibilityLabel={words.options}
          style={styles.topButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="ellipsis-horizontal" size={23} color={theme.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={theme.cyan} />
          <Text style={styles.loadingText}>{words.loading}</Text>
        </View>
      ) : (
        <>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={38} color={theme.cyan} />
              </View>
              <View style={styles.avatarBadge}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.bioLine}>
              {profile?.username ? `@${profile.username}` : words.usernameHint}
            </Text>
            <Text style={styles.bioText}>
              {profile?.bio || words.bioHint}
            </Text>
          </View>

          <View style={styles.tabs}>
            {([
              ['Photos', words.photos],
              ['Create', words.create],
              ['Hosts', words.hosts],
            ] as const).map(([tab, label]) => {
              const selected = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={styles.tab}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.tabText, selected && styles.activeTabText]}>
                    {label}
                  </Text>
                  {selected && <View style={styles.tabUnderline} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeading}>
              <Text style={styles.cardTitle}>{words.personalDetails}</Text>
              <Pressable
                accessibilityLabel={words.editDetails}
                hitSlop={8}
                onPress={() => router.push('/profile-edit')}
              >
                <Ionicons name="pencil-outline" size={20} color={theme.muted} />
              </Pressable>
            </View>

            <View style={styles.publicRow}>
              <View style={styles.publicInfo}>
                <Ionicons name="globe-outline" size={20} color={theme.cyan} />
                <Text style={styles.rowLabel}>{words.public}</Text>
              </View>
              <Switch
                value={Boolean(profile?.is_public ?? true)}
                onValueChange={handleTogglePublic}
                disabled={saving}
                trackColor={{ false: theme.border, true: theme.cyan }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
              />
            </View>
          </View>

          <Pressable
            style={styles.card}
            onPress={() => {
              if (profile?.username) {
                router.push({
                  pathname: '/profile/[username]',
                  params: { username: profile.username },
                });
              } else {
                router.push('/profile-edit');
              }
            }}
          >
            <View style={styles.singleCardRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="person-outline" size={21} color={theme.cyan} />
              </View>
              <Text style={styles.cardTitle}>
                {profile?.username ? words.publicProfile : words.createLink}
              </Text>
              <View style={styles.flexSpace} />
              <Ionicons name="chevron-forward" size={20} color={theme.muted} />
            </View>
          </Pressable>

          <Pressable
            style={styles.card}
            onPress={() => Alert.alert(words.subscribers, words.subscribersMessage)}
          >
            <View style={styles.singleCardRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="people-outline" size={21} color={theme.cyan} />
              </View>
              <Text style={styles.cardTitle}>{words.subscribers}</Text>
              <View style={styles.flexSpace} />
              <Ionicons name="chevron-forward" size={20} color={theme.muted} />
            </View>
          </Pressable>

          <Pressable
            style={styles.card}
            onPress={() => Alert.alert(words.friends, words.friendsMessage)}
          >
            <View style={styles.singleCardRow}>
              <View style={styles.iconBubble}>
                <Ionicons name="people-circle-outline" size={22} color={theme.cyan} />
              </View>
              <Text style={styles.cardTitle}>{words.friends}</Text>
              <View style={styles.flexSpace} />
              <Text style={styles.seeAll}>{words.seeAll}</Text>
              <Ionicons name="chevron-forward" size={19} color={theme.muted} />
            </View>
          </Pressable>

          <Text style={styles.libraryTitle}>{words.library}</Text>

          <View style={styles.libraryRow}>
            <Pressable
              style={styles.libraryCard}
              onPress={() => {
                setActiveTab('Photos');
                Alert.alert(words.photos, words.photosLibraryMessage);
              }}
            >
              <View style={styles.libraryCardHeading}>
                <Text style={styles.libraryCardTitle}>{words.photos}</Text>
                <Ionicons name="arrow-forward" size={15} color={theme.cyan} />
              </View>
              <View style={styles.photoGrid}>
                {Array.from({ length: 6 }, (_, index) => (
                  <View key={index} style={styles.photoBox}>
                    <Ionicons name="image-outline" size={13} color={theme.muted} />
                  </View>
                ))}
              </View>
              <Text style={styles.enterText}>{words.enter}</Text>
            </Pressable>

            <Pressable
              style={styles.libraryCard}
              onPress={() => router.push('/dashboard')}
            >
              <View style={styles.libraryCardHeading}>
                <Text style={styles.libraryCardTitle}>{words.dashboard}</Text>
                <Ionicons name="arrow-forward" size={15} color={theme.cyan} />
              </View>
              <View style={styles.dashboardGraphic}>
                <Ionicons name="trending-up-outline" size={43} color={theme.cyan} />
              </View>
              <Text style={styles.enterText}>{words.enter}</Text>
            </Pressable>

            <Pressable
              style={styles.libraryCard}
              onPress={() => {
                setActiveTab('Create');
                Alert.alert(words.videos, words.videosLibraryMessage);
              }}
            >
              <View style={styles.libraryCardHeading}>
                <Text style={styles.libraryCardTitle}>{words.videos}</Text>
                <Ionicons name="arrow-forward" size={15} color={theme.cyan} />
              </View>
              <View style={styles.videoStack}>
                {[0, 1, 2].map((item) => (
                  <View key={item} style={styles.videoItem}>
                    <Ionicons name="play-circle-outline" size={17} color={theme.cyan} />
                    <View style={styles.videoLine} />
                  </View>
                ))}
              </View>
              <Text style={styles.enterText}>{words.enter}</Text>
            </Pressable>
          </View>

          <View style={styles.tabContent}>
            <Text style={styles.tabContentTitle}>
              {activeTab === 'Photos' ? words.photos : activeTab === 'Create' ? words.create : words.hosts}
            </Text>
            <Text style={styles.tabContentDescription}>
              {activeTab === 'Photos'
                ? words.photosMessage
                : activeTab === 'Create'
                  ? words.createMessage
                  : words.hostsMessage}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    content: { paddingHorizontal: 15, paddingTop: 12, paddingBottom: 30 },
    topBar: {
      minHeight: 43,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    pageTitle: { color: theme.text, fontSize: 23, fontWeight: '800' },
    topButton: {
      width: 38, height: 38, alignItems: 'center',
      justifyContent: 'center', borderRadius: 19,
    },
    profileHeader: { alignItems: 'center', paddingTop: 7, paddingBottom: 17 },
    avatarWrap: {
      width: 100, height: 100, marginBottom: 8,
      alignItems: 'center', justifyContent: 'center',
    },
    avatar: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: theme.panel2, borderWidth: 2,
      borderColor: theme.border, alignItems: 'center',
      justifyContent: 'center',
    },
    avatarBadge: {
      position: 'absolute', right: 3, bottom: 5,
      width: 29, height: 29, borderRadius: 15,
      backgroundColor: theme.cyan, borderWidth: 2,
      borderColor: theme.bg, alignItems: 'center',
      justifyContent: 'center',
    },
    profileName: { color: theme.text, fontSize: 21, fontWeight: '800', marginTop: 1 },
    bioLine: { color: theme.cyan, fontSize: 13, marginTop: 6, fontWeight: '700' },
    bioText: { color: theme.muted, fontSize: 14, marginTop: 6, textAlign: 'center' },
    tabs: {
      flexDirection: 'row', borderBottomWidth: 1,
      borderBottomColor: theme.border, marginBottom: 15,
    },
    tab: {
      flex: 1, minHeight: 43, alignItems: 'center',
      justifyContent: 'center', position: 'relative',
    },
    tabText: { color: theme.muted, fontSize: 14, fontWeight: '600' },
    activeTabText: { color: theme.cyan, fontWeight: '800' },
    tabUnderline: {
      position: 'absolute', bottom: -1, height: 3,
      width: '58%', backgroundColor: theme.cyan, borderRadius: 3,
    },
    card: {
      backgroundColor: theme.panel, borderWidth: 1,
      borderColor: theme.border, borderRadius: 17,
      paddingHorizontal: 14, paddingVertical: 13,
      marginBottom: 11, elevation: 3,
      shadowColor: theme.shadow, shadowOpacity: 0.12,
      shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    },
    cardHeading: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 12,
    },
    cardTitle: { color: theme.text, fontSize: 15, fontWeight: '800' },
    publicRow: {
      minHeight: 35, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'space-between',
    },
    publicInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rowLabel: { color: theme.text, fontSize: 14, fontWeight: '600' },
    singleCardRow: {
      minHeight: 33, flexDirection: 'row',
      alignItems: 'center', gap: 10,
    },
    iconBubble: {
      width: 34, height: 34, borderRadius: 12,
      backgroundColor: theme.panel2, alignItems: 'center',
      justifyContent: 'center',
    },
    flexSpace: { flex: 1 },
    seeAll: { color: theme.cyan, fontSize: 13, fontWeight: '700' },
    libraryTitle: {
      color: theme.text, fontSize: 19,
      fontWeight: '800', marginTop: 9, marginBottom: 11,
    },
    libraryRow: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
    libraryCard: {
      flex: 1, minWidth: 0, backgroundColor: theme.panel,
      borderWidth: 1, borderColor: theme.border,
      borderRadius: 15, padding: 8, minHeight: 145,
      elevation: 2, shadowColor: theme.shadow,
      shadowOpacity: 0.1, shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    libraryCardHeading: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', gap: 2, marginBottom: 11,
    },
    libraryCardTitle: { flexShrink: 1, color: theme.text, fontSize: 11, fontWeight: '800' },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    photoBox: {
      width: '47%', aspectRatio: 1, backgroundColor: theme.panel2,
      borderRadius: 5, alignItems: 'center', justifyContent: 'center',
    },
    dashboardGraphic: {
      height: 69, backgroundColor: theme.panel2,
      borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    },
    videoStack: { gap: 6, paddingTop: 2 },
    videoItem: {
      height: 18, flexDirection: 'row',
      alignItems: 'center', gap: 4,
      paddingHorizontal: 4, backgroundColor: theme.panel2,
      borderRadius: 5,
    },
    videoLine: { flex: 1, height: 3, borderRadius: 2, backgroundColor: theme.border },
    enterText: {
      color: theme.cyan, fontSize: 11,
      fontWeight: '700', textAlign: 'center', marginTop: 8,
    },
    tabContent: {
      marginTop: 17, padding: 14, borderRadius: 15,
      backgroundColor: theme.panel, borderWidth: 1,
      borderColor: theme.border,
    },
    tabContentTitle: { color: theme.text, fontSize: 15, fontWeight: '800' },
    tabContentDescription: { color: theme.muted, fontSize: 13, marginTop: 5 },
    loadingBox: { paddingVertical: 30, alignItems: 'center', gap: 8 },
    loadingText: { color: theme.muted, fontSize: 12 },
    emptyState: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      padding: 20, backgroundColor: theme.bg,
    },
    emptyTitle: {
      color: theme.text, fontSize: 18,
      fontWeight: '800', marginTop: 12, marginBottom: 16,
      textAlign: 'center',
    },
    primaryAction: {
      backgroundColor: theme.cyan,
      paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999,
    },
    primaryActionText: { color: '#FFFFFF', fontWeight: '700' },
  });
}
