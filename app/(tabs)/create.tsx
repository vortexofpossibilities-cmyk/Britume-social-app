
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
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
import { File as ExpoFile } from 'expo-file-system';

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

  // Keep a copy of the selected browser file's bytes.
  // This prevents temporary browser file URLs from expiring.
  webBytes?: ArrayBuffer;
};

type PostKind = 'text' | 'photo' | 'video' | 'reel';

function getErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error || 'An unknown error occurred.');
}

function getSafeExtension(item: MediaItem): string {
  const mimeExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };

  if (mimeExtensions[item.mimeType]) {
    return mimeExtensions[item.mimeType];
  }

  const fromName = item.name.split('.').pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) {
    return fromName;
  }

  return item.mediaType === 'image' ? 'jpg' : 'mp4';
}

// IMPORTANT:
// Read browser files immediately after selection.
// Do not wait until the Publish button is pressed.
async function prepareMediaItem(
  asset: ImagePicker.ImagePickerAsset,
  mediaType: 'image' | 'video',
  index: number,
): Promise<MediaItem> {
  const mimeType =
    asset.mimeType ||
    (mediaType === 'image' ? 'image/jpeg' : 'video/mp4');

  const extension =
    mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
        ? 'webp'
        : mimeType === 'video/quicktime'
          ? 'mov'
          : mediaType === 'image'
            ? 'jpg'
            : 'mp4';

  const item: MediaItem = {
    uri: asset.uri,
    name:
      asset.fileName ||
      `${mediaType}-${Date.now()}-${index}.${extension}`,
    mimeType,
    mediaType,
    size: asset.fileSize,
  };

  if (Platform.OS === 'web') {
    try {
      let bytes: ArrayBuffer;

      // Preferred method: read the original browser File.
      if (asset.file) {
        bytes = await asset.file.arrayBuffer();
      } else {
        // Fallback: read the temporary URI immediately.
        const response = await fetch(asset.uri);

        if (!response.ok) {
          throw new Error('The browser could not access this selected file.');
        }

        const blob = await response.blob();
        bytes = await blob.arrayBuffer();
      }

      if (!bytes || bytes.byteLength === 0) {
        throw new Error('The selected file is empty.');
      }

      return {
        ...item,
        webBytes: bytes,
      };
    } catch (error) {
      throw new Error(
        `Could not read ${item.name}: ${getErrorMessage(error)}. Please select it again.`,
      );
    }
  }

  return item;
}

async function readSelectedFile(item: MediaItem): Promise<ArrayBuffer> {
  // Web: use the bytes captured during selection.
  if (Platform.OS === 'web') {
    if (item.webBytes && item.webBytes.byteLength > 0) {
      return item.webBytes;
    }

    throw new Error(
      `The saved browser file data is unavailable for ${item.name}. Please select the file again.`,
    );
  }

  // Android and iOS: read the local Expo file.
  const file = new ExpoFile(item.uri);

  if (!file.exists) {
    throw new Error(
      `The selected file could not be found: ${item.name}`,
    );
  }

  const bytes = await file.arrayBuffer();

  if (!bytes || bytes.byteLength === 0) {
    throw new Error(`The selected file is empty: ${item.name}`);
  }

  return bytes;
}

export default function Create() {
  const { session } = useAuth();
  const { theme } = useAppTheme();

  const styles = useMemo(
    () => createStyles(theme),
    [theme],
  );

  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [postKind, setPostKind] = useState<PostKind>('text');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<
    'success' | 'error' | 'info'
  >('info');

  const showStatus = (
    message: string,
    type: 'success' | 'error' | 'info',
  ) => {
    setStatus(message);
    setStatusType(type);
  };

  // ==========================================
  // SELECT PHOTOS
  // ==========================================

  const pickPhotos = async () => {
    try {
      setStatus('');

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted && Platform.OS !== 'web') {
        showStatus(
          'Please allow BRITUME to access your photos.',
          'error',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: MAX_FILES,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      if (result.assets.length > MAX_FILES) {
        showStatus(
          `Choose no more than ${MAX_FILES} photos.`,
          'error',
        );
        return;
      }

      showStatus('Preparing your photos...', 'info');

      // Read every selected photo immediately.
      const selected = await Promise.all(
        result.assets.map((asset, index) =>
          prepareMediaItem(asset, 'image', index),
        ),
      );

      const oversized = selected.find(
        item =>
          (item.size !== undefined && item.size > MAX_IMAGE_SIZE) ||
          (item.webBytes !== undefined &&
            item.webBytes.byteLength > MAX_IMAGE_SIZE),
      );

      if (oversized) {
        showStatus(
          `${oversized.name} is larger than 15 MB.`,
          'error',
        );
        return;
      }

      setMedia(selected);
      setPostKind('photo');

      showStatus(
        `Success! ${selected.length} photo(s) selected and ready to upload.`,
        'success',
      );
    } catch (error) {
      showStatus(
        `Photo selection failed: ${getErrorMessage(error)}`,
        'error',
      );
    }
  };

  // ==========================================
  // SELECT VIDEOS AND REELS
  // ==========================================

  const pickVideo = async (kind: 'video' | 'reel') => {
    try {
      setStatus('');

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted && Platform.OS !== 'web') {
        showStatus(
          'Please allow BRITUME to access your videos.',
          'error',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      showStatus('Preparing your video...', 'info');

      const asset = result.assets[0];

      const selected = await prepareMediaItem(
        asset,
        'video',
        0,
      );

      if (
        (selected.size !== undefined &&
          selected.size > MAX_VIDEO_SIZE) ||
        (selected.webBytes !== undefined &&
          selected.webBytes.byteLength > MAX_VIDEO_SIZE)
      ) {
        showStatus(
          'Your video must be 100 MB or smaller.',
          'error',
        );
        return;
      }

      setMedia([selected]);
      setPostKind(kind);

      showStatus(
        'Video selected and ready to upload.',
        'success',
      );
    } catch (error) {
      showStatus(
        `Video selection failed: ${getErrorMessage(error)}`,
        'error',
      );
    }
  };

  // ==========================================
  // REMOVE SELECTED MEDIA
  // ==========================================

  const removeMedia = (index: number) => {
    setMedia(current => {
      const updated = current.filter(
        (_, i) => i !== index,
      );

      if (updated.length === 0) {
        setPostKind('text');
      }

      return updated;
    });

    showStatus('Media removed.', 'info');
  };

  // ==========================================
  // PUBLISH POST
  // ==========================================

  const publish = async () => {
    if (busy) return;

    if (!supabase) {
      showStatus(
        'BRITUME is not connected to Supabase. Check the website configuration.',
        'error',
      );
      return;
    }

    if (!session?.user?.id) {
      showStatus(
        'Your session has expired. Please sign in again.',
        'error',
      );
      return;
    }

    const text = content.trim();

    if (!text && media.length === 0) {
      showStatus(
        'Write something or select a photo or video first.',
        'error',
      );
      return;
    }

    if (text.length > 2000) {
      showStatus(
        'Your post must be 2,000 characters or less.',
        'error',
      );
      return;
    }

    if (media.length > MAX_FILES) {
      showStatus(
        `Choose no more than ${MAX_FILES} photos.`,
        'error',
      );
      return;
    }

    setBusy(true);
    setStatus('');

    const uploadedPaths: string[] = [];
    let createdPostId: string | null = null;
    let stage = 'Preparing your post';

    try {
      const finalType: PostKind =
        media.length === 0 ? 'text' : postKind;

      // STEP 1: Save the post.
      stage = 'Saving your post';

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
        throw new Error(
          `Could not save post: ${postError.message}`,
        );
      }

      if (!post?.id) {
        throw new Error(
          'The database did not return a post ID.',
        );
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

      // STEP 2: Read and upload media.
      for (
        let index = 0;
        index < media.length;
        index++
      ) {
        const item = media[index];

        stage = `Reading ${item.name}`;

        const bytes = await readSelectedFile(item);

        if (!bytes || bytes.byteLength === 0) {
          throw new Error(
            `The selected file is empty: ${item.name}`,
          );
        }

        const sizeLimit =
          item.mediaType === 'image'
            ? MAX_IMAGE_SIZE
            : MAX_VIDEO_SIZE;

        if (bytes.byteLength > sizeLimit) {
          throw new Error(
            item.mediaType === 'image'
              ? `${item.name} is larger than 15 MB.`
              : `${item.name} is larger than 100 MB.`,
          );
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
          throw new Error(
            `Media upload failed: ${uploadError.message}`,
          );
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

      // STEP 3: Save media information.
      if (mediaRows.length > 0) {
        stage = 'Saving media information';

        const { error: mediaError } = await supabase
          .from('post_media')
          .insert(mediaRows);

        if (mediaError) {
          throw new Error(
            `Could not save media information: ${mediaError.message}`,
          );
        }
      }

      // STEP 4: Clear the form after successful publishing.
      setContent('');
      setMedia([]);
      setPostKind('text');

      showStatus(
        'Success! Your post has been published. Open Home to see it.',
        'success',
      );
    } catch (error) {
      const originalMessage = getErrorMessage(error);
      let cleanupMessage = '';

      // Remove uploaded files if the post fails.
      if (uploadedPaths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(BUCKET)
          .remove(uploadedPaths);

        if (removeError) {
          cleanupMessage +=
            ` File cleanup also failed: ${removeError.message}`;
        }
      }

      // Remove the incomplete post.
      if (createdPostId) {
        const { error: deleteError } = await supabase
          .from('posts')
          .delete()
          .eq('id', createdPostId)
          .eq('user_id', session.user.id);

        if (deleteError) {
          cleanupMessage +=
            ` Post cleanup also failed: ${deleteError.message}`;
        }
      }

      showStatus(
        `Publishing failed at: ${stage}. ${originalMessage}${cleanupMessage}`,
        'error',
      );
    } finally {
      setBusy(false);
    }
  };

  // ==========================================
  // SCREEN DESIGN
  // ==========================================

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Create</Text>
          <Text style={styles.subtitle}>
            Share your possibilities
          </Text>
        </View>

        <View style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>
          Write something
        </Text>

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="What's happening? Share it with BRITUME..."
          placeholderTextColor={theme.muted}
          multiline
          maxLength={2000}
          style={styles.input}
          textAlignVertical="top"
          editable={!busy}
        />

        <Text style={styles.counter}>
          {content.length}/2000
        </Text>

        <Text style={styles.label}>
          Add media
        </Text>

        <View style={styles.actions}>
          <Pressable
            style={styles.mediaButton}
            onPress={pickPhotos}
            disabled={busy}
          >
            <Ionicons
              name="images-outline"
              size={23}
              color={theme.cyan}
            />
            <Text style={styles.mediaText}>
              Photos
            </Text>
          </Pressable>

          <Pressable
            style={styles.mediaButton}
            onPress={() => pickVideo('video')}
            disabled={busy}
          >
            <Ionicons
              name="videocam-outline"
              size={23}
              color={theme.purple}
            />
            <Text style={styles.mediaText}>
              Video
            </Text>
          </Pressable>

          <Pressable
            style={styles.mediaButton}
            onPress={() => pickVideo('reel')}
            disabled={busy}
          >
            <Ionicons
              name="play-circle-outline"
              size={23}
              color={theme.cyan}
            />
            <Text style={styles.mediaText}>
              Reel
            </Text>
          </Pressable>
        </View>

        {media.length > 0 && (
          <>
            <Text style={styles.selectedTitle}>
              Selected media ({media.length})
            </Text>

            <View style={styles.previewGrid}>
              {media.map((item, index) => (
                <View
                  key={`${item.uri}-${index}`}
                  style={styles.preview}
                >
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

                      <Text
                        style={styles.videoName}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                    </View>
                  )}

                  <Pressable
                    style={styles.removeButton}
                    onPress={() => removeMedia(index)}
                    disabled={busy}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color="#FFFFFF"
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.info}>
          Photos: up to 10 files, 15 MB each. Videos and Reels: up to 100 MB.
        </Text>

        {status !== '' && (
          <View
            style={[
              styles.statusBox,
              statusType === 'success' && styles.successBox,
              statusType === 'error' && styles.errorBox,
              statusType === 'info' && styles.infoBox,
            ]}
          >
            <Ionicons
              name={
                statusType === 'success'
                  ? 'checkmark-circle'
                  : statusType === 'error'
                    ? 'alert-circle'
                    : 'information-circle'
              }
              size={22}
              color={
                statusType === 'success'
                  ? '#16834A'
                  : statusType === 'error'
                    ? '#C73535'
                    : theme.cyan
              }
            />

            <Text style={styles.statusText}>
              {status}
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.publishButton,
            busy && styles.disabled,
          ]}
          onPress={publish}
          disabled={busy}
        >
          {busy ? (
            <>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.publishText}>
                Publishing...
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={21}
                color="#FFFFFF"
              />
              <Text style={styles.publishText}>
                Publish to BRITUME
              </Text>
            </>
          )}
        </Pressable>

        {statusType === 'success' && (
          <Pressable
            style={styles.homeButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons
              name="home-outline"
              size={19}
              color={theme.cyan}
            />

            <Text style={styles.homeButtonText}>
              Go to Home
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

// ==========================================
// BRITUME LIGHT BLUE THEME STYLES
// ==========================================

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

    statusBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 14,
    },

    successBox: {
      backgroundColor: '#E8F8EF',
      borderColor: '#A8DFC0',
    },

    errorBox: {
      backgroundColor: '#FFF0F0',
      borderColor: '#F0B8B8',
    },

    infoBox: {
      backgroundColor: theme.panel2,
      borderColor: theme.border,
    },

    statusText: {
      flex: 1,
      color: theme.text,
      fontSize: 13,
      lineHeight: 19,
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

    homeButton: {
      minHeight: 48,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.panel2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 12,
    },

    homeButtonText: {
      color: theme.cyan,
      fontWeight: '800',
    },

    disabled: {
      opacity: 0.6,
    },
  });
}
