
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';
import { VideoView, useVideoPlayer } from 'expo-video';

import { useAuth } from '../src/auth/AuthProvider';
import { supabase } from '../src/lib/supabase';
import { useAppTheme } from '../src/contexts/ThemeContext';

const BUCKET = 'britume-media';
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const STORY_DURATION = 24 * 60 * 60 * 1000;

type Story = {
  id: string;
  user_id: string;
  caption: string;
  storage_path: string;
  media_type: 'image' | 'video';
  created_at: string;
  expires_at: string;
  media_url: string;
  display_name: string;
};

function errorMessage(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return String(error || 'An unexpected error occurred.');
}

function VideoStory({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, videoPlayer => {
    videoPlayer.loop = true;
    videoPlayer.play();
  });

  return (
    <VideoView
      player={player}
      style={stylesVideo.video}
      contentFit="contain"
      nativeControls
    />
  );
}

const stylesVideo = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
});

export default function StoriesScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [status, setStatus] = useState('');

  const userId = session?.user?.id;

  const loadStories = useCallback(async () => {
    if (!supabase || !userId) {
      setStories([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('stories')
        .select(
          'id,user_id,caption,storage_path,media_type,created_at,expires_at',
        )
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];

      if (rows.length === 0) {
        setStories([]);
        return;
      }

      const authorIds = [...new Set(rows.map(row => row.user_id))];

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id,display_name,username')
        .in('user_id', authorIds);

      if (profileError) throw profileError;

      const profileMap = new Map(
        (profiles || []).map(profile => [
          profile.user_id,
          profile.display_name || profile.username || 'BRITUME member',
        ]),
      );

      const enriched: Story[] = [];

      for (const row of rows) {
        const { data: signed, error: signedError } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.storage_path, 60 * 60);

        if (signedError || !signed?.signedUrl) {
          console.warn('Could not load story media:', signedError);
          continue;
        }

        enriched.push({
          ...row,
          media_url: signed.signedUrl,
          display_name: profileMap.get(row.user_id) || 'BRITUME member',
        });
      }

      setStories(enriched);
    } catch (error) {
      setStatus(`Could not load stories: ${errorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void loadStories();
    }, [loadStories]),
  );

  const pickStory = async (mediaType: 'image' | 'video') => {
    if (!supabase || !userId) {
      Alert.alert('Sign in required', 'Please sign in to create a story.');
      return;
    }

    try {
      setStatus('');

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted && Platform.OS !== 'web') {
        Alert.alert(
          'Permission required',
          'Please allow BRITUME to access your photos and videos.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaType === 'image' ? ['images'] : ['videos'],
        allowsMultipleSelection: false,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const mimeType =
        asset.mimeType ||
        (mediaType === 'image' ? 'image/jpeg' : 'video/mp4');

      let bytes: ArrayBuffer;

      if (Platform.OS === 'web') {
        if (asset.file) {
          bytes = await asset.file.arrayBuffer();
        } else {
          const response = await fetch(asset.uri);
          if (!response.ok) {
            throw new Error('Could not read the selected browser file.');
          }
          bytes = await (await response.blob()).arrayBuffer();
        }
      } else {
        const file = new ExpoFile(asset.uri);

        if (!file.exists) {
          throw new Error('The selected file could not be found.');
        }

        bytes = await file.arrayBuffer();
      }

      if (!bytes.byteLength) {
        throw new Error('The selected file is empty.');
      }

      const sizeLimit =
        mediaType === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;

      if (bytes.byteLength > sizeLimit) {
        throw new Error(
          mediaType === 'image'
            ? 'Photos must be 15 MB or smaller.'
            : 'Videos must be 100 MB or smaller.',
        );
      }

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

      setUploading(true);
      setStatus('Uploading your story...');

      const path =
        `${userId}/stories/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const expiresAt = new Date(
        Date.now() + STORY_DURATION,
      ).toISOString();

      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: userId,
          caption: caption.trim(),
          storage_path: path,
          media_type: mediaType,
          expires_at: expiresAt,
        });

      if (insertError) {
        await supabase.storage.from(BUCKET).remove([path]);
        throw insertError;
      }

      setCaption('');
      setStatus('Your story has been published!');
      await loadStories();
    } catch (error) {
      setStatus(`Story upload failed: ${errorMessage(error)}`);
    } finally {
      setUploading(false);
    }
  };

  const openStory = async (story: Story) => {
    setSelectedStory(story);

    if (!supabase || !userId || story.user_id === userId) return;

    try {
      const { data: existing, error: checkError } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('story_id', story.id)
        .eq('viewer_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!existing) {
        const { error } = await supabase.from('story_views').insert({
          story_id: story.id,
          viewer_id: userId,
        });

        if (error) {
          console.warn('Could not record story view:', error.message);
        }
      }
    } catch (error) {
      console.warn('Story view recording failed:', errorMessage(error));
    }
  };

  const deleteStory = (story: Story) => {
    if (!supabase || story.user_id !== userId) return;

    Alert.alert(
      'Delete story?',
      'This will remove your story from BRITUME.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('stories')
                .delete()
                .eq('id', story.id)
                .eq('user_id', userId);

              if (error) throw error;

              await supabase.storage
                .from(BUCKET)
                .remove([story.storage_path]);

              setSelectedStory(null);
              await loadStories();
            } catch (error) {
              Alert.alert('Delete failed', errorMessage(error));
            }
          },
        },
      ],
    );
  };

  const ownStories = stories.filter(story => story.user_id === userId);
  const otherStories = stories.filter(story => story.user_id !== userId);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={23} color={theme.text} />
        </Pressable>

        <View style={styles.headerTitle}>
          <Text style={styles.title}>Stories</Text>
          <Text style={styles.subtitle}>Moments that last 24 hours</Text>
        </View>

        <Pressable onPress={() => void loadStories()}>
          <Ionicons name="refresh" size={23} color={theme.cyan} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.createCard}>
          <Text style={styles.sectionTitle}>Share a moment</Text>
          <Text style={styles.description}>
            Photos and videos disappear from Stories after 24 hours.
          </Text>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption (optional)..."
            placeholderTextColor={theme.muted}
            multiline
            maxLength={300}
            style={styles.captionInput}
          />

          <View style={styles.uploadButtons}>
            <Pressable
              disabled={uploading}
              style={styles.uploadButton}
              onPress={() => void pickStory('image')}
            >
              <Ionicons name="image-outline" size={21} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Photo</Text>
            </Pressable>

            <Pressable
              disabled={uploading}
              style={[styles.uploadButton, styles.videoButton]}
              onPress={() => void pickStory('video')}
            >
              <Ionicons name="videocam-outline" size={21} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Video</Text>
            </Pressable>
          </View>

          {uploading && (
            <View style={styles.progress}>
              <ActivityIndicator color={theme.cyan} />
              <Text style={styles.progressText}>Uploading...</Text>
            </View>
          )}

          {!!status && <Text style={styles.status}>{status}</Text>}
        </View>

        <Text style={styles.sectionTitle}>Your stories</Text>

        {ownStories.length === 0 ? (
          <Text style={styles.emptyText}>
            You haven't shared a story yet. Add your first photo or video.
          </Text>
        ) : (
          ownStories.map(story => (
            <StoryRow
              key={story.id}
              story={story}
              styles={styles}
              onPress={() => void openStory(story)}
            />
          ))
        )}

        <Text style={styles.sectionTitle}>Recent stories</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.cyan}
            style={styles.loader}
          />
        ) : otherStories.length === 0 ? (
          <Text style={styles.emptyText}>
            Stories from other public BRITUME members will appear here.
          </Text>
        ) : (
          otherStories.map(story => (
            <StoryRow
              key={story.id}
              story={story}
              styles={styles}
              onPress={() => void openStory(story)}
            />
          ))
        )}
      </ScrollView>

      {selectedStory && (
        <View style={styles.viewer}>
          <View style={styles.viewerHeader}>
            <View style={styles.viewerAuthor}>
              <Text style={styles.viewerName}>
                {selectedStory.display_name}
              </Text>
              <Text style={styles.viewerTime}>
                {new Date(selectedStory.created_at).toLocaleString()}
              </Text>
            </View>

            {selectedStory.user_id === userId && (
              <Pressable
                onPress={() => deleteStory(selectedStory)}
                style={styles.viewerAction}
              >
                <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
              </Pressable>
            )}

            <Pressable
              onPress={() => setSelectedStory(null)}
              style={styles.viewerAction}
            >
              <Ionicons name="close" size={27} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.viewerMedia}>
            {selectedStory.media_type === 'image' ? (
              <Image
                source={{ uri: selectedStory.media_url }}
                style={styles.storyImage}
                resizeMode="contain"
              />
            ) : (
              <VideoStory uri={selectedStory.media_url} />
            )}
          </View>

          {!!selectedStory.caption && (
            <Text style={styles.viewerCaption}>
              {selectedStory.caption}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

function StoryRow({
  story,
  styles,
  onPress,
}: {
  story: Story;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.storyRow} onPress={onPress}>
      <Image
        source={{ uri: story.media_url }}
        style={styles.storyThumbnail}
      />

      <View style={styles.storyInfo}>
        <Text style={styles.storyAuthor}>{story.display_name}</Text>
        <Text style={styles.storyCaption} numberOfLines={2}>
          {story.caption || 'Shared a moment'}
        </Text>
        <Text style={styles.storyExpiry}>Expires after 24 hours</Text>
      </View>

      <Ionicons name="play-circle-outline" size={27} color={styles.iconColor} />
    </Pressable>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 38,
      height: 38,
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      marginLeft: 8,
    },
    title: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
    },
    subtitle: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 2,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    createCard: {
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      padding: 16,
      marginBottom: 24,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 10,
      marginTop: 12,
    },
    description: {
      color: theme.muted,
      fontSize: 13,
      marginBottom: 14,
    },
    captionInput: {
      minHeight: 76,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 12,
      color: theme.text,
      textAlignVertical: 'top',
      backgroundColor: theme.bg,
    },
    uploadButtons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },
    uploadButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: theme.cyan,
    },
    videoButton: {
      backgroundColor: theme.purple,
    },
    uploadButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    progress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 14,
    },
    progressText: {
      color: theme.muted,
      fontSize: 13,
    },
    status: {
      color: theme.cyan,
      fontSize: 13,
      marginTop: 12,
    },
    emptyText: {
      color: theme.muted,
      fontSize: 13,
      lineHeight: 20,
      paddingVertical: 12,
    },
    storyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 10,
      marginBottom: 9,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
    },
    storyThumbnail: {
      width: 62,
      height: 72,
      borderRadius: 10,
      backgroundColor: theme.panel2,
    },
    storyInfo: {
      flex: 1,
    },
    storyAuthor: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
    },
    storyCaption: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 4,
    },
    storyExpiry: {
      color: theme.cyan,
      fontSize: 11,
      marginTop: 5,
    },
    loader: {
      marginVertical: 20,
    },
    viewer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#000000',
      zIndex: 20,
    },
    viewerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: Platform.OS === 'ios' ? 55 : 25,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    viewerAuthor: {
      flex: 1,
    },
    viewerName: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },
    viewerTime: {
      color: '#CCCCCC',
      fontSize: 11,
      marginTop: 3,
    },
    viewerAction: {
      padding: 9,
    },
    viewerMedia: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    storyImage: {
      width: '100%',
      height: '100%',
    },
    viewerCaption: {
      color: '#FFFFFF',
      fontSize: 15,
      textAlign: 'center',
      padding: 18,
    },
    iconColor: theme.cyan,
  });
}
