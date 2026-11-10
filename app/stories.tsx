
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
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
import {
  MEDIA_BUCKET,
  compressImage,
  uploadMediaResumable,
  type UploadSource,
} from '../src/lib/mediaUpload';

const BUCKET = MEDIA_BUCKET;
const MAX_IMAGE_SIZE = 15 * 1024 * 1024;
const MAX_VIDEO_SIZE = 48 * 1024 * 1024;
const STORY_DURATION = 24 * 60 * 60 * 1000;
const IMAGE_VIEW_DURATION = 6000;
const VIDEO_VIEW_DURATION = 15000;

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
      nativeControls={false}
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [viewerProgress, setViewerProgress] = useState(0);
  const [status, setStatus] = useState('');

  const userId = session?.user?.id;

  const ownStories = useMemo(
    () => stories.filter(story => story.user_id === userId),
    [stories, userId],
  );

  const otherStories = useMemo(
    () => stories.filter(story => story.user_id !== userId),
    [stories, userId],
  );

  const viewerStories = useMemo(
    () => [...ownStories, ...otherStories],
    [ownStories, otherStories],
  );

  const selectedStory =
    selectedIndex !== null ? viewerStories[selectedIndex] || null : null;

  const loadStories = useCallback(async () => {
    const client = supabase;

    if (!client || !userId) {
      setStories([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await client
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

      const { data: profiles, error: profileError } = await client
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
        const { data: signed, error: signedError } = await client.storage
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

  const recordStoryView = useCallback(
    async (story: Story) => {
      const client = supabase;

      if (!client || !userId || story.user_id === userId) return;

      try {
        const { data: existing, error: checkError } = await client
          .from('story_views')
          .select('story_id')
          .eq('story_id', story.id)
          .eq('viewer_id', userId)
          .maybeSingle();

        if (checkError) throw checkError;

        if (!existing) {
          const { error } = await client.from('story_views').insert({
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
    },
    [userId],
  );

  const closeViewer = useCallback(() => {
    setSelectedIndex(null);
    setViewerProgress(0);
  }, []);

  const goToStory = useCallback(
    (index: number) => {
      if (index < 0 || index >= viewerStories.length) {
        closeViewer();
        return;
      }

      const nextStory = viewerStories[index];

      setSelectedIndex(index);
      setViewerProgress(0);
      void recordStoryView(nextStory);
    },
    [viewerStories, recordStoryView, closeViewer],
  );

  const openStory = useCallback(
    (story: Story) => {
      const index = viewerStories.findIndex(item => item.id === story.id);

      if (index !== -1) {
        goToStory(index);
      }
    },
    [viewerStories, goToStory],
  );

  const nextStory = useCallback(() => {
    if (selectedIndex === null) return;
    goToStory(selectedIndex + 1);
  }, [selectedIndex, goToStory]);

  const previousStory = useCallback(() => {
    if (selectedIndex === null) return;

    if (viewerProgress > 0.15) {
      setViewerProgress(0);
      return;
    }

    goToStory(selectedIndex - 1);
  }, [selectedIndex, viewerProgress, goToStory]);

  useEffect(() => {
    if (!selectedStory || selectedIndex === null) return;

    setViewerProgress(0);

    const duration =
      selectedStory.media_type === 'video'
        ? VIDEO_VIEW_DURATION
        : IMAGE_VIEW_DURATION;

    const step = 100;

    const timer = setInterval(() => {
      setViewerProgress(current => {
        const next = current + (step / duration) * 100;

        if (next >= 100) {
          clearInterval(timer);

          setTimeout(() => {
            setSelectedIndex(currentIndex => {
              if (currentIndex === null) return null;

              const nextIndex = currentIndex + 1;

              if (nextIndex >= viewerStories.length) {
                return null;
              }

              const nextItem = viewerStories[nextIndex];

              if (nextItem) {
                void recordStoryView(nextItem);
              }

              return nextIndex;
            });

            setViewerProgress(0);
          }, 0);

          return 100;
        }

        return next;
      });
    }, step);

    return () => clearInterval(timer);
  }, [
    selectedStory?.id,
    selectedStory?.media_type,
    selectedIndex,
    viewerStories,
    recordStoryView,
  ]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 20 &&
          Math.abs(gesture.dx) > Math.abs(gesture.dy),

        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -60) {
            nextStory();
          } else if (gesture.dx > 60) {
            previousStory();
          }
        },
      }),
    [nextStory, previousStory],
  );

  const pickStory = async (mediaType: 'image' | 'video') => {
    const client = supabase;

    if (!client || !userId) {
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
        quality: 1,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      let uploadSource: UploadSource;
      let mimeType: string;
      let extension: string;

      if (mediaType === 'image') {
        setStatus('Compressing your photo...');

        const originalMime =
          asset.mimeType || 'image/jpeg';

        const compressed = await compressImage(
          asset.uri,
          originalMime,
        );

        mimeType = compressed.mimeType;
        extension = compressed.name.split('.').pop() || 'jpg';

        if (Platform.OS === 'web') {
          const response = await fetch(compressed.uri);

          if (!response.ok) {
            throw new Error('Could not prepare the compressed photo.');
          }

          const blob = await response.blob();

          if (!blob.size) {
            throw new Error('The compressed photo is empty.');
          }

          if (blob.size > MAX_IMAGE_SIZE) {
            throw new Error('Photos must be 15 MB or smaller after compression.');
          }

          uploadSource = new File(
            [blob],
            compressed.name,
            { type: mimeType },
          );
        } else {
          uploadSource = {
            uri: compressed.uri,
            name: compressed.name,
            type: mimeType,
            size: compressed.size,
          };
        }
      } else {
        mimeType =
          asset.mimeType ||
          (asset.uri.toLowerCase().endsWith('.mov')
            ? 'video/quicktime'
            : 'video/mp4');

        extension =
          mimeType === 'video/quicktime' ? 'mov' : 'mp4';

        let videoSize = 0;

        if (Platform.OS === 'web') {
          if (asset.file) {
            videoSize = asset.file.size;
            uploadSource = asset.file;
          } else {
            const response = await fetch(asset.uri);

            if (!response.ok) {
              throw new Error('Could not read the selected video.');
            }

            const blob = await response.blob();
            videoSize = blob.size;

            uploadSource = new File(
              [blob],
              `story-${Date.now()}.${extension}`,
              { type: mimeType },
            );
          }
        } else {
          const file = new ExpoFile(asset.uri);

          if (!file.exists) {
            throw new Error('The selected video could not be found.');
          }

          videoSize = file.size;

          uploadSource = {
            uri: asset.uri,
            name: `story-${Date.now()}.${extension}`,
            type: mimeType,
            size: videoSize,
          };
        }

        if (!videoSize) {
          throw new Error('Could not determine the video file size.');
        }

        if (videoSize > MAX_VIDEO_SIZE) {
          throw new Error('Videos must be 48 MB or smaller.');
        }
      }

      setUploading(true);
      setStatus('Uploading your story... 0%');

      const path =
        `${userId}/stories/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${extension}`;

      await uploadMediaResumable(
        uploadSource,
        path,
        mimeType,
        percent => {
          setStatus(`Uploading your story... ${percent}%`);
        },
      );

      const expiresAt = new Date(
        Date.now() + STORY_DURATION,
      ).toISOString();

      const { error: insertError } = await client
        .from('stories')
        .insert({
          user_id: userId,
          caption: caption.trim(),
          storage_path: path,
          media_type: mediaType,
          expires_at: expiresAt,
        });

      if (insertError) {
        await client.storage.from(BUCKET).remove([path]);
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

  const deleteStory = (story: Story) => {
    const client = supabase;

    if (!client || story.user_id !== userId) return;

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
              const { error } = await client
                .from('stories')
                .delete()
                .eq('id', story.id)
                .eq('user_id', userId);

              if (error) throw error;

              await client.storage
                .from(BUCKET)
                .remove([story.storage_path]);

              closeViewer();
              await loadStories();
            } catch (error) {
              Alert.alert('Delete failed', errorMessage(error));
            }
          },
        },
      ],
    );
  };

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
              style={[
                styles.uploadButton,
                uploading && styles.disabledButton,
              ]}
              onPress={() => void pickStory('image')}
            >
              <Ionicons name="image-outline" size={21} color="#FFFFFF" />
              <Text style={styles.uploadButtonText}>Photo</Text>
            </Pressable>

            <Pressable
              disabled={uploading}
              style={[
                styles.uploadButton,
                styles.videoButton,
                uploading && styles.disabledButton,
              ]}
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
              onPress={() => openStory(story)}
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
              onPress={() => openStory(story)}
            />
          ))
        )}
      </ScrollView>

      {selectedStory && selectedIndex !== null && (
        <View style={styles.viewer}>
          <View style={styles.viewerProgressRow}>
            {viewerStories.map((story, index) => (
              <View key={story.id} style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width:
                        index < selectedIndex
                          ? '100%'
                          : index === selectedIndex
                            ? `${viewerProgress}%`
                            : '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.viewerHeader}>
            <View style={styles.viewerAvatar}>
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>

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
              onPress={closeViewer}
              style={styles.viewerAction}
            >
              <Ionicons name="close" size={27} color="#FFFFFF" />
            </Pressable>
          </View>

          <View
            style={styles.viewerMedia}
            {...panResponder.panHandlers}
          >
            {selectedStory.media_type === 'image' ? (
              <Image
                key={selectedStory.id}
                source={{ uri: selectedStory.media_url }}
                style={styles.storyImage}
                resizeMode="contain"
              />
            ) : (
              <VideoStory
                key={selectedStory.id}
                uri={selectedStory.media_url}
              />
            )}

            <Pressable
              style={styles.leftTapZone}
              onPress={previousStory}
            />

            <Pressable
              style={styles.rightTapZone}
              onPress={nextStory}
            />
          </View>

          {!!selectedStory.caption && (
            <Text style={styles.viewerCaption}>
              {selectedStory.caption}
            </Text>
          )}

          <View style={styles.viewerBottom}>
            <Text style={styles.viewerHint}>
              Tap left or right, or swipe to change stories
            </Text>
          </View>
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
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: story.media_url }}
          style={styles.storyThumbnail}
          resizeMode="cover"
        />

        {story.media_type === 'video' && (
          <View style={styles.thumbnailPlay}>
            <Ionicons name="play" size={18} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.storyInfo}>
        <Text style={styles.storyAuthor}>{story.display_name}</Text>

        <Text style={styles.storyCaption} numberOfLines={2}>
          {story.caption || 'Shared a moment'}
        </Text>

        <Text style={styles.storyExpiry}>Expires after 24 hours</Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={23}
        color={styles.iconColor}
      />
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
    disabledButton: {
      opacity: 0.5,
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
    thumbnailContainer: {
      width: 62,
      height: 72,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: theme.panel2,
    },
    storyThumbnail: {
      width: '100%',
      height: '100%',
    },
    thumbnailPlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
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
      elevation: 20,
    },
    viewerProgressRow: {
      flexDirection: 'row',
      gap: 4,
      paddingHorizontal: 9,
      paddingTop: Platform.OS === 'ios' ? 54 : 27,
    },
    progressTrack: {
      flex: 1,
      height: 3,
      borderRadius: 5,
      overflow: 'hidden',
      backgroundColor: 'rgba(255,255,255,0.35)',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: 5,
    },
    viewerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 10,
    },
    viewerAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#444444',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 9,
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
      position: 'relative',
    },
    storyImage: {
      width: '100%',
      height: '100%',
    },
    leftTapZone: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: '35%',
    },
    rightTapZone: {
      position: 'absolute',
      right: 0,
      top: 0,
      bottom: 0,
      width: '65%',
    },
    viewerCaption: {
      color: '#FFFFFF',
      fontSize: 15,
      textAlign: 'center',
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 8,
    },
    viewerBottom: {
      paddingBottom: Platform.OS === 'ios' ? 28 : 14,
      paddingTop: 6,
      alignItems: 'center',
    },
    viewerHint: {
      color: '#AAAAAA',
      fontSize: 11,
    },
    iconColor: theme.cyan,
  });
}
