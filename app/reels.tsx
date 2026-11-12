
import React, { useCallback, useState } from 'react';
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
import { router, useFocusEffect } from 'expo-router';
import { fetchPublicPosts, type FeedPost } from '../src/lib/posts';

function ReelVideo({ uri }: { uri: string }) {
  if (Platform.OS === 'web') {
    return React.createElement('video' as any, {
      src: uri,
      controls: true,
      autoPlay: true,
      muted: true,
      loop: true,
      playsInline: true,
      preload: 'metadata',
      style: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        backgroundColor: '#000',
      },
    });
  }

  return (
    <View style={styles.videoFallback}>
      <Ionicons name="videocam-outline" size={48} color="#fff" />
      <Text style={styles.white}>
        Video playback is not available here.
      </Text>
    </View>
  );
}

export default function VideosScreen() {
  const { height } = useWindowDimensions();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const addReel = () => {
    router.push('/(tabs)/create' as never);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as never);
    }
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
    } catch (err: any) {
      console.error('BRITUME Reels loading error:', err);
      setError(
        err?.message || 'Could not load Reels. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadVideos();
    }, [loadVideos])
  );

  const renderItem = ({ item }: { item: FeedPost }) => {
    const video = item.media?.find(media =>
      media.media_type?.toLowerCase() === 'video' &&
      !!media.url
    );

    return (
      <View style={[styles.reel, { height }]}>
        {video?.url ? (
          <ReelVideo uri={video.url} />
        ) : (
          <View style={styles.videoFallback}>
            <Text style={styles.white}>Video unavailable</Text>
          </View>
        )}

        <View style={styles.captionArea}>
          <Text style={styles.author}>
            {item.author?.display_name ||
              item.author?.username ||
              'BRITUME member'}
          </Text>

          {!!item.content && (
            <Text style={styles.caption} numberOfLines={4}>
              {item.content}
            </Text>
          )}

          <Text style={styles.hint}>
            Swipe up for the next Reel
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={goBack}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>

        <Text style={styles.heading}>BRITUME REELS</Text>

        <Pressable
          style={styles.addButton}
          onPress={addReel}
          accessibilityRole="button"
          accessibilityLabel="Add a Reel"
        >
          <Ionicons name="add" size={23} color="#fff" />
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
          <Ionicons
            name="alert-circle-outline"
            size={55}
            color="#FF6B6B"
          />

          <Text style={styles.title}>Reels could not load</Text>

          <Text style={styles.message}>{error}</Text>

          <Pressable
            style={styles.retry}
            onPress={() => void loadVideos()}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.white}>Try again</Text>
          </Pressable>

          <Pressable style={styles.retry} onPress={addReel}>
            <Ionicons name="add" size={20} color="#fff" />
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
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          windowSize={3}
          removeClippedSubviews={false}
          getItemLayout={(_, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
        />
      ) : (
        <View style={styles.center}>
          <Ionicons
            name="videocam-off-outline"
            size={65}
            color="#fff"
          />

          <Text style={styles.title}>No Reels yet</Text>

          <Text style={styles.message}>
            Be the first to share a video on BRITUME.
            Your public video posts will appear here.
          </Text>

          <Pressable style={styles.retry} onPress={addReel}>
            <Ionicons name="add-circle-outline" size={21} color="#fff" />
            <Text style={styles.white}>Add your first Reel</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  list: {
    flex: 1,
  },
  topBar: {
    height: 66,
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: '#07111F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 10,
  },
  heading: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: '#1B3046',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#128FBD',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 22,
  },
  addText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  reel: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
    gap: 14,
    backgroundColor: '#07111F',
  },
  videoFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17283A',
    gap: 12,
  },
  white: {
    color: '#fff',
    fontSize: 14,
  },
  captionArea: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 35,
  },
  author: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    color: '#ddd',
    fontSize: 11,
    marginTop: 12,
  },
  title: {
    color: '#fff',
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  message: {
    color: '#ddd',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#128FBD',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 25,
    marginTop: 8,
  },
});
