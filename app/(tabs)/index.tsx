
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  fetchPublicPosts,
  type FeedPost,
} from '../../src/lib/posts';

export default function HomeScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const results = await fetchPublicPosts();
      setPosts(results);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to load posts.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPosts();
    }, [loadPosts])
  );

  if (loading) {
    return (
      <ActivityIndicator style={{ marginTop: 40 }} size="large" />
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: '#19334D', marginBottom: 12 }}>
          {error}
        </Text>
        <Text
          onPress={() => void loadPosts()}
          style={{ color: '#47739B' }}
        >
          Tap to try again
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadPosts(true)}
        />
      }
      ListHeaderComponent={
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: '#19334D',
            marginBottom: 16,
          }}
        >
          BRITUME · Latest posts
        </Text>
      }
      ListEmptyComponent={
        <Text style={{ color: '#47739B' }}>
          No posts yet. Be the first to share something on BRITUME!
        </Text>
      }
      ListFooterComponent={
        error ? (
          <Text style={{ color: '#B42318', marginTop: 12 }}>
            Refresh failed: {error}
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        <View
          style={{
            padding: 16,
            marginBottom: 12,
            borderRadius: 16,
            backgroundColor: '#EAF5FF',
          }}
        >
          <Text
            style={{
              marginBottom: 8,
              color: '#47739B',
              fontWeight: 'bold',
            }}
          >
            BRITUME member
          </Text>

          <Text style={{ fontSize: 16, color: '#19334D' }}>
            {item.content}
          </Text>

          <Text
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#66829B',
            }}
          >
            {new Date(item.created_at).toLocaleString()}
          </Text>
        </View>
      )}
    />
  );
}
