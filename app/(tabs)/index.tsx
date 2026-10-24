import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { Action, Copy, Heading, Panel, Page } from '../../src/components/UI';
import { supabase } from '../../src/lib/supabase';
import { theme as C } from '../../src/lib/theme';

type Post = { id: string; content: string; created_at: string; user_id: string; profiles?: { display_name: string | null; username: string | null } | null };

export default function Home() {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!supabase) return;
    setBusy(true); setError('');
    const { data, error: e } = await supabase.from('posts')
      .select('id,content,created_at,user_id,profiles(display_name,username)')
      .eq('visibility', 'public').order('created_at', { ascending: false }).limit(50);
    if (e) setError(e.message);
    else setPosts((data ?? []) as unknown as Post[]);
    setBusy(false);
  }, []);
  useEffect(() => { load(); }, [load, session?.user.id]);
  return <Page>
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={{ color: C.cyan, letterSpacing: 4, fontWeight: '900', marginBottom: 12 }}>BRITUME</Text>
      <Heading>Your world, in motion.</Heading>
      <Copy>Find your people. Keep your moments.</Copy>
      <Action title="Create a post" onPress={() => router.push('/(tabs)/create')} />
      <View style={{ marginTop: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Heading>Latest posts</Heading><Pressable onPress={load}><Text style={{ color: C.cyan }}>Refresh</Text></Pressable>
      </View>
      {busy && <ActivityIndicator color={C.cyan} style={{ marginTop: 20 }} />}
      {!!error && <Copy>{error}</Copy>}
      {!busy && !error && posts.length === 0 && <Panel><Text style={{ color: C.text, fontWeight: '800', marginBottom: 6 }}>No posts yet</Text><Copy>There are no public posts yet. Create the first real post.</Copy></Panel>}
      {posts.map(post => <Panel key={post.id}>
        <Text style={{ color: C.text, fontWeight: '800' }}>{post.profiles?.display_name || post.profiles?.username || 'BRITUME member'}</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 3, marginBottom: 12 }}>{new Date(post.created_at).toLocaleString()}</Text>
        <Text style={{ color: C.text, fontSize: 15, lineHeight: 22 }}>{post.content}</Text>
      </Panel>)}
    </ScrollView>
  </Page>;
}
