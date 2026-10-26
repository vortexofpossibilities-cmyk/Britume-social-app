import React, { useMemo, useState } from 'react';
import { ScrollView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { recordGame } from '../src/lib/game-storage';

const puzzle = [
  '530070000','600195000','098000060','800060003','400803001',
  '700020006','060000280','000419005','000080079'
];
const solution = [
  '534678912','672195348','198342567','859761423','426853791',
  '713924856','961537284','287419635','345286179'
];
export default function SudokuGame() {
  const [board,setBoard]=useState(puzzle.join('').split(''));
  const [selected,setSelected]=useState(0); const [message,setMessage]=useState('Select an empty square, then choose a number.');
  const fixed=useMemo(()=>puzzle.join('').split('').map(x=>x!=='0'),[]);
  const done=board.every((x,i)=>x===solution.join('')[i]);
  async function put(n:string){if(fixed[selected]||done)return;const next=[...board];next[selected]=n;setBoard(next);if(next.every((x,i)=>x===solution.join('')[i])){setMessage('Solved! Great work.');await recordGame('sudoku',true,100);}else setMessage(n===solution.join('')[selected]?'Good move!':'Number entered. Check row, column and box.');}
  return <ScrollView contentContainerStyle={s.page}><Text style={s.h1}>Sudoku</Text><Text style={s.info}>{message}</Text>
    <View style={s.grid}>{board.map((n,i)=><Pressable key={i} onPress={()=>setSelected(i)} style={[s.cell,{borderRightWidth:(i%9===2||i%9===5)?2:0,borderBottomWidth:(Math.floor(i/9)===2||Math.floor(i/9)===5)?2:0,backgroundColor:selected===i?'#2b6591':fixed[i]?'#183653':'#0d223b'}]}><Text style={[s.digit,{color:fixed[i]?'#fff':'#8de0ff'}]}>{n==='0'?'':n}</Text></Pressable>)}</View>
    <View style={s.numbers}>{'123456789'.split('').map(n=><Pressable key={n} onPress={()=>put(n)} style={s.num}><Text style={s.digit}>{n}</Text></Pressable>)}</View>
    <Pressable style={s.btn} onPress={()=>{setBoard(puzzle.join('').split(''));setMessage('Puzzle reset.');}}><Text style={s.btnText}>Reset puzzle</Text></Pressable>
    <Text style={s.note}>Starter puzzle only. Progress saving is recorded when solved; install AsyncStorage first.</Text>
  </ScrollView>;
}
const s=StyleSheet.create({page:{padding:16,gap:12,backgroundColor:'#07152d',flexGrow:1},h1:{fontSize:28,fontWeight:'900',color:'#fff'},info:{color:'#a9d9f5'},grid:{flexDirection:'row',flexWrap:'wrap',borderWidth:2,borderColor:'#8dc8ed'},cell:{width:'11.1111%',aspectRatio:1,borderColor:'#416481',borderWidth:.5,alignItems:'center',justifyContent:'center'},digit:{fontSize:18,fontWeight:'700',color:'#fff'},numbers:{flexDirection:'row',justifyContent:'space-between',gap:4},num:{flex:1,backgroundColor:'#17456a',paddingVertical:12,alignItems:'center',borderRadius:7},btn:{backgroundColor:'#78d5ff',padding:13,borderRadius:10,alignItems:'center'},btnText:{fontWeight:'900',color:'#07152d'},note:{color:'#9eb6cc',fontSize:12}});
