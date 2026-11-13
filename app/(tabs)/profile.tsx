
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile, Paths } from 'expo-file-system';

import { useAuth } from '../../src/auth/AuthProvider';
import { useAppTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';

import {
  fetchCurrentUserProfile,
  getProfileName,
  updateOwnProfile,
  type ProfileRecord,
} from '../../src/lib/profile';

import {
  fetchPostsForUser,
  type FeedPost,
} from '../../src/lib/posts';

import {
  MEDIA_BUCKET,
  compressImage,
  uploadMediaResumable,
  type UploadSource,
} from '../../src/lib/mediaUpload';

import { supabase } from '../../src/lib/supabase';

export default function ProfileScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const { language } = useLanguage();

  const isSt = false;

  const words = {
    profile: isSt ? 'Profaele' : 'Profile',
    settings: isSt ? 'Dikgetho' : 'Settings',
    signIn: isSt
      ? 'Tsena go bona profaele ya gago'
      : 'Sign in to view your profile',
    goSignIn: isSt ? 'Tsena' : 'Sign in',
    loading: isSt ? 'E a laisa...' : 'Loading...',
    edit: isSt ? 'Baakanya profaele' : 'Edit profile',
    addPhoto: isSt ? 'Tsenya setshwantsho' : 'Add profile photo',
    changePhoto: isSt ? 'Fetola setshwantsho' : 'Change profile photo',
    public: isSt ? 'Profaele ya phatlalatsa' : 'Public profile',
    private: isSt ? 'Profaele ya sephiri' : 'Private profile',
    publicLink: isSt ? 'Bona profaele ya phatlalatsa' : 'View public profile',
    createLink: isSt ? 'Tlhoma leina la gago la modirisi' : 'Set up your username',
    dashboard: 'Dashboard',
    studio: 'BRITUME Studio',
    comingSoon: isSt ? 'E tla tloga e tla' : 'Coming Soon',
    studioDescription: isSt
      ? 'Tlhama dikhathuni, difilimi, dipopae le dilo tse dingwe tsa boitlhamedi.'
      : 'Create cartoons, movies, animations and other creative projects.',
    myPosts: isSt ? 'Dipositi tsa me' : 'My posts',
    noPosts: isSt ? 'Ga o ise o dire poso.' : 'You have not posted anything yet.',
    loadingPosts: isSt ? 'E laisa diposo...' : 'Loading your posts...',
    postsUnavailable: isSt
      ? 'Dipositi ga di kgone go bonala.'
      : 'Your posts could not be loaded.',
    privatePost: isSt ? 'Sephiri' : 'Private',
    publicPost: isSt ? 'Phatlalatsa' : 'Public',
    photoUpload: isSt ? 'Setshwantsho sa profaele' : 'Profile photo',
    uploadFailed: isSt ? 'Go tsenya ga go a atlega' : 'Upload failed',
    photoUpdated: isSt
      ? 'Setshwantsho sa gago se ntšhwafaditswe.'
      : 'Your profile photo has been updated.',
    photoPermission: isSt
      ? 'Re tshwanetse go bona ditshwantsho tsa gago.'
      : 'Please allow photo library access to choose a profile picture.',
    updateFailed: isSt
      ? 'Ga go a kgonega go ntšhwafatsa profaele.'
      : 'Could not update your profile.',
    visibilityFailed: isSt
      ? 'Ga go a kgonega go fetola ponalo ya profaele.'
      : 'Could not update profile visibility.',
    studioMessage: isSt
      ? 'BRITUME Studio e tla tloga e tla.'
      : 'BRITUME Studio is coming soon. Creative tools will be available here.',
    dashboardDescription: isSt
      ? 'Bona tswelelopele ya gago le dipalopalo.'
      : 'View your activity, progress and statistics.',
    uploadProgress: isSt ? 'E tsenya...' : 'Uploading...',
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadProfile = useCallback(async () => {
    const userId = session?.user?.id;

    if (!userId) {
      setProfile(null);
      setPosts([]);
      setAvatarUrl(null);
      setLoading(false);
      setPostsLoading(false);
      return;
    }

    setLoading(true);
    setPostsLoading(true);

    try {
      const nextProfile = await fetchCurrentUserProfile(userId);
      setProfile(nextProfile);

      if (nextProfile?.avatar_path && supabase) {
        const { data, error } = await supabase.storage
          .from(MEDIA_BUCKET)
          .createSignedUrl(nextProfile.avatar_path, 60 * 60);

        if (!error && data?.signedUrl) {
          setAvatarUrl(data.signedUrl);
        } else {
          setAvatarUrl(null);
          console.warn('Could not load profile photo:', error?.message);
        }
      } else {
        setAvatarUrl(null);
      }
    } catch (error) {
      Alert.alert(
        'Profile unavailable',
        error instanceof Error ? error.message : words.updateFailed,
      );
    } finally {
      setLoading(false);
    }

    try {
      const userPosts = await fetchPostsForUser(userId, {
        includePrivate: true,
      });

      setPosts(userPosts);
    } catch (error) {
      setPosts([]);
      Alert.alert(
        'Posts unavailable',
        error instanceof Error ? error.message : words.postsUnavailable,
      );
    } finally {
      setPostsLoading(false);
    }
  }, [session?.user?.id, words.updateFailed, words.postsUnavailable]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleTogglePublic = async (value: boolean) => {
    if (!session?.user?.id || saving) return;

    setSaving(true);

    try {
      const nextProfile = await updateOwnProfile({
        userId: session.user.id,
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        bio: profile?.bio ?? '',
        avatar_path: profile?.avatar_path ?? null,
        is_public: value,
      });

      setProfile(nextProfile);
    } catch (error) {
      Alert.alert(
        words.updateFailed,
        error instanceof Error ? error.message : words.visibilityFailed,
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChoosePhoto = async () => {
    if (!session?.user?.id || uploadingPhoto) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(words.photoUpload, words.photoPermission);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      setUploadingPhoto(true);

      let uploadSource: UploadSource;
      let compressed: Awaited<ReturnType<typeof compressImage>>;

      if (Platform.OS === 'web') {
        let browserFile = asset.file;

        if (!browserFile) {
          const response = await fetch(asset.uri);

          if (!response.ok) {
            throw new Error('Could not read the selected image.');
          }

          const blob = await response.blob();

          browserFile = new File(
            [blob],
            asset.fileName || `britume-photo-${Date.now()}.jpg`,
            { type: asset.mimeType || blob.type || 'image/jpeg' },
          );
        }

        compressed = await compressImage(
          asset.uri,
          asset.mimeType || browserFile.type,
        );

        const compressedResponse = await fetch(compressed.uri);

        if (!compressedResponse.ok) {
          throw new Error('Could not prepare the profile photo.');
        }

        const compressedBlob = await compressedResponse.blob();

        uploadSource = new File(
          [compressedBlob],
          compressed.name,
          { type: compressed.mimeType },
        );
      } else {
        const extension =
          asset.fileName?.split('.').pop()?.toLowerCase() || 'jpg';

        const sourceFile = new ExpoFile(asset.uri);

        if (!sourceFile.exists) {
          throw new Error('The selected image is no longer available. Please select it again.');
        }

        const cachedFile = new ExpoFile(
          Paths.cache,
          `britume-avatar-${Date.now()}.${extension}`,
        );

        await sourceFile.copy(cachedFile);

        if (!cachedFile.exists || !cachedFile.size) {
          throw new Error('Could not prepare the selected image.');
        }

        compressed = await compressImage(
          cachedFile.uri,
          asset.mimeType || undefined,
        );

        uploadSource = {
          uri: compressed.uri,
          name: compressed.name,
          type: compressed.mimeType,
          size: compressed.size,
        };
      }

      const userId = session.user.id;
      const extension = compressed.mimeType === 'image/gif' ? 'gif' : 'jpg';

      const storagePath =
        `${userId}/avatars/${Date.now()}.${extension}`;

      await uploadMediaResumable(
        uploadSource,
        storagePath,
        compressed.mimeType,
      );

      const updatedProfile = await updateOwnProfile({
        userId,
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        bio: profile?.bio ?? '',
        avatar_path: storagePath,
        is_public: profile?.is_public ?? true,
      });

      setProfile(updatedProfile);

      if (!supabase) {
        throw new Error('Supabase is not configured.');
      }

      const { data, error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .createSignedUrl(storagePath, 60 * 60);

      if (error || !data?.signedUrl) {
        throw new Error(
          error?.message || 'Could not display the uploaded profile photo.',
        );
      }

      setAvatarUrl(data.signedUrl);

      Alert.alert(words.photoUpload, words.photoUpdated);
    } catch (error) {
      Alert.alert(
        words.uploadFailed,
        error instanceof Error ? error.message : 'Could not upload your photo.',
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const displayName = getProfileName(profile);

  if (!session) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="person-circle-outline" size={58} color={theme.cyan} />
        <Text style={styles.emptyTitle}>{words.signIn}</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.primaryButtonText}>{words.goSignIn}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>{words.profile}</Text>

        <Pressable
          accessibilityLabel={words.settings}
          style={styles.topButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={22} color={theme.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={theme.cyan} size="large" />
          <Text style={styles.mutedText}>{words.loading}</Text>
        </View>
      ) : (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />

            <Pressable
              style={styles.avatarButton}
              onPress={handleChoosePhoto}
              disabled={uploadingPhoto}
              accessibilityLabel={profile?.avatar_path ? words.changePhoto : words.addPhoto}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={48} color={theme.cyan} />
                </View>
              )}

              <View style={styles.avatarAdd}>
                {uploadingPhoto ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                )}
              </View>
            </Pressable>

            <Text style={styles.photoHint}>
              {uploadingPhoto ? words.uploadProgress : words.changePhoto}
            </Text>

            <Text style={styles.profileName}>{displayName}</Text>

            <Text style={styles.username}>
              {profile?.username ? `@${profile.username}` : words.createLink}
            </Text>

            <Text style={styles.bio}>
              {profile?.bio || 'Welcome to your BRITUME home.'}
            </Text>

            <Pressable
              style={styles.editButton}
              onPress={() => router.push('/profile-edit')}
            >
              <Ionicons name="create-outline" size={17} color={theme.text} />
              <Text style={styles.editButtonText}>{words.edit}</Text>
            </Pressable>
          </View>

          <View style={styles.visibilityCard}>
            <View style={styles.visibilityIcon}>
              <Ionicons
                name={profile?.is_public ? 'globe-outline' : 'lock-closed-outline'}
                size={22}
                color={theme.cyan}
              />
            </View>

            <View style={styles.visibilityText}>
              <Text style={styles.cardTitle}>
                {profile?.is_public ? words.public : words.private}
              </Text>
              <Text style={styles.mutedSmall}>
                {profile?.is_public
                  ? 'People can view your public profile and public posts.'
                  : 'Your profile is private to other users.'}
              </Text>
            </View>

            <Switch
              value={Boolean(profile?.is_public ?? true)}
              onValueChange={handleTogglePublic}
              disabled={saving}
              trackColor={{ false: theme.border, true: theme.cyan }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={theme.border}
            />
          </View>

          <Pressable
            style={styles.linkCard}
            onPress={() => {
              if (profile?.username) {
                router.push({
                  pathname: '/profile/[username]',
                  params: { username: profile.username },
                });
              } else {
                router.push('/profile-edit');
              }
            }}
          >
            <View style={styles.linkIcon}>
              <Ionicons name="person-circle-outline" size={23} color={theme.cyan} />
            </View>

            <View style={styles.linkText}>
              <Text style={styles.cardTitle}>
                {profile?.username ? words.publicLink : words.createLink}
              </Text>
              <Text style={styles.mutedSmall}>
                {profile?.username
                  ? 'See how your profile appears to other people.'
                  : 'Choose a username to create your profile link.'}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={theme.muted} />
          </Pressable>

          <Text style={styles.sectionTitle}>Your BRITUME space</Text>

          <Pressable
            style={styles.dashboardCard}
            onPress={() => router.push('/dashboard')}
          >
            <View style={styles.dashboardIcon}>
              <Ionicons name="stats-chart-outline" size={27} color={theme.cyan} />
            </View>

            <View style={styles.dashboardText}>
              <Text style={styles.cardTitle}>{words.dashboard}</Text>
              <Text style={styles.mutedSmall}>{words.dashboardDescription}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={theme.muted} />
          </Pressable>

          <Pressable
            style={styles.studioCard}
            onPress={() => Alert.alert(words.studio, words.studioMessage)}
          >
            <View style={styles.studioTop}>
              <View style={styles.studioIcon}>
                <Ionicons name="color-palette-outline" size={30} color="#FFFFFF" />
              </View>

              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>{words.comingSoon}</Text>
              </View>
            </View>

            <Text style={styles.studioTitle}>{words.studio}</Text>
            <Text style={styles.studioDescription}>
              {words.studioDescription}
            </Text>

            <View style={styles.studioExamples}>
              <View style={styles.studioExample}>
                <Ionicons name="film-outline" size={18} color={theme.cyan} />
                <Text style={styles.studioExampleText}>Movies</Text>
              </View>

              <View style={styles.studioExample}>
                <Ionicons name="happy-outline" size={18} color={theme.cyan} />
                <Text style={styles.studioExampleText}>Cartoons</Text>
              </View>

              <View style={styles.studioExample}>
                <Ionicons name="sparkles-outline" size={18} color={theme.cyan} />
                <Text style={styles.studioExampleText}>Animation</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.postsHeading}>
            <View>
              <Text style={styles.sectionTitle}>{words.myPosts}</Text>
              <Text style={styles.mutedSmall}>
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </Text>
            </View>

            <Pressable
              style={styles.createPostButton}
              onPress={() => router.push('/(tabs)/create')}
            >
              <Ionicons name="add" size={19} color="#FFFFFF" />
              <Text style={styles.createPostText}>Create</Text>
            </Pressable>
          </View>

          {postsLoading ? (
            <View style={styles.emptyPosts}>
              <ActivityIndicator color={theme.cyan} />
              <Text style={styles.mutedText}>{words.loadingPosts}</Text>
            </View>
          ) : posts.length === 0 ? (
            <View style={styles.emptyPosts}>
              <Ionicons name="albums-outline" size={42} color={theme.muted} />
              <Text style={styles.emptyPostsTitle}>{words.noPosts}</Text>
              <Text style={styles.mutedSmall}>
                Your photos, videos and text posts will appear here.
              </Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => router.push('/(tabs)/create')}
              >
                <Text style={styles.primaryButtonText}>Create your first post</Text>
              </Pressable>
            </View>
          ) : (
            posts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar}>
                    {avatarUrl ? (
                      <Image
                        source={{ uri: avatarUrl }}
                        style={styles.postAvatarImage}
                      />
                    ) : (
                      <Ionicons name="person" size={18} color={theme.cyan} />
                    )}
                  </View>

                  <View style={styles.postAuthor}>
                    <Text style={styles.postAuthorName}>{displayName}</Text>
                    <Text style={styles.mutedSmall}>
                      {new Date(post.created_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.postVisibility}>
                    <Ionicons
                      name={post.visibility === 'private' ? 'lock-closed-outline' : 'globe-outline'}
                      size={14}
                      color={theme.muted}
                    />
                    <Text style={styles.mutedTiny}>
                      {post.visibility === 'private' ? words.privatePost : words.publicPost}
                    </Text>
                  </View>
                </View>

                {!!post.content && (
                  <Text style={styles.postContent}>{post.content}</Text>
                )}

                {!!post.media?.length && (
                  <View style={styles.postMediaList}>
                    {post.media.map((media) => (
                      <View key={media.id} style={styles.postMedia}>
                        {media.media_type === 'image' && media.url ? (
                          <Image
                            source={{ uri: media.url }}
                            style={styles.postImage}
                            resizeMode="cover"
                          />
                        ) : media.media_type === 'video' ? (
                          <View style={styles.videoPreview}>
                            <Ionicons
                              name="play-circle"
                              size={48}
                              color="#FFFFFF"
                            />
                            <Text style={styles.videoLabel}>Video</Text>
                          </View>
                        ) : (
                          <View style={styles.mediaUnavailable}>
                            <Ionicons
                              name="image-outline"
                              size={30}
                              color={theme.muted}
                            />
                            <Text style={styles.mutedSmall}>Media unavailable</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      paddingHorizontal: 15,
      paddingTop: 12,
      paddingBottom: 40,
    },
    topBar: {
      minHeight: 45,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    pageTitle: {
      color: theme.text,
      fontSize: 25,
      fontWeight: '900',
    },
    topButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
    },
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 24,
      paddingHorizontal: 18,
      paddingTop: 23,
      paddingBottom: 20,
      marginBottom: 13,
    },
    heroGlow: {
      position: 'absolute',
      width: 210,
      height: 150,
      top: -90,
      borderRadius: 100,
      backgroundColor: theme.panel2,
      opacity: 0.8,
    },
    avatarButton: {
      width: 116,
      height: 116,
      borderRadius: 58,
      borderWidth: 3,
      borderColor: theme.cyan,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 5,
    },
    avatarImage: {
      width: 108,
      height: 108,
      borderRadius: 54,
    },
    avatarPlaceholder: {
      width: 108,
      height: 108,
      borderRadius: 54,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.panel2,
    },
    avatarAdd: {
      position: 'absolute',
      right: -2,
      bottom: 1,
      width: 35,
      height: 35,
      borderRadius: 18,
      backgroundColor: theme.cyan,
      borderWidth: 3,
      borderColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoHint: {
      color: theme.cyan,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 5,
    },
    profileName: {
      color: theme.text,
      fontSize: 23,
      fontWeight: '900',
      textAlign: 'center',
      marginTop: 10,
    },
    username: {
      color: theme.cyan,
      fontSize: 13,
      fontWeight: '800',
      marginTop: 5,
    },
    bio: {
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      textAlign: 'center',
      marginTop: 10,
      maxWidth: 290,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 17,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 22,
      backgroundColor: theme.panel2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    editButtonText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '800',
    },
    visibilityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 17,
      padding: 13,
      marginBottom: 11,
    },
    visibilityIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    visibilityText: {
      flex: 1,
    },
    cardTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
    },
    mutedSmall: {
      color: theme.muted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 3,
    },
    mutedTiny: {
      color: theme.muted,
      fontSize: 10,
      marginLeft: 4,
    },
    linkCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 17,
      padding: 13,
      marginBottom: 22,
    },
    linkIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkText: {
      flex: 1,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '900',
      marginBottom: 10,
    },
    dashboardCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
    },
    dashboardIcon: {
      width: 48,
      height: 48,
      borderRadius: 15,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dashboardText: {
      flex: 1,
    },
    studioCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 16,
      marginBottom: 25,
    },
    studioTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    studioIcon: {
      width: 53,
      height: 53,
      borderRadius: 17,
      backgroundColor: theme.cyan,
      alignItems: 'center',
      justifyContent: 'center',
    },
    comingSoonBadge: {
      backgroundColor: theme.panel2,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingHorizontal: 11,
      paddingVertical: 7,
    },
    comingSoonText: {
      color: theme.cyan,
      fontSize: 10,
      fontWeight: '900',
    },
    studioTitle: {
      color: theme.text,
      fontSize: 19,
      fontWeight: '900',
      marginTop: 14,
    },
    studioDescription: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 19,
      marginTop: 6,
    },
    studioExamples: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 15,
    },
    studioExample: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: theme.panel2,
      borderRadius: 12,
      paddingHorizontal: 9,
      paddingVertical: 8,
    },
    studioExampleText: {
      color: theme.text,
      fontSize: 10,
      fontWeight: '700',
    },
    postsHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    createPostButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.cyan,
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 9,
    },
    createPostText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '900',
    },
    emptyPosts: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      padding: 24,
      gap: 8,
    },
    emptyPostsTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '800',
      textAlign: 'center',
    },
    postCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      padding: 13,
      marginBottom: 13,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 11,
    },
    postAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    postAvatarImage: {
      width: 38,
      height: 38,
      borderRadius: 19,
    },
    postAuthor: {
      flex: 1,
      marginLeft: 9,
    },
    postAuthorName: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '800',
    },
    postVisibility: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel2,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 12,
    },
    postContent: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 21,
      marginBottom: 11,
    },
    postMediaList: {
      gap: 8,
    },
    postMedia: {
      width: '100%',
      overflow: 'hidden',
      borderRadius: 13,
      backgroundColor: theme.panel2,
    },
    postImage: {
      width: '100%',
      height: 235,
    },
    videoPreview: {
      height: 190,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.blueDark,
    },
    videoLabel: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
      marginTop: 5,
    },
    mediaUnavailable: {
      minHeight: 110,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },
    loadingBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 45,
      gap: 10,
    },
    mutedText: {
      color: theme.muted,
      fontSize: 13,
      textAlign: 'center',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 25,
      backgroundColor: theme.bg,
    },
    emptyTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 13,
      marginBottom: 15,
    },
    primaryButton: {
      backgroundColor: theme.cyan,
      paddingHorizontal: 19,
      paddingVertical: 11,
      borderRadius: 24,
      marginTop: 8,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },
  });
}
