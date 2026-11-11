// app/community/create-post.tsx

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '../../src/lib/supabase';
import {
  createCommunityPost,
  addCommunityPostMedia,
  deleteCommunityPost,
  type CommunityPostType,
} from '../../src/lib/communityPosts';

import {
  MEDIA_BUCKET,
  compressImage,
  uploadMediaResumable,
  type UploadSource,
} from '../../src/lib/mediaUpload';

type SelectedMedia = {
  uri: string;
  name: string;
  mimeType: string;
  mediaType: 'image' | 'video';
  size?: number;
  file?: File;
};

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 48 * 1024 * 1024;

export default function CreateCommunityPostScreen() {
  const params = useLocalSearchParams<{
    communityId: string;
    communityName?: string;
  }>();

  const communityId = String(params.communityId || '');
  const communityName = String(params.communityName || 'Community');

  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedMedia, setSelectedMedia] =
    useState<SelectedMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postType, setPostType] =
    useState<CommunityPostType>('text');

  const showError = (message: string) => {
    Alert.alert('BRITUME', message);
  };

  const chooseMedia = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showError('Please allow photo library access to select media.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 0.85,
        videoMaxDuration: 120,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const isVideo = asset.type === 'video';

      const mediaType: 'image' | 'video' = isVideo
        ? 'video'
        : 'image';

      const mimeType =
        asset.mimeType ||
        (isVideo ? 'video/mp4' : 'image/jpeg');

      const fileName =
        asset.fileName ||
        `community-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;

      if (asset.fileSize) {
        const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

        if (asset.fileSize > limit) {
          showError(
            isVideo
              ? 'This video is larger than 48 MB. Please choose a smaller video.'
              : 'This image is larger than 15 MB. Please choose a smaller image.'
          );
          return;
        }
      }

      setSelectedMedia({
        uri: asset.uri,
        name: fileName,
        mimeType,
        mediaType,
        size: asset.fileSize,
        file: asset.file,
      });

      setPostType(isVideo ? 'video' : 'photo');
    } catch (error: any) {
      showError(error?.message || 'Could not select media.');
    }
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setPostType(linkUrl.trim() ? 'link' : 'text');
  };

  const getExtension = (name: string, mimeType: string) => {
    const existing = name.split('.').pop()?.toLowerCase();

    if (existing && existing !== name.toLowerCase()) {
      return existing.replace(/[^a-z0-9]/g, '') || 'bin';
    }

    const mimeExtensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/webm': 'webm',
    };

    return mimeExtensions[mimeType] || 'bin';
  };

  const prepareUploadSource = async (
    media: SelectedMedia
  ): Promise<{
    source: UploadSource;
    mimeType: string;
    name: string;
  }> => {
    if (Platform.OS === 'web') {
      if (media.file) {
        return {
          source: media.file,
          mimeType: media.mimeType,
          name: media.name,
        };
      }

      const response = await fetch(media.uri);

      if (!response.ok) {
        throw new Error('Could not read the selected media.');
      }

      const blob = await response.blob();

      const file = new File([blob], media.name, {
        type: media.mimeType,
      });

      return {
        source: file,
        mimeType: media.mimeType,
        name: media.name,
      };
    }

    if (media.mediaType === 'image') {
      const compressed = await compressImage(
        media.uri,
        media.mimeType
      );

      return {
        source: {
          uri: compressed.uri,
          name: compressed.name,
          type: compressed.mimeType,
          size: compressed.size,
        },
        mimeType: compressed.mimeType,
        name: compressed.name,
      };
    }

    return {
      source: {
        uri: media.uri,
        name: media.name,
        type: media.mimeType,
        size: media.size,
      },
      mimeType: media.mimeType,
      name: media.name,
    };
  };

  const publishPost = async () => {
    if (!communityId) {
      showError('Community information is missing.');
      return;
    }

    if (
      !content.trim() &&
      !linkUrl.trim() &&
      !selectedMedia
    ) {
      showError('Write something or add a link or media.');
      return;
    }

    if (content.length > 10000) {
      showError('Your post cannot exceed 10,000 characters.');
      return;
    }

    if (linkUrl.trim()) {
      try {
        const parsed = new URL(linkUrl.trim());

        if (!['http:', 'https:'].includes(parsed.protocol)) {
          throw new Error();
        }
      } catch {
        showError('Enter a valid website address beginning with https:// or http://.');
        return;
      }
    }

    let createdPostId: string | null = null;
    let uploadedPath: string | null = null;

    try {
      setUploading(true);
      setUploadProgress(0);

      const userResult = await supabase?.auth.getUser();
      const user = userResult?.data.user;

      if (!user) {
        throw new Error('Please sign in before publishing.');
      }

      let finalPostType: CommunityPostType = postType;

      if (!selectedMedia) {
        finalPostType = linkUrl.trim() ? 'link' : 'text';
      }

      const post = await createCommunityPost({
        communityId,
        content: content.trim(),
        postType: finalPostType,
        linkUrl: linkUrl.trim() || undefined,
      });

      createdPostId = post.id;

      if (selectedMedia) {
        const prepared = await prepareUploadSource(selectedMedia);
        const extension = getExtension(
          prepared.name,
          prepared.mimeType
        );

        uploadedPath =
          `${user.id}/community-posts/${communityId}/${post.id}/` +
          `${Date.now()}.${extension}`;

        await uploadMediaResumable(
          prepared.source,
          uploadedPath,
          prepared.mimeType,
          (progress) => {
            if (progress.total > 0) {
              setUploadProgress(
                Math.round(
                  (progress.loaded / progress.total) * 100
                )
              );
            }
          }
        );

        await addCommunityPostMedia({
          postId: post.id,
          storagePath: uploadedPath,
          mediaType: selectedMedia.mediaType,
          mimeType: prepared.mimeType,
          position: 0,
        });
      }

      Alert.alert('Published', 'Your community post is live.');

      router.replace({
        pathname: '/community/[id]',
        params: {
          id: communityId,
          name: communityName,
        },
      });
    } catch (error: any) {
      if (uploadedPath) {
        await supabase?.storage
          .from(MEDIA_BUCKET)
          .remove([uploadedPath]);
      }

      if (createdPostId) {
        try {
          await deleteCommunityPost(createdPostId);
        } catch {
          // Preserve the original publishing error.
        }
      }

      showError(
        error?.message || 'Your post could not be published.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          disabled={uploading}
        >
          <Ionicons name="arrow-back" size={25} color="#222222" />
        </Pressable>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Create post</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {communityName}
          </Text>
        </View>

        <Pressable
          style={[
            styles.publishButton,
            uploading && styles.disabledButton,
          ]}
          disabled={uploading}
          onPress={publishPost}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.publishButtonText}>Publish</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Share with your community</Text>

        <TextInput
          style={styles.postInput}
          placeholder="What would you like to share?"
          placeholderTextColor="#999999"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={10000}
          editable={!uploading}
          textAlignVertical="top"
        />

        <Text style={styles.characterCount}>
          {content.length}/10000
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Website link (optional)</Text>

        <View style={styles.linkInputContainer}>
          <Ionicons name="link-outline" size={21} color="#777777" />
          <TextInput
            style={styles.linkInput}
            placeholder="https://example.com"
            placeholderTextColor="#999999"
            value={linkUrl}
            onChangeText={setLinkUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            editable={!uploading}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>Add photos or videos</Text>

        <Pressable
          style={styles.mediaButton}
          onPress={chooseMedia}
          disabled={uploading}
        >
          <Ionicons name="images-outline" size={24} color="#6759D8" />
          <View style={styles.mediaButtonTextContainer}>
            <Text style={styles.mediaButtonTitle}>
              Choose photo or video
            </Text>
            <Text style={styles.mediaButtonSubtitle}>
              Images up to 15 MB · Videos up to 48 MB
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888888" />
        </Pressable>

        {selectedMedia && (
          <View style={styles.selectedMedia}>
            <View style={styles.selectedMediaIcon}>
              <Ionicons
                name={
                  selectedMedia.mediaType === 'video'
                    ? 'videocam'
                    : 'image'
                }
                size={24}
                color="#6759D8"
              />
            </View>

            <View style={styles.selectedMediaInfo}>
              <Text style={styles.selectedMediaName} numberOfLines={1}>
                {selectedMedia.name}
              </Text>
              <Text style={styles.selectedMediaType}>
                {selectedMedia.mediaType === 'video'
                  ? 'Video selected'
                  : 'Photo selected'}
              </Text>
            </View>

            <Pressable
              onPress={removeMedia}
              disabled={uploading}
            >
              <Ionicons
                name="close-circle"
                size={24}
                color="#D94A5B"
              />
            </Pressable>
          </View>
        )}

        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>
                Publishing your post...
              </Text>
              <Text style={styles.progressValue}>
                {selectedMedia ? `${uploadProgress}%` : 'Please wait'}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${uploadProgress}%` },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#6759D8"
          />
          <Text style={styles.noticeText}>
            Only members of this community can view and interact with
            its posts.
          </Text>
        </View>

        <Pressable
          style={[
            styles.bottomPublishButton,
            uploading && styles.disabledButton,
          ]}
          onPress={publishPost}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.bottomPublishText}>
                Publish to community
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    paddingTop: Platform.OS === 'android' ? 35 : 55,
  },
  header: {
    height: 65,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAF0',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#222222',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#888888',
    fontSize: 12,
    marginTop: 3,
  },
  publishButton: {
    backgroundColor: '#6759D8',
    borderRadius: 10,
    paddingHorizontal: 17,
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 76,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.6,
  },
  content: {
    padding: 17,
    paddingBottom: 45,
  },
  label: {
    color: '#252525',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  postInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E7ED',
    minHeight: 175,
    padding: 15,
    color: '#222222',
    fontSize: 15,
    lineHeight: 23,
  },
  characterCount: {
    color: '#999999',
    textAlign: 'right',
    fontSize: 11,
    marginTop: 7,
  },
  divider: {
    height: 1,
    backgroundColor: '#E7E7ED',
    marginVertical: 21,
  },
  linkInputContainer: {
    height: 49,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E7ED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 10,
  },
  linkInput: {
    flex: 1,
    color: '#222222',
    fontSize: 14,
  },
  mediaButton: {
    minHeight: 75,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E7E7ED',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mediaButtonTextContainer: {
    flex: 1,
  },
  mediaButtonTitle: {
    color: '#292929',
    fontSize: 14,
    fontWeight: '700',
  },
  mediaButtonSubtitle: {
    color: '#888888',
    fontSize: 11,
    marginTop: 5,
  },
  selectedMedia: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EFEDFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  selectedMediaIcon: {
    width: 42,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMediaInfo: {
    flex: 1,
  },
  selectedMediaName: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '700',
  },
  selectedMediaType: {
    color: '#777777',
    fontSize: 11,
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 13,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    color: '#444444',
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    color: '#6759D8',
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    backgroundColor: '#EAEAEA',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    backgroundColor: '#6759D8',
    borderRadius: 10,
  },
  notice: {
    marginTop: 23,
    backgroundColor: '#EFEDFF',
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  noticeText: {
    flex: 1,
    color: '#5547B8',
    fontSize: 12,
    lineHeight: 18,
  },
  bottomPublishButton: {
    minHeight: 50,
    backgroundColor: '#6759D8',
    borderRadius: 13,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  bottomPublishText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
