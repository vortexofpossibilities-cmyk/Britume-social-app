import React from 'react';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

const games = [
  { title: 'Ludo', detail: 'Dice-and-token race vs robot', route: '/game-ludo', emoji: '🎲' },
  { title: 'Chess', detail: 'Move pieces vs a simple robot', route: '/game-chess', emoji: '♟️' },
  { title: 'Sudoku', detail: 'Fill the number grid', route: '/game-sudoku', emoji: '🔢' },
  { title: 'Card Duel', detail: 'High-card challenge vs robot', route: '/game-cards', emoji: '🃏' },
  { title: 'Football', detail: 'Penalty shootout vs robot', route: '/game-football', emoji: '⚽' },
  { title: '8 Ball Pool Mini', detail: 'Aim and shoot a simplified table', route: '/game-pool', emoji: '🎱' },
];
export default function GamesHub() {
  const router = useRouter();
  return <ScrollView contentContainerStyle={s.page}>
    <Text style={s.brand}>BRITUME GAMES 🎮</Text>
    <Text style={s.sub}>Choose a game. Robot play is local; online rooms need backend setup.</Text>
    {games.map(g => <Pressable key={g.route} onPress={() => router.push(g.route as never)} style={s.card}>
      <Text style={s.emoji}>{g.emoji}</Text><View style={{flex:1}}>
        <Text style={s.title}>{g.title}</Text><Text style={s.detail}>{g.detail}</Text>
      </View><Text style={s.arrow}>›</Text>
    </Pressable>)}
  </ScrollView>;
}
const s=StyleSheet.create({page:{padding:18,gap:12,backgroundColor:'#07152d',flexGrow:1},brand:{fontSize:26,fontWeight:'900',color:'#eaf6ff'},sub:{fontSize:14,color:'#a9c7e5',marginBottom:8},card:{backgroundColor:'#102747',borderColor:'#244b70',borderWidth:1,borderRadius:16,padding:16,flexDirection:'row',alignItems:'center',gap:12},emoji:{fontSize:32},title:{fontSize:17,fontWeight:'800',color:'#fff'},detail:{fontSize:13,color:'#b6cce1',marginTop:3},arrow:{fontSize:28,color:'#8bd7ff'}});
