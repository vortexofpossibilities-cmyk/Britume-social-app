import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { router, useFocusEffect } from 'expo-router';

import { fetchPublicPosts, type FeedPost } from '../src/lib/posts';
import { withThemeBackground } from '../src/components/ThemeScreen';

const TOP_BAR_HEIGHT = 66;

function ReelVideo({
  uri,
  active,
  soundStarted,
  onStartSound,
}: {
  uri: string;
  active: boolean;
  soundStarted: boolean;
  onStartSound: () => void;
}) {
  const player = useVideoPlayer(uri, instance => {
    instance.loop = true;
    instance.muted = false;
    instance.volume = 1;
  });

  useEffect(() => {
    player.muted = false;
    player.volume = 1;

    if (active && (Platform.OS !== 'web' || soundStarted)) {
      player.play();
    } else {
      player.pause();
    }

    return () => player.pause();
  }, [active, player, soundStarted]);

  const startSound = () => {
    // Browsers can block audible autoplay until one direct interaction.
    // This is a one-time start, not a mute toggle on every Reel.
    player.muted = false;
    player.volume = 1;
    player.play();
    onStartSound();
  };

  return (
    <View style={styles.videoArea}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen
      />

      {Platform.OS === 'web' && active && !soundStarted && (
        <Pressable
          style={styles.soundStart}
          onPress={startSound}
          accessibilityRole="button"
          accessibilityLabel="Start Reels with sound"
        >
          <View style={styles.soundStartIcon}>
            <Ionicons name="volume-high" size={25} color="#FFFFFF" />
          </View>
          <Text style={styles.soundStartText}>Tap once to start Reels with sound</Text>
        </Pressable>
      )}
    </View>
  );
}

function VideosScreen() {
  const { height } = useWindowDimensions();
  const reelHeight = Math.max(320, height - TOP_BAR_HEIGHT);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [screenFocused, setScreenFocused] = useState(false);
  const [soundStarted, setSoundStarted] = useState(Platform.OS !== 'web');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
    minimumViewTime: 80,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const visible = viewableItems.find(
      (token: any) => token.isViewable && token.index !== null,
    );

    if (visible && typeof visible.index === 'number') {
      setActiveIndex(visible.index);
    }
  }).current;

  const addReel = () => router.push('/(tabs)/create' as never);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  };

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const allPosts = await fetchPublicPosts();
      const videos = allPosts.filter(post =>
        post.media?.some(media =>
          media.media_type?.toLowerCase() === 'video' &&
          typeof media.url === 'string' &&
          media.url.trim().length > 0
        )
      );

      setPosts(videos);
      setActiveIndex(0);
    } catch (err: any) {
      console.error('BRITUME Reels loading error:', err);
      setError(err?.message || 'Could not load Reels. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      void loadVideos();

      return () => setScreenFocused(false);
    }, [loadVideos]),
  );

  useEffect(() => {
    if (activeIndex >= posts.length) {
      setActiveIndex(Math.max(0, posts.length - 1));
    }
  }, [activeIndex, posts.length]);

  const renderItem = ({ item, index }: { item: FeedPost; index: number }) => {
    const video = item.media?.find(media =>
      media.media_type?.toLowerCase() === 'video' && !!media.url
    );

    return (
      <View style={[styles.reel, { height: reelHeight }]}>
        {video?.url ? (
          <ReelVideo
            uri={video.url}
            active={screenFocused && index === activeIndex}
            soundStarted={soundStarted}
            onStartSound={() => setSoundStarted(true)}
          />
        ) : (
          <View style={styles.videoFallback}>
            <Ionicons name="videocam-outline" size={48} color="#FFFFFF" />
            <Text style={styles.white}>Video unavailable</Text>
          </View>
        )}

        <View pointerEvents="none" style={styles.captionArea}>
          <Text style={styles.author}>
            {item.author?.display_name || item.author?.username || 'BRITUME member'}
          </Text>
          {!!item.content && (
            <Text style={styles.caption} numberOfLines={4}>{item.content}</Text>
          )}
          <Text style={styles.hint}>Swipe up for the next Reel</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={goBack} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.heading}>BRITUME REELS</Text>
        <Pressable
          style={styles.addButton}
          onPress={addReel}
          accessibilityRole="button"
          accessibilityLabel="Add a Reel"
        >
          <Ionicons name="add" size={23} color="#FFFFFF" />
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#19C5E8" />
          <Text style={styles.white}>Loading BRITUME Reels...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={55} color="#FF6B6B" />
          <Text style={styles.title}>Reels could not load</Text>
          <Text style={styles.message}>{error}</Text>
          <Pressable style={styles.retry} onPress={() => void loadVideos()}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.white}>Try again</Text>
          </Pressable>
          <Pressable style={styles.retry} onPress={addReel}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.white}>Add a Reel</Text>
          </Pressable>
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          style={styles.list}
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={reelHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          getItemLayout={(_, index) => ({
            length: reelHeight,
            offset: reelHeight * index,
            index,
          })}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={65} color="#FFFFFF" />
          <Text style={styles.title}>No Reels yet</Text>
          <Text style={styles.message}>
            Be the first to share a video on BRITUME. Your public video posts will appear here.
          </Text>
          <Pressable style={styles.retry} onPress={addReel}>
            <Ionicons name="add-circle-outline" size={21} color="#FFFFFF" />
            <Text style={styles.white}>Add your first Reel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07111F' },
  list: { flex: 1 },
  topBar: {
    height: TOP_BAR_HEIGHT, paddingHorizontal: 14, paddingTop: 8,
    backgroundColor: '#07111F', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10, elevation: 10,
  },
  heading: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  iconButton: {
    width: 42, height: 42, borderRadius: 22, backgroundColor: '#1B3046',
    alignItems: 'center', justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, backgroundColor: '#128FBD', paddingHorizontal: 14,
    height: 40, borderRadius: 22,
  },
  addText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  reel: { width: '100%', backgroundColor: '#000000', overflow: 'hidden' },
  videoArea: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  video: { width: '100%', height: '100%', backgroundColor: '#000000' },
  soundStart: {
    position: 'absolute', left: 22, right: 22, top: '42%',
    alignItems: 'center', justifyContent: 'center',
    padding: 18, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.72)',
  },
  soundStartIcon: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#128FBD',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  soundStartText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 25, gap: 14, backgroundColor: '#07111F',
  },
  videoFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#17283A', gap: 12,
  },
  white: { color: '#FFFFFF', fontSize: 14 },
  captionArea: { position: 'absolute', left: 18, right: 18, bottom: 35 },
  author: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  caption: { color: '#FFFFFF', fontSize: 14, lineHeight: 20 },
  hint: { color: '#DDDDDD', fontSize: 11, marginTop: 12 },
  title: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', textAlign: 'center' },
  message: { color: '#DDDDDD', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  retry: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: '#128FBD', paddingHorizontal: 20,
    paddingVertical: 13, borderRadius: 25, marginTop: 8,
  },
});

export default withThemeBackground(VideosScreen);
