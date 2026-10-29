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
Alert.alert(label, "${label} options are not connected yet.");
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

    <Text style={styles.pageTitle}>More</Text>
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

            {row.checked && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={theme.cyan}
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
      style={styles.row}
      onPress={() => openRow('Delete account')}
    >
      <Ionicons
        name="trash-outline"
        size={22}
        color={theme.danger}
        style={styles.rowIcon}
      />
      <Text style={[styles.rowText, styles.dangerText]}>
        Delete account
      </Text>
      <Ionicons
        name="chevron-forward"
        size={19}
        color={theme.muted}
      />
    </Pressable>

    <Pressable
      style={[styles.row, styles.rowDivider]}
      onPress={() => openRow('Deactivate')}
    >
      <Ionicons
        name="pause-outline"
        size={22}
        color={theme.cyan}
        style={styles.rowIcon}
      />
      <Text style={styles.rowText}>Deactivate</Text>
      <Ionicons
        name="chevron-forward"
        size={19}
        color={theme.muted}
      />
    </Pressable>

    <Pressable
      style={styles.row}
      onPress={() => openRow('Clear my account')}
    >
      <Ionicons
        name="trash-outline"
        size={22}
        color={theme.danger}
        style={styles.rowIcon}
      />
      <Text style={[styles.rowText, styles.dangerText]}>
        Clear my account
      </Text>
      <Ionicons
        name="chevron-forward"
        size={19}
        color={theme.muted}
      />
    </Pressable>
  </View>

  <Pressable
    style={styles.helpBar}
    onPress={() => openRow('Help')}
  >
    <Ionicons
      name="search-outline"
      size={22}
      color={theme.cyan}
    />
    <Text style={styles.helpText}>HELP</Text>
    <Ionicons
      name="chevron-forward"
      size={19}
      color={theme.muted}
    />
  </Pressable>

  <Pressable
    style={styles.settingsLink}
    onPress={() => router.push('/(tabs)/settings')}
  >
    <Ionicons
      name="settings-outline"
      size={19}
      color={theme.cyan}
    />
    <Text style={styles.settingsLinkText}>Open Settings</Text>
  </Pressable>
</ScrollView>

);
}

const styles = StyleSheet.create({
screen: { flex: 1, backgroundColor: theme.bg },
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
brandText: { flex: 1, marginLeft: 9 },
brandName: {
color: theme.text,
fontSize: 17,
fontWeight: '900',
},
tagline: { color: theme.muted, fontSize: 10 },
byline: { color: theme.muted, fontSize: 10 },
pageTitle: {
color: theme.text,
fontSize: 17,
fontWeight: '800',
marginLeft: 8,
},
section: { marginBottom: 18 },
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
marginBottom: 12,
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
rowIcon: { width: 29, marginRight: 8 },
rowText: {
flex: 1,
color: theme.text,
fontSize: 15,
fontWeight: '600',
},
checkIcon: { marginRight: 7 },
dangerText: { color: theme.danger },
helpBar: {
minHeight: 51,
flexDirection: 'row',
alignItems: 'center',
gap: 12,
paddingHorizontal: 15,
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
borderRadius: 18,
marginTop: 1,
},
helpText: {
flex: 1,
color: theme.text,
fontSize: 15,
fontWeight: '800',
letterSpacing: 1,
},
settingsLink: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 8,
padding: 15,
},
settingsLinkText: {
color: theme.cyan,
fontSize: 14,
fontWeight: '700',
},
});
