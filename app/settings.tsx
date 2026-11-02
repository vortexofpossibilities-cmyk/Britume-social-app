import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '../src/auth/AuthProvider';
import { theme } from '../src/lib/theme';

type SettingRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress?: () => void;
  color?: string;
  trailing?: React.ReactNode;
};

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  color = theme.cyan,
  trailing,
}: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress ? styles.rowPressed : null,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>

      {trailing || (
        onPress ? (
          <Ionicons
            name="chevron-forward"
            size={19}
            color={theme.muted}
          />
        ) : null
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const openProfileEditor = () => {
    router.push('/profile-edit');
  };

  const confirmSignOut = () => {
    Alert.alert(
      'Sign out',
      'Are you sure you want to sign out of BRITUME?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: handleSignOut,
        },
      ],
    );
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      Alert.alert(
        'Sign out failed',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );
    } finally {
      setSigningOut(false);
    }
  };

  const showAbout = () => {
    Alert.alert(
      'About BRITUME',
      'BRITUME\nVortex of Possibilities\n\nCreated by Brilliant Tumelo Mere.',
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandLetter}>B</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.brandName}>BRITUME</Text>
            <Text style={styles.tagline}>Vortex of Possibilities</Text>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/more')}
            style={styles.moreButton}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={23}
              color={theme.text}
            />
          </Pressable>
        </View>

        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>
          Manage your BRITUME account.
        </Text>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <View style={styles.card}>
            <SettingRow
              icon="person-circle-outline"
              title="Edit profile"
              subtitle="Change your name, username and bio"
              onPress={openProfileEditor}
            />

            <View style={styles.separator} />

            <SettingRow
              icon="lock-closed-outline"
              title="Privacy"
              subtitle="Manage your public or private profile"
              color={theme.purple}
              onPress={openProfileEditor}
            />
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>

          <View style={styles.card}>
            <SettingRow
              icon="language-outline"
              title="Language"
              subtitle="English"
              color="#20A878"
            />
          </View>
        </View>

        {/* ABOUT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATION</Text>

          <View style={styles.card}>
            <SettingRow
              icon="information-circle-outline"
              title="About BRITUME"
              subtitle="Learn about BRITUME"
              color={theme.gold}
              onPress={showAbout}
            />
          </View>
        </View>

        {/* SIGN OUT */}
        <View style={styles.section}>
          <View style={styles.card}>
            <SettingRow
              icon="log-out-outline"
              title="Sign out"
              subtitle="Sign out of your account"
              color={theme.danger}
              onPress={confirmSignOut}
              trailing={
                signingOut ? (
                  <ActivityIndicator color={theme.danger} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={theme.danger}
                  />
                )
              }
            />
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Text style={styles.footerLetter}>B</Text>
          </View>

          <Text style={styles.footerName}>BRITUME</Text>
          <Text style={styles.footerTagline}>
            Vortex of Possibilities
          </Text>
          <Text style={styles.footerNote}>
            Built with possibilities in mind.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 45,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },

  brandIcon: {
    width: 49,
    height: 49,
    borderRadius: 17,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: theme.cyan,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  brandLetter: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  brandName: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  tagline: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 2,
  },

  moreButton: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: theme.panel,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#7A9DBB',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  pageTitle: {
    color: theme.text,
    fontSize: 29,
    fontWeight: '900',
  },

  pageSubtitle: {
    color: theme.muted,
    fontSize: 13,
    marginTop: 5,
    marginBottom: 24,
  },

  section: {
    marginBottom: 22,
  },

  sectionTitle: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginLeft: 5,
  },

  card: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 23,
    paddingHorizontal: 13,
    paddingVertical: 5,
    elevation: 5,
    shadowColor: '#7398BA',
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },

  row: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  rowPressed: {
    backgroundColor: theme.panel2,
    borderRadius: 16,
  },

  iconBox: {
    width: 45,
    height: 45,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rowText: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },

  rowTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '800',
  },

  rowSubtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 4,
  },

  separator: {
    height: 1,
    backgroundColor: theme.border,
    marginLeft: 57,
  },

  footer: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 20,
  },

  footerLogo: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: theme.clayBlue,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },

  footerLetter: {
    color: theme.cyan,
    fontSize: 27,
    fontWeight: '900',
  },

  footerName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 10,
  },

  footerTagline: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 3,
  },

  footerNote: {
    color: theme.muted,
    fontSize: 10,
    marginTop: 13,
  },
});
