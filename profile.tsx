import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { Action, Copy, Field, Heading, Page } from '../../src/components/UI';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/lib/theme';

export default function Profile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!supabase || !userId) return;
    supabase.from('profiles').select('display_name,username,bio,is_public').eq('user_id', userId).maybeSingle().then(({ data, error }) => {
      if (error) Alert.alert('Profile could not load', error.message);
      if (data) { setDisplayName(data.display_name ?? ''); setUsername(data.username ?? ''); setBio(data.bio ?? ''); setIsPublic(data.is_public ?? true); }
    });
  }, [userId]);
  const save = async () => {
    if (!supabase || !userId) return;
    const cleanUsername = username.trim().replace(/^@/, '');
    if (cleanUsername && !/^[A-Za-z0-9_]{3,30}$/.test(cleanUsername)) {
      Alert.alert('Invalid username', 'Use 3–30 letters, numbers, or underscores.'); return;
    }
    setBusy(true);
    const { error } = await supabase.from('profiles').upsert({
      user_id: userId, display_name: displayName.trim(), username: cleanUsername || null,
      bio: bio.trim(), is_public: isPublic, updated_at: new Date().toISOString()
    });
    setBusy(false);
    if (error) Alert.alert('Could not save profile', error.message);
    else Alert.alert('Saved', 'Your profile was updated.');
  };
  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
  };
  return <Page><ScrollView keyboardShouldPersistTaps="handled">
    <Heading>Your profile</Heading><Copy>{session?.user.email}</Copy>
    <Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
    <Field label="Username" value={username} onChangeText={setUsername} placeholder="your_username" autoCapitalize="none" />
    <Field label="Bio" value={bio} onChangeText={setBio} placeholder="A little about you" multiline />
    <Action title={`Profile visibility: ${isPublic ? 'Public' : 'Private'} (tap to change)`} secondary onPress={() => setIsPublic(v => !v)} />
    <Action title={busy ? 'Saving…' : 'Save profile'} onPress={save} disabled={busy} />
    <Action title="Settings" secondary onPress={() => router.push('/settings')} />
    <Action title="Sign out" secondary onPress={signOut} />
  </ScrollView></Page>;
}
