import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { withThemeBackground } from '../../src/components/ThemeScreen';

const TYPES = [
  { title: 'Quick Match', detail: 'Find an available game and start quickly.', icon: 'flash-outline' as const },
  { title: 'Scheduled Match', detail: 'Register for a match at a future time.', icon: 'calendar-outline' as const },
  { title: 'Championship', detail: 'Play through multi-round tournament stages.', icon: 'trophy-outline' as const },
  { title: 'Private Room', detail: 'Create an invite-only room for friends.', icon: 'people-outline' as const },
];
function RoomsScreen() {
  return <View style={styles.screen}>
    <StatusBar barStyle="light-content" backgroundColor="#07152D" />
    <Stack.Screen options={{ title: 'Match Types', headerStyle: { backgroundColor: '#07152D' }, headerTintColor: '#FFFFFF' }} />
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" color="#F4C76B" size={18}/><Text style={styles.backText}>Games Arena</Text></Pressable>
      <Text style={styles.kicker}>PLAY YOUR WAY</Text>
      <Text style={styles.title}>Choose a match type</Text>
      <Text style={styles.copy}>These are the four match experiences planned for BRITUME Games.</Text>
      {TYPES.map(item => <View key={item.title} style={styles.card}><View style={styles.icon}><Ionicons name={item.icon} size={24} color="#F4C76B"/></View><View style={{flex:1}}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.detail}>{item.detail}</Text></View><View style={styles.soon}><Text style={styles.soonText}>PLANNED</Text></View></View>)}
      <View style={styles.notice}><Ionicons name="shield-checkmark-outline" color="#F4C76B" size={19}/><Text style={styles.noticeText}>Live human-vs-human rooms and invitations are not connected yet. You can play the available solo and robot practice games now.</Text></View>
      <Pressable style={styles.button} onPress={() => router.push('/games/number-guess' as any)}><Text style={styles.buttonText}>PLAY VS ROBOT</Text></Pressable>
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({screen:{flex:1,backgroundColor:'#07152D'},content:{padding:18,paddingBottom:40},back:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:25},backText:{color:'#F4C76B',fontWeight:'800'},kicker:{color:'#F4C76B',fontWeight:'900',letterSpacing:2,fontSize:11},title:{color:'#FFFFFF',fontSize:27,fontWeight:'900',marginTop:8},copy:{color:'#B8C6D9',fontSize:13,lineHeight:20,marginTop:10,marginBottom:20},card:{flexDirection:'row',gap:12,alignItems:'center',backgroundColor:'#102747',borderRadius:17,borderWidth:1,borderColor:'#315078',padding:14,marginBottom:11,elevation:4},icon:{width:45,height:45,borderRadius:14,backgroundColor:'#1A3A60',alignItems:'center',justifyContent:'center'},cardTitle:{color:'#FFFFFF',fontSize:15,fontWeight:'900'},detail:{color:'#B8C6D9',fontSize:11,lineHeight:16,marginTop:5},soon:{backgroundColor:'#1B3B62',paddingHorizontal:8,paddingVertical:6,borderRadius:8},soonText:{color:'#F4D68D',fontSize:9,fontWeight:'900'},notice:{flexDirection:'row',gap:9,backgroundColor:'#102747',borderRadius:13,padding:14,marginTop:8},noticeText:{color:'#B8C6D9',fontSize:11,lineHeight:17,flex:1},button:{backgroundColor:'#F3C96D',padding:16,borderRadius:14,alignItems:'center',marginTop:18,borderBottomWidth:4,borderBottomColor:'#A9772C'},buttonText:{color:'#142541',fontWeight:'900',fontSize:12}});
export default withThemeBackground(RoomsScreen);
