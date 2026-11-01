
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
      {/* HEADER */}
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
          accessibilityRole="button"
          accessibilityLabel="More options"
          style={({ pressed }) => [
            styles.moreButton,
            pressed && styles.pressedButton,
          ]}
          onPress={() => router.push('/(tabs)/more')}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={22}
            color={theme.text}
          />
        </Pressable>
      </View>

      {/* SETTINGS SECTIONS */}
      {sections.map((section, sectionIndex) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {section.title}
          </Text>

          <View style={styles.card}>
            {section.rows.map((row, index) => (
              <Pressable
                key={row.label}
                accessibilityRole="button"
                onPress={() => openRow(row.label)}
                style={({ pressed }) => [
                  styles.row,
                  row.highlight && styles.highlightRow,
                  index < section.rows.length - 1 &&
                    styles.rowDivider,
                  pressed && styles.pressedRow,
                ]}
              >
                <View
                  style={[
                    styles.iconTile,
                    sectionIndex === 1 && styles.purpleTile,
                    row.highlight && styles.goldTile,
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

                <Text style={styles.rowText}>
                  {row.label}
                </Text>

                {row.highlight && (
                  <View style={styles.premiumBadge}>
                    <Ionicons
                      name="sparkles"
                      size={12}
                      color="#9A7100"
                    />
                    <Text style={styles.premiumText}>
                      PREMIUM
                    </Text>
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

      {/* PREFERENCES CARD */}
      <Text style={styles.sectionTitle}>
        Personal preferences
      </Text>

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <View style={styles.iconTile}>
            <Ionicons
              name="moon-outline"
              size={21}
              color={theme.purple}
            />
          </View>

          <View style={styles.toggleInfo}>
            <Text style={styles.rowText}>Dark mode</Text>
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
            thumbColor={theme.panel}
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

        {/* SIGN OUT */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          disabled={signingOut}
          style={({ pressed }) => [
            styles.row,
            styles.signOutRow,
            pressed && styles.pressedButton,
          ]}
          onPress={() =>
            Alert.alert(
              'Sign out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign out',
                  style: 'destructive',
                  onPress: () => {
                    void signOut();
                  },
                },
              ]
            )
          }
        >
          <View style={styles.dangerTile}>
            {signingOut ? (
              <ActivityIndicator
                size="small"
                color={theme.danger}
              />
            ) : (
              <Ionicons
                name="log-out-outline"
                size={21}
                color={theme.danger}
              />
            )}
          </View>

          <Text style={[styles.rowText, styles.dangerText]}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={theme.danger}
          />
        </Pressable>
      </View>

      {/* FOOTER */}
      <View style={styles.footerCard}>
        <View style={styles.footerLogo}>
          <Text style={styles.footerLetter}>B</Text>
        </View>

        <Text style={styles.footerBrand}>BRITUME</Text>
        <Text style={styles.footerText}>
          Vortex of Possibilities
        </Text>
        <Text style={styles.version}>
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
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressedRow,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconTile}>
        <Ionicons
          name={icon}
          size={21}
          color={theme.cyan}
        />
      </View>

      <Text style={styles.rowText}>{label}</Text>

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
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  brandMark: {
    width: 51,
    height: 51,
    borderRadius: 18,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.panel,
    shadowColor: theme.blueDark,
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 9,
    elevation: 8,
  },

  brandLetter: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  brandText: {
    flex: 1,
    marginLeft: 11,
  },

  brandName: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
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
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: theme.shadowDark,
    shadowOffset: { width: 4, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 5,
  },

  pageTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
  },

  moreButton: {
    width: 41,
    height: 41,
    borderRadius: 15,
    backgroundColor: theme.clay,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadowDark,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.17,
    shadowRadius: 6,
    elevation: 5,
  },

  section: {
    marginBottom: 21,
  },

  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 11,
    marginLeft: 5,
  },

  card: {
    backgroundColor: theme.clay,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: 23,
    marginBottom: 18,
    paddingVertical: 5,
    shadowColor: theme.shadowDark,
    shadowOffset: { width: 7, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 8,
  },

  row: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  pressedRow: {
    backgroundColor: theme.clayPressed,
    transform: [{ scale: 0.985 }],
  },

  pressedButton: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },

  iconTile: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    shadowColor: theme.shadow,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 4,
  },

  purpleTile: {
    backgroundColor: theme.clayPurple,
  },

  goldTile: {
    backgroundColor: '#FFF5D4',
    borderWidth: 1,
    borderColor: '#FFE49A',
  },

  dangerTile: {
    width: 39,
    height: 39,
    borderRadius: 14,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    shadowColor: '#D64545',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },

  rowText: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    fontWeight: '800',
  },

  highlightRow: {
    backgroundColor: '#FFFCF1',
    borderRadius: 15,
    marginHorizontal: 5,
    marginVertical: 3,
  },

  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0B9',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    marginRight: 8,
  },

  premiumText: {
    color: '#9A7100',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 3,
  },

  toggleRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  toggleInfo: {
    flex: 1,
  },

  description: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 3,
  },

  signOutRow: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: 4,
  },

  dangerText: {
    color: theme.danger,
  },

  footerCard: {
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: 22,
    alignItems: 'center',
    padding: 20,
    marginTop: 3,
    shadowColor: theme.shadowDark,
    shadowOffset: { width: 5, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 5,
  },

  footerLogo: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 5,
  },

  footerLetter: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  footerBrand: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footerText: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },

  version: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 9,
  },
});
