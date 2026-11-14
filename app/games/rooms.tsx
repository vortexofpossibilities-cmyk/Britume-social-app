import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, StatusBar, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { withThemeBackground } from '../../src/components/ThemeScreen';
import { useAuth } from '../../src/auth/AuthProvider';
import { BRITUME_GAMES } from '../../src/games/gameCatalog';
import {
  createPrivateRoom, findQuickMatch, getGameRoom, getRoomPlayerCount,
  joinPrivateRoom, leaveGameRoom, subscribeToGameRoom, type LiveRoom,
} from '../../src/games/liveRooms';

function RoomsScreen() {
  const { user, loading: authLoading } = useAuth();
  const games = BRITUME_GAMES.filter(game => game.status === 'ready');
  const [gameId, setGameId] = useState(games[0]?.id ?? 'number-guess');
  const [inviteCode, setInviteCode] = useState('');
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refreshRoom = useCallback(async (roomId: string) => {
    try {
      const [nextRoom, count] = await Promise.all([
        getGameRoom(roomId), getRoomPlayerCount(roomId),
      ]);
      setRoom(nextRoom);
      setPlayerCount(count);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not refresh the room.');
    }
  }, []);

  useEffect(() => {
    if (!room?.id) return;
    const channel = subscribeToGameRoom(room.id, () => { void refreshRoom(room.id); });
    return () => { void channel.unsubscribe(); };
  }, [room?.id, refreshRoom]);

  const runRoomAction = async (action: () => Promise<LiveRoom>) => {
    if (!user) {
      Alert.alert('Sign in required', 'Sign in to create or join an online room.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const nextRoom = await action();
      setRoom(nextRoom);
      await refreshRoom(nextRoom.id);
      setMessage(nextRoom.status === 'ready'
        ? 'A second player has joined. The room is ready; synced in-game turns are the next development step.'
        : 'Room created. Share the code with a friend and wait for them to join.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The room request failed.');
    } finally {
      setBusy(false);
    }
  };

  const exitRoom = async () => {
    if (!room) return;
    setBusy(true);
    try {
      await leaveGameRoom(room.id);
      setRoom(null);
      setPlayerCount(0);
      setMessage('You left the room.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not leave the room.');
    } finally {
      setBusy(false);
    }
  };

  return <View style={styles.screen}>
    <StatusBar barStyle="light-content" backgroundColor="#07152D" />
    <Stack.Screen options={{ title: 'Live Match Rooms', headerStyle: { backgroundColor: '#07152D' }, headerTintColor: '#FFFFFF' }} />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" color="#F4C76B" size={18}/><Text style={styles.backText}>Games Arena</Text></Pressable>
      <Text style={styles.kicker}>BRITUME ONLINE ARENA</Text>
      <Text style={styles.title}>Find your opponent</Text>
      <Text style={styles.copy}>Choose a practice game, find an open room or invite a friend. Online rooms use demo play only and never charge points.</Text>

      <Text style={styles.section}>SELECT A GAME</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gameRow}>
        {games.map(game => <Pressable key={game.id} onPress={() => setGameId(game.id)} style={[styles.gameChip, gameId === game.id && styles.gameChipActive]}>
          <Text style={[styles.gameChipText, gameId === game.id && styles.gameChipTextActive]}>{game.name}</Text>
        </Pressable>)}
      </ScrollView>

      <Pressable disabled={busy || authLoading} style={[styles.actionCard, busy && styles.disabled]} onPress={() => void runRoomAction(() => findQuickMatch(gameId))}>
        <View style={styles.icon}><Ionicons name="flash" size={23} color="#F4C76B"/></View>
        <View style={styles.actionCopy}><Text style={styles.cardTitle}>Quick Match</Text><Text style={styles.detail}>Join an available player or open a waiting room.</Text></View>
        <Ionicons name="chevron-forward" color="#F4C76B" size={20}/>
      </Pressable>

      <Pressable disabled={busy || authLoading} style={[styles.actionCard, busy && styles.disabled]} onPress={() => void runRoomAction(() => createPrivateRoom(gameId))}>
        <View style={styles.icon}><Ionicons name="people" size={23} color="#F4C76B"/></View>
        <View style={styles.actionCopy}><Text style={styles.cardTitle}>Create Private Room</Text><Text style={styles.detail}>Create a six-character invite code for a friend.</Text></View>
        <Ionicons name="chevron-forward" color="#F4C76B" size={20}/>
      </Pressable>

      <View style={styles.joinPanel}>
        <Text style={styles.cardTitle}>Join with a room code</Text>
        <Text style={styles.detail}>Enter the code shared by your friend.</Text>
        <TextInput value={inviteCode} onChangeText={value => setInviteCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          placeholder="6-CHARACTER CODE" placeholderTextColor="#71839D" autoCapitalize="characters" maxLength={6} style={styles.codeInput}/>
        <Pressable disabled={busy || inviteCode.length !== 6 || authLoading} style={[styles.joinButton, (busy || inviteCode.length !== 6) && styles.disabled]}
          onPress={() => void runRoomAction(() => joinPrivateRoom(inviteCode))}>
          <Text style={styles.joinButtonText}>JOIN ROOM</Text>
        </Pressable>
      </View>

      {busy && <View style={styles.loading}><ActivityIndicator color="#F4C76B"/><Text style={styles.detail}>Connecting to BRITUME…</Text></View>}
      {!!message && <View style={styles.notice}><Ionicons name="information-circle-outline" color="#F4C76B" size={19}/><Text style={styles.noticeText}>{message}</Text></View>}

      {room && <View style={styles.roomPanel}>
        <Text style={styles.section}>YOUR ROOM</Text>
        <Text style={styles.roomCode}>{room.room_code ?? 'QUICK MATCH'}</Text>
        <Text style={styles.detail}>Game: {games.find(game => game.id === room.game_id)?.name ?? room.game_id}</Text>
        <Text style={styles.roomStatus}>{room.status.replace('_', ' ').toUpperCase()}</Text>
        <Text style={styles.detail}>Players joined: {playerCount} / {room.max_players}</Text>
        {room.status === 'waiting' && <Text style={styles.waiting}>Waiting for another player to join…</Text>}
        {room.status === 'ready' && <Text style={styles.waiting}>Opponent connected. Live match gameplay still needs its next server-sync layer.</Text>}
        <Pressable disabled={busy} style={styles.leaveButton} onPress={() => void exitRoom()}><Text style={styles.leaveText}>LEAVE ROOM</Text></Pressable>
      </View>}

      <View style={styles.notice}><Ionicons name="shield-checkmark-outline" color="#F4C76B" size={19}/><Text style={styles.noticeText}>This stage connects room creation, joining, membership and live room-status updates. It does not yet synchronize game moves or verify final scores.</Text></View>
      {!user && !authLoading && <Text style={styles.signInHint}>Sign in to use online rooms.</Text>}
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#07152D'},content:{padding:18,paddingBottom:48},back:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:24},backText:{color:'#F4C76B',fontWeight:'800'},kicker:{color:'#F4C76B',fontWeight:'900',letterSpacing:2,fontSize:11},title:{color:'#FFFFFF',fontSize:28,fontWeight:'900',marginTop:8},copy:{color:'#B8C6D9',fontSize:13,lineHeight:20,marginTop:9,marginBottom:20},section:{color:'#F4D68D',fontSize:11,fontWeight:'900',letterSpacing:1.4,marginBottom:10},gameRow:{gap:8,paddingBottom:16},gameChip:{backgroundColor:'#102747',borderColor:'#315078',borderWidth:1,borderRadius:20,paddingHorizontal:13,paddingVertical:10},gameChipActive:{backgroundColor:'#F3C96D',borderColor:'#F3C96D'},gameChipText:{color:'#D3DEEB',fontSize:11,fontWeight:'800'},gameChipTextActive:{color:'#142541'},actionCard:{flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'#102747',borderRadius:17,borderWidth:1,borderColor:'#315078',padding:14,marginBottom:11},icon:{width:45,height:45,borderRadius:14,backgroundColor:'#1A3A60',alignItems:'center',justifyContent:'center'},actionCopy:{flex:1},cardTitle:{color:'#FFFFFF',fontSize:15,fontWeight:'900'},detail:{color:'#B8C6D9',fontSize:11,lineHeight:17,marginTop:5},joinPanel:{backgroundColor:'#102747',borderRadius:17,borderWidth:1,borderColor:'#315078',padding:15,marginTop:5},codeInput:{backgroundColor:'#081A33',borderColor:'#315078',borderWidth:1,borderRadius:11,padding:14,color:'#FFFFFF',fontWeight:'900',letterSpacing:4,textAlign:'center',marginTop:12},joinButton:{backgroundColor:'#F3C96D',padding:14,borderRadius:11,alignItems:'center',marginTop:10},joinButtonText:{color:'#142541',fontWeight:'900'},disabled:{opacity:0.55},loading:{flexDirection:'row',alignItems:'center',gap:10,marginTop:16},notice:{flexDirection:'row',gap:9,backgroundColor:'#102747',borderRadius:13,padding:14,marginTop:15},noticeText:{color:'#B8C6D9',fontSize:11,lineHeight:17,flex:1},roomPanel:{backgroundColor:'#132E4F',borderRadius:17,borderWidth:1,borderColor:'#F4C76B',padding:16,marginTop:16},roomCode:{color:'#F4D68D',fontSize:29,fontWeight:'900',letterSpacing:5,marginBottom:8},roomStatus:{color:'#FFFFFF',fontWeight:'900',marginTop:12,marginBottom:3},waiting:{color:'#F4D68B',fontSize:12,lineHeight:18,marginTop:9},leaveButton:{borderWidth:1,borderColor:'#D78A8A',borderRadius:10,padding:12,alignItems:'center',marginTop:14},leaveText:{color:'#FFC2C2',fontWeight:'900',fontSize:11},signInHint:{color:'#F4D68D',fontSize:12,textAlign:'center',marginTop:15}
});

export default withThemeBackground(RoomsScreen);
