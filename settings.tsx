import React from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Action, Copy, Heading, Panel, Page } from '../src/components/UI';
import { supabase } from '../src/lib/supabase';
import { theme } from '../src/lib/theme';

export default function Settings() {
  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
  };
  return <Page><ScrollView>
    <Heading>Settings</Heading>
    <Panel><Text style={{ color: theme.text, fontWeight: '800', marginBottom: 6 }}>Account</Text><Copy>Sign-in and session are handled by Supabase Auth.</Copy></Panel>
    <Panel><Text style={{ color: theme.text, fontWeight: '800', marginBottom: 6 }}>Privacy</Text><Copy>Profile visibility is editable on your Profile screen. Server-side post access is protected by row-level security policies in the supplied SQL.</Copy></Panel>
    <Panel><Text style={{ color: theme.text, fontWeight: '800', marginBottom: 6 }}>Notifications</Text><Copy>Push notifications are not connected yet.</Copy></Panel>
    <Panel><Text style={{ color: theme.text, fontWeight: '800', marginBottom: 6 }}>Storage and downloads</Text><Copy>Offline media management will appear here after download support is implemented.</Copy></Panel>
    <Panel><Text style={{ color: theme.text, fontWeight: '800', marginBottom: 6 }}>Safety</Text><Copy>Blocking, reporting, and moderation tools are required before opening the app to the public and are not implemented yet.</Copy></Panel>
    <Action title="Sign out" onPress={signOut} secondary />
  </ScrollView></Page>;
}
