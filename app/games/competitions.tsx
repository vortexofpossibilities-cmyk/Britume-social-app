import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { withThemeBackground } from '../../src/components/ThemeScreen';

const SCHEDULES = [
  { title: 'Daily Challenges', timing: 'Every day', detail: 'Short skill rounds, fresh daily tasks and a daily leaderboard.', icon: 'sunny-outline' as const },
  { title: 'Weekly Championships', timing: 'Every week', detail: 'Qualifying rounds, a weekly leaderboard and a top-three podium.', icon: 'trophy-outline' as const },
  { title: 'Monthly Grand Championship', timing: 'Every month', detail: 'A larger seasonal event with qualification and achievement badges.', icon: 'medal-outline' as const },
];
function CompetitionsScreen() {
  return <View style={styles.screen}>
    <StatusBar barStyle="light-content" backgroundColor="#07152D" />
    <Stack.Screen options={{ title: 'Competitions', headerStyle: { backgroundColor: '#07152D' }, headerTintColor: '#FFFFFF' }} />
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" color="#F4C76B" size={18}/><Text style={styles.backText}>Games Arena</Text></Pressable>
      <Text style={styles.kicker}>BRITUME CHAMPIONSHIPS</Text>
      <Text style={styles.title}>Compete on your schedule</Text>
      <Text style={styles.copy}>The competition calendar is designed for daily, weekly and monthly events. This preview is not connected to live registration yet.</Text>
      {SCHEDULES.map(item => <View key={item.title} style={styles.card}><View style={styles.icon}><Ionicons name={item.icon} size={25} color="#F4C76B"/></View><View style={{flex:1}}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.timing}>{item.timing}</Text><Text style={styles.detail}>{item.detail}</Text></View></View>)}
      <View style={styles.notice}><Ionicons name="information-circle-outline" color="#F4C76B" size={19}/><Text style={styles.noticeText}>Tournament registration, verified rankings and sponsor rewards will activate only after the secure online competition service is connected. Practice scores are non-cash.</Text></View>
      <Pressable style={styles.button} onPress={() => router.push('/games/trivia' as any)}><Text style={styles.buttonText}>TRY A PRACTICE GAME</Text></Pressable>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#07152D'},content:{padding:18,paddingBottom:40},back:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:25},backText:{color:'#F4C76B',fontWeight:'800'},kicker:{color:'#F4C76B',fontWeight:'900',letterSpacing:2,fontSize:11},title:{color:'#FFFFFF',fontSize:27,fontWeight:'900',marginTop:8},copy:{color:'#B8C6D9',fontSize:13,lineHeight:20,marginTop:10,marginBottom:20},card:{flexDirection:'row',gap:14,backgroundColor:'#102747',borderRadius:18,borderWidth:1,borderColor:'#315078',padding:16,marginBottom:12,elevation:4},icon:{width:48,height:48,borderRadius:15,backgroundColor:'#1A3A60',alignItems:'center',justifyContent:'center'},cardTitle:{color:'#FFFFFF',fontSize:16,fontWeight:'900'},timing:{color:'#F4D68D',fontSize:11,fontWeight:'800',marginTop:4},detail:{color:'#B8C6D9',fontSize:12,lineHeight:18,marginTop:7},notice:{flexDirection:'row',gap:9,backgroundColor:'#102747',borderRadius:13,padding:14,marginTop:8},noticeText:{color:'#B8C6D9',fontSize:11,lineHeight:17,flex:1},button:{backgroundColor:'#F3C96D',padding:16,borderRadius:14,alignItems:'center',marginTop:18,borderBottomWidth:4,borderBottomColor:'#A9772C'},buttonText:{color:'#142541',fontWeight:'900',fontSize:12}});
export default withThemeBackground(CompetitionsScreen);
