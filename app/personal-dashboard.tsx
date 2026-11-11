
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/auth/AuthProvider';
import { useAppTheme } from '../src/contexts/ThemeContext';

type AdminStats = {
  users: number | null;
  pendingRecoveries: number | null;
  walletActivity: number | null;
};

const adminSections = [
  {
    title: 'User Management',
    description: 'Review accounts, profiles and user reports.',
    icon: 'people-outline' as const,
    route: '/admin/users',
  },
  {
    title: 'Wallet Management',
    description: 'Review wallet activity and payment operations.',
    icon: 'wallet-outline' as const,
    route: '/admin/wallet',
  },
  {
    title: 'PIN Recovery Approvals',
    description: 'Review authorised wallet recovery requests.',
    icon: 'shield-checkmark-outline' as const,
    route: '/admin/pin-recovery',
  },
  {
    title: 'Rewards Management',
    description: 'Manage rewards, games and prize approvals.',
    icon: 'gift-outline' as const,
    route: '/admin/rewards',
  },
  {
    title: 'Reports and Safety',
    description: 'Review reports and platform safety issues.',
    icon: 'flag-outline' as const,
    route: '/admin/reports',
  },
  {
    title: 'Advertisement Review',
    description: 'Approve or reject submitted advertising campaigns.',
    icon: 'megaphone-outline' as const,
    route: '/admin-advertisements',
  },
  {
    title: 'Platform Settings',
    description: 'Manage BRITUME platform configuration.',
    icon: 'settings-outline' as const,
    route: '/admin/settings',
  },
];

export default function PersonalDashboardScreen() {
  const { theme } = useAppTheme();
  const { session, loading: authLoading, signOut } = useAuth();

  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<AdminStats>({
    users: null,
    pendingRecoveries: null,
    walletActivity: null,
  });

  const styles = createStyles(theme);

  const loadDashboard = useCallback(async () => {
    if (!session?.user || !supabase) {
      setIsAdmin(false);
      setError('Please sign in with an authorised administrator account.');
      setChecking(false);
      return;
    }

    setChecking(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'is_britume_admin',
      );

      if (rpcError) throw rpcError;

      if (data !== true) {
        setIsAdmin(false);
        setError(
          'This area is restricted to authorised BRITUME administrators.',
        );
        return;
      }

      setIsAdmin(true);

      const [usersResult, recoveryResult, ledgerResult] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('wallet_pin_recovery_requests')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'under_review']),
          supabase
            .from('wallet_ledger')
            .select('*', { count: 'exact', head: true }),
        ]);

      setStats({
        users: usersResult.error ? null : usersResult.count ?? 0,
        pendingRecoveries: recoveryResult.error
          ? null
          : recoveryResult.count ?? 0,
        walletActivity: ledgerResult.error
          ? null
          : ledgerResult.count ?? 0,
      });
    } catch {
      setIsAdmin(false);
      setError(
        'Administrator verification is unavailable. Access has been blocked.',
      );
    } finally {
      setChecking(false);
      setRefreshing(false);
    }
  }, [session?.user]);

  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        void loadDashboard();
      }
    }, [authLoading, loadDashboard]),
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/' as never);
    } catch {
      setError('Sign out failed. Please try again.');
    }
  };

  if (authLoading || checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.cyan} />
        <Text style={styles.message}>
          Verifying administrator access...
        </Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed" size={34} color="#EF4444" />
        </View>

        <Text style={styles.deniedTitle}>Restricted Area</Text>
        <Text style={styles.message}>
          {error || 'You are not authorised to access this dashboard.'}
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/' as never)}
        >
          <Text style={styles.backButtonText}>Return to BRITUME</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void loadDashboard();
          }}
          tintColor={theme.cyan}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>PRIVATE CONTROL CENTRE</Text>
          <Text style={styles.title}>Personal Dashboard</Text>
          <Text style={styles.subtitle}>
            BRITUME owner and administrator workspace
          </Text>
        </View>

        <View style={styles.ownerIcon}>
          <Ionicons name="shield-checkmark" size={27} color="#FBBF24" />
        </View>
      </View>

      <View style={styles.welcomeCard}>
        <View style={styles.welcomeIcon}>
          <Ionicons name="business-outline" size={25} color={theme.cyan} />
        </View>

        <View style={styles.welcomeText}>
          <Text style={styles.welcomeTitle}>Welcome to BRITUME Control</Text>
          <Text style={styles.welcomeSubtitle}>
            Administrator access verified for this session.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Platform overview</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={23} color={theme.cyan} />
          <Text style={styles.statValue}>
            {stats.users === null ? '—' : stats.users.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Total users</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="time-outline"
            size={23}
            color="#F59E0B"
          />
          <Text style={styles.statValue}>
            {stats.pendingRecoveries === null
              ? '—'
              : stats.pendingRecoveries.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Pending PIN approvals</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="wallet-outline"
            size={23}
            color="#8B5CF6"
          />
          <Text style={styles.statValue}>
            {stats.walletActivity === null
              ? '—'
              : stats.walletActivity.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Wallet ledger entries</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="trending-up-outline"
            size={23}
            color="#10B981"
          />
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>Platform earnings</Text>
          <Text style={styles.statNote}>
            Awaiting verified revenue reporting
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Management centre</Text>

      {adminSections.map((item) => (
        <Pressable
          key={item.title}
          style={styles.sectionCard}
          onPress={() => router.push(item.route as never)}
        >
          <View style={styles.sectionIcon}>
            <Ionicons name={item.icon} size={23} color={theme.cyan} />
          </View>

          <View style={styles.sectionText}>
            <Text style={styles.sectionName}>{item.title}</Text>
            <Text style={styles.sectionDescription}>
              {item.description}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.muted}
          />
        </Pressable>
      ))}

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>

      <Text style={styles.footer}>
        Private administrator interface. All management actions must be
        independently authorised and audited by the backend.
      </Text>
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
    center: {
      flex: 1,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 28,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    headerText: {
      flex: 1,
    },
    eyebrow: {
      color: theme.cyan,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 1.5,
    },
    title: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '900',
      marginTop: 6,
    },
    subtitle: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 5,
    },
    ownerIcon: {
      width: 49,
      height: 49,
      borderRadius: 16,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
    },
    welcomeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 15,
      marginBottom: 25,
    },
    welcomeIcon: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeText: {
      flex: 1,
      marginLeft: 12,
    },
    welcomeTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '900',
    },
    welcomeSubtitle: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 5,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 13,
      marginTop: 7,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    statCard: {
      width: '48%',
      flexGrow: 1,
      minHeight: 125,
      backgroundColor: theme.panel,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 13,
    },
    statValue: {
      color: theme.text,
      fontSize: 23,
      fontWeight: '900',
      marginTop: 9,
    },
    statLabel: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '800',
      marginTop: 3,
    },
    statNote: {
      color: theme.muted,
      fontSize: 9,
      marginTop: 5,
    },
    sectionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 15,
      padding: 13,
      marginBottom: 10,
    },
    sectionIcon: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionText: {
      flex: 1,
      marginLeft: 12,
    },
    sectionName: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '900',
    },
    sectionDescription: {
      color: theme.muted,
      fontSize: 10,
      lineHeight: 15,
      marginTop: 4,
    },
    lockIcon: {
      width: 75,
      height: 75,
      borderRadius: 25,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 17,
    },
    deniedTitle: {
      color: theme.text,
      fontSize: 23,
      fontWeight: '900',
      marginBottom: 10,
    },
    message: {
      color: theme.muted,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
      marginTop: 10,
    },
    backButton: {
      backgroundColor: theme.cyan,
      borderRadius: 13,
      paddingHorizontal: 22,
      paddingVertical: 13,
      marginTop: 22,
    },
    backButtonText: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      backgroundColor: '#DC2626',
      borderRadius: 14,
      padding: 15,
      marginTop: 22,
    },
    signOutText: {
      color: '#FFFFFF',
      fontWeight: '900',
    },
    footer: {
      color: theme.muted,
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 18,
    },
  });
}
