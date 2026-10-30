import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createCommunity,
  fetchCommunities,
  type Community,
} from '../../src/lib/communities';
import { supabaseConfigured } from '../../src/lib/supabase';
import { theme } from '../../src/lib/theme';

export default function CommunitiesScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadCommunities = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      setCommunities(await fetchCommunities());
    } catch (error) {
      Alert.alert(
        'Communities',
        error instanceof Error ? error.message : 'Could not load communities.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  const submitCommunity = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const created = await createCommunity({ name, description });

      setCommunities((current) => [created, ...current]);
      setName('');
      setDescription('');
      setCreating(false);

      Alert.alert('Success', 'Your BRITUME community has been created.');
    } catch (error) {
      Alert.alert(
        'Could not create community',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadCommunities(true)}
          tintColor="#168BFF"
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="trophy" size={15} color="#FFFFFF" />
          <Text style={styles.logoB}>B</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Communities</Text>
          <Text style={styles.subtitle}>
            Find your people. Build something together.
          </Text>
        </View>
      </View>

      {!supabaseConfigured && (
        <Text style={styles.notice}>
          BRITUME is not connected to Supabase. Check your Expo environment variables.
        </Text>
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#168BFF" />
          <Text style={styles.subtitle}>Loading communities...</Text>
        </View>
      ) : communities.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyLogo}>
            <Ionicons name="trophy" size={19} color="#FFFFFF" />
            <Text style={styles.emptyB}>B</Text>
          </View>

          <Text style={styles.emptyTitle}>
            Your community space starts here
          </Text>

          <Text style={styles.subtitle}>
            There are no communities yet. Create the first one and bring
            people together around a shared interest.
          </Text>

          <Pressable
            onPress={() => setCreating(true)}
            style={styles.primaryButton}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>
              Create your first community
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Text style={styles.sectionTitle}>Discover communities</Text>

          {communities.map((community) => (
            <View key={community.id} style={styles.communityCard}>
              <View style={styles.communityLogo}>
                <Text style={styles.communityB}>B</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.communityName}>{community.name}</Text>
                <Text style={styles.subtitle}>
                  {community.description || 'A BRITUME community'}
                </Text>
              </View>
            </View>
          ))}

          <Pressable
            onPress={() => setCreating(true)}
            style={styles.secondaryButton}
          >
            <Ionicons name="add" size={19} color="#168BFF" />
            <Text style={styles.secondaryText}>Create a community</Text>
          </Pressable>
        </View>
      )}

      {creating && (
        <View style={styles.form}>
          <View style={styles.formHeading}>
            <Text style={styles.sectionTitle}>Create a community</Text>
            <Pressable onPress={() => setCreating(false)}>
              <Ionicons name="close" size={23} color={theme.muted} />
            </Pressable>
          </View>

          <Text style={styles.label}>Community name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gaborone Tech"
            placeholderTextColor={theme.muted}
            maxLength={60}
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What is this community about?"
            placeholderTextColor={theme.muted}
            maxLength={500}
            multiline
            style={[styles.input, styles.descriptionInput]}
          />

          <Pressable
            disabled={saving || name.trim().length < 3}
            onPress={() => void submitCommunity()}
            style={[
              styles.primaryButton,
              (saving || name.trim().length < 3) && styles.disabled,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.buttonText}>
              {saving ? 'Creating...' : 'Create community'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 18, paddingBottom: 40, gap: 18 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  logo: {
    width: 54, height: 54, borderRadius: 18,
    backgroundColor: '#168BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  logoB: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  title: { color: theme.text, fontSize: 25, fontWeight: '900' },
  subtitle: { color: theme.muted, fontSize: 13, lineHeight: 19 },
  notice: {
    padding: 13, borderRadius: 13,
    backgroundColor: theme.panel2, color: theme.text,
  },
  loading: { alignItems: 'center', padding: 35, gap: 12 },
  empty: {
    alignItems: 'center', padding: 23, gap: 13,
    backgroundColor: theme.panel, borderRadius: 22,
    borderWidth: 1, borderColor: theme.border,
  },
  emptyLogo: {
    width: 76, height: 76, borderRadius: 25,
    backgroundColor: '#168BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyB: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  emptyTitle: {
    color: theme.text, fontSize: 19,
    fontWeight: '800', textAlign: 'center',
  },
  primaryButton: {
    width: '100%', minHeight: 49, borderRadius: 14,
    backgroundColor: '#168BFF', paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.5 },
  sectionTitle: { color: theme.text, fontSize: 18, fontWeight: '800' },
  communityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    padding: 15, backgroundColor: theme.panel,
    borderWidth: 1, borderColor: theme.border, borderRadius: 17,
  },
  communityLogo: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: '#168BFF',
    alignItems: 'center', justifyContent: 'center',
  },
  communityB: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  communityName: { color: theme.text, fontSize: 16, fontWeight: '800' },
  secondaryButton: {
    minHeight: 46, borderRadius: 14,
    borderWidth: 1, borderColor: '#168BFF',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
  },
  secondaryText: { color: '#168BFF', fontWeight: '800' },
  form: {
    padding: 17, backgroundColor: theme.panel,
    borderRadius: 18, borderWidth: 1,
    borderColor: theme.border, gap: 10,
  },
  formHeading: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { color: theme.text, fontSize: 13, fontWeight: '800' },
  input: {
    minHeight: 47, borderWidth: 1, borderColor: theme.border,
    borderRadius: 12, paddingHorizontal: 13,
    color: theme.text, backgroundColor: theme.bg,
  },
  descriptionInput: { minHeight: 90, paddingTop: 12 },
});
