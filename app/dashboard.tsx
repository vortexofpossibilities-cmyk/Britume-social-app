import React from 'react';
import {
View,
Text,
ScrollView,
Pressable,
StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../src/contexts/ThemeContext';

export default function UserDashboardScreen() {
const { theme } = useAppTheme();
const styles = createStyles(theme);

const open = (path: string) => {
router.push(path as never);
};

const shortcuts = [
{
title: 'My Wallet',
subtitle: 'Balance and transactions',
icon: 'wallet-outline' as const,
path: '/(tabs)/wallet',
},
{
title: 'Rewards Hub',
subtitle: 'Games and rewards',
icon: 'gift-outline' as const,
path: '/(tabs)/rewards',
},
{
title: 'My Profile',
subtitle: 'Your public profile',
icon: 'person-circle-outline' as const,
path: '/(tabs)/profile',
},
{
title: 'Messages',
subtitle: 'Your conversations',
icon: 'chatbubbles-outline' as const,
path: '/messages',
},
];

return (
<ScrollView
style={styles.screen}
contentContainerStyle={styles.content}
showsVerticalScrollIndicator={false}
>
<View style={styles.header}>
<View>
<Text style={styles.eyebrow}>BRITUME</Text>
<Text style={styles.title}>My Dashboard</Text>
<Text style={styles.subtitle}>
Your account, rewards and activity in one place.
</Text>
</View>

    <View style={styles.headerIcon}>
      <Ionicons name="grid-outline" size={25} color={theme.cyan} />
    </View>
  </View>

  <View style={styles.overviewCard}>
    <Text style={styles.cardLabel}>MY ACCOUNT OVERVIEW</Text>

    <View style={styles.statsRow}>
      <View style={styles.stat}>
        <Ionicons name="wallet-outline" size={21} color={theme.cyan} />
        <Text style={styles.statValue}>—</Text>
        <Text style={styles.statLabel}>Wallet points</Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.stat}>
        <Ionicons name="gift-outline" size={21} color="#F59E0B" />
        <Text style={styles.statValue}>—</Text>
        <Text style={styles.statLabel}>Rewards earned</Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.stat}>
        <Ionicons name="people-outline" size={21} color="#8B5CF6" />
        <Text style={styles.statValue}>—</Text>
        <Text style={styles.statLabel}>Connections</Text>
      </View>
    </View>

    <Text style={styles.dataNote}>
      Your real account figures will appear when the dashboard is connected
      to your BRITUME account and database.
    </Text>
  </View>

  <View style={styles.section}>
    <Text style={styles.sectionTitle}>My membership</Text>

    <View style={styles.membershipCard}>
      <View style={styles.membershipTop}>
        <View style={styles.tierIcon}>
          <Ionicons name="medal-outline" size={25} color="#FBBF24" />
        </View>

        <View style={styles.membershipText}>
          <Text style={styles.membershipTitle}>My BRITUME tier</Text>
          <Text style={styles.membershipSubtitle}>
            Your current tier will appear here.
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={theme.muted} />
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressFill} />
      </View>

      <Text style={styles.progressNote}>
        Tier progress will update from verified qualifying activity.
      </Text>
    </View>
  </View>

  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Quick access</Text>

    {shortcuts.map((item) => (
      <Pressable
        key={item.title}
        style={styles.shortcut}
        onPress={() => open(item.path)}
      >
        <View style={styles.shortcutIcon}>
          <Ionicons name={item.icon} size={23} color={theme.cyan} />
        </View>

        <View style={styles.shortcutText}>
          <Text style={styles.shortcutTitle}>{item.title}</Text>
          <Text style={styles.shortcutSubtitle}>{item.subtitle}</Text>
        </View>

        <Ionicons name="chevron-forward" size={19} color={theme.muted} />
      </Pressable>
    ))}
  </View>

  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Recent activity</Text>

    <View style={styles.emptyCard}>
      <Ionicons name="time-outline" size={30} color={theme.muted} />
      <Text style={styles.emptyTitle}>Your activity will appear here</Text>
      <Text style={styles.emptyText}>
        Posts, rewards, wallet transactions and account updates will be
        displayed here once connected.
      </Text>
    </View>
  </View>
</ScrollView>

);
}

function createStyles(theme: any) {
return StyleSheet.create({
screen: {
flex: 1,
backgroundColor: theme.bg,
},
content: {
padding: 18,
paddingBottom: 45,
},
header: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 23,
},
eyebrow: {
color: theme.cyan,
fontSize: 11,
fontWeight: '900',
letterSpacing: 2,
},
title: {
color: theme.text,
fontSize: 27,
fontWeight: '900',
marginTop: 5,
},
subtitle: {
color: theme.muted,
fontSize: 12,
marginTop: 5,
},
headerIcon: {
width: 48,
height: 48,
borderRadius: 15,
backgroundColor: theme.panel,
alignItems: 'center',
justifyContent: 'center',
},
overviewCard: {
backgroundColor: theme.panel,
borderRadius: 19,
borderWidth: 1,
borderColor: theme.border,
padding: 17,
},
cardLabel: {
color: theme.muted,
fontSize: 11,
fontWeight: '900',
letterSpacing: 1.2,
marginBottom: 20,
},
statsRow: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
},
stat: {
flex: 1,
alignItems: 'center',
gap: 7,
},
statValue: {
color: theme.text,
fontSize: 22,
fontWeight: '900',
},
statLabel: {
color: theme.muted,
fontSize: 10,
textAlign: 'center',
},
statDivider: {
width: 1,
height: 55,
backgroundColor: theme.border,
},
dataNote: {
color: theme.muted,
fontSize: 10,
lineHeight: 16,
marginTop: 18,
},
section: {
marginTop: 25,
},
sectionTitle: {
color: theme.text,
fontSize: 18,
fontWeight: '900',
marginBottom: 13,
},
membershipCard: {
backgroundColor: theme.panel,
borderRadius: 17,
borderWidth: 1,
borderColor: theme.border,
padding: 16,
},
membershipTop: {
flexDirection: 'row',
alignItems: 'center',
},
tierIcon: {
width: 45,
height: 45,
borderRadius: 14,
backgroundColor: theme.panel2,
alignItems: 'center',
justifyContent: 'center',
},
membershipText: {
flex: 1,
marginLeft: 12,
},
membershipTitle: {
color: theme.text,
fontWeight: '900',
fontSize: 14,
},
membershipSubtitle: {
color: theme.muted,
fontSize: 11,
marginTop: 4,
},
progressTrack: {
height: 8,
borderRadius: 8,
backgroundColor: theme.panel2,
marginTop: 19,
overflow: 'hidden',
},
progressFill: {
width: '0%',
height: 8,
borderRadius: 8,
backgroundColor: theme.cyan,
},
progressNote: {
color: theme.muted,
fontSize: 10,
marginTop: 9,
},
shortcut: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
borderRadius: 15,
padding: 13,
marginBottom: 10,
},
shortcutIcon: {
width: 43,
height: 43,
borderRadius: 13,
backgroundColor: theme.panel2,
alignItems: 'center',
justifyContent: 'center',
},
shortcutText: {
flex: 1,
marginLeft: 12,
},
shortcutTitle: {
color: theme.text,
fontSize: 14,
fontWeight: '800',
},
shortcutSubtitle: {
color: theme.muted,
fontSize: 11,
marginTop: 4,
},
emptyCard: {
alignItems: 'center',
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
borderRadius: 17,
padding: 25,
},
emptyTitle: {
color: theme.text,
fontSize: 14,
fontWeight: '800',
marginTop: 12,
},
emptyText: {
color: theme.muted,
fontSize: 11,
lineHeight: 17,
textAlign: 'center',
marginTop: 7,
},
});
}
