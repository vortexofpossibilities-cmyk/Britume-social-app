
import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { theme } from '../src/lib/theme';
import { supabase } from '../src/lib/supabase';

type RowItem = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  highlight?: boolean;
};

const sections: { title: string; rows: RowItem[] }[] = [
  {
    title: 'Account',
    rows: [
      { label: 'General', icon: 'settings-outline' },
      { label: 'Switch or manage account', icon: 'people-outline' },
      { label: 'Languages', icon: 'globe-outline' },
      { label: 'Time management', icon: 'time-outline' },
      { label: 'Get Britume Premium', icon: 'star-outline', highlight: true },
      { label: 'Manage all history', icon: 'time-outline' },
      { label: 'Privacy', icon: 'shield-checkmark-outline' },
      { label: 'Connected apps', icon: 'link-outline' },
    ],
  },
  {
    title: 'Video and audio preferences',
    rows: [
      { label: 'Video quality pref', icon: 'videocam-outline' },
      { label: 'Playback', icon: 'pause-outline' },
      { label: 'Captions', icon: 'chatbubble-ellipses-outline' },
      { label: 'Data saving', icon: 'server-outline' },
      { label: 'Downloads pref', icon: 'download-outline' },
      { label: 'Like chart', icon: 'bar-chart-outline' },
      { label: 'Accessibility', icon: 'accessibility-outline' },
    ],
  },
  {
    title: 'Help and policy',
    rows: [
      { label: 'Help', icon: 'help-circle-outline' },
      { label: 'Britume terms and services', icon: 'document-text-outline' },
      { label: 'Send feedback', icon: 'chatbox-ellipses-outline' },
      { label: 'About', icon: 'information-circle-outline' },
    ],
  },
];

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const openRow = (label: string) => {
    Alert.alert(label, `${label} settings are not connected yet.`);
  };

  const signOut = async () => {
    if (!supabase) {
      Alert.alert(
        'Connection unavailable',
        'BRITUME cannot connect to Supabase. Please check your app environment configuration.'
      );
      return;
    }

    if (signingOut) return;
    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        Alert.alert('Sign out failed', error.message);
        return;
      }

      router.replace('/(auth)/sign-in');
    } catch (error) {
      Alert.alert(
        'Sign out failed',
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred.'
      );
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* BRITUME HEADER */}
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandLetter}>B</Text>
        </View>

        <View style={styles.brandText}>
          <Text style={styles.brandName}>BRITUME</Text>
          <Text style={styles.tagline}>Vortex of Possibilities</Text>
          <Text style={styles.byline}>by brilliant mere</Text>
        </View>

        <View style={styles.pageBadge}>
          <Text style={styles.pageTitle}>Settings</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.push('/(tabs)/more')}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={theme.text} />
        </Pressable>
      </View>

      {/* SETTINGS GROUPS */}
      {sections.map((section, sectionIndex) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          <View style={styles.clayCard}>
            {section.rows.map((row, index) => (
              <Pressable
                key={row.label}
                onPress={() => openRow(row.label)}
                style={({ pressed }) => [
                  styles.settingRow,
                  row.highlight && styles.premiumRow,
                  index !== section.rows.length - 1 &&
                    styles.rowDivider,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.iconClay,
                    sectionIndex === 1 && styles.purpleClay,
                    row.highlight && styles.goldClay,
                  ]}
                >
                  <Ionicons
                    name={row.icon}
                    size={21}
                    color={
                      row.highlight
                        ? '#B98500'
                        : sectionIndex === 1
                          ? theme.purple
                          : theme.cyan
                    }
                  />
                </View>

                <Text style={styles.rowLabel}>{row.label}</Text>

                {row.highlight && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="sparkles" size={12} color="#A47700" />
                    <Text style={styles.premiumText}>PRO</Text>
                  </View>
                )}

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={theme.muted}
                />
              </Pressable>
            ))}
          </View>
        </View>
      ))}

      {/* PERSONAL PREFERENCES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal preferences</Text>

        <View style={styles.clayCard}>
          <View style={styles.switchRow}>
            <View style={styles.iconClay}>
              <Ionicons
                name="moon-outline"
                size={21}
                color={theme.purple}
              />
            </View>

            <View style={styles.switchInfo}>
              <Text style={styles.rowLabel}>Dark mode</Text>
              <Text style={styles.description}>
                Choose your preferred appearance
              </Text>
            </View>

            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{
                false: theme.borderStrong,
                true: theme.cyan,
              }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
            />
          </View>

          <ActionRow
            label="Clear space"
            icon="trash-outline"
            onPress={() => openRow('Clear space')}
          />

          <ActionRow
            label="Early access"
            icon="flask-outline"
            onPress={() => openRow('Early access')}
          />

          <ActionRow
            label="Switch account"
            icon="repeat-outline"
            onPress={() => openRow('Switch account')}
          />

          <Pressable
            disabled={signingOut}
            onPress={() =>
              Alert.alert(
                'Sign out',
                'Are you sure you want to sign out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign out',
                    style: 'destructive',
                    onPress: () => void signOut(),
                  },
                ]
              )
            }
            style={({ pressed }) => [
              styles.settingRow,
              styles.signOutRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.dangerClay}>
              {signingOut ? (
                <ActivityIndicator size="small" color={theme.danger} />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={21}
                  color={theme.danger}
                />
              )}
            </View>

            <Text style={[styles.rowLabel, styles.dangerText]}>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={19}
              color={theme.danger}
            />
          </Pressable>
        </View>
      </View>

      {/* BRAND FOOTER */}
      <View style={styles.footerCard}>
        <View style={styles.footerLogo}>
          <Text style={styles.footerLetter}>B</Text>
        </View>

        <Text style={styles.footerBrand}>BRITUME</Text>
        <Text style={styles.footerTagline}>Vortex of Possibilities</Text>
        <Text style={styles.footerCaption}>
          Your world. Your possibilities.
        </Text>
      </View>
    </ScrollView>
  );
}

function ActionRow({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconClay}>
        <Ionicons name={icon} size={21} color={theme.cyan} />
      </View>

      <Text style={styles.rowLabel}>{label}</Text>

      <Ionicons
        name="chevron-forward"
        size={19}
        color={theme.muted}
      />
    </Pressable>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 27,
  },

  brandMark: {
    width: 53,
    height: 53,
    borderRadius: 19,
    backgroundColor: theme.cyan,
    borderWidth: 3,
    borderColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.blueDark,
    shadowOffset: { width: 6, height: 7 },
    shadowOpacity: 0.26,
    shadowRadius: 10,
    elevation: 8,
  },

  brandLetter: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
  },

  brandText: {
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

  pageBadge: {
    backgroundColor: theme.clayBlue,
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    shadowColor: theme.shadow,
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 9,
    elevation: 6,
  },

  pageTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
  },

  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 16,
    backgroundColor: theme.clay,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadowDark,
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.20,
    shadowRadius: 7,
    elevation: 5,
  },

  section: {
    marginBottom: 23,
  },

  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
    marginLeft: 5,
  },

  clayCard: {
    backgroundColor: theme.clay,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    paddingVertical: 6,
    shadowColor: theme.shadowDark,
    shadowOffset: { width: 8, height: 9 },
    shadowOpacity: 0.22,
    shadowRadius: 13,
    elevation: 9,
  },

  settingRow: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  iconClay: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: theme.shadow,
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.23,
    shadowRadius: 7,
    elevation: 5,
  },

  purpleClay: {
    backgroundColor: theme.clayPurple,
  },

  goldClay: {
    backgroundColor: '#FFF2C5',
    borderColor: '#FFE49A',
  },

  rowLabel: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    fontWeight: '800',
  },

  premiumRow: {
    backgroundColor: '#FFFCF1',
    borderRadius: 18,
    marginHorizontal: 5,
    marginVertical: 4,
    shadowColor: '#D4A72C',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },

  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0B9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    marginRight: 7,
    shadowColor: '#C99A28',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  premiumText: {
    color: '#9A7100',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 3,
  },

  switchRow: {
    minHeight: 79,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  switchInfo: {
    flex: 1,
  },

  description: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 4,
  },

  dangerClay: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    shadowColor: theme.danger,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },

  dangerText: {
    color: theme.danger,
  },

  signOutRow: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: 5,
  },

  pressed: {
    backgroundColor: theme.clayPressed,
    transform: [{ scale: 0.975 }],
  },

  footerCard: {
    backgroundColor: theme.clayBlue,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    alignItems: 'center',
    padding: 22,
    marginTop: 4,
    shadowColor: theme.shadowDark,
    shadowOffset: { width: 7, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 7,
  },

  footerLogo: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
    elevation: 5,
  },

  footerLetter: {
    color: '#FFFFFF',
    fontSize: 26,
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
    marginTop: 10,
  },
});
