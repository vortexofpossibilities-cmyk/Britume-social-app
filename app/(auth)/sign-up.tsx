
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

export default function SignUp() {
  const [name, setName] = useState('');
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

    const displayName = name.trim();
    const cleanEmail = email.trim();
    const hasFourNumbers = (password.match(/[0-9]/g) || []).length >= 4;

    if (!displayName || !cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert(
        'Check your details',
        'Enter your display name and a valid email address.'
      );
      return;
    }

    if (password.length < 8 || !hasFourNumbers) {
      Alert.alert(
        'Password too weak',
        'Your password must contain at least 8 characters and at least 4 numbers.'
      );
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (error) {
        Alert.alert('Could not create account', error.message);
        return;
      }

      if (data.session) {
        router.replace('/(tabs)');
      } else {
        Alert.alert(
          'Check your email',
          'Open the confirmation link sent to your email to finish creating your account. If no email arrives, check your spam folder.'
        );
      }
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

        <Heading>Create your account</Heading>
        <Copy>Join BRITUME and connect with real people.</Copy>

        <Field
          label="Display name"
          value={name}
          onChangeText={setName}
        />

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Field
          label="Password (8+ characters, 4+ numbers)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Action
          title={busy ? 'Creating account…' : 'Create account'}
          onPress={submit}
          disabled={busy}
        />

        <Link
          href="/(auth)/sign-in"
          style={{ color: theme.cyan, marginTop: 20 }}
        >
          I already have an account
        </Link>
      </ScrollView>
    </Page>
  );
}
