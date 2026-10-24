import React, { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { Action, Copy, Field, Heading, Page } from '../../src/components/UI';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/lib/theme';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!supabase) return;
    if (!name.trim() || !email.trim() || password.length < 8) {
      Alert.alert('Check your details', 'Enter a display name, email, and password with at least 8 characters.'); return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { display_name: name.trim() } }
    });
    setBusy(false);
    if (error) Alert.alert('Could not create account', error.message);
    else if (data.session) router.replace('/(tabs)');
    else Alert.alert('Check your email', 'Use the confirmation link from Supabase to finish creating your account.');
  };
  return <Page><ScrollView keyboardShouldPersistTaps="handled">
    <Text style={{ color: theme.cyan, letterSpacing: 4, fontWeight: '900', marginBottom: 20 }}>BRITUME</Text>
    <Heading>Create your account</Heading><Copy>Real people only. No sample accounts.</Copy>
    <Field label="Display name" value={name} onChangeText={setName} />
    <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
    <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
    <Action title={busy ? 'Creating account…' : 'Create account'} onPress={submit} disabled={busy} />
    <Link href="/(auth)/sign-in" style={{ color: theme.cyan, marginTop: 20 }}>I already have an account</Link>
  </ScrollView></Page>;
}
