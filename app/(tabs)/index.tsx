
import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Pressable,
  Share,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import {
  fetchPublicPosts,
  type FeedPost,
} from '../../src/lib/posts';
import { theme } from '../../src/lib/theme';

export default function HomeScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

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

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return posts;

    return posts.filter((post) =>
      (post.content ?? '').toLowerCase().includes(query)
    );
  }, [posts, search]);

  const sharePost = async (content: string) => {
    try {
      await Share.share({ message: content });
    } catch {
      // Sharing was cancelled or unavailable.
    }
  };

  const Header = (
    <View>
      <View style={styles.topBar}>
        <View style={styles.brandMark}>
          <Text style={styles.brandLetter}>B</Text>
        </View>

        <View style={styles.brandText}>
          <Text style={styles.brandName}>BRITUME</Text>
          <Text style={styles.tagline}>
            Vortex of Possibilities
          </Text>
          <Text style={styles.byline}>by brilliant mere</Text>
        </View>

        <Pressable
          accessibilityLabel="Create a post"
          style={styles.topIcon}
          onPress={() => router.push('/(tabs)/create')}
        >
          <Ionicons name="add-circle-outline" size={25} color={theme.text} />
        </Pressable>

        <Pressable
          accessibilityLabel="Discover people and posts"
          style={styles.topIcon}
          onPress={() => router.push('/(tabs)/discover')}
        >
          <Ionicons name="people-outline" size={23} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color={theme.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search posts..."
          placeholderTextColor={theme.muted}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Stories</Text>
        <Text style={styles.sectionNote}>Share a moment</Text>
      </View>

      <View style={styles.storyRow}>
        <Pressable
          style={styles.storyItem}
          onPress={() => router.push('/(tabs)/create')}
        >
          <View style={[styles.storyCircle, styles.createStory]}>
            <Ionicons name="add" size={30} color="#FFFFFF" />
          </View>
          <Text style={styles.storyLabel}>Your story</Text>
        </Pressable>

        <View style={styles.storyEmpty}>
          <Ionicons
            name="people-circle-outline"
            size={27}
            color={theme.muted}
          />
          <Text style={styles.storyEmptyText}>
            Stories from people you follow will appear here.
          </Text>
        </View>
      </View>

      <View style={styles.feedHeading}>
        <Text style={styles.sectionTitle}>Your feed</Text>
        <Pressable
          onPress={() => void loadPosts(true)}
          accessibilityLabel="Refresh feed"
        >
          <Ionicons name="refresh-outline" size={22} color={theme.cyan} />
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void loadPosts()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.cyan} />
        <Text style={styles.loadingText}>Loading BRITUME...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={filteredPosts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={Header}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadPosts(true)}
          tintColor={theme.cyan}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={35}
            color={theme.cyan}
          />
          <Text style={styles.emptyTitle}>
            {search.trim() ? 'No matching posts' : 'Your feed starts here'}
          </Text>
          <Text style={styles.emptyText}>
            {search.trim()
              ? 'Try a different search.'
              : 'When posts are available, they will appear here. You can create the first post.'}
          </Text>
          {!search.trim() && (
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push('/(tabs)/create')}
            >
              <Text style={styles.primaryButtonText}>Create a post</Text>
            </Pressable>
          )}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.postCard}>
          <View style={styles.postHeader}>
            <View style={styles.avatar}>
              <Ionicons
                name="person-outline"
                size={21}
                color={theme.cyan}
              />
            </View>
            <View style={styles.postAuthor}>
              <Text style={styles.authorName}>BRITUME post</Text>
              <Text style={styles.postDate}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Share post"
              onPress={() => void sharePost(item.content ?? '')}
              style={styles.actionIcon}
            >
              <Ionicons
                name="share-social-outline"
                size={21}
                color={theme.text}
              />
            </Pressable>
          </View>

          <Text style={styles.postContent}>{item.content}</Text>

          <View style={styles.postActions}>
            <View style={styles.notConnectedAction}>
              <Ionicons
                name="heart-outline"
                size={20}
                color={theme.muted}
              />
              <Text style={styles.actionLabel}>Like</Text>
            </View>

            <View style={styles.notConnectedAction}>
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={theme.muted}
              />
              <Text style={styles.actionLabel}>Comment</Text>
            </View>

            <Pressable
              style={styles.actionButton}
              onPress={() => void sharePost(item.content ?? '')}
            >
              <Ionicons
                name="paper-plane-outline"
                size={20}
                color={theme.cyan}
              />
              <Text style={styles.shareLabel}>Share</Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 28,
    flexGrow: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: theme.cyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },
  brandText: {
    flex: 1,
    marginLeft: 10,
  },
  brandName: {
    color: theme.text,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tagline: {
    color: theme.muted,
    fontSize: 11,
  },
  byline: {
    color: theme.muted,
    fontSize: 10,
  },
  topIcon: {
    padding: 7,
    marginLeft: 3,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 15,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 9,
    color: theme.text,
    fontSize: 15,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.text,
  },
  sectionNote: {
    color: theme.muted,
    fontSize: 12,
  },
  storyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 13,
  },
  storyCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.cyan,
  },
  createStory: {
    backgroundColor: theme.cyan,
  },
  storyLabel: {
    color: theme.text,
    fontSize: 11,
    marginTop: 5,
  },
  storyEmpty: {
    flex: 1,
    minHeight: 67,
    borderRadius: 15,
    padding: 10,
    backgroundColor: theme.panel2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyEmptyText: {
    flex: 1,
    color: theme.muted,
    fontSize: 12,
    marginLeft: 7,
  },
  feedHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    marginBottom: 12,
  },
  errorText: {
    color: theme.danger,
    marginBottom: 6,
  },
  retryText: {
    color: theme.cyan,
    fontWeight: '800',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  loadingText: {
    color: theme.muted,
    marginTop: 10,
  },
  emptyBox: {
    backgroundColor: theme.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 22,
    alignItems: 'center',
    marginTop: 5,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 10,
  },
  emptyText: {
    color: theme.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },
  primaryButton: {
    backgroundColor: theme.cyan,
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginTop: 15,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  postCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 15,
    marginBottom: 13,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAuthor: {
    flex: 1,
    marginLeft: 10,
  },
  authorName: {
    color: theme.text,
    fontWeight: '800',
  },
  postDate: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 3,
  },
  actionIcon: {
    padding: 7,
  },
  postContent: {
    color: theme.text,
    fontSize: 16,
    lineHeight: 23,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.border,
    marginTop: 15,
    paddingTop: 12,
  },
  notConnectedAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  actionLabel: {
    color: theme.muted,
    fontSize: 12,
  },
  shareLabel: {
    color: theme.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
});
