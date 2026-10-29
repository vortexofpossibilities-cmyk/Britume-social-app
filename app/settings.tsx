
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
  const [darkMode, setDarkMode] = useState(true);
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

      // The AuthProvider should receive the signed-out event.
      // Replace this route if your project uses a different login path.
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
    >
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Text style={styles.brandLetter}>B</Text>
        </View>

        <View style={styles.brandText}>
          <Text style={styles.brandName}>BRITUME</Text>
          <Text style={styles.tagline}>Vortex of Possibilities</Text>
          <Text style={styles.byline}>by brilliant mere</Text>
        </View>

        <Text style={styles.pageTitle}>Settings</Text>

        <Pressable
          accessibilityLabel="More options"
          style={styles.moreButton}
          onPress={() => router.push('/(tabs)/more')}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={23}
            color={theme.text}
          />
        </Pressable>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          <View style={styles.card}>
            {section.rows.map((row, index) => (
              <Pressable
                key={row.label}
                onPress={() => openRow(row.label)}
                style={[
                  styles.row,
                  row.highlight && styles.highlightRow,
                  index < section.rows.length - 1 && styles.rowDivider,
                ]}
              >
                <Ionicons
                  name={row.icon}
                  size={22}
                  color={theme.cyan}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowText}>{row.label}</Text>
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

      <View style={styles.card}>
        <View style={styles.toggleRow}>
          <Ionicons
            name="moon-outline"
            size={22}
            color={theme.cyan}
            style={styles.rowIcon}
          />
          <Text style={styles.rowText}>Dark mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{
              false: theme.border,
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
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          disabled={signingOut}
          style={styles.row}
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
          {signingOut ? (
            <ActivityIndicator
              size="small"
              color={theme.danger}
              style={styles.rowIcon}
            />
          ) : (
            <Ionicons
              name="log-out-outline"
              size={22}
              color={theme.danger}
              style={styles.rowIcon}
            />
          )}

          <Text style={[styles.rowText, styles.dangerText]}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={19}
            color={theme.muted}
          />
        </Pressable>
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
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons
        name={icon}
        size={22}
        color={theme.cyan}
        style={styles.rowIcon}
      />
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
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 19,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },
  brandText: {
    flex: 1,
    marginLeft: 9,
  },
  brandName: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '900',
  },
  tagline: {
    color: theme.muted,
    fontSize: 10,
  },
  byline: {
    color: theme.muted,
    fontSize: 10,
  },
  pageTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 5,
  },
  moreButton: {
    padding: 5,
    marginLeft: 2,
  },
  section: {
    marginBottom: 19,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 9,
    marginLeft: 2,
  },
  card: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 13,
  },
  row: {
    minHeight: 49,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  rowIcon: {
    width: 29,
    marginRight: 8,
  },
  rowText: {
    flex: 1,
    color: theme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  highlightRow: {
    backgroundColor: theme.panel2,
  },
  toggleRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  dangerText: {
    color: theme.danger,
  },
});
