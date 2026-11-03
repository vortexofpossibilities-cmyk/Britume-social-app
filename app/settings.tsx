
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '../src/auth/AuthProvider';
import { useAppTheme } from '../src/contexts/ThemeContext';
import { theme as lightTheme } from '../src/lib/theme';

const LANGUAGE_KEY = '@britume_language';

const languages = [
  'English',
  'Setswana',
  'French',
  'Spanish',
  'Portuguese',
  'Arabic',
  'Chinese',
  'Hindi',
  'German',
  'Swahili',
  'Zulu',
  'Afrikaans',
];

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { theme: colors, isDark, setMode } = useAppTheme();

  const [language, setLanguage] = useState('English');
  const [languageModal, setLanguageModal] = useState(false);
  const [signOutModal, setSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  const styles = createStyles(colors);

  useEffect(() => {
    let active = true;

    async function loadLanguage() {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

        if (active && savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.warn('Could not load language setting:', error);
      }
    }

    void loadLanguage();

    return () => {
      active = false;
    };
  }, []);

  const changeTheme = async (value: boolean) => {
    try {
      await setMode(value ? 'dark' : 'light');
    } catch {
      Alert.alert(
        'Settings',
        'Could not save your theme preference. Please try again.',
      );
    }
  };

  const changeLanguage = async (value: string) => {
    setLanguage(value);
    setLanguageModal(false);

    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, value);
    } catch {
      Alert.alert('Settings', 'Could not save your language preference.');
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      setSignOutError('');

      await signOut();

      setSignOutModal(false);
      router.replace('/(auth)/sign-in');
    } catch (error) {
      setSignOutError(
        error instanceof Error
          ? error.message
          : 'Could not sign out. Please try again.',
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

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    color,
    trailing,
  }: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    subtitle: string;
    onPress?: () => void;
    color?: string;
    trailing?: React.ReactNode;
  }) => (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && onPress ? styles.rowPressed : null,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          { backgroundColor: `${color || colors.cyan}20` },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={color || colors.cyan}
        />
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
            color={colors.muted}
          />
        ) : null
      )}
    </Pressable>
  );

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
        </View>

        <Text style={styles.pageTitle}>Settings</Text>
        <Text style={styles.pageSubtitle}>
          Make BRITUME feel like yours.
        </Text>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          <View style={styles.card}>
            <SettingRow
              icon="person-circle-outline"
              title="Edit profile"
              subtitle="Change your name, username and bio"
              onPress={() => router.push('/profile-edit')}
            />

            <View style={styles.separator} />

            <SettingRow
              icon="lock-closed-outline"
              title="Privacy"
              subtitle="Manage your public or private profile"
              color={colors.purple}
              onPress={() => router.push('/profile-edit')}
            />
          </View>
        </View>

        {/* APPEARANCE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>

          <View style={styles.card}>
            <SettingRow
              icon={isDark ? 'moon' : 'sunny-outline'}
              title="Dark mode"
              subtitle={
                isDark
                  ? 'Dark appearance selected'
                  : 'Light appearance selected'
              }
              color={colors.purple}
              trailing={
                <Switch
                  value={isDark}
                  onValueChange={changeTheme}
                  trackColor={{
                    false: '#C8D9EA',
                    true: colors.cyan,
                  }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* LANGUAGE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LANGUAGE</Text>

          <View style={styles.card}>
            <SettingRow
              icon="globe-outline"
              title="App language"
              subtitle={language}
              color="#20A878"
              onPress={() => setLanguageModal(true)}
            />
          </View>
        </View>

        {/* INFORMATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATION</Text>

          <View style={styles.card}>
            <SettingRow
              icon="information-circle-outline"
              title="About BRITUME"
              subtitle="Vortex of Possibilities"
              color={colors.gold}
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
              color={colors.danger}
              onPress={() => {
                setSignOutError('');
                setSignOutModal(true);
              }}
              trailing={
                signingOut ? (
                  <ActivityIndicator color={colors.danger} />
                ) : (
                  <Ionicons
                    name="chevron-forward"
                    size={19}
                    color={colors.danger}
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
          <Text style={styles.footerTagline}>Vortex of Possibilities</Text>
          <Text style={styles.footerNote}>
            Built with possibilities in mind.
          </Text>
        </View>
      </ScrollView>

      {/* SIGN OUT CONFIRMATION */}
      <Modal
        visible={signOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!signingOut) setSignOutModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.languageCard}>
            <View style={styles.signOutIcon}>
              <Ionicons
                name="log-out-outline"
                size={34}
                color={colors.danger}
              />
            </View>

            <Text style={styles.modalTitle}>Sign out of BRITUME?</Text>

            <Text style={styles.modalSubtitle}>
              Are you sure you want to sign out of your account?
            </Text>

            {signOutError ? (
              <Text style={styles.errorText}>{signOutError}</Text>
            ) : null}

            <Pressable
              disabled={signingOut}
              onPress={handleSignOut}
              style={[
                styles.signOutButton,
                signingOut && { opacity: 0.6 },
              ]}
            >
              {signingOut ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signOutButtonText}>
                  Yes, sign out
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={signingOut}
              onPress={() => setSignOutModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* LANGUAGE PICKER */}
      <Modal
        visible={languageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.languageCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choose language</Text>
                <Text style={styles.modalSubtitle}>
                  Select your preferred language.
                </Text>
              </View>

              <Pressable onPress={() => setLanguageModal(false)}>
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={colors.muted}
                />
              </Pressable>
            </View>

            <ScrollView style={styles.languageList}>
              {languages.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => changeLanguage(item)}
                  style={styles.languageOption}
                >
                  <Text style={styles.languageText}>{item}</Text>

                  {language === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.cyan}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.languageNote}>
              Your preference is saved. Automatic app translation will be
              connected when the translation service is integrated.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: typeof lightTheme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
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
      backgroundColor: colors.cyan,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: colors.cyan,
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
      color: colors.text,
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 1.5,
    },

    tagline: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 2,
    },

    pageTitle: {
      color: colors.text,
      fontSize: 29,
      fontWeight: '900',
    },

    pageSubtitle: {
      color: colors.muted,
      fontSize: 13,
      marginTop: 5,
      marginBottom: 24,
    },

    section: {
      marginBottom: 22,
    },

    sectionTitle: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.5,
      marginBottom: 10,
      marginLeft: 5,
    },

    card: {
      backgroundColor: colors.panel,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 23,
      paddingHorizontal: 13,
      paddingVertical: 5,
      elevation: 5,
      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
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
      backgroundColor: colors.panel2,
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
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },

    rowSubtitle: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 4,
    },

    separator: {
      height: 1,
      backgroundColor: colors.border,
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
      backgroundColor: colors.clayBlue,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },

    footerLetter: {
      color: colors.cyan,
      fontSize: 27,
      fontWeight: '900',
    },

    footerName: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 2,
      marginTop: 10,
    },

    footerTagline: {
      color: colors.muted,
      fontSize: 11,
      marginTop: 3,
    },

    footerNote: {
      color: colors.muted,
      fontSize: 10,
      marginTop: 13,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      padding: 22,
    },

    languageCard: {
      maxHeight: '80%',
      backgroundColor: colors.panel,
      borderRadius: 25,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 12,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },

    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
      marginTop: 10,
    },

    modalSubtitle: {
      color: colors.muted,
      fontSize: 12,
      marginTop: 4,
    },

    signOutIcon: {
      width: 60,
      height: 60,
      borderRadius: 20,
      backgroundColor: `${colors.danger}18`,
      alignItems: 'center',
      justifyContent: 'center',
    },

    signOutButton: {
      backgroundColor: colors.danger,
      padding: 15,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 22,
      minHeight: 50,
    },

    signOutButtonText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 15,
    },

    cancelButton: {
      padding: 14,
      alignItems: 'center',
      marginTop: 5,
    },

    cancelText: {
      color: colors.text,
      fontWeight: '800',
    },

    errorText: {
      color: colors.danger,
      fontSize: 12,
      marginTop: 12,
    },

    languageList: {
      maxHeight: 360,
    },

    languageOption: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 12,
    },

    languageText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },

    languageNote: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 15,
    },
  });
}
