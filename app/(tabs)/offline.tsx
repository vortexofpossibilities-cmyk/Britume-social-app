import React from 'react';
import { ScrollView, Text } from 'react-native';
import { Copy, Heading, Panel, Page } from '../../src/components/UI';
import { theme } from '../../src/lib/theme';

export default function Offline() {
  return <Page><ScrollView>
    <Heading>Offline library</Heading>
    <Copy>This section will manage audio and videos that the user has permission to save for offline use.</Copy>
    <Panel><Text style={{ color: theme.text, fontWeight: '800', marginBottom: 6 }}>No saved media</Text><Copy>No sample songs or videos are included. Secure offline downloads and personal audio import are not implemented yet.</Copy></Panel>
  </ScrollView></Page>;
}
