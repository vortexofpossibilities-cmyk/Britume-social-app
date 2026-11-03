
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';

import { useAuth } from '../../src/auth/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { useAppTheme } from '../../src/contexts/ThemeContext';

const BUCKET = 'britume-media';
const MAX_FILES = 10;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

type MediaItem = {
  uri: string;
  name: string;
  mimeType: string;
  mediaType: 'image' | 'video';
  size?: number;
};

type PostKind = 'text' | 'photo' | 'video' | 'reel';

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error || 'Unknown error');
}

function getSafeExtension(item: MediaItem) {
  const fromName = item.name.split('.').pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) {
    return fromName;
  }

  if (item.mimeType === 'image/png') return 'png';
  if (item.mimeType === 'image/webp') return 'webp';
  if (item.mimeType === 'image/heic') return 'heic';
  if (item.mimeType === 'video/quicktime') return 'mov';

  return item.mediaType === 'image' ? 'jpg' : 'mp4';
}

export default function Create() {
  const { session } = useAuth();
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [postKind, setPostKind] = useState<PostKind>('text');
  const [busy, setBusy] = useState(false);

  const pickPhotos = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Allow BRITUME to access your photos so you can select images.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_FILES,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) return;

      const selected: MediaItem[] = result.assets.map((asset, index) => ({
        uri: asset.uri,
        name: asset.fileName || `photo-${Date.now()}-${index}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        mediaType: 'image',
        size: asset.fileSize,
      }));

      if (selected.length > MAX_FILES) {
        Alert.alert('Too many photos', `Choose up to ${MAX_FILES} photos.`);
        return;
      }

      const oversized = selected.find(
        item => item.size && item.size > MAX_IMAGE_SIZE
      );

      if (oversized) {
        Alert.alert('Photo too large', 'Each photo must be 15 MB or smaller.');
        return;
      }

      setMedia(selected);
      setPostKind('photo');
    } catch (error) {
      Alert.alert('Photo selection failed', getErrorMessage(error));
    }
  };

  const pickVideo = async (kind: 'video' | 'reel') => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Allow BRITUME to access your videos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > MAX_VIDEO_SIZE) {
        Alert.alert('Video too large', 'Your video must be 100 MB or smaller.');
        return;
      }

      setMedia([
        {
          uri: asset.uri,
          name: asset.fileName || `video-${Date.now()}.mp4`,
          mimeType: asset.mimeType || 'video/mp4',
          mediaType: 'video',
          size: asset.fileSize,
        },
      ]);

      setPostKind(kind);
    } catch (error) {
      Alert.alert('Video selection failed', getErrorMessage(error));
    }
  };

  const removeMedia = (index: number) => {
    setMedia(current => {
      const updated = current.filter((_, i) => i !== index);

      if (updated.length === 0) {
        setPostKind('text');
      }

      return updated;
    });
  };

  const publish = async () => {
    if (busy) return;

    if (!supabase || !session) {
      Alert.alert('Sign in required', 'Please sign in before publishing.');
      return;
    }

    const text = content.trim();

    if (!text && media.length === 0) {
      Alert.alert('Nothing to publish', 'Write something or select media.');
      return;
    }

    if (text.length > 2000) {
      Alert.alert('Post too long', 'Your post must be 2,000 characters or less.');
      return;
    }

    if (media.length > MAX_FILES) {
      Alert.alert('Too many files', `Choose up to ${MAX_FILES} photos.`);
      return;
    }

    setBusy(true);

    const uploadedPaths: string[] = [];
    let createdPostId: string | null = null;
    let stage = 'Preparing your post';

    try {
      const finalType: PostKind =
        media.length === 0 ? 'text' : postKind;

      stage = 'Creating post record';

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: session.user.id,
          content: text || null,
          visibility: 'public',
          post_type: finalType,
        })
        .select('id')
        .single();

      if (postError) {
        throw new Error(postError.message);
      }

      if (!post?.id) {
        throw new Error('Supabase did not return the new post ID.');
      }

      createdPostId = post.id;

      const mediaRows: {
        post_id: string;
        user_id: string;
        storage_path: string;
        media_type: 'image' | 'video';
        mime_type: string;
        position: number;
      }[] = [];

      for (let index = 0; index < media.length; index++) {
        const item = media[index];

        stage = `Reading file ${index + 1} of ${media.length}`;

        const file = new File(item.uri);

        if (!file.exists) {
          throw new Error(`The selected file could not be found: ${item.name}`);
        }

        const bytes = await file.arrayBuffer();

        if (!bytes || bytes.byteLength === 0) {
          throw new Error(`The selected file is empty: ${item.name}`);
        }

        stage = `Uploading file ${index + 1} of ${media.length}`;

        const extension = getSafeExtension(item);
        const path =
          `${session.user.id}/${post.id}/${Date.now()}-${index}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, bytes, {
            contentType: item.mimeType,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        uploadedPaths.push(path);

        mediaRows.push({
          post_id: post.id,
          user_id: session.user.id,
          storage_path: path,
          media_type: item.mediaType,
          mime_type: item.mimeType,
          position: index,
        });
      }

      if (mediaRows.length > 0) {
        stage = 'Saving media details';

        const { error: mediaError } = await supabase
          .from('post_media')
          .insert(mediaRows);

        if (mediaError) {
          throw new Error(mediaError.message);
        }
      }

      setContent('');
      setMedia([]);
      setPostKind('text');

      Alert.alert(
        'Published!',
        'Your post is now on BRITUME.',
        [
          {
            text: 'View post',
            onPress: () => router.replace('/(tabs)'),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      const originalMessage = getErrorMessage(error);

      let cleanupMessage = '';

      if (uploadedPaths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove(uploadedPaths);

        if (removeError) {
          cleanupMessage += `\nFile cleanup: ${removeError.message}`;
        }
      }

      if (createdPostId) {
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', createdPostId)
          .eq('user_id', session.user.id);

        if (deleteError) {
          cleanupMessage += `\nPost cleanup: ${deleteError.message}`;
        }
      }

      Alert.alert(
        'Publishing failed',
        `Stage: ${stage}\n\n${originalMessage}${cleanupMessage}`
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Create</Text>
          <Text style={styles.subtitle}>Share your possibilities</Text>
        </View>

        <View style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Write something</Text>

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What's happening? Share it with BRITUME..."
          placeholderTextColor={theme.muted}
          multiline
          maxLength={2000}
          style={styles.input}
          textAlignVertical="top"
        />

        <Text style={styles.counter}>{content.length}/2000</Text>

        <Text style={styles.label}>Add media</Text>

        <View style={styles.actions}>
          <Pressable
            style={styles.mediaButton}
            onPress={pickPhotos}
            disabled={busy}
          >
            <Ionicons name="images-outline" size={23} color={theme.cyan} />
            <Text style={styles.mediaText}>Photos</Text>
          </Pressable>

          <Pressable
            style={styles.mediaButton}
            onPress={() => pickVideo('video')}
            disabled={busy}
          >
            <Ionicons name="videocam-outline" size={23} color={theme.purple} />
            <Text style={styles.mediaText}>Video</Text>
          </Pressable>

          <Pressable
            style={styles.mediaButton}
            onPress={() => pickVideo('reel')}
            disabled={busy}
          >
            <Ionicons name="play-circle-outline" size={23} color={theme.cyan} />
            <Text style={styles.mediaText}>Reel</Text>
          </Pressable>
        </View>

        {media.length > 0 && (
          <>
            <Text style={styles.selectedTitle}>
              Selected media ({media.length})
            </Text>

            <View style={styles.previewGrid}>
              {media.map((item, index) => (
                <View key={`${item.uri}-${index}`} style={styles.preview}>
                  {item.mediaType === 'image' ? (
                    <Image
                      source={{ uri: item.uri }}
                      style={styles.previewImage}
                    />
                  ) : (
                    <View style={styles.videoPreview}>
                      <Ionicons
                        name="videocam"
                        size={34}
                        color={theme.cyan}
                      />
                      <Text style={styles.videoName} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </View>
                  )}

                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeMedia(index)}
                    disabled={busy}
                  >
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.info}>
          Photos: up to 10 files, 15 MB each. Videos and Reels: up to 100 MB.
        </Text>

        <Pressable
          style={[styles.publishButton, busy && styles.disabled]}
          onPress={publish}
          disabled={busy}
        >
          {busy ? (
            <>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.publishText}>Publishing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={21} color="#FFFFFF" />
              <Text style={styles.publishText}>Publish to BRITUME</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    container: {
      padding: 18,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    heading: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
    },
    subtitle: {
      color: theme.muted,
      marginTop: 4,
    },
    logo: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.cyan,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.clayRaised,
    },
    logoText: {
      color: '#FFFFFF',
      fontSize: 29,
      fontWeight: '900',
    },
    card: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      padding: 17,
      ...theme.clayShadow,
    },
    label: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },
    input: {
      minHeight: 125,
      backgroundColor: theme.panel2,
      borderRadius: 14,
      padding: 14,
      color: theme.text,
      fontSize: 15,
    },
    counter: {
      textAlign: 'right',
      color: theme.muted,
      marginTop: 7,
      marginBottom: 22,
    },
    actions: {
      flexDirection: 'row',
      gap: 9,
      marginBottom: 18,
    },
    mediaButton: {
      flex: 1,
      minHeight: 76,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    mediaText: {
      color: theme.text,
      fontWeight: '700',
      fontSize: 12,
    },
    selectedTitle: {
      color: theme.text,
      fontWeight: '700',
      marginBottom: 12,
    },
    previewGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 14,
    },
    preview: {
      width: '47%',
      height: 145,
      borderRadius: 13,
      overflow: 'hidden',
      backgroundColor: theme.panel2,
      position: 'relative',
    },
    previewImage: {
      width: '100%',
      height: '100%',
    },
    videoPreview: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    videoName: {
      color: theme.text,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 8,
    },
    removeButton: {
      position: 'absolute',
      top: 7,
      right: 7,
      width: 27,
      height: 27,
      borderRadius: 14,
      backgroundColor: '#D64545',
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
      marginBottom: 18,
    },
    publishButton: {
      minHeight: 54,
      borderRadius: 15,
      backgroundColor: theme.cyan,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      ...theme.clayRaised,
    },
    publishText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    disabled: {
      opacity: 0.6,
    },
  });
}
