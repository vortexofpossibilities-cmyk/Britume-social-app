
import React, { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Link, router } from 'expo-router';
import {
  Action,
  Copy,
  Field,
  Heading,
  Page,
} from '../../src/components/UI';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/lib/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;

    if (!supabase) {
      Alert.alert(
        'Setup required',
        'BRITUME authentication is not configured. Please check the Supabase URL and key.'
      );
      return;
    }

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert(
        'Missing details',
        'Enter your email address and password.'
      );
      return;
    }

    setBusy(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        Alert.alert(
          'Sign in failed',
          error.message
        );
        return;
      }

      router.replace('/(tabs)');
    } catch {
      Alert.alert(
        'Connection problem',
        'Could not reach Supabase. Check your internet connection and project configuration, then try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text
          style={{
            color: theme.cyan,
            letterSpacing: 4,
            fontWeight: '900',
            marginBottom: 20,
          }}
        >
          BRITUME
        </Text>

        <Heading>Welcome back</Heading>
        <Copy>Sign in to your BRITUME account.</Copy>

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Action
          title={busy ? 'Signing in…' : 'Sign in'}
          onPress={submit}
          disabled={busy}
        />

        <Link
          href="/(auth)/sign-up"
          style={{
            color: theme.cyan,
            marginTop: 20,
          }}
        >
          Create a new account
        </Link>
      </ScrollView>
    </Page>
  );
}
