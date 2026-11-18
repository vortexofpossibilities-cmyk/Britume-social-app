import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  type Community,
} from '../src/lib/communities';

import { withThemeBackground } from '../src/components/ThemeScreen';
import { supabase } from '../src/lib/supabase';
import { blockUser } from '../src/lib/postModeration';

function CommunitiesScreen() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [hiddenCommunityIds, setHiddenCommunityIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('error');

  const showMessage = (text: string, type: 'success' | 'error' = 'error') => {
    setMessage(text);
    setMessageType(type);
  };

  const loadCommunities = useCallback(async () => {
    try {
      const result = await fetchCommunities();
      setCommunities(result);
    } catch (error: any) {
      showMessage(error?.message || 'Could not load communities.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  const filteredCommunities = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return communities;

    return communities.filter(community =>
      `${community.name} ${community.description || ''}`.toLowerCase().includes(term)
    );
  }, [communities, search]);

  const handleCreate = async () => {
    setMessage('');
    const communityName = name.trim();
    const communityDescription = description.trim();

    if (communityName.length < 3 || communityName.length > 60) {
      showMessage('Community name must be 3–60 characters.');
      return;
    }
    if (communityDescription.length > 500) {
      showMessage('Description must be 500 characters or fewer.');
      return;
    }

    try {
      setCreating(true);
      await createCommunity({
        name: communityName,
        description: communityDescription || undefined,
      });
      setName('');
      setDescription('');
      setShowCreate(false);
      showMessage('Your community was created successfully!', 'success');
      await loadCommunities();
    } catch (error: any) {
      showMessage(error?.message || 'Could not create community.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const beginEdit = (community: Community) => {
    setEditingId(community.id);
    setEditName(community.name);
    setEditDescription(community.description || '');
    setShowCreate(false);
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const saveEdit = async () => {
    if (!editingId) return;

    try {
      setSavingEdit(true);
      await updateCommunity({
        communityId: editingId,
        name: editName,
        description: editDescription,
      });
      cancelEdit();
      showMessage('Community details updated.', 'success');
      await loadCommunities();
    } catch (error: any) {
      showMessage(error?.message || 'Could not update community.', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const removeCommunity = (community: Community) => {
    Alert.alert(
      'Delete community',
      `Delete "${community.name}" and its posts? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(community.id);
              await deleteCommunity(community.id);
              setCommunities(previous => previous.filter(item => item.id !== community.id));
              if (editingId === community.id) cancelEdit();
              showMessage('Community deleted.', 'success');
            } catch (error: any) {
              showMessage(error?.message || 'Could not delete community.', 'error');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleMembership = async (community: Community) => {
    if (community.is_owner) return;

    try {
      setJoiningId(community.id);
      if (community.is_member) await leaveCommunity(community.id);
      else await joinCommunity(community.id);
      await loadCommunities();
    } catch (error: any) {
      showMessage(error?.message || 'Could not update your membership.', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  const openCommunity = (community: Community) => {
    router.push({
      pathname: '/community/[id]',
      params: { id: community.id, name: community.name },
    });
  };

  const showCommunityOptions = (community: Community) => {
    const actions: any[] = [
      { text: 'Hide community', onPress: () => setHiddenCommunityIds(previous => [...previous, community.id]) },
    ];
    if (!community.is_owner) actions.push({
      text: 'Block community owner', style: 'destructive', onPress: async () => {
        try {
          if (!supabase) throw new Error('BRITUME is not connected to Supabase.');
          const { data, error } = await supabase.auth.getUser();
          if (error || !data.user) throw new Error('Please sign in to block an account.');
          await blockUser(data.user.id, community.owner_id);
          setHiddenCommunityIds(previous => [...previous, community.id]);
          Alert.alert('Account blocked', 'The community owner has been blocked.');
        } catch (error: any) {
          Alert.alert('Could not block account', error?.message || 'Please try again.');
        }
      },
    });
    if (community.is_owner) actions.push({ text: 'Delete community', style: 'destructive', onPress: () => removeCommunity(community) });
    actions.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Community options', community.name, actions);
  };

  const renderCommunity = ({ item }: { item: Community }) => {
    if (hiddenCommunityIds.includes(item.id)) return null;
    const isJoining = joiningId === item.id;
    const isDeleting = deletingId === item.id;

    return (
      <Pressable style={styles.communityCard} onPress={() => openCommunity(item)}>
        <View style={styles.communityIcon}>
          <Ionicons name="people" size={27} color="#6759D8" />
        </View>

        <View style={styles.communityInfo}>
          <Text style={styles.communityName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.communityDescription} numberOfLines={2}>
            {item.description || 'A BRITUME community.'}
          </Text>
          <Text style={styles.memberCount}>
            {item.member_count} {item.member_count === 1 ? 'member' : 'members'}
          </Text>
          <Pressable style={styles.communityMoreButton} onPress={event => { event.stopPropagation(); showCommunityOptions(item); }} accessibilityLabel="Community options">
            <Ionicons name="ellipsis-horizontal" size={20} color="#6759D8" />
            <Text style={styles.communityMoreText}>More</Text>
          </Pressable>

          <View style={styles.cardActions}>
            {item.is_owner ? (
              <View style={styles.ownerTag}>
                <Ionicons name="shield-checkmark" size={14} color="#5547B8" />
                <Text style={styles.ownerTagText}>Owner</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.joinButton, item.is_member && styles.joinedButton]}
                disabled={isJoining}
                onPress={event => {
                  event.stopPropagation();
                  void handleMembership(item);
                }}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color={item.is_member ? '#333333' : '#FFFFFF'} />
                ) : (
                  <Text style={[styles.joinButtonText, item.is_member && styles.joinedButtonText]}>
                    {item.is_member ? 'Leave' : 'Join'}
                  </Text>
                )}
              </Pressable>
            )}

            <Pressable
              style={styles.openButton}
              onPress={event => {
                event.stopPropagation();
                openCommunity(item);
              }}
            >
              <Text style={styles.openButtonText}>Open community</Text>
              <Ionicons name="chevron-forward" size={16} color="#6759D8" />
            </Pressable>
          </View>

          {item.is_owner && (
            <View style={styles.ownerActions}>
              <Pressable
                style={styles.editButton}
                onPress={event => {
                  event.stopPropagation();
                  beginEdit(item);
                }}
              >
                <Ionicons name="create-outline" size={17} color="#5547B8" />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                disabled={isDeleting}
                onPress={event => {
                  event.stopPropagation();
                  removeCommunity(item);
                }}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#C43C4E" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color="#C43C4E" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
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
          <Text style={styles.subtitle}>Discover people and interests across BRITUME.</Text>
        </View>
        <Pressable
          style={styles.createIconButton}
          onPress={() => {
            cancelEdit();
            setShowCreate(value => !value);
            setMessage('');
          }}
        >
          <Ionicons name={showCreate ? 'close' : 'add'} size={27} color="#FFFFFF" />
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
            style={[styles.publishButton, creating && styles.disabledButton]}
            disabled={creating}
            onPress={handleCreate}
          >
            {creating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Create community</Text>}
          </Pressable>
        </View>
      )}

      {!!editingId && (
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>Edit community</Text>
          <TextInput
            style={styles.input}
            placeholder="Community name"
            placeholderTextColor="#888888"
            value={editName}
            onChangeText={setEditName}
            maxLength={60}
          />
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            placeholder="Community description"
            placeholderTextColor="#888888"
            value={editDescription}
            onChangeText={setEditDescription}
            multiline
            maxLength={500}
          />
          <View style={styles.editFormActions}>
            <Pressable style={styles.cancelButton} onPress={cancelEdit} disabled={savingEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.publishButton, styles.saveEditButton, savingEdit && styles.disabledButton]}
              disabled={savingEdit}
              onPress={saveEdit}
            >
              {savingEdit ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Save changes</Text>}
            </Pressable>
          </View>
        </View>
      )}

      {!!message && (
        <View style={[styles.messageBox, messageType === 'success' ? styles.successMessage : styles.errorMessage]}>
          <Ionicons
            name={messageType === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={messageType === 'success' ? '#167A43' : '#B42318'}
          />
          <Text style={[styles.messageText, messageType === 'success' ? styles.successText : styles.errorText]}>
            {message}
          </Text>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Discover communities</Text>
        <Text style={styles.sectionCount}>{filteredCommunities.length}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6759D8" />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCommunities}
          keyExtractor={item => item.id}
          renderItem={renderCommunity}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadCommunities();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#999999" />
              <Text style={styles.emptyTitle}>No communities found</Text>
              <Text style={styles.emptyDescription}>Create a community or try another search.</Text>
              <Pressable style={styles.emptyCreateButton} onPress={() => setShowCreate(true)}>
                <Text style={styles.emptyCreateText}>Create a community</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F6FA', paddingTop: Platform.OS === 'android' ? 35 : 55 },
  header: { paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { fontSize: 27, fontWeight: '800', color: '#171717' },
  subtitle: { fontSize: 13, color: '#777777', marginTop: 5 },
  createIconButton: { width: 45, height: 45, borderRadius: 15, backgroundColor: '#6759D8', alignItems: 'center', justifyContent: 'center' },
  searchContainer: { marginHorizontal: 16, marginBottom: 17, height: 48, borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E8E8EE' },
  searchInput: { flex: 1, color: '#222222', fontSize: 14 },
  createCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginBottom: 18, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E8E8EE' },
  createTitle: { fontSize: 18, fontWeight: '800', color: '#222222', marginBottom: 13 },
  input: { backgroundColor: '#F5F6FA', borderRadius: 11, paddingHorizontal: 13, paddingVertical: 13, color: '#222222', fontSize: 14, marginBottom: 11, borderWidth: 1, borderColor: '#E6E6EC' },
  descriptionInput: { minHeight: 85, textAlignVertical: 'top' },
  publishButton: { backgroundColor: '#6759D8', borderRadius: 11, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  publishButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  disabledButton: { opacity: 0.6 },
  editFormActions: { flexDirection: 'row', gap: 10 },
  cancelButton: { minHeight: 46, borderRadius: 11, paddingHorizontal: 18, backgroundColor: '#EEEEF4', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#444444', fontSize: 14, fontWeight: '700' },
  saveEditButton: { flex: 1 },
  messageBox: { marginHorizontal: 16, marginBottom: 14, padding: 12, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  successMessage: { backgroundColor: '#EAF7EF', borderColor: '#B7E2C5' },
  errorMessage: { backgroundColor: '#FFF0EF', borderColor: '#F2C2BE' },
  messageText: { flex: 1, fontSize: 13, lineHeight: 19 },
  successText: { color: '#167A43' },
  errorText: { color: '#B42318' },
  sectionHeader: { paddingHorizontal: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#222222' },
  sectionCount: { color: '#777777', fontSize: 13 },
  listContent: { paddingHorizontal: 16, paddingBottom: 35, flexGrow: 1 },
  communityCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', borderWidth: 1, borderColor: '#EAEAF0' },
  communityIcon: { width: 53, height: 53, borderRadius: 15, backgroundColor: '#EFEDFF', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  communityMoreButton: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 7, paddingVertical: 3 },
  communityMoreText: { color: '#6759D8', fontSize: 11, fontWeight: '800' },
  communityInfo: { flex: 1 },
  communityName: { color: '#222222', fontSize: 16, fontWeight: '800' },
  communityDescription: { color: '#777777', fontSize: 12, lineHeight: 18, marginTop: 5 },
  memberCount: { color: '#999999', fontSize: 11, marginTop: 7 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  joinButton: { minWidth: 82, minHeight: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#6759D8', alignItems: 'center', justifyContent: 'center' },
  joinedButton: { backgroundColor: '#EEEEF4' },
  joinButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  joinedButtonText: { color: '#333333' },
  ownerTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFEDFF', paddingHorizontal: 12, minHeight: 34, borderRadius: 10 },
  ownerTagText: { color: '#5547B8', fontSize: 12, fontWeight: '800' },
  openButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  openButtonText: { color: '#6759D8', fontSize: 12, fontWeight: '700' },
  ownerActions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: '#F0F0F4' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  editButtonText: { color: '#5547B8', fontSize: 12, fontWeight: '700' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deleteButtonText: { color: '#C43C4E', fontSize: 12, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 },
  loadingText: { color: '#777777', fontSize: 13, marginTop: 12 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 65, paddingHorizontal: 25 },
  emptyTitle: { color: '#333333', fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptyDescription: { color: '#777777', fontSize: 13, marginTop: 7, textAlign: 'center' },
  emptyCreateButton: { backgroundColor: '#6759D8', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12, marginTop: 17 },
  emptyCreateText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
});

export default withThemeBackground(CommunitiesScreen);
