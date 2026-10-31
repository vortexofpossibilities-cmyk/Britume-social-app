
import React, { useState } from 'react';
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
import { theme } from '../../src/lib/theme';

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

export default function Create() {
  const { session } = useAuth();

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [postKind, setPostKind] = useState<PostKind>('text');
  const [busy, setBusy] = useState(false);

  const pickPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_FILES,
        quality: 0.85,
      });

      if (result.canceled || !result.assets) return;

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
      Alert.alert('Photo selection failed', String(error));
    }
  };

  const pickVideo = async (kind: 'video' | 'reel') => {
    try {
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
      Alert.alert('Video selection failed', String(error));
    }
  };

  const removeMedia = (index: number) => {
    setMedia(current => current.filter((_, i) => i !== index));

    if (media.length <= 1) {
      setPostKind('text');
    }
  };

  const publish = async () => {
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

    setBusy(true);

    const uploadedPaths: string[] = [];
    let createdPostId: string | null = null;

    try {
      const finalType: PostKind =
        media.length === 0
          ? 'text'
          : postKind;

      // Create the post first.
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

      if (postError) throw postError;

      createdPostId = post.id;

      // Upload selected files to the user's private storage folder.
      const mediaRows = [];

      for (let index = 0; index < media.length; index++) {
        const item = media[index];

        const extension =
          item.name.split('.').pop()?.toLowerCase() ||
          (item.mediaType === 'image' ? 'jpg' : 'mp4');

        const safeExtension = /^[a-z0-9]{1,8}$/.test(extension)
          ? extension
          : item.mediaType === 'image' ? 'jpg' : 'mp4';

        const path =
          `${session.user.id}/${post.id}/${Date.now()}-${index}.${safeExtension}`;

        const file = new File(item.uri);
        const bytes = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, bytes, {
            contentType: item.mimeType,
            upsert: false,
          });

        if (uploadError) throw uploadError;

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

      // Save the media records.
      if (mediaRows.length > 0) {
        const { error: mediaError } = await supabase
          .from('post_media')
          .insert(mediaRows);

        if (mediaError) throw mediaError;
      }

      setContent('');
      setMedia([]);
      setPostKind('text');

      Alert.alert('Published!', 'Your post is now on BRITUME.');

      router.replace('/(tabs)');
    } catch (error: any) {
      // Remove uploaded files if publishing did not complete.
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(BUCKET).remove(uploadedPaths);
      }

      // Remove the incomplete post.
      if (createdPostId) {
        await supabase.from('posts').delete().eq('id', createdPostId);
      }

      Alert.alert(
        'Publishing failed',
        error?.message || 'Something went wrong while uploading your post.'
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
          <Pressable style={styles.mediaButton} onPress={pickPhotos}>
            <Ionicons name="images-outline" size={23} color={theme.cyan} />
            <Text style={styles.mediaText}>Photos</Text>
          </Pressable>

          <Pressable
            style={styles.mediaButton}
            onPress={() => pickVideo('video')}
          >
            <Ionicons name="videocam-outline" size={23} color={theme.purple} />
            <Text style={styles.mediaText}>Video</Text>
          </Pressable>

          <Pressable
            style={styles.mediaButton}
            onPress={() => pickVideo('reel')}
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
            <ActivityIndicator color="#FFFFFF" />
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

const styles = StyleSheet.create({
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
