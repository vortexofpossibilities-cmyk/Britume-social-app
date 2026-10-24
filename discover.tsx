import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text } from 'react-native';
import { Action, Copy, Heading, Panel, Page } from '../../src/components/UI';
import { supabase } from '../../src/lib/supabase';
import { theme as C } from '../../src/lib/theme';

type Profile = { user_id: string; username: string | null; display_name: string | null; bio: string | null };
export default function Discover() {
  const [people, setPeople] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    if (!supabase) return;
    setBusy(true);
    const { data, error: e } = await supabase.from('profiles').select('user_id,username,display_name,bio').eq('is_public', true).order('created_at', { ascending: false }).limit(50);
    if (e) setError(e.message); else { setError(''); setPeople(data ?? []); }
    setBusy(false);
  };
  useEffect(() => { load(); }, []);
  return <Page><ScrollView>
    <Heading>Discover</Heading><Copy>Find real BRITUME members who have chosen public profiles.</Copy>
    <Action title="Refresh people" secondary onPress={load} />
    {busy && <ActivityIndicator color={C.cyan} style={{ marginTop: 20 }} />}
    {!!error && <Copy>{error}</Copy>}
    {!busy && !error && people.length === 0 && <Panel><Text style={{ color: C.text, fontWeight: '800' }}>No public profiles yet</Text><Copy>As people join BRITUME and choose public profiles, they will appear here.</Copy></Panel>}
    {people.map(p => <Panel key={p.user_id}>
      <Text style={{ color: C.text, fontWeight: '800' }}>{p.display_name || 'BRITUME member'}</Text>
      {!!p.username && <Text style={{ color: C.cyan, marginTop: 3 }}>@{p.username}</Text>}
      {!!p.bio && <Copy>{p.bio}</Copy>}
    </Panel>)}
  </ScrollView></Page>;
}
