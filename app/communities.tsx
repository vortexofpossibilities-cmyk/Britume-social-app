
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  fetchCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  type Community,
} from '../src/lib/communities';

export default function CommunitiesScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const showMessage = (
    text: string,
    type: 'success' | 'error' = 'error'
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  const loadCommunities = useCallback(async () => {
    try {
      const result = await fetchCommunities();
      setCommunities(result);
    } catch (error: any) {
      showMessage(
        error?.message || 'Could not load communities.',
        'error'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  const filteredCommunities = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return communities;

    return communities.filter((community) =>
      `${community.name} ${community.description || ''}`
        .toLowerCase()
        .includes(term)
    );
  }, [communities, search]);

  const handleCreate = async () => {
    setMessage('');

    const communityName = name.trim();
    const communityDescription = description.trim();

    if (communityName.length < 3) {
      showMessage('Enter a community name with at least 3 characters.');
      return;
    }

    if (communityName.length > 60) {
      showMessage('Community name must be 60 characters or fewer.');
      return;
    }

    if (communityDescription.length > 500) {
      showMessage('Description must be 500 characters or fewer.');
      return;
    }

    try {
      setCreating(true);

      const created = await createCommunity({
        name: communityName,
        description: communityDescription || undefined,
      });

      setCommunities((previous) => [
        {
          ...created,
          member_count: 1,
          is_member: true,
        },
        ...previous.filter((item) => item.id !== created.id),
      ]);

      setName('');
      setDescription('');
      setShowCreate(false);

      showMessage('Your community was created successfully!', 'success');

      await loadCommunities();
    } catch (error: any) {
      showMessage(
        error?.message || 'Could not create community. Please try again.',
        'error'
      );
    } finally {
      setCreating(false);
    }
  };

  const handleMembership = async (community: Community) => {
    setMessage('');

    try {
      setJoiningId(community.id);

      if (community.is_member) {
        await leaveCommunity(community.id);
      } else {
        await joinCommunity(community.id);
      }

      await loadCommunities();
    } catch (error: any) {
      showMessage(
        error?.message || 'Could not update your membership.',
        'error'
      );
    } finally {
      setJoiningId(null);
    }
  };

  const openCommunity = (community: Community) => {
    router.push({
      pathname: '/community/[id]',
      params: {
        id: community.id,
        name: community.name,
      },
    });
  };

  const renderCommunity = ({ item }: { item: Community }) => {
    const isJoining = joiningId === item.id;

    return (
      <Pressable
        style={styles.communityCard}
        onPress={() => openCommunity(item)}
      >
        <View style={styles.communityIcon}>
          <Ionicons name="people" size={27} color="#6759D8" />
        </View>

        <View style={styles.communityInfo}>
          <Text style={styles.communityName} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.communityDescription} numberOfLines={2}>
            {item.description || 'A BRITUME community.'}
          </Text>

          <Text style={styles.memberCount}>
            {item.member_count ?? 0} members
          </Text>

          <View style={styles.cardActions}>
            <Pressable
              style={[
                styles.joinButton,
                item.is_member && styles.joinedButton,
              ]}
              disabled={isJoining}
              onPress={(event) => {
                event.stopPropagation();
                handleMembership(item);
              }}
            >
              {isJoining ? (
                <ActivityIndicator
                  size="small"
                  color={item.is_member ? '#333' : '#FFFFFF'}
                />
              ) : (
                <Text
                  style={[
                    styles.joinButtonText,
                    item.is_member && styles.joinedButtonText,
                  ]}
                >
                  {item.is_member ? 'Joined' : 'Join'}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.openButton}
              onPress={() => openCommunity(item)}
            >
              <Text style={styles.openButtonText}>Open community</Text>
              <Ionicons name="chevron-forward" size={16} color="#6759D8" />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Communities</Text>
          <Text style={styles.subtitle}>
            Discover people and interests across BRITUME.
          </Text>
        </View>

        <Pressable
          style={styles.createIconButton}
          onPress={() => {
            setShowCreate((value) => !value);
            setMessage('');
          }}
        >
          <Ionicons
            name={showCreate ? 'close' : 'add'}
            size={27}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#777777" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search communities..."
          placeholderTextColor="#888888"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {!!search && (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={19} color="#888888" />
          </Pressable>
        )}
      </View>

      {showCreate && (
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>Create a community</Text>

          <TextInput
            style={styles.input}
            placeholder="Community name"
            placeholderTextColor="#888888"
            value={name}
            onChangeText={setName}
            maxLength={60}
          />

          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="What is this community about?"
            placeholderTextColor="#888888"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
          />

          <Pressable
            style={[
              styles.publishButton,
              creating && styles.disabledButton,
            ]}
            disabled={creating}
            onPress={handleCreate}
          >
            {creating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.publishButtonText}>
                Create community
              </Text>
            )}
          </Pressable>
        </View>
      )}

      {!!message && (
        <View
          style={[
            styles.messageBox,
            messageType === 'success'
              ? styles.successMessage
              : styles.errorMessage,
          ]}
        >
          <Ionicons
            name={messageType === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={messageType === 'success' ? '#167A43' : '#B42318'}
          />
          <Text
            style={[
              styles.messageText,
              messageType === 'success'
                ? styles.successText
                : styles.errorText,
            ]}
          >
            {message}
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Discover communities</Text>
        <Text style={styles.sectionCount}>
          {filteredCommunities.length}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6759D8" />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCommunities}
          keyExtractor={(item) => item.id}
          renderItem={renderCommunity}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadCommunities();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={48}
                color="#999999"
              />
              <Text style={styles.emptyTitle}>
                No communities found
              </Text>
              <Text style={styles.emptyDescription}>
                Create a community or try another search.
              </Text>
              <Pressable
                style={styles.emptyCreateButton}
                onPress={() => setShowCreate(true)}
              >
                <Text style={styles.emptyCreateText}>
                  Create a community
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#171717',
  },
  subtitle: {
    fontSize: 13,
    color: '#777777',
    marginTop: 5,
  },
  createIconButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#6759D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 17,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8E8EE',
  },
  searchInput: {
    flex: 1,
    color: '#222222',
    fontSize: 14,
  },
  createCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8EE',
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222222',
    marginBottom: 13,
  },
  input: {
    backgroundColor: '#F5F6FA',
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: '#222222',
    fontSize: 14,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#E6E6EC',
  },
  descriptionInput: {
    minHeight: 85,
    textAlignVertical: 'top',
  },
  publishButton: {
    backgroundColor: '#6759D8',
    borderRadius: 11,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  messageBox: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },
  successMessage: {
    backgroundColor: '#EAF7EF',
    borderColor: '#B7E2C5',
  },
  errorMessage: {
    backgroundColor: '#FFF0EF',
    borderColor: '#F2C2BE',
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  successText: {
    color: '#167A43',
  },
  errorText: {
    color: '#B42318',
  },
  sectionHeader: {
    paddingHorizontal: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#222222',
  },
  sectionCount: {
    color: '#777777',
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 35,
    flexGrow: 1,
  },
  communityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EAEAF0',
  },
  communityIcon: {
    width: 53,
    height: 53,
    borderRadius: 16,
    backgroundColor: '#EFEDFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#202020',
  },
  communityDescription: {
    fontSize: 13,
    color: '#707070',
    lineHeight: 19,
    marginTop: 5,
  },
  memberCount: {
    fontSize: 12,
    color: '#888888',
    marginTop: 7,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  joinButton: {
    backgroundColor: '#6759D8',
    paddingHorizontal: 20,
    minWidth: 78,
    height: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinedButton: {
    backgroundColor: '#EAEAEA',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  joinedButtonText: {
    color: '#333333',
  },
  openButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 7,
  },
  openButtonText: {
    color: '#6759D8',
    fontSize: 12,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#777777',
    marginTop: 12,
    fontSize: 13,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 55,
  },
  emptyTitle: {
    color: '#333333',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 15,
  },
  emptyDescription: {
    color: '#777777',
    fontSize: 13,
    marginTop: 7,
    textAlign: 'center',
  },
  emptyCreateButton: {
    backgroundColor: '#6759D8',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 11,
    marginTop: 17,
  },
  emptyCreateText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
