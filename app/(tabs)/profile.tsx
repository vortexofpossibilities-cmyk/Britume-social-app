import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/auth/AuthProvider';
import { fetchCurrentUserProfile, updateOwnProfile, type ProfileRecord } from '../../src/lib/profile';
import { theme } from '../../src/lib/theme';

export default function ProfileEditScreen() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const nextProfile = await fetchCurrentUserProfile(session.user.id);
      setProfile(nextProfile);
      setDisplayName(nextProfile?.display_name ?? '');
      setUsername(nextProfile?.username ?? '');
      setBio(nextProfile?.bio ?? '');
      setIsPublic(Boolean(nextProfile?.is_public ?? true));
    } catch (error) {
      Alert.alert('Profile could not load', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in to edit your profile.');
      return;
    }

    setSaving(true);

    try {
      const nextProfile = await updateOwnProfile({
        userId: session.user.id,
        username,
        display_name: displayName,
        bio,
        is_public: isPublic,
      });
      setProfile(nextProfile);
      const targetUsername = nextProfile.username?.trim();

      if (targetUsername) {
        router.replace({ pathname: '/profile/[username]', params: { username: targetUsername } });
        return;
      }

      router.back();
    } catch (error) {
      Alert.alert(
        'Could not save profile',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-circle-outline" size={52} color={theme.cyan} />
        <Text style={styles.emptyText}>Sign in to edit your profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={styles.title}>Edit profile</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={theme.cyan} />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={theme.muted}
            style={styles.input}
            maxLength={60}
          />

          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="yourname"
            placeholderTextColor={theme.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            maxLength={30}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people about yourself"
            placeholderTextColor={theme.muted}
            multiline
            numberOfLines={5}
            style={[styles.input, styles.textArea]}
            maxLength={500}
          />

          <View style={styles.publicRow}>
            <Text style={styles.publicLabel}>Public profile</Text>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: theme.border, true: theme.cyan }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
            />
          </View>

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            disabled={saving}
            onPress={() => {
              void handleSave();
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save profile</Text>
            )}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
  },
  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '800',
  },
  card: {
    backgroundColor: theme.panel,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  label: {
    color: theme.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.bg,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  publicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  publicLabel: {
    color: theme.text,
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: theme.cyan,
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
    padding: 20,
  },
  emptyText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
});
