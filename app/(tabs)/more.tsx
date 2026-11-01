
import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../../src/lib/theme';

type RowItem = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  checked?: boolean;
};

const sections: { title: string; rows: RowItem[] }[] = [
  {
    title: 'Your account Management',
    rows: [
      { label: 'Password', icon: 'key-outline' },
      { label: 'Security', icon: 'lock-closed-outline' },
      { label: 'Personal details', icon: 'person-outline' },
      { label: 'Cross profile', icon: 'people-circle-outline' },
      { label: 'Lock app', icon: 'lock-closed-outline', checked: true },
    ],
  },
  {
    title: 'Preferences',
    rows: [
      { label: 'Content pref', icon: 'eye-outline' },
      { label: 'Reaction pref', icon: 'chatbubble-ellipses-outline' },
      { label: 'Notification pref', icon: 'settings-outline' },
      { label: 'Britume updates', icon: 'information-circle-outline' },
      { label: 'Media', icon: 'videocam-outline' },
    ],
  },
  {
    title: 'Audience and visibility',
    rows: [
      { label: 'Profile locking', icon: 'lock-closed-outline' },
      { label: 'Profile details', icon: 'person-outline' },
      { label: 'Post', icon: 'document-outline' },
      { label: 'Stories', icon: 'chatbubble-ellipses-outline' },
      { label: 'Subscribers & public content', icon: 'people-outline' },
      { label: 'Blocking', icon: 'ban-outline' },
      { label: 'Active people', icon: 'people-circle-outline' },
    ],
  },
  {
    title: 'Your Activity',
    rows: [
      { label: 'Activity log', icon: 'time-outline' },
      { label: 'Location', icon: 'location-outline' },
      { label: 'Apps and websites', icon: 'apps-outline' },
      { label: 'Business integrations', icon: 'briefcase-outline' },
      { label: 'Learn how to manage', icon: 'help-circle-outline' },
    ],
  },
];

export default function MoreScreen() {
  const openRow = (label: string) => {
    Alert.alert(label, `${label} is coming soon in BRITUME.`);
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
          <Text style={styles.pageTitle}>More</Text>
        </View>
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
                  index < section.rows.length - 1 && styles.rowDivider,
                  pressed && styles.rowPressed,
                ]}
              >
                <View
                  style={[
                    styles.iconTile,
                    sectionIndex % 2 === 1 && styles.purpleTile,
                  ]}
                >
                  <Ionicons
                    name={row.icon}
                    size={20}
                    color={sectionIndex % 2 === 1 ? theme.purple : theme.cyan}
                  />
                </View>

                <Text style={styles.rowText}>{row.label}</Text>

                {row.checked && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.success}
                    style={styles.checkIcon}
                  />
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

      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [
            styles.row,
            styles.rowDivider,
            pressed && styles.rowPressed,
          ]}
          onPress={() => openRow('Delete account')}
        >
          <View style={styles.dangerTile}>
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
          </View>
          <Text style={[styles.rowText, styles.dangerText]}>
            Delete account
          </Text>
          <Ionicons name="chevron-forward" size={19} color={theme.muted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.row,
            styles.rowDivider,
            pressed && styles.rowPressed,
          ]}
          onPress={() => openRow('Deactivate')}
        >
          <View style={styles.iconTile}>
            <Ionicons name="pause-outline" size={20} color={theme.cyan} />
          </View>
          <Text style={styles.rowText}>Deactivate</Text>
          <Ionicons name="chevron-forward" size={19} color={theme.muted} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.row,
            pressed && styles.rowPressed,
          ]}
          onPress={() => openRow('Clear my account')}
        >
          <View style={styles.dangerTile}>
            <Ionicons name="trash-outline" size={20} color={theme.danger} />
          </View>
          <Text style={[styles.rowText, styles.dangerText]}>
            Clear my account
          </Text>
          <Ionicons name="chevron-forward" size={19} color={theme.muted} />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.helpBar,
          pressed && styles.rowPressed,
        ]}
        onPress={() => openRow('Help')}
      >
        <View style={styles.helpIcon}>
          <Ionicons name="search-outline" size={22} color={theme.cyan} />
        </View>
        <Text style={styles.helpText}>HELP & SUPPORT</Text>
        <Ionicons name="chevron-forward" size={19} color={theme.muted} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.settingsLink,
          pressed && styles.rowPressed,
        ]}
        onPress={() => router.push('/settings')}
      >
        <Ionicons name="settings-outline" size={20} color={theme.cyan} />
        <Text style={styles.settingsLinkText}>Open Settings</Text>
        <Ionicons name="arrow-forward" size={17} color={theme.cyan} />
      </Pressable>
    </ScrollView>
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
    paddingHorizontal: 2,
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
    marginLeft: 11,
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
    paddingHorizontal: 13,
    paddingVertical: 9,
    shadowColor: theme.shadow,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 3,
  },

  pageTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '800',
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

  rowPressed: {
    backgroundColor: theme.panel2,
    transform: [{ scale: 0.99 }],
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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

  checkIcon: {
    marginRight: 8,
  },

  dangerText: {
    color: theme.danger,
  },

  helpBar: {
    minHeight: 61,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 20,
    marginTop: 2,

    shadowColor: theme.shadow,
    shadowOffset: { width: 4, height: 6 },
    shadowOpacity: 0.17,
    shadowRadius: 8,
    elevation: 5,
  },

  helpIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: theme.clayBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpText: {
    flex: 1,
    color: theme.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    alignSelf: 'center',
    marginTop: 15,
    paddingHorizontal: 19,
    paddingVertical: 13,
    borderRadius: 17,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,

    shadowColor: theme.shadow,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  settingsLinkText: {
    color: theme.cyan,
    fontSize: 14,
    fontWeight: '800',
  },
});
