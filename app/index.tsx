import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth/AuthProvider';
import { supabaseConfigured } from '../src/lib/supabase';
import { theme } from '../src/lib/theme';

import { withThemeBackground } from '../src/components/ThemeScreen';

function Index() {
  const { session, loading } = useAuth();
  if (!supabaseConfigured) return <Redirect href="/setup" />;
  if (loading) return <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={theme.cyan} size="large" /></View>;
  return <Redirect href={session ? '/(tabs)' : '/(auth)/sign-in'} />;
}

export default withThemeBackground(Index);
