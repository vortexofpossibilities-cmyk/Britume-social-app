import React, { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { Action, Copy, Field, Heading, Page } from '../../src/components/UI';
import { supabase } from '../../src/lib/supabase';
import { theme } from '../../src/lib/theme';

export default function Create() {
  const { session } = useAuth();
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const publish = async () => {
    if (!supabase || !session) return;
    const text = content.trim();
    if (!text) { Alert.alert('Write something first', 'A post cannot be empty.'); return; }
    setBusy(true);
    const { error } = await supabase.from('posts').insert({ user_id: session.user.id, content: text, visibility: 'public' });
    setBusy(false);
    if (error) Alert.alert('Post failed', error.message);
    else { setContent(''); Alert.alert('Published', 'Your real post is now saved.'); router.replace('/(tabs)'); }
  };
  return <Page><ScrollView keyboardShouldPersistTaps="handled">
    <Heading>Create</Heading><Copy>Share a text post with BRITUME. Photo and video upload will be added as a separate tested feature.</Copy>
    <Field label="Your post" value={content} onChangeText={setContent} multiline maxLength={2000} placeholder="What would you like to share?" />
    <Text style={{ color: theme.muted, textAlign: 'right' }}>{content.length}/2000</Text>
    <Action title={busy ? 'Publishing…' : 'Publish post'} onPress={publish} disabled={busy} />
  </ScrollView></Page>;
}
