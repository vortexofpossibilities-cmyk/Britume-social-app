import React from 'react';
import { ScrollView, Text } from 'react-native';
import { Page, Heading, Copy, Panel } from '../src/components/UI';
import { theme } from '../src/lib/theme';

export default function Setup() {
  return <Page>
    <ScrollView>
      <Text style={{ color: theme.cyan, fontSize: 14, letterSpacing: 4, fontWeight: '900', marginBottom: 18 }}>BRITUME</Text>
      <Heading>Connect your real backend</Heading>
      <Copy>This app has no seeded profiles, posts, songs, or fake engagement. Connect Supabase to turn on real accounts and shared data.</Copy>
      <Panel>
        <Copy>1. Create a Supabase project.</Copy>
        <Copy>2. Open SQL Editor and run supabase/schema.sql from this project.</Copy>
        <Copy>3. Copy .env.example to .env.</Copy>
        <Copy>4. Add the Supabase project URL and publishable/anon key.</Copy>
        <Copy>5. Restart Expo with npx expo start -c.</Copy>
      </Panel>
    </ScrollView>
  </Page>;
}
