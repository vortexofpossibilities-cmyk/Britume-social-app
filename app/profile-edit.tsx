
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useAuth } from '../src/auth/AuthProvider';
import {
  fetchCurrentUserProfile,
  updateOwnProfile,
  type ProfileRecord,
} from '../src/lib/profile';
import { theme } from '../src/lib/theme';

export default function ProfileEditScreen() {
  const { session } = useAuth();

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!session?.user?.id) {
        setLoading(false);
        return;
      }

      try {
        const result = await fetchCurrentUserProfile(session.user.id);

        if (!mounted) return;

        setProfile(result);
        setUsername(result?.username ?? '');
        setDisplayName(result?.display_name ?? '');
        setBio(result?.bio ?? '');
        setIsPublic(result?.is_public ?? true);
      } catch (error) {
        Alert.alert(
          'Profile error',
          error instanceof Error ? error.message : 'Could not load profile.'
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  const handleSave = async () => {
    if (!session?.user?.id) {
      Alert.alert('Sign in required', 'Please sign in first.');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter a username.');
      return;
    }

    setSaving(true);

    try {
      const updated = await updateOwnProfile({
        userId: session.user.id,
        username: username.trim(),
        display_name: displayName.trim() || null,
        bio: bio.trim(),
        is_public: isPublic,
      });

      setProfile(updated);

      Alert.alert('Success', 'Your BRITUME profile has been updated.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert(
        'Could not save profile',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.cyan} />
        <Text style={styles.muted}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={23} color={theme.text} />
          </Pressable>

          <Text style={styles.title}>Edit profile</Text>
          <View style={styles.headerSpace} />
        </View>

        <View style={styles.avatar}>
          <Ionicons name="person" size={43} color={theme.cyan} />
        </View>

        <Text style={styles.avatarCaption}>Your BRITUME profile</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={theme.muted}
            maxLength={60}
          />

          <Text style={styles.label}>Username</Text>
          <View style={styles.usernameInput}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={styles.usernameText}
              value={username}
              onChangeText={setUsername}
              placeholder="your_username"
              placeholderTextColor={theme.muted}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
          </View>
          <Text style={styles.hint}>
            Use 3–30 letters, numbers or underscores.
          </Text>

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell people something about yourself..."
            placeholderTextColor={theme.muted}
            multiline
            textAlignVertical="top"
            maxLength={300}
          />
          <Text style={styles.counter}>{bio.length}/300</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.visibilityRow}>
            <View style={styles.visibilityInfo}>
              <Ionicons name="globe-outline" size={22} color={theme.cyan} />
              <View style={styles.visibilityText}>
                <Text style={styles.visibilityTitle}>Public profile</Text>
                <Text style={styles.hint}>
                  Allow people to discover your profile.
                </Text>
              </View>
            </View>

            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{
                false: theme.border,
                true: theme.cyan,
              }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.saveText}>Save changes</Text>
            </>
          )}
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={saving}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    color: theme.text,
    fontSize: 21,
    fontWeight: '800',
  },
  headerSpace: {
    width: 40,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.panel,
    borderWidth: 2,
    borderColor: theme.cyan,
  },
  avatarCaption: {
    color: theme.muted,
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 22,
    fontSize: 13,
  },
  card: {
    backgroundColor: theme.panel,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 14,
  },
  label: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 13,
  },
  input: {
    backgroundColor: theme.panel2,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 11,
    color: theme.text,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
  },
  usernameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.panel2,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 11,
    paddingHorizontal: 13,
  },
  atSign: {
    color: theme.cyan,
    fontSize: 16,
    fontWeight: '800',
  },
  usernameText: {
    flex: 1,
    color: theme.text,
    paddingVertical: 12,
    paddingLeft: 5,
    fontSize: 15,
  },
  hint: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 6,
  },
  bioInput: {
    minHeight: 105,
  },
  counter: {
    color: theme.muted,
    textAlign: 'right',
    fontSize: 11,
    marginTop: 5,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 11,
  },
  visibilityText: {
    flex: 1,
  },
  visibilityTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 49,
    borderRadius: 13,
    backgroundColor: theme.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 7,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    alignItems: 'center',
    padding: 15,
  },
  cancelText: {
    color: theme.muted,
    fontWeight: '700',
  },
  loading: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  muted: {
    color: theme.muted,
  },
});
