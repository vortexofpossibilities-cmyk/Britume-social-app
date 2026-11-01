
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
            pressed && styles.pressed,
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

      {sections.map((section, sectionIndex) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>

          <View style={styles.card}>
            {section.rows.map((row, index) => (
              <Pressable
                key={row.label}
                onPress={() => openRow(row.label)}
                style={({ pressed }) => [
                  styles.row,
                  row.highlight && styles.highlightRow,
                  index < section.rows.length - 1 && styles.rowDivider,
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
                    size={20}
                    color={
                      row.highlight
                        ? '#B98500'
                        : sectionIndex === 1
                          ? theme.purple
                          : theme.cyan
                    }
                  />
                </View>

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
          <View style={styles.iconTile}>
            <Ionicons
              name="moon-outline"
              size={20}
              color={theme.cyan}
            />
          </View>

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
          style={({ pressed }) => [
            styles.row,
            pressed && styles.pressedRow,
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
              <ActivityIndicator size="small" color={theme.danger} />
            ) : (
              <Ionicons
                name="log-out-outline"
                size={20}
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
            color={theme.muted}
          />
        </Pressable>
      </View>

      <Text style={styles.footer}>
        BRITUME · Vortex of Possibilities
      </Text>
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
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressedRow,
      ]}
      onPress={onPress}
    >
      <View style={styles.iconTile}>
        <Ionicons name={icon} size={20} color={theme.cyan} />
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
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 35,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 23,
  },

  brandMark: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.panel,
    shadowColor: theme.blueDark,
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 7,
  },

  brandLetter: {
    color: '#FFFFFF',
    fontSize: 27,
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
    fontWeight: '600',
  },

  byline: {
    color: theme.muted,
    fontSize: 10,
  },

  pageBadge: {
    backgroundColor: theme.panel,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 11,
    paddingVertical: 9,
    shadowColor: theme.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },

  pageTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '800',
  },

  moreButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 7,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 3,
  },

  section: {
    marginBottom: 19,
  },

  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
    marginLeft: 4,
  },

  card: {
    backgroundColor: theme.clay,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 21,
    overflow: 'hidden',
    marginBottom: 13,
    shadowColor: theme.shadow,
    shadowOffset: { width: 5, height: 7 },
    shadowOpacity: 0.19,
    shadowRadius: 10,
    elevation: 6,
  },

  row: {
    minHeight: 59,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  pressedRow: {
    backgroundColor: theme.panel2,
    transform: [{ scale: 0.99 }],
  },

  iconTile: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 4,
    elevation: 2,
  },

  purpleTile: {
    backgroundColor: theme.clayPurple,
  },

  goldTile: {
    backgroundColor: '#FFF6D8',
  },

  dangerTile: {
    width: 37,
    height: 37,
    borderRadius: 13,
    backgroundColor: '#FFF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  rowText: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },

  highlightRow: {
    backgroundColor: theme.clayPurple,
  },

  toggleRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },

  dangerText: {
    color: theme.danger,
  },

  footer: {
    color: theme.muted,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
});
