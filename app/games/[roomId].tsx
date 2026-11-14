import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/auth/AuthProvider';
import { getDuelEvents, getGuessDuelStatus, startGuessDuel, submitGuess, subscribeToDuel, type DuelEvent } from '../../../src/games/liveDuel';

export default function LiveGuessDuelScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();
  const [guess, setGuess] = useState('');
  const [events, setEvents] = useState<DuelEvent[]>([]);
  const [turnUserId, setTurnUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [notice, setNotice] = useState('Both players must be in the room before starting.');

  const refresh = useCallback(async () => {
    if (!roomId) return;
    try {
      const [nextEvents, status] = await Promise.all([getDuelEvents(roomId), getGuessDuelStatus(roomId)]);
      setEvents(nextEvents);
      if (status.started) { setStarted(true); setTurnUserId(status.turn_user_id ?? null); setFinished(Boolean(status.completed)); }
    }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Could not refresh guesses.'); }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const channel = subscribeToDuel(roomId, () => { void refresh(); });
    void refresh();
    return () => { void channel.unsubscribe(); };
  }, [roomId, refresh]);

  const start = async () => {
    if (!roomId) return;
    setBusy(true); setNotice('');
    try { await startGuessDuel(roomId); await refresh(); setNotice('Match started. The first player can guess.'); }
    catch (e) { setNotice(e instanceof Error ? e.message : 'Could not start match.'); }
    finally { setBusy(false); }
  };

  const play = async () => {
    if (!roomId) return;
    const n = Number(guess);
    if (!Number.isInteger(n) || n < 1 || n > 100) { setNotice('Enter a whole number from 1 to 100.'); return; }
    setBusy(true); setNotice('');
    try {
      const result = await submitGuess(roomId, n);
      setGuess(''); setTurnUserId(result.turn_user_id ?? null); setFinished(result.status === 'completed');
      setNotice(result.outcome === 'higher' ? 'Try a higher number.' : result.outcome === 'lower' ? 'Try a lower number.' : result.outcome === 'correct' ? 'Correct guess! Match complete.' : result.outcome === 'draw' ? 'The match ended in a draw.' : 'Guess submitted.');
      await refresh();
    } catch (e) { setNotice(e instanceof Error ? e.message : 'Guess could not be submitted.'); }
    finally { setBusy(false); }
  };

  return <View style={s.screen}>
    <StatusBar barStyle="light-content" backgroundColor="#07152D" />
    <Stack.Screen options={{ title: 'Live Guess Duel', headerStyle: { backgroundColor: '#07152D' }, headerTintColor: '#FFFFFF' }} />
    <ScrollView contentContainerStyle={s.content}>
      <Pressable style={s.back} onPress={() => router.back()}><Ionicons name="arrow-back" color="#F4C76B" size={18}/><Text style={s.backText}>Back to room</Text></Pressable>
      <Text style={s.kicker}>BRITUME LIVE ARENA</Text>
      <Text style={s.title}>Guess the Number</Text>
      <Text style={s.copy}>Two players take turns guessing a server-hidden number from 1 to 100. First correct guess wins. Demo play only.</Text>
      {!started && <Pressable disabled={busy} onPress={() => void start()} style={s.primary}>{busy ? <ActivityIndicator color="#142541"/> : <Text style={s.primaryText}>START MATCH</Text>}</Pressable>}
      {started && !finished && <View style={s.panel}>
        <Text style={s.label}>{turnUserId === user?.id ? 'YOUR TURN' : 'OPPONENT’S TURN'}</Text>
        <Text style={s.hint}>{turnUserId === user?.id ? 'Enter your guess below.' : 'Waiting for your opponent to guess…'}</Text>
        {turnUserId === user?.id && <><TextInput value={guess} onChangeText={v => setGuess(v.replace(/[^0-9]/g, '').slice(0,3))} keyboardType="number-pad" maxLength={3} placeholder="1–100" placeholderTextColor="#7F91A9" style={s.input}/><Pressable disabled={busy} onPress={() => void play()} style={s.primary}>{busy ? <ActivityIndicator color="#142541"/> : <Text style={s.primaryText}>SUBMIT GUESS</Text>}</Pressable></>}
      </View>}
      {!!notice && <Text style={s.notice}>{notice}</Text>}
      <Text style={s.label}>LIVE GUESSES</Text>
      {events.length === 0 ? <Text style={s.hint}>No guesses yet.</Text> : events.map(e => <View key={e.id} style={s.event}><Text style={s.eventText}>Turn {e.turn_number} · {e.user_id === user?.id ? 'You' : 'Opponent'} guessed {e.guess}</Text></View>)}
      {finished && <Pressable onPress={() => router.back()} style={s.secondary}><Text style={s.secondaryText}>RETURN TO ROOM</Text></Pressable>}
      <Text style={s.foot}>The secret number and winner decision are handled by Supabase, not the player's device. No wallet or cash rewards are connected.</Text>
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({ screen:{flex:1,backgroundColor:'#07152D'},content:{padding:18,paddingBottom:44},back:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:22},backText:{color:'#F4C76B',fontWeight:'800'},kicker:{color:'#F4C76B',fontWeight:'900',letterSpacing:2,fontSize:11},title:{color:'#FFF',fontSize:28,fontWeight:'900',marginTop:8},copy:{color:'#B8C6D9',fontSize:13,lineHeight:20,marginTop:9,marginBottom:20},primary:{backgroundColor:'#F3C96D',padding:15,borderRadius:12,alignItems:'center',marginTop:12},primaryText:{color:'#142541',fontWeight:'900'},panel:{backgroundColor:'#102747',borderRadius:16,borderColor:'#F4C76B',borderWidth:1,padding:16,marginVertical:10},label:{color:'#F4D68D',fontWeight:'900',fontSize:12,letterSpacing:1.2,marginTop:12,marginBottom:8},hint:{color:'#B8C6D9',fontSize:12,lineHeight:18},input:{backgroundColor:'#081A33',borderColor:'#315078',borderWidth:1,borderRadius:10,padding:14,color:'#FFF',fontSize:24,fontWeight:'900',textAlign:'center',marginTop:12},notice:{color:'#F4D68D',backgroundColor:'#102747',padding:13,borderRadius:11,marginVertical:14,lineHeight:19},event:{backgroundColor:'#102747',borderRadius:10,padding:12,marginTop:7},eventText:{color:'#E6EDF6',fontSize:12},secondary:{borderWidth:1,borderColor:'#F4C76B',borderRadius:11,padding:13,alignItems:'center',marginTop:18},secondaryText:{color:'#F4D68D',fontWeight:'900'},foot:{color:'#8092A9',fontSize:10,lineHeight:16,marginTop:20}});
