
import React, { useCallback, useState } from 'react';
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
import {
  fetchCurrentUserProfile,
  getProfileName,
  updateOwnProfile,
  type ProfileRecord,
} from '../../src/lib/profile';
import { theme } from '../../src/lib/theme';

type ProfileTab = 'Photos' | 'Create' | 'Hosts';

const profileTabs: ProfileTab[] = ['Photos', 'Create', 'Hosts'];

export default function ProfileScreen() {
  const { session } = useAuth();

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
        'Profile unavailable',
        error instanceof Error
          ? error.message
          : 'Could not load your profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const handleTogglePublic = async (value: boolean) => {
    if (!session?.user?.id || saving) {
      return;
    }

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
        'Update failed',
        error instanceof Error
          ? error.message
          : 'Could not update your visibility.'
      );
    } finally {
      setSaving(false);
    }
  };

  const displayName = getProfileName(profile);

  if (!session) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="person-circle-outline"
            size={52}
            color={theme.cyan}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Sign in to view your profile
        </Text>

        <Text style={styles.emptyDescription}>
          Your BRITUME profile, creations and personal library will be here.
        </Text>

        <Pressable
          style={styles.primaryAction}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.primaryActionText}>
            Go to sign in
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
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
        <View>
          <Text style={styles.eyebrow}>BRITUME ACCOUNT</Text>
          <Text style={styles.pageTitle}>My Profile</Text>
        </View>

        <Pressable
          accessibilityLabel="Profile options"
          style={({ pressed }) => [
            styles.topButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={23}
            color={theme.text}
          />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={theme.cyan} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      ) : (
        <>
          <View style={styles.profileHeader}>
            <View style={styles.avatarOuter}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person"
                  size={43}
                  color={theme.cyan}
                />
              </View>

              <View style={styles.avatarBadge}>
                <Ionicons
                  name="sparkles"
                  size={15}
                  color="#FFFFFF"
                />
              </View>
            </View>

            <Text style={styles.profileName}>{displayName}</Text>

            <Text style={styles.bioLine}>
              {profile?.username
                ? `@${profile.username}`
                : 'Set your username in Edit profile'}
            </Text>

            <Text style={styles.bioText}>
              {profile?.bio ||
                'Add a short personal bio and let the world know you.'}
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
              onPress={() => router.push('/profile-edit')}
            >
              <Ionicons
                name="create-outline"
                size={17}
                color={theme.cyan}
              />
              <Text style={styles.editButtonText}>Edit profile</Text>
            </Pressable>
          </View>

          <View style={styles.tabs}>
            {profileTabs.map((tab) => {
              const selected = activeTab === tab;

              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tab,
                    selected && styles.activeTab,
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      selected && styles.activeTabText,
                    ]}
                  >
                    {tab}
                  </Text>

                  {selected && <View style={styles.tabUnderline} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeading}>
              <View>
                <Text style={styles.cardEyebrow}>YOUR INFORMATION</Text>
                <Text style={styles.cardTitle}>Personal details</Text>
              </View>

              <Pressable
                accessibilityLabel="Edit personal details"
                hitSlop={8}
                style={styles.editIconButton}
                onPress={() => router.push('/profile-edit')}
              >
                <Ionicons
                  name="pencil-outline"
                  size={19}
                  color={theme.cyan}
                />
              </Pressable>
            </View>

            <View style={styles.publicRow}>
              <View style={styles.publicInfo}>
                <View style={styles.iconBubble}>
                  <Ionicons
                    name="globe-outline"
                    size={20}
                    color={theme.cyan}
                  />
                </View>

                <View>
                  <Text style={styles.rowLabel}>Public profile</Text>
                  <Text style={styles.rowDescription}>
                    {profile?.is_public
                      ? 'People can discover your profile'
                      : 'Your profile is private'}
                  </Text>
                </View>
              </View>

              <Switch
                value={Boolean(profile?.is_public ?? true)}
                onValueChange={handleTogglePublic}
                disabled={saving}
                trackColor={{
                  false: theme.border,
                  true: theme.cyan,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={theme.border}
              />
            </View>

            {saving && (
              <View style={styles.savingRow}>
                <ActivityIndicator size="small" color={theme.cyan} />
                <Text style={styles.savingText}>Updating visibility...</Text>
              </View>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.pressedCard,
            ]}
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
                <Ionicons
                  name="person-outline"
                  size={21}
                  color={theme.cyan}
                />
              </View>

              <View>
                <Text style={styles.cardTitle}>
                  {profile?.username
                    ? 'Public profile'
                    : 'Create profile link'}
                </Text>
                <Text style={styles.rowDescription}>
                  View how others see your profile
                </Text>
              </View>

              <View style={styles.flexSpace} />

              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.muted}
              />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.pressedCard,
            ]}
            onPress={() =>
              Alert.alert(
                'Subscribers',
                'Your subscriber list will appear here when subscriber data is connected.'
              )
            }
          >
            <View style={styles.singleCardRow}>
              <View style={styles.iconBubblePurple}>
                <Ionicons
                  name="people-outline"
                  size={21}
                  color={theme.purple}
                />
              </View>

              <View>
                <Text style={styles.cardTitle}>Subscribers</Text>
                <Text style={styles.rowDescription}>
                  People following your updates
                </Text>
              </View>

              <View style={styles.flexSpace} />

              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.muted}
              />
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.pressedCard,
            ]}
            onPress={() =>
              Alert.alert(
                'Friends',
                'Your friends list will appear here when friend data is connected.'
              )
            }
          >
            <View style={styles.singleCardRow}>
              <View style={styles.iconBubbleGold}>
                <Ionicons
                  name="people-circle-outline"
                  size={22}
                  color="#B58A16"
                />
              </View>

              <View>
                <Text style={styles.cardTitle}>Friends</Text>
                <Text style={styles.rowDescription}>
                  Your BRITUME connections
                </Text>
              </View>

              <View style={styles.flexSpace} />

              <Text style={styles.seeAll}>See all</Text>

              <Ionicons
                name="chevron-forward"
                size={19}
                color={theme.muted}
              />
            </View>
          </Pressable>

          <View style={styles.libraryHeading}>
            <View>
              <Text style={styles.cardEyebrow}>YOUR COLLECTION</Text>
              <Text style={styles.libraryTitle}>My library</Text>
            </View>

            <View style={styles.libraryBadge}>
              <Ionicons name="folder-open" size={16} color={theme.cyan} />
            </View>
          </View>

          <View style={styles.libraryRow}>
            <Pressable
              style={({ pressed }) => [
                styles.libraryCard,
                pressed && styles.pressedCard,
              ]}
              onPress={() => {
                setActiveTab('Photos');
                Alert.alert(
                  'Photos',
                  'Your photo library will appear here when media storage is connected.'
                );
              }}
            >
              <View style={styles.libraryCardHeading}>
                <Text style={styles.libraryCardTitle}>Photos</Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={theme.cyan}
                />
              </View>

              <View style={styles.photoGrid}>
                {Array.from({ length: 6 }, (_, index) => (
                  <View key={index} style={styles.photoBox}>
                    <Ionicons
                      name="image-outline"
                      size={14}
                      color={theme.muted}
                    />
                  </View>
                ))}
              </View>

              <Text style={styles.enterText}>Enter</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.libraryCard,
                pressed && styles.pressedCard,
              ]}
              onPress={() => router.push('/dashboard')}
            >
              <View style={styles.libraryCardHeading}>
                <Text style={styles.libraryCardTitle}>Dashboard</Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={theme.cyan}
                />
              </View>

              <View style={styles.dashboardGraphic}>
                <Ionicons
                  name="trending-up-outline"
                  size={43}
                  color={theme.cyan}
                />
              </View>

              <Text style={styles.enterText}>Enter</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.libraryCard,
                pressed && styles.pressedCard,
              ]}
              onPress={() => {
                setActiveTab('Create');
                Alert.alert(
                  'Videos',
                  'Your video library will appear here when media storage is connected.'
                );
              }}
            >
              <View style={styles.libraryCardHeading}>
                <Text style={styles.libraryCardTitle}>Videos</Text>
                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={theme.cyan}
                />
              </View>

              <View style={styles.videoStack}>
                {[0, 1, 2].map((item) => (
                  <View key={item} style={styles.videoItem}>
                    <Ionicons
                      name="play-circle-outline"
                      size={17}
                      color={theme.cyan}
                    />
                    <View style={styles.videoLine} />
                  </View>
                ))}
              </View>

              <Text style={styles.enterText}>Enter</Text>
            </Pressable>
          </View>

          <View style={styles.tabContent}>
            <View style={styles.tabContentIcon}>
              <Ionicons
                name={
                  activeTab === 'Photos'
                    ? 'images-outline'
                    : activeTab === 'Create'
                      ? 'color-wand-outline'
                      : 'people-outline'
                }
                size={25}
                color={theme.cyan}
              />
            </View>

            <Text style={styles.tabContentTitle}>{activeTab}</Text>

            <Text style={styles.tabContentDescription}>
              {activeTab === 'Photos'
                ? 'Your photos will appear here.'
                : activeTab === 'Create'
                  ? 'Your creations will appear here.'
                  : 'Your hosts will appear here.'}
            </Text>
          </View>
        </>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 38,
  },
  topBar: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    color: theme.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  pageTitle: {
    color: theme.text,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 2,
  },
  topButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#789BB9',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.17,
    shadowRadius: 6,
    elevation: 4,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  pressedCard: {
    transform: [{ scale: 0.985 }],
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 21,
    paddingHorizontal: 16,
    marginBottom: 17,
    backgroundColor: theme.panel,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#789BB9',
    shadowOffset: { width: 5, height: 7 },
    shadowOpacity: 0.17,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarOuter: {
    width: 108,
    height: 108,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: theme.panel2,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#168BFF',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.cyan,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  bioLine: {
    color: theme.cyan,
    fontSize: 13,
    marginTop: 6,
    fontWeight: '800',
  },
  bioText: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  editButton: {
    minHeight: 39,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 15,
    backgroundColor: theme.panel2,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 13,
  },
  editButtonText: {
    color: theme.cyan,
    fontSize: 13,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#789BB9',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  tab: {
    flex: 1,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: theme.panel2,
  },
  tabText: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  activeTabText: {
    color: theme.cyan,
    fontWeight: '900',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 2,
    height: 3,
    width: '35%',
    backgroundColor: theme.cyan,
    borderRadius: 3,
  },
  card: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 11,
    shadowColor: '#789BB9',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 7,
    elevation: 4,
  },
  cardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  cardEyebrow: {
    color: theme.cyan,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  cardTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '900',
  },
  editIconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: theme.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publicRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  publicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconBubble: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: theme.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubblePurple: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#EFEDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleGold: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#FFF6D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '800',
  },
  rowDescription: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 3,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  savingText: {
    color: theme.muted,
    fontSize: 11,
  },
  singleCardRow: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  flexSpace: {
    flex: 1,
  },
  seeAll: {
    color: theme.cyan,
    fontSize: 12,
    fontWeight: '900',
  },
  libraryHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
    marginBottom: 12,
  },
  libraryTitle: {
    color: theme.text,
    fontSize: 21,
    fontWeight: '900',
  },
  libraryBadge: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#789BB9',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    elevation: 3,
  },
  libraryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  libraryCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 8,
    minHeight: 150,
    shadowColor: '#789BB9',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  libraryCardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    marginBottom: 11,
  },
  libraryCardTitle: {
    flexShrink: 1,
    color: theme.text,
    fontSize: 11,
    fontWeight: '900',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  photoBox: {
    width: '47%',
    aspectRatio: 1,
    backgroundColor: theme.panel2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashboardGraphic: {
    height: 72,
    backgroundColor: theme.panel2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoStack: {
    gap: 6,
    paddingTop: 2,
  },
  videoItem: {
    height: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    backgroundColor: theme.panel2,
    borderRadius: 6,
  },
  videoLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.border,
  },
  enterText: {
    color: theme.cyan,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 9,
  },
  tabContent: {
    marginTop: 17,
    padding: 17,
    borderRadius: 18,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    shadowColor: '#789BB9',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 7,
    elevation: 3,
  },
  tabContentIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.panel2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  tabContentTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '900',
  },
  tabContentDescription: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  loadingBox: {
    paddingVertical: 45,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    backgroundColor: theme.bg,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#789BB9',
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.17,
    shadowRadius: 9,
    elevation: 5,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 18,
    textAlign: 'center',
  },
  emptyDescription: {
    color: theme.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
    textAlign: 'center',
  },
  primaryAction: {
    minHeight: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: theme.cyan,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 15,
    shadowColor: '#168BFF',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 5,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
});
