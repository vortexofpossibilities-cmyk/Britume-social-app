import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Modal,
  Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '../src/contexts/ThemeContext';
import { supabase } from '../src/lib/supabase';

const MEDIA_BUCKET = 'britume-chat-media';
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

type Profile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};
type FriendRequest = {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
};
type ChatMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  message_type?: 'text' | 'image' | 'video' | 'file' | 'voice';
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_mime_type?: string | null;
  attachment_size?: number | null;
  attachment_url?: string | null;
};
type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  file?: Blob;
  kind: 'image' | 'video' | 'file';
};

export default function MessagesScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [myId, setMyId] = useState('');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePerson, setActivePerson] = useState<Profile | null>(null);
  const [conversationId, setConversationId] = useState('');
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [peerOnline, setPeerOnline] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const channelRef = useRef<any>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayName = (person: Profile) =>
    person.display_name || person.username || 'BRITUME member';
  const sortMessages = (items: ChatMessage[]) =>
    [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const withSignedUrl = useCallback(async (message: ChatMessage): Promise<ChatMessage> => {
    if (!message.attachment_path) return message;
    const { data, error } = await supabase!.storage.from(MEDIA_BUCKET)
      .createSignedUrl(message.attachment_path, 3600);
    if (error) {
      console.warn('Could not create attachment link:', error.message);
      return message;
    }
    return { ...message, attachment_url: data?.signedUrl || null };
  }, []);

  const mergeMessage = useCallback((message: ChatMessage) => {
    setChatMessages(previous => {
      const found = previous.some(item => item.id === message.id);
      return sortMessages(found
        ? previous.map(item => item.id === message.id ? { ...item, ...message } : item)
        : [...previous, message]);
    });
  }, []);

  const loadMessagesData = useCallback(async () => {
    const client = supabase;
    if (!client) {
      Alert.alert('Connection unavailable', 'Please check your Supabase configuration.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const { data: authData, error: authError } = await client.auth.getUser();
      if (authError || !authData.user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      const userId = authData.user.id;
      setMyId(userId);
      const { data: requests, error } = await client.from('friend_requests')
        .select('id,sender_id,recipient_id,status')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      if (error) throw error;
      const all = (requests || []) as FriendRequest[];
      const accepted = all.filter(item => item.status === 'accepted');
      const received = all.filter(item => item.recipient_id === userId && item.status === 'pending');
      const sent = all.filter(item => item.sender_id === userId && item.status === 'pending');
      setIncoming(received);
      setOutgoing(sent);
      const friendIds = accepted.map(item => item.sender_id === userId ? item.recipient_id : item.sender_id);
      const ids = [...new Set([...friendIds, ...received.map(item => item.sender_id)])];
      if (!ids.length) {
        setFriends([]);
        setProfiles([]);
      } else {
        const { data, error: profileError } = await client.from('profiles')
          .select('user_id,username,display_name,avatar_url').in('user_id', ids);
        if (profileError) throw profileError;
        const people = (data || []) as Profile[];
        setFriends(people.filter(person => friendIds.includes(person.user_id)));
        setProfiles(people);
      }
    } catch (error: any) {
      Alert.alert('Could not load messages', error?.message || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void loadMessagesData(); }, [loadMessagesData]);

  const searchPeople = async () => {
    const term = search.trim();
    if (!term) { setProfiles([]); return; }
    const client = supabase;
    if (!client) return;
    setSearching(true);
    try {
      const { data, error } = await client.from('profiles')
        .select('user_id,username,display_name,avatar_url')
        .or(`display_name.ilike.%${term}%,username.ilike.%${term}%`)
        .neq('user_id', myId).limit(20);
      if (error) throw error;
      setProfiles((data || []) as Profile[]);
    } catch (error: any) {
      Alert.alert('Search failed', error?.message || 'Please try again.');
    } finally { setSearching(false); }
  };

  const sendFriendRequest = async (person: Profile) => {
    const client = supabase;
    if (!client || !myId) return;
    if (friends.some(friend => friend.user_id === person.user_id)) {
      Alert.alert('Already friends', 'This person is already your friend.'); return;
    }
    if (outgoing.some(request => request.recipient_id === person.user_id)) {
      Alert.alert('Request sent', 'You have already sent this request.'); return;
    }
    if (incoming.some(request => request.sender_id === person.user_id)) {
      Alert.alert('Friend request received', 'Accept this person’s request in Friend requests.'); return;
    }
    try {
      const { error } = await client.from('friend_requests').insert({
        sender_id: myId, recipient_id: person.user_id, status: 'pending',
      });
      if (error) throw error;
      Alert.alert('Request sent!', `Your friend request was sent to ${displayName(person)}.`);
      await loadMessagesData();
    } catch (error: any) {
      Alert.alert('Could not send request', error?.message || 'Please try again.');
    }
  };

  const respondToRequest = async (request: FriendRequest, status: 'accepted' | 'rejected') => {
    const client = supabase;
    if (!client) return;
    try {
      const { error } = await client.from('friend_requests').update({
        status, updated_at: new Date().toISOString(),
      }).eq('id', request.id).eq('recipient_id', myId).eq('status', 'pending');
      if (error) throw error;
      Alert.alert(status === 'accepted' ? 'Friend added!' : 'Request declined',
        status === 'accepted' ? 'You are now connected on BRITUME.' : 'The friend request was declined.');
      await loadMessagesData();
    } catch (error: any) {
      Alert.alert('Could not update request', error?.message || 'Please try again.');
    }
  };

  const loadConversationMessages = useCallback(async (person: Profile) => {
    const client = supabase;
    if (!client || !myId) return;
    const { data, error } = await client.from('messages')
      .select('id,sender_id,recipient_id,content,created_at,read_at,message_type,attachment_path,attachment_name,attachment_mime_type,attachment_size')
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${person.user_id}),and(sender_id.eq.${person.user_id},recipient_id.eq.${myId})`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const messages = await Promise.all(((data || []) as ChatMessage[]).map(withSignedUrl));
    setChatMessages(sortMessages(messages));
    const unread = messages.filter(item => item.sender_id === person.user_id &&
      item.recipient_id === myId && !item.read_at).map(item => item.id);
    if (unread.length) {
      const readAt = new Date().toISOString();
      const { error: readError } = await client.from('messages').update({ read_at: readAt })
        .in('id', unread).eq('recipient_id', myId);
      if (readError) console.warn('Could not update read receipts:', readError.message);
      else setChatMessages(previous => previous.map(item =>
        unread.includes(item.id) ? { ...item, read_at: readAt } : item));
    }
  }, [myId, withSignedUrl]);

  const openChat = async (person: Profile) => {
    const client = supabase;
    if (!client || !myId) {
      Alert.alert('Please sign in', 'Sign in to start a conversation.'); return;
    }
    setActivePerson(person);
    setChatMessages([]);
    setMessageText('');
    setConversationId('');
    setPeerOnline(false);
    setPeerTyping(false);
    setChatVisible(true);
    setChatLoading(true);
    try {
      const { data, error } = await client.rpc('create_britume_direct_conversation', {
        p_other_user: person.user_id,
      });
      if (error) throw error;
      if (!data) throw new Error('The conversation could not be created.');
      setConversationId(data);
      await loadConversationMessages(person);
    } catch (error: any) {
      Alert.alert('Could not open conversation', error?.message || 'Please try again.');
    } finally { setChatLoading(false); }
  };

  useEffect(() => {
    const client = supabase;
    if (!client || !chatVisible || !activePerson || !myId || !conversationId) return;
    let active = true;
    const channel = client.channel(`britume-chat-${conversationId}`, { config: { presence: { key: myId } } });
    channelRef.current = channel;
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' },
      async (payload: any) => {
        if (!active) return;
        const row = (payload.new || payload.old) as ChatMessage;
        if (!row?.id) return;
        const belongs = (row.sender_id === myId && row.recipient_id === activePerson.user_id) ||
          (row.sender_id === activePerson.user_id && row.recipient_id === myId);
        if (!belongs) return;
        if (payload.eventType === 'INSERT') {
          const enriched = await withSignedUrl(row);
          if (!active) return;
          mergeMessage(enriched);
          if (row.sender_id === activePerson.user_id && row.recipient_id === myId && !row.read_at) {
            const readAt = new Date().toISOString();
            const { error } = await client.from('messages').update({ read_at: readAt })
              .eq('id', row.id).eq('recipient_id', myId).is('read_at', null);
            if (!error && active) mergeMessage({ ...enriched, read_at: readAt });
          }
        } else if (payload.eventType === 'UPDATE') {
          mergeMessage(row);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        if (!active) return;
        const state = channel.presenceState() as Record<string, Array<{ user_id?: string }>>;
        setPeerOnline(Object.values(state).some(entries =>
          entries.some(entry => entry.user_id === activePerson.user_id)));
      })
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        if (active && payload?.payload?.user_id === activePerson.user_id)
          setPeerTyping(Boolean(payload.payload.is_typing));
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED' && active)
          await channel.track({ user_id: myId, online_at: new Date().toISOString() });
      });
    return () => {
      active = false;
      if (channelRef.current === channel) channelRef.current = null;
      setPeerOnline(false); setPeerTyping(false);
      void client.removeChannel(channel);
    };
  }, [chatVisible, activePerson, myId, conversationId, mergeMessage, withSignedUrl]);

  const handleMessageTextChange = (value: string) => {
    setMessageText(value);
    const channel = channelRef.current;
    if (channel && conversationId) void channel.send({
      type: 'broadcast', event: 'typing',
      payload: { user_id: myId, is_typing: value.trim().length > 0 },
    });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      const current = channelRef.current;
      if (current) void current.send({
        type: 'broadcast', event: 'typing',
        payload: { user_id: myId, is_typing: false },
      });
    }, 1800);
  };

  const sendMessage = async () => {
    const client = supabase;
    const person = activePerson;
    const content = messageText.trim();
    if (!client || !person || !myId || !conversationId || !content || sending) return;
    if (content.length > 5000) {
      Alert.alert('Message too long', 'Messages can contain up to 5,000 characters.'); return;
    }
    setSending(true); setMessageText('');
    try {
      const { data, error } = await client.from('messages').insert({
        sender_id: myId, recipient_id: person.user_id, content,
      }).select('id,sender_id,recipient_id,content,created_at,read_at,message_type,attachment_path,attachment_name,attachment_mime_type,attachment_size').single();
      if (error) throw error;
      if (data) mergeMessage(data as ChatMessage);
      const channel = channelRef.current;
      if (channel) void channel.send({
        type: 'broadcast', event: 'typing',
        payload: { user_id: myId, is_typing: false },
      });
    } catch (error: any) {
      setMessageText(content);
      Alert.alert('Message not sent', error?.message || 'Please try again.');
    } finally { setSending(false); }
  };

  const uploadPickedFile = async (file: PickedFile) => {
    const client = supabase;
    const person = activePerson;
    if (!client || !person || !myId || !conversationId || uploading) return;
    if (file.size && file.size > MAX_UPLOAD_BYTES) {
      Alert.alert('File too large', 'The current BRITUME chat upload limit is 100 MB per file.');
      return;
    }
    setUploading(true);
    try {
      const response = file.file ? null : await fetch(file.uri);
      const body: Blob | ArrayBuffer = file.file || await response!.arrayBuffer();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100) || 'attachment';
      const path = `${myId}/${conversationId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await client.storage.from(MEDIA_BUCKET).upload(path, body, {
        contentType: file.mimeType || 'application/octet-stream',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data, error } = await client.from('messages').insert({
        sender_id: myId,
        recipient_id: person.user_id,
        content: '',
        message_type: file.kind,
        attachment_path: path,
        attachment_name: file.name,
        attachment_mime_type: file.mimeType || 'application/octet-stream',
        attachment_size: file.size || null,
      }).select('id,sender_id,recipient_id,content,created_at,read_at,message_type,attachment_path,attachment_name,attachment_mime_type,attachment_size').single();
      if (error) {
        await client.storage.from(MEDIA_BUCKET).remove([path]);
        throw error;
      }
      if (data) mergeMessage(await withSignedUrl(data as ChatMessage));
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message || 'Please try again.');
    } finally { setUploading(false); }
  };

  const chooseMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach photos or videos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'], allowsMultipleSelection: false, quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const kind = asset.type === 'video' ? 'video' : 'image';
    await uploadPickedFile({
      uri: asset.uri,
      name: asset.fileName || `${kind}-${Date.now()}.${kind === 'video' ? 'mp4' : 'jpg'}`,
      mimeType: asset.mimeType || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
      size: asset.fileSize,
      file: (asset as any).file,
      kind,
    });
  };

  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true, multiple: false,
      type: '*/*',
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    await uploadPickedFile({
      uri: asset.uri, name: asset.name,
      mimeType: asset.mimeType || 'application/octet-stream',
      size: asset.size, kind: 'file',
    });
  };

  const closeChat = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current); typingTimerRef.current = null;
    }
    const channel = channelRef.current;
    if (channel) void channel.send({
      type: 'broadcast', event: 'typing',
      payload: { user_id: myId, is_typing: false },
    });
    setChatVisible(false); setActivePerson(null); setConversationId('');
    setChatMessages([]); setMessageText(''); setPeerOnline(false); setPeerTyping(false);
  };

  const Avatar = ({ person, size = 58 }: { person: Profile; size?: number }) => (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {person.avatar_url
        ? <Image source={{ uri: person.avatar_url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
        : <Ionicons name="person" size={size * 0.48} color={theme.cyan} />}
    </View>
  );

  const FriendCard = ({ person }: { person: Profile }) => (
    <Pressable style={({ pressed }) => [styles.friendCard, pressed && styles.pressed]}
      onPress={() => void openChat(person)}>
      <Avatar person={person} size={57} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{displayName(person)}</Text>
        <Text style={styles.friendUsername}>{person.username ? `@${person.username}` : 'BRITUME friend'}</Text>
        <Text style={styles.tapHint}>Tap to open conversation</Text>
      </View>
      <View style={styles.chatIcon}><Ionicons name="chatbubble-ellipses" size={23} color={theme.cyan} /></View>
    </Pressable>
  );

  const PersonResult = ({ person }: { person: Profile }) => {
    const sent = outgoing.some(request => request.recipient_id === person.user_id);
    const isFriend = friends.some(friend => friend.user_id === person.user_id);
    return (
      <View style={styles.personCard}>
        <Avatar person={person} size={51} />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{displayName(person)}</Text>
          <Text style={styles.friendUsername}>{person.username ? `@${person.username}` : 'BRITUME member'}</Text>
        </View>
        <Pressable disabled={sent && !isFriend}
          style={[styles.addButton, sent && !isFriend && styles.disabledButton]}
          onPress={() => isFriend ? void openChat(person) : void sendFriendRequest(person)}>
          <Ionicons name={isFriend ? 'chatbubble' : sent ? 'time-outline' : 'person-add'}
            size={16} color={sent && !isFriend ? theme.muted : '#FFFFFF'} />
          <Text style={[styles.addButtonText, sent && !isFriend && styles.disabledButtonText]}>
            {isFriend ? 'Chat' : sent ? 'Sent' : 'Add'}
          </Text>
        </Pressable>
      </View>
    );
  };

  const formatMessageTime = (value: string) => new Date(value).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  const renderAttachment = (message: ChatMessage, mine: boolean) => {
    if (!message.attachment_path) return null;
    const url = message.attachment_url;
    const isImage = message.message_type === 'image' || message.attachment_mime_type?.startsWith('image/');
    const isVideo = message.message_type === 'video' || message.attachment_mime_type?.startsWith('video/');
    if (isImage && url) {
      return <Pressable onPress={() => void Linking.openURL(url)}>
        <Image source={{ uri: url }} resizeMode="cover" style={styles.attachmentImage} />
      </Pressable>;
    }
    return (
      <Pressable style={styles.attachmentCard} disabled={!url}
        onPress={() => url && void Linking.openURL(url)}>
        <Ionicons name={isVideo ? 'videocam' : 'document-attach'} size={25}
          color={mine ? '#FFFFFF' : theme.cyan} />
        <View style={styles.attachmentInfo}>
          <Text numberOfLines={2} style={[styles.attachmentName, mine && styles.myMessageContent]}>
            {message.attachment_name || (isVideo ? 'Video' : 'Attachment')}
          </Text>
          <Text style={[styles.attachmentHint, mine && styles.myMessageTime]}>
            {isVideo ? 'Tap to open video' : 'Tap to open file'}
          </Text>
        </View>
        <Ionicons name="open-outline" size={17} color={mine ? '#FFFFFF' : theme.cyan} />
      </Pressable>
    );
  };

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={theme.cyan} />
      <Text style={styles.loadingText}>Loading your BRITUME friends...</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); void loadMessagesData(); }} tintColor={theme.cyan} />}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={23} color={theme.text} />
          </Pressable>
          <View style={styles.brand}>
            <View style={styles.logo}><Text style={styles.logoText}>B</Text></View>
            <View><Text style={styles.brandName}>BRITUME</Text><Text style={styles.tagline}>Vortex of Possibilities</Text></View>
          </View>
          <Pressable style={styles.headerIcon} onPress={() => { setSearch(''); setProfiles([]); }}>
            <Ionicons name="person-add" size={22} color={theme.text} />
          </Pressable>
        </View>

        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Connect, communicate and stay close.</Text>

        <View style={styles.shortcuts}>
          <Pressable style={styles.shortcut} onPress={() => Alert.alert('Chats', 'Open a friend below to start or continue a conversation.')}>
            <View style={styles.shortcutIcon}><Ionicons name="chatbubbles" size={25} color={theme.cyan} /></View>
            <Text style={styles.shortcutText}>Chats</Text>
          </Pressable>
          <Pressable style={styles.shortcut} onPress={() => Alert.alert('Media & Files', 'Open a private chat with a friend, then use the attachment button to share photos, videos or files.')}>
            <View style={styles.shortcutIcon}><Ionicons name="images" size={25} color={theme.purple} /></View>
            <Text style={styles.shortcutText}>Media & Files</Text>
          </Pressable>
          <Pressable style={styles.shortcut} onPress={() => Alert.alert('Groups', 'Group conversation creation is the next database feature we will connect.')}>
            <View style={styles.shortcutIcon}><Ionicons name="people" size={25} color={theme.gold} /></View>
            <Text style={styles.shortcutText}>Groups</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Find friends</Text>
          <Ionicons name="people" size={21} color={theme.cyan} />
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={21} color={theme.muted} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search by name or username..."
            placeholderTextColor={theme.muted} style={styles.searchInput} returnKeyType="search"
            onSubmitEditing={() => void searchPeople()} autoCapitalize="none" />
          <Pressable style={styles.searchButton} onPress={() => void searchPeople()}>
            {searching ? <ActivityIndicator color="#FFFFFF" size="small" />
              : <Ionicons name="search" size={19} color="#FFFFFF" />}
          </Pressable>
        </View>

        {profiles.length > 0 && <View style={styles.resultsArea}>
          <Text style={styles.smallHeading}>Search results</Text>
          {profiles.map(person => <PersonResult key={person.user_id} person={person} />)}
        </View>}
        {search.trim().length > 0 && profiles.length === 0 && !searching &&
          <Text style={styles.noResults}>No results yet. Press the search icon to find people.</Text>}

        {incoming.length > 0 && <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friend requests</Text>
            <View style={styles.countBadge}><Text style={styles.countText}>{incoming.length}</Text></View>
          </View>
          {incoming.map(request => {
            const sender = profiles.find(person => person.user_id === request.sender_id);
            return <View key={request.id} style={styles.requestCard}>
              <View style={styles.friendInfo}>
                <Text style={styles.friendName}>{sender ? displayName(sender) : 'New friend request'}</Text>
                <Text style={styles.friendUsername}>{sender?.username ? `@${sender.username}` : 'A BRITUME member wants to connect with you.'}</Text>
              </View>
              <Pressable style={styles.acceptButton} onPress={() => void respondToRequest(request, 'accepted')}>
                <Ionicons name="checkmark" color="#FFFFFF" size={19} />
              </Pressable>
              <Pressable style={styles.rejectButton} onPress={() => void respondToRequest(request, 'rejected')}>
                <Ionicons name="close" color={theme.danger} size={19} />
              </Pressable>
            </View>;
          })}
        </View>}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View><Text style={styles.sectionTitle}>Your friends</Text>
              <Text style={styles.sectionSubtitle}>People you can connect with</Text></View>
            <Pressable style={styles.addFriendButton} onPress={() => { setSearch(''); setProfiles([]); }}>
              <Ionicons name="person-add" size={18} color="#FFFFFF" /><Text style={styles.addFriendText}>Add</Text>
            </Pressable>
          </View>
          {friends.length === 0 ? <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="people-outline" size={38} color={theme.cyan} /></View>
            <Text style={styles.emptyTitle}>Your friend list is waiting</Text>
            <Text style={styles.emptyText}>Search for people on BRITUME and send them a friend request. Once they accept, they will appear here.</Text>
          </View> : friends.map(person => <FriendCard key={person.user_id} person={person} />)}
        </View>
        <Text style={styles.footer}>BRITUME • Vortex of Possibilities</Text>
      </ScrollView>

      <Modal visible={chatVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeChat}>
        <KeyboardAvoidingView style={styles.chatScreen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}>
          <View style={styles.chatHeader}>
            <Pressable style={styles.chatBackButton} onPress={closeChat}>
              <Ionicons name="arrow-back" size={23} color={theme.text} />
            </Pressable>
            {activePerson && <>
              <View style={styles.chatAvatarWrap}><Avatar person={activePerson} size={43} />
                <View style={[styles.onlineDot, !peerOnline && styles.offlineDot]} />
              </View>
              <View style={styles.chatHeaderInfo}>
                <Text style={styles.chatHeaderName}>{displayName(activePerson)}</Text>
                <Text style={styles.chatHeaderStatus}>{peerTyping ? 'Typing...' : peerOnline ? 'Online' : 'Offline'}</Text>
              </View>
            </>}
            <Pressable style={styles.chatBackButton} onPress={() => {
              if (!activePerson) return;
              setChatLoading(true);
              void loadConversationMessages(activePerson).catch(error =>
                Alert.alert('Could not refresh', error?.message || 'Please try again.')
              ).finally(() => setChatLoading(false));
            }}>
              <Ionicons name="refresh" size={21} color={theme.cyan} />
            </Pressable>
          </View>

          <View style={styles.chatBody}>
            {chatLoading ? <View style={styles.chatLoading}>
              <ActivityIndicator size="large" color={theme.cyan} />
              <Text style={styles.loadingText}>Loading conversation...</Text>
            </View> : chatMessages.length === 0 ? <View style={styles.chatEmpty}>
              <View style={styles.emptyIcon}><Ionicons name="chatbubbles-outline" size={38} color={theme.cyan} /></View>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptyText}>Send your first message to {activePerson ? displayName(activePerson) : 'your friend'}.</Text>
            </View> : <ScrollView style={styles.messageScroll} contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}>
              {chatMessages.map(message => {
                const mine = message.sender_id === myId;
                return <View key={message.id} style={[styles.messageRow, mine ? styles.myMessageRow : styles.theirMessageRow]}>
                  <View style={[styles.messageBubble, mine ? styles.myMessageBubble : styles.theirMessageBubble]}>
                    {renderAttachment(message, mine)}
                    {!!message.content && <Text style={[styles.messageContent, mine && styles.myMessageContent]}>{message.content}</Text>}
                    <View style={styles.messageMeta}>
                      <Text style={[styles.messageTime, mine && styles.myMessageTime]}>{formatMessageTime(message.created_at)}</Text>
                      {mine && <View style={styles.readEyes}>
                        <Ionicons name={message.read_at ? 'checkmark-done' : 'checkmark'} size={15}
                          color={message.read_at ? '#B8F4FF' : '#FFFFFF'} />
                      </View>}
                    </View>
                  </View>
                </View>;
              })}
            </ScrollView>}
          </View>

          <View style={styles.composer}>
            <Pressable style={styles.attachButton} disabled={uploading || chatLoading || !conversationId}
              onPress={() => Alert.alert('Attach to chat', 'Choose what you want to share.', [
                { text: 'Photo or video', onPress: () => void chooseMedia() },
                { text: 'Document or other file', onPress: () => void chooseFile() },
                { text: 'Cancel', style: 'cancel' },
              ])}>
              {uploading ? <ActivityIndicator color={theme.cyan} size="small" />
                : <Ionicons name="add" size={25} color={theme.cyan} />}
            </Pressable>
            <TextInput value={messageText} onChangeText={handleMessageTextChange}
              placeholder="Write a message..." placeholderTextColor={theme.muted}
              style={styles.composerInput} multiline maxLength={5000}
              editable={!chatLoading && !sending && !uploading} />
            <Pressable style={[styles.sendButton, (!messageText.trim() || sending || chatLoading) && styles.sendButtonDisabled]}
              disabled={!messageText.trim() || sending || chatLoading || uploading || !conversationId}
              onPress={() => void sendMessage()}>
              {sending ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Ionicons name="send" size={20} color="#FFFFFF" />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.bg },
    content: { paddingHorizontal: 17, paddingTop: 16, paddingBottom: 45 },
    loadingScreen: { flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: theme.muted, marginTop: 13, fontSize: 13 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 27 },
    headerIcon: { width: 45, height: 45, borderRadius: 16, backgroundColor: theme.panel, justifyContent: 'center', alignItems: 'center', ...theme.clayRaised },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
    logo: { width: 43, height: 43, borderRadius: 15, backgroundColor: theme.cyan, justifyContent: 'center', alignItems: 'center', ...theme.clayRaised },
    logoText: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
    brandName: { color: theme.text, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
    tagline: { color: theme.muted, fontSize: 9, marginTop: 2 },
    title: { color: theme.text, fontSize: 30, fontWeight: '900' },
    subtitle: { color: theme.muted, fontSize: 13, marginTop: 5, marginBottom: 21 },
    shortcuts: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 29 },
    shortcut: { flex: 1, alignItems: 'center', backgroundColor: theme.panel, borderRadius: 19, paddingVertical: 13, ...theme.clayRaised },
    shortcutIcon: { width: 49, height: 49, borderRadius: 17, backgroundColor: theme.clayBlue, alignItems: 'center', justifyContent: 'center', ...theme.clayRaised },
    shortcutText: { color: theme.text, fontSize: 11, fontWeight: '800', marginTop: 8, textAlign: 'center' },
    section: { marginTop: 25 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
    sectionTitle: { color: theme.text, fontSize: 19, fontWeight: '900' },
    sectionSubtitle: { color: theme.muted, fontSize: 11, marginTop: 4 },
    searchBox: { minHeight: 55, borderRadius: 19, backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10, ...theme.clayRaised },
    searchInput: { flex: 1, color: theme.text, fontSize: 13, paddingVertical: 12 },
    searchButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: theme.cyan, justifyContent: 'center', alignItems: 'center' },
    resultsArea: { marginTop: 17 },
    smallHeading: { color: theme.text, fontWeight: '900', marginBottom: 10 },
    personCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.panel, borderRadius: 21, padding: 12, marginBottom: 11, borderWidth: 1, borderColor: theme.border, ...theme.clayRaised },
    friendCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.panel, borderRadius: 23, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.border, ...theme.clayShadow },
    avatar: { backgroundColor: theme.clayBlue, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: theme.border, ...theme.clayRaised },
    friendInfo: { flex: 1, marginLeft: 13 },
    friendName: { color: theme.text, fontSize: 14, fontWeight: '900' },
    friendUsername: { color: theme.muted, fontSize: 11, marginTop: 4 },
    tapHint: { color: theme.cyan, fontSize: 10, fontWeight: '700', marginTop: 5 },
    chatIcon: { width: 43, height: 43, borderRadius: 15, backgroundColor: theme.clayBlue, alignItems: 'center', justifyContent: 'center', ...theme.clayRaised },
    addButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.cyan, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 13 },
    addButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 11 },
    disabledButton: { backgroundColor: theme.panel2 },
    disabledButtonText: { color: theme.muted },
    addFriendButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.cyan, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 14, ...theme.clayRaised },
    addFriendText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
    emptyCard: { backgroundColor: theme.panel, borderRadius: 25, padding: 23, alignItems: 'center', borderWidth: 1, borderColor: theme.border, ...theme.clayShadow },
    emptyIcon: { width: 83, height: 83, borderRadius: 28, backgroundColor: theme.clayBlue, alignItems: 'center', justifyContent: 'center', ...theme.clayRaised },
    emptyTitle: { color: theme.text, fontSize: 16, fontWeight: '900', marginTop: 17 },
    emptyText: { color: theme.muted, fontSize: 12, textAlign: 'center', lineHeight: 19, marginTop: 8 },
    requestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.panel, borderRadius: 19, padding: 13, marginBottom: 11, borderWidth: 1, borderColor: theme.border, ...theme.clayRaised },
    acceptButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: theme.success, alignItems: 'center', justifyContent: 'center', marginLeft: 7 },
    rejectButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: theme.panel2, alignItems: 'center', justifyContent: 'center', marginLeft: 7 },
    countBadge: { backgroundColor: theme.cyan, minWidth: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    countText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
    noResults: { color: theme.muted, fontSize: 12, marginTop: 12 },
    pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
    footer: { color: theme.muted, textAlign: 'center', fontSize: 10, marginTop: 30 },
    chatScreen: { flex: 1, backgroundColor: theme.bg },
    chatHeader: { minHeight: 72, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: theme.panel, borderBottomWidth: 1, borderBottomColor: theme.border },
    chatBackButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.panel2 },
    chatAvatarWrap: { position: 'relative' },
    onlineDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: theme.success, borderWidth: 2, borderColor: theme.panel, right: 0, bottom: 0 },
    offlineDot: { backgroundColor: theme.muted },
    chatHeaderInfo: { flex: 1 },
    chatHeaderName: { color: theme.text, fontSize: 15, fontWeight: '900' },
    chatHeaderStatus: { color: theme.muted, fontSize: 10, marginTop: 3 },
    chatBody: { flex: 1, minHeight: 0 },
    chatLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    chatEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25 },
    messageScroll: { flex: 1 },
    messageList: { paddingHorizontal: 14, paddingVertical: 18, gap: 11 },
    messageRow: { width: '100%', flexDirection: 'row' },
    myMessageRow: { justifyContent: 'flex-end' },
    theirMessageRow: { justifyContent: 'flex-start' },
    messageBubble: { maxWidth: '85%', minWidth: 85, borderRadius: 19, paddingHorizontal: 13, paddingTop: 10, paddingBottom: 7 },
    myMessageBubble: { backgroundColor: theme.cyan, borderBottomRightRadius: 5 },
    theirMessageBubble: { backgroundColor: theme.panel, borderWidth: 1, borderColor: theme.border, borderBottomLeftRadius: 5 },
    messageContent: { color: theme.text, fontSize: 14, lineHeight: 20 },
    myMessageContent: { color: '#FFFFFF' },
    messageMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 5, marginTop: 5 },
    readEyes: { flexDirection: 'row', alignItems: 'center', gap: 0 },
    messageTime: { color: theme.muted, fontSize: 9 },
    myMessageTime: { color: '#E7FAFF' },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 24 : 12, backgroundColor: theme.panel, borderTopWidth: 1, borderTopColor: theme.border },
    attachButton: { width: 43, height: 45, borderRadius: 15, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    composerInput: { flex: 1, minHeight: 45, maxHeight: 120, borderRadius: 17, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, color: theme.text, fontSize: 14, paddingHorizontal: 14, paddingVertical: 11 },
    sendButton: { width: 45, height: 45, borderRadius: 16, backgroundColor: theme.cyan, alignItems: 'center', justifyContent: 'center' },
    sendButtonDisabled: { opacity: 0.45 },
    attachmentImage: { width: 220, height: 180, borderRadius: 12, marginBottom: 5, backgroundColor: theme.panel2 },
    attachmentCard: { flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 180, maxWidth: 240, padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.08)', marginBottom: 4 },
    attachmentInfo: { flex: 1 },
    attachmentName: { color: theme.text, fontSize: 12, fontWeight: '800' },
    attachmentHint: { color: theme.muted, fontSize: 10, marginTop: 3 },
  });
}
