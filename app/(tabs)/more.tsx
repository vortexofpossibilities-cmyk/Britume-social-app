import React, { useMemo } from 'react';
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

import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function MoreScreen() {
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const openSettings = () => {
    router.push('/settings' as never);
  };

  const openInformation = () => {
    Alert.alert(
      t('information'),
      t('aboutMessage'),
    );
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
          <Text style={styles.brandName}>{t('appName')}</Text>
          <Text style={styles.tagline}>{t('tagline')}</Text>
          <Text style={styles.byline}>{t('byline')}</Text>
        </View>

        <View style={styles.pageBadge}>
          <Text style={styles.pageTitle}>{t('more')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('account')}</Text>

      <View style={styles.card}>
        <Pressable
          onPress={openSettings}
          accessibilityRole="button"
          accessibilityLabel={t('personalDetails')}
          style={({ pressed }) => [
            styles.row,
            styles.rowDivider,
            pressed && styles.rowPressed,
          ]}
        >
          <View style={styles.iconTile}>
            <Ionicons
              name="person-outline"
              size={21}
              color={theme.cyan}
            />
          </View>

          <Text style={styles.rowText}>
            {t('personalDetails')}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={theme.muted}
          />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.helpBar,
          pressed && styles.rowPressed,
        ]}
        onPress={openInformation}
        accessibilityRole="button"
        accessibilityLabel={t('information')}
      >
        <View style={styles.helpIcon}>
          <Ionicons
            name="help-circle-outline"
            size={23}
            color={theme.cyan}
          />
        </View>

        <Text style={styles.helpText}>
          {t('information')}
        </Text>

        <Ionicons
          name="chevron-forward"
          size={19}
          color={theme.muted}
        />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.settingsLink,
          pressed && styles.rowPressed,
        ]}
        onPress={openSettings}
        accessibilityRole="button"
        accessibilityLabel={t('openSettings')}
      >
        <Ionicons
          name="settings-outline"
          size={20}
          color={theme.cyan}
        />

        <Text style={styles.settingsLinkText}>
          {t('openSettings')}
        </Text>

        <Ionicons
          name="arrow-forward"
          size={17}
          color={theme.cyan}
        />
      </Pressable>
    </ScrollView>
  );
}

function createStyles(
  theme: ReturnType<typeof useAppTheme>['theme'],
) {
  return StyleSheet.create({
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
      marginBottom: 25,
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
      marginBottom: 18,
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
      width: 39,
      height: 39,
      borderRadius: 14,
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

    rowText: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      fontWeight: '700',
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
      width: 40,
      height: 40,
      borderRadius: 14,
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
      marginTop: 16,
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
      }
