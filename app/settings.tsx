import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '../src/auth/AuthProvider';
import { theme } from '../src/lib/theme';

const SETTINGS_KEY = '@britume_settings_v1';

type Preferences = {
  language: string;
  videoQuality: string;
  autoplay: boolean;
  captions: boolean;
  dataSaver: boolean;
  downloadQuality: string;
  earlyAccess: boolean;
};

const DEFAULTS: Preferences = {
  language: 'English',
  videoQuality: 'Auto',
  autoplay: true,
  captions: false,
  dataSaver: false,
  downloadQuality: 'Standard',
  earlyAccess: false,
};

type SettingRowProps = {
  label: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accent?: 'blue' | 'purple' | 'gold' | 'danger';
};

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  const [preferences, setPreferences] =
    useState<Preferences>(DEFAULTS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);

        if (stored && active) {
          const parsed = JSON.parse(stored);

          setPreferences({
            ...DEFAULTS,
            ...parsed,
          });
        }
      } catch {
        Alert.alert(
          'Settings',
          'Your saved preferences could not be loaded. Default settings will be used.'
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const updatePreference = async (
    key: keyof Preferences,
    value: string | boolean
  ) => {
    const next = {
      ...preferences,
      [key]: value,
    };

    setPreferences(next);
    setSaving(true);

    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(next)
      );
    } catch {
      Alert.alert(
        'Could not save',
        'Your device could not save this preference. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const chooseOption = (
    title: string,
    options: string[],
    current: string,
    onChoose: (value: string) => void
  ) => {
    Alert.alert(
      title,
      `Current selection: ${current}`,
      [
        ...options.map(option => ({
          text: option === current ? `✓ ${option}` : option,
          onPress: () => onChoose(option),
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ]
    );
  };

  const openProfile = () => {
    router.push('/profile-edit');
  };

  const openGeneral = () => {
    Alert.alert(
      'BRITUME account',
      `Signed in as:\n${session?.user?.email ?? 'Account email unavailable'}`,
      [
        {
          text: 'Edit profile',
          onPress: openProfile,
        },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const openHistory = () => {
    Alert.alert(
      'Your BRITUME history',
      'Your account activity and post history are stored in their respective BRITUME sections. A complete activity-history screen is not yet available.'
    );
  };

  const openConnectedApps = () => {
    Alert.alert(
      'Connected apps',
      'No third-party app integrations are currently configured in BRITUME.'
    );
  };

  const openPremium = () => {
    Alert.alert(
      'BRITUME Premium',
      'Premium is part of the BRITUME roadmap. Subscription plans and secure payment options are not available yet. You will not be charged from this screen.'
    );
  };

  const openTerms = () => {
    Alert.alert(
      'BRITUME terms and services',
      'The official BRITUME terms and services page has not yet been connected. Please check back when the company policy pages are published.'
    );
  };

  const openHelp = () => {
    Alert.alert(
      'BRITUME Help',
      'Need help? You can send feedback from this Settings screen. Include a description of the problem so it can be investigated.'
    );
  };

  const sendFeedback = async () => {
    try {
      await Share.share({
        title: 'BRITUME feedback',
        message:
          'BRITUME feedback\n\nApp: BRITUME – Vortex of Possibilities\n\nMy feedback or problem:\n',
      });
    } catch {
      Alert.alert(
        'Feedback',
        'Your device could not open the sharing options.'
      );
    }
  };

  const openAbout = () => {
    Alert.alert(
      'About BRITUME',
      'BRITUME\nVortex of Possibilities\n\nCreated by Brilliant Tumelo Mere.\n\nYour world. Your possibilities.'
    );
  };

  const clearSettings = () => {
    Alert.alert(
      'Reset preferences?',
      'This resets the preferences saved by this Settings screen. It will not delete your BRITUME account, posts, messages or profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(SETTINGS_KEY);
              setPreferences(DEFAULTS);

              Alert.alert(
                'Preferences reset',
                'Your BRITUME Settings preferences have been restored to their defaults.'
              );
            } catch {
              Alert.alert(
                'Reset failed',
                'Your preferences could not be reset.'
              );
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign out of BRITUME?',
      'You will need to sign in again to access your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            if (signingOut) return;

            setSigningOut(true);

            try {
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (error) {
              Alert.alert(
                'Sign out failed',
                error instanceof Error
                  ? error.message
                  : 'Please try again.'
              );
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={theme.cyan} />
        <Text style={styles.loadingText}>
          Loading BRITUME Settings...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoLetter}>B</Text>
        </View>

        <View style={styles.brandInfo}>
          <Text style={styles.brandName}>BRITUME</Text>
          <Text style={styles.tagline}>
            Vortex of Possibilities
          </Text>
          <Text style={styles.byline}>by brilliant mere</Text>
        </View>

        <View style={styles.headerBadge}>
          <Ionicons
            name="settings"
            size={16}
            color={theme.cyan}
          />
          <Text style={styles.headerBadgeText}>Settings</Text>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/more')}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={21}
            color={theme.text}
          />
        </Pressable>
      </View>

      {/* ACCOUNT */}
      <Section title="Account and profile" icon="person-circle-outline">
        <SettingRow
          label="General account settings"
          subtitle="View your signed-in account"
          icon="person-outline"
          onPress={openGeneral}
        />

        <SettingRow
          label="Edit profile"
          subtitle="Change your name, username, bio and visibility"
          icon="create-outline"
          onPress={openProfile}
        />

        <SettingRow
          label="Privacy and visibility"
          subtitle="Manage whether your profile is public"
          icon="shield-checkmark-outline"
          onPress={openProfile}
          accent="purple"
        />

        <SettingRow
          label="Language"
          subtitle={`Saved preference: ${preferences.language}`}
          icon="globe-outline"
          onPress={() =>
            chooseOption(
              'Choose language',
              ['English', 'Setswana', 'French', 'Portuguese'],
              preferences.language,
              value => void updatePreference('language', value)
            )
          }
        />

        <SettingRow
          label="Time management"
          subtitle="Your device controls BRITUME's local time"
          icon="time-outline"
          onPress={() =>
            Alert.alert(
              'Time management',
              'BRITUME currently follows your phone’s date, time and time-zone settings. Change these in your Android device settings.'
            )
          }
        />

        <SettingRow
          label="Manage history"
          subtitle="Information about your account activity"
          icon="calendar-outline"
          onPress={openHistory}
        />

        <SettingRow
          label="Connected apps"
          subtitle="Third-party integrations"
          icon="link-outline"
          onPress={openConnectedApps}
        />
      </Section>

      {/* PREMIUM */}
      <Pressable
        onPress={openPremium}
        style={({ pressed }) => [
          styles.premiumCard,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.premiumIcon}>
          <Ionicons
            name="sparkles"
            size={27}
            color="#A47700"
          />
        </View>

        <View style={styles.premiumInfo}>
          <Text style={styles.premiumTitle}>
            BRITUME PREMIUM
          </Text>
          <Text style={styles.premiumSubtitle}>
            Discover future premium experiences
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={21}
          color="#A47700"
        />
      </Pressable>

      {/* VIDEO */}
      <Section title="Video and audio" icon="videocam-outline">
        <SettingRow
          label="Video quality"
          subtitle={`Preferred quality: ${preferences.videoQuality}`}
          icon="videocam-outline"
          accent="purple"
          onPress={() =>
            chooseOption(
              'Video quality',
              ['Auto', 'Low', 'Medium', 'High', '1080p'],
              preferences.videoQuality,
              value => void updatePreference('videoQuality', value)
            )
          }
        />

        <PreferenceSwitch
          label="Autoplay preference"
          subtitle="Save whether you prefer videos to autoplay"
          icon="play-circle-outline"
          value={preferences.autoplay}
          onChange={value =>
            void updatePreference('autoplay', value)
          }
        />

        <PreferenceSwitch
          label="Captions preference"
          subtitle="Save your preferred captions setting"
          icon="chatbubble-ellipses-outline"
          value={preferences.captions}
          onChange={value =>
            void updatePreference('captions', value)
          }
        />

        <PreferenceSwitch
          label="Data saving"
          subtitle="Save your preference for lower data usage"
          icon="server-outline"
          value={preferences.dataSaver}
          onChange={value =>
            void updatePreference('dataSaver', value)
          }
        />

        <SettingRow
          label="Download quality"
          subtitle={`Preferred quality: ${preferences.downloadQuality}`}
          icon="download-outline"
          onPress={() =>
            chooseOption(
              'Download quality',
              ['Standard', 'High', 'Data saver'],
              preferences.downloadQuality,
              value => void updatePreference('downloadQuality', value)
            )
          }
        />
      </Section>

      {/* APPEARANCE */}
      <Section title="Appearance" icon="color-palette-outline">
        <View style={styles.infoRow}>
          <View style={styles.iconTile}>
            <Ionicons
              name="sunny-outline"
              size={21}
              color={theme.cyan}
            />
          </View>

          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>BRITUME light theme</Text>
            <Text style={styles.rowSubtitle}>
              Your current app theme is soft blue and white.
            </Text>
          </View>

          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={theme.muted}
          />
          <Text style={styles.noticeText}>
            A global dark-mode switch is not connected yet. This screen
            will not show a switch that changes only itself.
          </Text>
        </View>
      </Section>

      {/* HELP */}
      <Section title="Help and BRITUME" icon="help-circle-outline">
        <SettingRow
          label="Help and support"
          subtitle="Information about getting assistance"
          icon="help-circle-outline"
          onPress={openHelp}
        />

        <SettingRow
          label="Send feedback"
          subtitle="Share your suggestions or report a problem"
          icon="chatbox-ellipses-outline"
          onPress={() => void sendFeedback()}
        />

        <SettingRow
          label="Terms and services"
          subtitle="BRITUME policy information"
          icon="document-text-outline"
          onPress={openTerms}
        />

        <SettingRow
          label="About BRITUME"
          subtitle="Company and app information"
          icon="information-circle-outline"
          onPress={openAbout}
        />

        <SettingRow
          label="Early access"
          subtitle={
            preferences.earlyAccess
              ? 'You have opted in'
              : 'Opt in to express interest in future features'
          }
          icon="flask-outline"
          accent="purple"
          onPress={() =>
            Alert.alert(
              'Early access',
              'Would you like to save your interest in future BRITUME early-access features?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: preferences.earlyAccess ? 'Turn off' : 'Opt in',
                  onPress: () =>
                    void updatePreference(
                      'earlyAccess',
                      !preferences.earlyAccess
                    ),
                },
              ]
            )
          }
        />
      </Section>

      {/* DEVICE SETTINGS */}
      <Section title="Device preferences" icon="phone-portrait-outline">
        <SettingRow
          label="Reset saved preferences"
          subtitle="Restore this screen's settings to defaults"
          icon="refresh-outline"
          onPress={clearSettings}
        />

        <SettingRow
          label="Clear space"
          subtitle="Manage storage from your device settings"
          icon="trash-outline"
          onPress={() =>
            Alert.alert(
              'Clear space',
              'This version of BRITUME does not yet have a complete media-cache manager. You can review app storage in Android Settings → Apps → BRITUME → Storage. Avoid choosing Clear data unless you understand that it may remove local app information.'
            )
          }
        />
      </Section>

      {/* SIGN OUT */}
      <Pressable
        disabled={signingOut}
        onPress={handleSignOut}
        style={({ pressed }) => [
          styles.signOutButton,
          pressed && styles.pressed,
        ]}
      >
        {signingOut ? (
          <ActivityIndicator color={theme.danger} />
        ) : (
          <Ionicons
            name="log-out-outline"
            size={22}
            color={theme.danger}
          />
        )}

        <Text style={styles.signOutText}>
          {signingOut ? 'Signing out...' : 'Sign out of BRITUME'}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={theme.danger}
        />
      </Pressable>

      {saving && (
        <View style={styles.savingInfo}>
          <ActivityIndicator size="small" color={theme.cyan} />
          <Text style={styles.savingText}>
            Saving preference...
          </Text>
        </View>
      )}

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.footerLogo}>
          <Text style={styles.footerLetter}>B</Text>
        </View>

        <Text style={styles.footerBrand}>BRITUME</Text>
        <Text style={styles.footerTagline}>
          Vortex of Possibilities
        </Text>
        <Text style={styles.footerCaption}>
          Your world. Your possibilities.
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <Ionicons name={icon} size={19} color={theme.cyan} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <View style={styles.card}>{children}</View>
    </View>
  );
}

function SettingRow({
  label,
  subtitle,
  icon,
  onPress,
  accent = 'blue',
}: SettingRowProps) {
  const iconColor =
    accent === 'purple'
      ? theme.purple
      : accent === 'gold'
        ? '#A47700'
        : accent === 'danger'
          ? theme.danger
          : theme.cyan;

  const iconBackground =
    accent === 'purple'
      ? theme.clayPurple
      : accent === 'gold'
        ? '#FFF2C5'
        : accent === 'danger'
          ? '#FFF0F1'
          : theme.clayBlue;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.iconTile,
          { backgroundColor: iconBackground },
        ]}
      >
        <Ionicons name={icon} size={21} color={iconColor} />
      </View>

      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{label}</Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        ) : null}
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={theme.muted}
      />
    </Pressable>
  );
}

function PreferenceSwitch({
  label,
  subtitle,
  icon,
  value,
  onChange,
}: {
  label: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={21} color={theme.purple} />
      </View>

      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{
          false: theme.borderStrong,
          true: theme.cyan,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  content: {
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 45,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },

  loadingText: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  logo: {
    width: 51,
    height: 51,
    borderRadius: 18,
    backgroundColor: theme.cyan,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.blueDark,
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 9,
    elevation: 7,
  },

  logoLetter: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  brandInfo: {
    flex: 1,
    marginLeft: 10,
  },

  brandName: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },

  tagline: {
    color: theme.muted,
    fontSize: 10,
    fontWeight: '700',
  },

  byline: {
    color: theme.muted,
    fontSize: 10,
  },

  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    ...theme.clayRaised,
  },

  headerBadgeText: {
    color: theme.text,
    fontSize: 12,
    fontWeight: '900',
  },

  headerButton: {
    width: 41,
    height: 41,
    borderRadius: 15,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    ...theme.clayRaised,
  },

  section: {
    marginBottom: 21,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginLeft: 5,
  },

  sectionTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '900',
  },

  card: {
    backgroundColor: theme.panel,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    paddingVertical: 5,
    overflow: 'hidden',
    ...theme.clayShadow,
  },

  row: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  iconTile: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    ...theme.clayRaised,
  },

  rowInfo: {
    flex: 1,
    paddingRight: 7,
  },

  rowTitle: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '800',
  },

  rowSubtitle: {
    color: theme.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  switchRow: {
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  premiumCard: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 23,
    borderRadius: 23,
    backgroundColor: '#FFFCF1',
    borderWidth: 1,
    borderColor: '#FFE49A',
    shadowColor: '#D4A72C',
    shadowOffset: { width: 6, height: 7 },
    shadowOpacity: 0.19,
    shadowRadius: 10,
    elevation: 7,
  },

  premiumIcon: {
    width: 47,
    height: 47,
    borderRadius: 17,
    backgroundColor: '#FFF0B9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#FFE49A',
  },

  premiumInfo: {
    flex: 1,
  },

  premiumTitle: {
    color: '#956D00',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  premiumSubtitle: {
    color: '#9C8549',
    fontSize: 10,
    marginTop: 4,
  },

  infoRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  activeBadge: {
    backgroundColor: '#E3F8EF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },

  activeText: {
    color: theme.success,
    fontSize: 9,
    fontWeight: '900',
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 11,
    backgroundColor: theme.panel2,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: theme.border,
  },

  noticeText: {
    flex: 1,
    color: theme.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  signOutButton: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    paddingHorizontal: 15,
    borderRadius: 19,
    backgroundColor: '#FFF0F1',
    borderWidth: 1,
    borderColor: '#F5D0D3',
    ...theme.clayRaised,
  },

  signOutText: {
    flex: 1,
    color: theme.danger,
    fontSize: 14,
    fontWeight: '900',
  },

  savingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 13,
  },

  savingText: {
    color: theme.muted,
    fontSize: 11,
  },

  pressed: {
    backgroundColor: theme.clayPressed,
    transform: [{ scale: 0.98 }],
  },

  footer: {
    alignItems: 'center',
    marginTop: 28,
    padding: 22,
    borderRadius: 24,
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    ...theme.clayRaised,
  },

  footerLogo: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
    elevation: 5,
  },

  footerLetter: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },

  footerBrand: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footerTagline: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  footerCaption: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 9,
  },
});
