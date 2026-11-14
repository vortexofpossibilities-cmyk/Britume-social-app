import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { getGame, createGameSession, finishGameSession, checkNumberGuess, generatePracticeNumber, type GameSession } from '../../src/games';
import { withThemeBackground } from '../../src/components/ThemeScreen';

const GOLD = '#F4C76B';
const QUESTIONS = [
  { q: 'What is 15% of 200?', a: ['20', '30', '35', '40'], correct: '30' },
  { q: 'What is 144 ÷ 12?', a: ['10', '11', '12', '14'], correct: '12' },
  { q: 'How many minutes are in 2.5 hours?', a: ['120', '135', '150', '180'], correct: '150' },
];
const TRIVIA = [
  { q: 'Which planet is known as the Red Planet?', a: ['Venus', 'Mars', 'Jupiter', 'Mercury'], c: 'Mars' },
  { q: 'How many sides does a hexagon have?', a: ['5', '6', '7', '8'], c: '6' },
  { q: 'Which gas do plants absorb?', a: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], c: 'Carbon dioxide' },
  { q: 'What is the largest ocean?', a: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], c: 'Pacific' },
  { q: 'Which instrument measures temperature?', a: ['Barometer', 'Thermometer', 'Compass', 'Ruler'], c: 'Thermometer' },
];
const SCIENCE = [
  { q: 'What force pulls objects towards Earth?', a: ['Friction', 'Gravity', 'Magnetism', 'Tension'], c: 'Gravity' },
  { q: 'What is the chemical symbol for water?', a: ['CO₂', 'O₂', 'H₂O', 'NaCl'], c: 'H₂O' },
  { q: 'Which part of a plant takes in most water?', a: ['Flower', 'Roots', 'Fruit', 'Leaf'], c: 'Roots' },
  { q: 'What is the centre of an atom called?', a: ['Nucleus', 'Cell', 'Core', 'Orbit'], c: 'Nucleus' },
  { q: 'At sea level, water boils at what temperature?', a: ['50°C', '75°C', '100°C', '150°C'], c: '100°C' },
];
const GEO = [
  { q: 'What is the largest continent?', a: ['Africa', 'Asia', 'Europe', 'South America'], c: 'Asia' },
  { q: 'What is the capital of Botswana?', a: ['Francistown', 'Maun', 'Gaborone', 'Kasane'], c: 'Gaborone' },
  { q: 'Which ocean is east of Africa?', a: ['Pacific', 'Atlantic', 'Indian', 'Arctic'], c: 'Indian' },
  { q: 'The Sahara is a…', a: ['Forest', 'Desert', 'Mountain range', 'River'], c: 'Desert' },
  { q: 'Which country has the city of Tokyo?', a: ['China', 'Japan', 'Thailand', 'India'], c: 'Japan' },
];
const WORDS = [{ w: 'PLANET', s: 'A world in space' }, { w: 'GARDEN', s: 'A place where plants grow' }, { w: 'BRIDGE', s: 'A structure over a river or road' }, { w: 'MARKET', s: 'A place to buy and sell' }, { w: 'PUZZLE', s: 'A game that tests your thinking' }];
const MEMORY = ['🍎','🚀','🎯','🌈','⚽','🦋','🎸','⭐'];
const LANES = ['LEFT', 'CENTRE', 'RIGHT'];
const OBSTACLES = ['🪨', '🌵', '🚧', '🪵', '🕳️'];
const BUSINESS_CHOICES = [
  { q: 'Your shop has more customers. What is the best next move?', options: [{ t: 'Improve stock planning', p: 20 }, { t: 'Ignore demand', p: 0 }, { t: 'Spend the whole budget on decoration', p: 5 }] },
  { q: 'A supplier raises prices. What should you do?', options: [{ t: 'Compare other suppliers', p: 20 }, { t: 'Stop checking costs', p: 0 }, { t: 'Raise every price immediately', p: 5 }] },
  { q: 'Customers report slow service. Choose a response.', options: [{ t: 'Train the team and improve workflow', p: 20 }, { t: 'Ignore feedback', p: 0 }, { t: 'Close during busy hours', p: 0 }] },
  { q: 'You have a small marketing budget.', options: [{ t: 'Test one clear local campaign', p: 20 }, { t: 'Spend without a plan', p: 0 }, { t: 'Hide the business', p: 0 }] },
  { q: 'The business earns a small profit.', options: [{ t: 'Save some and reinvest carefully', p: 20 }, { t: 'Spend everything', p: 0 }, { t: 'Stop tracking finances', p: 0 }] },
];
const CITY_CHOICES = [
  { q: 'Your new town needs its first development.', options: [{ t: 'Build homes and a water point', p: 20 }, { t: 'Build only a stadium', p: 5 }, { t: 'Build nothing', p: 0 }] },
  { q: 'Traffic is increasing.', options: [{ t: 'Improve roads and public transport', p: 20 }, { t: 'Remove all footpaths', p: 0 }, { t: 'Ignore the problem', p: 0 }] },
  { q: 'Residents need places to relax.', options: [{ t: 'Add parks and safe public spaces', p: 20 }, { t: 'Remove green spaces', p: 0 }, { t: 'Build extra warehouses only', p: 5 }] },
  { q: 'The town needs more learning opportunities.', options: [{ t: 'Build a school and library', p: 20 }, { t: 'Close the school', p: 0 }, { t: 'Use the land for parking only', p: 5 }] },
  { q: 'The budget is getting tight.', options: [{ t: 'Prioritise essential services', p: 20 }, { t: 'Borrow for decorations', p: 0 }, { t: 'Stop maintenance', p: 0 }] },
];

function shuffle<T>(items: T[]): T[] { return [...items].sort(() => Math.random() - 0.5); }

function IndividualGameScreen() {
  const params = useLocalSearchParams<{ game: string }>();
  const slug = Array.isArray(params.game) ? params.game[0] : params.game;
  const aliases: Record<string, string> = { 'spin-wheel': 'pooled-spin', 'crash-rocket': 'rocket', 'prediction-pot': 'prediction-pot', 'daily-challenge': 'daily-challenge', 'mystery-box': 'mystery-box', 'lowest-unique-bid': 'lowest-bid', 'last-one-standing': 'last-standing' };
  const gameId = aliases[slug ?? ''] ?? slug ?? '';
  const definition = getGame(gameId);
  const [session, setSession] = useState<GameSession | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState('');
  const [secret, setSecret] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [robotScore, setRobotScore] = useState(0);
  const [seconds, setSeconds] = useState(20);
  const [answer, setAnswer] = useState('');
  const [scrambled, setScrambled] = useState(WORDS[0]);
  const [cards, setCards] = useState<string[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [lane, setLane] = useState(1);
  const [hazards, setHazards] = useState<number[]>([]);
  const [safePath, setSafePath] = useState<number[]>([]);
  const [resourceScore, setResourceScore] = useState(100);
  const [businessIndex, setBusinessIndex] = useState(0);
  const [matchHistory, setMatchHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<'robot' | 'solo'>('robot');

  useEffect(() => {
    if (!session || session.status !== 'playing' || !['math-duel'].includes(gameId)) return;
    if (seconds <= 0) {
      const next = round + 1;
      setFeedback('Time is up. The robot takes this round.');
      setRobotScore(v => v + 1);
      if (next >= 3) finish(score, robotScore + 1);
      else { setRound(next); setSeconds(20); }
      return;
    }
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [session, seconds, gameId, round, score, robotScore]);

  const start = () => {
    setSession(createGameSession(gameId)); setScore(0); setRobotScore(0); setRound(0);
    setGuess(''); setFeedback(''); setAnswer(''); setSeconds(20); setBusinessIndex(0);
    setResourceScore(100); setLane(1); setMatchHistory([]);
    setSecret(generatePracticeNumber()); setHazards(Array.from({ length: 10 }, () => Math.floor(Math.random() * 3)));
    setSafePath(Array.from({ length: 8 }, () => Math.floor(Math.random() * 3)));
    setCards(shuffle([...MEMORY, ...MEMORY])); setRevealed([]); setMatched([]);
    setScrambled(shuffle(WORDS)[0]);
  };
  const finish = (finalScore: number, bot = robotScore) => {
    if (!session) return;
    setScore(Math.max(0, finalScore)); setRobotScore(bot);
    setSession(finishGameSession(session, Math.max(0, finalScore)));
    setMatchHistory(old => [`You ${finalScore >= bot * 10 ? 'won' : 'finished'} · ${finalScore} pts`, ...old].slice(0, 5));
  };
  const progress = (points: number) => {
    const next = round + 1;
    const total = score + points;
    setScore(total);
    if (next >= 5) finish(total, robotScore);
    else setRound(next);
  };
  const submitGuess = () => {
    const result = checkNumberGuess(Number(guess), secret);
    if (result === 'invalid') { setFeedback('Enter a whole number from 1 to 100.'); return; }
    const botGuess = Math.floor(Math.random() * 100) + 1;
    if (result === 'correct') { setFeedback(`Correct! The robot guessed ${botGuess}.`); finish(Math.max(10, 100 - round * 10), botGuess === secret ? 100 : 0); }
    else { setRound(v => v + 1); setFeedback(result === 'too-low' ? 'Too low — try a higher number.' : 'Too high — try a lower number.'); if (round >= 9) finish(0, 10); }
    setGuess('');
  };
  const currentQuestions = gameId === 'science-battle' ? SCIENCE : gameId === 'geography-quiz' ? GEO : TRIVIA;
  const currentQuestion = gameId === 'math-duel' ? QUESTIONS[round] : currentQuestions[round];
  const answerQuestion = (selected: string) => {
    const correct = gameId === 'math-duel' ? selected === QUESTIONS[round].correct : selected === currentQuestions[round].c;
    const nextScore = score + (correct ? 10 : 0);
    const botPoint = Math.random() > 0.38 ? 10 : 0;
    const nextBot = robotScore + botPoint;
    setScore(nextScore); setRobotScore(nextBot);
    setFeedback(correct ? 'Correct! +10 points.' : 'Not quite — keep going.');
    if (round >= (gameId === 'math-duel' ? 2 : 4)) finish(nextScore, nextBot);
    else { setRound(v => v + 1); setSeconds(20); }
  };
  const chooseLane = (chosen: number) => {
    const danger = hazards[round];
    if (chosen === danger) { setFeedback('Obstacle hit! You lost this stage.'); finish(score, robotScore); return; }
    const next = round + 1; setLane(chosen); setFeedback('Clear lane! +10 points.');
    if (next >= 10) finish(score + 10, robotScore + 60); else { setScore(v => v + 10); setRound(next); }
  };
  const chooseIce = (chosen: number) => {
    if (chosen !== safePath[round]) { setFeedback('That tile was slippery. Try a new bridge.'); finish(score, robotScore); return; }
    const next = round + 1; setFeedback('Safe step!');
    if (next >= 8) finish(score + 80, 55); else { setScore(v => v + 10); setRound(next); }
  };
  const chooseBusiness = (points: number, city = false) => {
    const nextScore = score + points; const next = businessIndex + 1;
    setScore(nextScore); setResourceScore(v => Math.max(0, v - (points === 20 ? 12 : 22)));
    if (next >= 5) finish(nextScore, 65); else { setBusinessIndex(next); setRound(next); }
  };
  const revealCard = (index: number) => {
    if (revealed.includes(index) || matched.includes(index) || revealed.length >= 2) return;
    const next = [...revealed, index]; setRevealed(next);
    if (next.length === 2) {
      if (cards[next[0]] === cards[next[1]]) { const found = [...matched, ...next]; setMatched(found); setRevealed([]); if (found.length === cards.length) finish(100, 70); }
      else setTimeout(() => setRevealed([]), 700);
    }
  };
  const submitWord = () => {
    const correct = answer.trim().toUpperCase() === scrambled.w;
    if (correct) finish(100, 60); else setFeedback('Not that word. Try again using the clue.');
  };

  if (!definition) return <View style={styles.container}><Text style={styles.title}>Game not found</Text><Pressable style={styles.primary} onPress={() => router.back()}><Text style={styles.primaryText}>Go back</Text></Pressable></View>;
  const isPlaying = session?.status === 'playing';
  const isComplete = session?.status === 'completed';
  const title = definition.name;

  const renderGame = () => {
    if (!session) return <View style={styles.panel}>
      <View style={[styles.gameIcon, { backgroundColor: `${definition.accent}25` }]}><Ionicons name={definition.icon as keyof typeof Ionicons.glyphMap} size={40} color={definition.accent}/></View>
      <Text style={styles.panelTitle}>Ready for the challenge?</Text>
      <Text style={styles.copy}>Play a complete practice round, learn the rules and build your score. No paid entries or cash rewards.</Text>
      <View style={styles.modeRow}><Pressable onPress={() => setMode('robot')} style={[styles.modeButton, mode === 'robot' && styles.modeActive]}><Text style={[styles.modeText, mode === 'robot' && styles.modeTextActive]}>🤖 Vs Robot</Text></Pressable><Pressable onPress={() => setMode('solo')} style={[styles.modeButton, mode === 'solo' && styles.modeActive]}><Text style={[styles.modeText, mode === 'solo' && styles.modeTextActive]}>Solo Practice</Text></Pressable></View>
      <Pressable style={styles.primary} onPress={start}><Text style={styles.primaryText}>START GAME</Text><Ionicons name="play" size={17} color="#10203A"/></Pressable>
    </View>;
    if (isComplete) return <View style={styles.panel}>
      <Text style={{ fontSize: 48 }}>🏆</Text><Text style={styles.panelTitle}>Round complete!</Text><Text style={styles.score}>{score}</Text><Text style={styles.copy}>Your practice score</Text>
      {mode === 'robot' && <View style={styles.scoreRow}><Text style={styles.copy}>Robot score</Text><Text style={styles.robotScore}>{robotScore}</Text></View>}
      <Text style={styles.resultLine}>{mode === 'solo' ? 'Practice complete — try another round to improve your score.' : score >= robotScore ? 'Great match — you beat the practice rival!' : 'Good effort. Try again and improve your score.'}</Text>
      <Pressable style={styles.primary} onPress={start}><Text style={styles.primaryText}>PLAY AGAIN</Text></Pressable>
    </View>;
    switch (gameId) {
      case 'number-guess': return <View style={styles.panel}><Text style={styles.panelTitle}>Find the hidden number</Text><Text style={styles.copy}>The robot has chosen a number from 1 to 100. Use the clues to find it.</Text><TextInput value={guess} onChangeText={setGuess} keyboardType="number-pad" maxLength={3} placeholder="Your guess" placeholderTextColor="#9BAAC0" style={styles.input}/><Pressable style={styles.primary} onPress={submitGuess}><Text style={styles.primaryText}>CHECK GUESS</Text></Pressable><Text style={styles.hint}>{feedback || `Attempts used: ${round}`}</Text></View>;
      case 'math-duel': return <View style={styles.panel}><View style={styles.hud}><Text style={styles.hudText}>QUESTION {round + 1}/3</Text><Text style={styles.timer}>⏱ {seconds}s</Text></View><Text style={styles.panelTitle}>{QUESTIONS[round]?.q}</Text>{QUESTIONS[round]?.a.map(a => <Pressable key={a} style={styles.answer} onPress={() => answerQuestion(a)}><Text style={styles.answerText}>{a}</Text></Pressable>)}<Text style={styles.hint}>{feedback}</Text></View>;
      case 'trivia': case 'science-battle': case 'geography-quiz': return <View style={styles.panel}><View style={styles.hud}><Text style={styles.hudText}>ROUND {round + 1}/5</Text><Text style={styles.timer}>YOU {score} · BOT {robotScore}</Text></View><Text style={styles.panelTitle}>{currentQuestion?.q}</Text>{currentQuestion?.a.map(a => <Pressable key={a} style={styles.answer} onPress={() => answerQuestion(a)}><Text style={styles.answerText}>{a}</Text></Pressable>)}</View>;
      case 'memory-match': return <View style={styles.panel}><Text style={styles.panelTitle}>Find all eight pairs</Text><Text style={styles.copy}>Matched: {matched.length / 2}/8</Text><View style={styles.memoryGrid}>{cards.map((card, i) => <Pressable key={i} onPress={() => revealCard(i)} style={[styles.memoryCard, (revealed.includes(i) || matched.includes(i)) && styles.memoryOpen]}><Text style={styles.memoryText}>{revealed.includes(i) || matched.includes(i) ? card : '?'}</Text></Pressable>)}</View><Text style={styles.hint}>{feedback}</Text></View>;
      case 'obstacle-dash': return <View style={styles.panel}><Text style={styles.panelTitle}>Stage {round + 1} of 10</Text><Text style={styles.copy}>Choose a lane that does not contain the obstacle.</Text><Text style={styles.obstacle}>{OBSTACLES[hazards[round] ?? 0]}</Text><View style={styles.laneRow}>{LANES.map((l, i) => <Pressable key={l} onPress={() => chooseLane(i)} style={styles.laneButton}><Text style={styles.laneText}>{l}</Text></Pressable>)}</View><Text style={styles.hint}>{feedback}</Text></View>;
      case 'ice-bridge': return <View style={styles.panel}><Text style={styles.panelTitle}>Cross the ice bridge</Text><Text style={styles.copy}>Step {round + 1} of 8. Choose the safe tile.</Text><View style={styles.iceRow}>{[0,1,2].map(i => <Pressable key={i} onPress={() => chooseIce(i)} style={styles.iceTile}><Text style={{fontSize:26}}>🧊</Text><Text style={styles.iceLabel}>TILE {i + 1}</Text></Pressable>)}</View><Text style={styles.hint}>{feedback}</Text></View>;
      case 'business-tycoon': case 'city-builder': {
        const decisions = gameId === 'city-builder' ? CITY_CHOICES : BUSINESS_CHOICES;
        const item = decisions[businessIndex];
        return <View style={styles.panel}><View style={styles.hud}><Text style={styles.hudText}>DECISION {businessIndex + 1}/5</Text><Text style={styles.timer}>BUDGET {resourceScore}</Text></View><Text style={styles.panelTitle}>{item.q}</Text>{item.options.map((option, i) => <Pressable key={i} style={styles.answer} onPress={() => chooseBusiness(option.p, gameId === 'city-builder')}><Text style={styles.answerText}>{option.t}</Text></Pressable>)}<Text style={styles.hint}>Make choices that help your {gameId === 'city-builder' ? 'community' : 'business'} grow.</Text></View>;
      }
      case 'word-scramble': return <View style={styles.panel}><Text style={styles.panelTitle}>Unscramble this word</Text><Text style={styles.scramble}>{scrambled.w.split('').reverse().join('  ')}</Text><Text style={styles.copy}>Clue: {scrambled.s}</Text><TextInput value={answer} onChangeText={setAnswer} autoCapitalize="characters" placeholder="Type your answer" placeholderTextColor="#9BAAC0" style={styles.input}/><Pressable style={styles.primary} onPress={submitWord}><Text style={styles.primaryText}>SUBMIT WORD</Text></Pressable><Text style={styles.hint}>{feedback}</Text></View>;
      case 'race-rush': return <View style={styles.panel}><Text style={styles.panelTitle}>Lane Racer · Stage {round + 1}/10</Text><Text style={styles.copy}>Choose a clear lane. Avoid the traffic obstacle.</Text><Text style={styles.obstacle}>{['🚙','🚚','🚌'][hazards[round] ?? 0]}</Text><View style={styles.laneRow}>{LANES.map((l,i)=><Pressable key={l} onPress={() => { if (i === hazards[round]) finish(score, robotScore + 50); else if (round >= 9) finish(score + 100, robotScore + 60); else { setScore(v=>v+10); setRound(v=>v+1); setFeedback('Clean pass! +10'); } }} style={styles.laneButton}><Text style={styles.laneText}>{l}</Text></Pressable>)}</View><Text style={styles.hint}>{feedback || 'Collect points by choosing a clear lane.'}</Text></View>;
      case 'arena-tactics': return <View style={styles.panel}><Text style={styles.panelTitle}>Friendly Sports Arena</Text><Text style={styles.copy}>Choose a tactic each turn. Manage stamina and outscore the robot in five rounds.</Text><Text style={styles.score}>{resourceScore} ⚡</Text>{[{t:'Quick move',p:15,s:15},{t:'Balanced move',p:20,s:20},{t:'Rest and recover',p:5,s:-15}].map((m,i)=><Pressable key={i} style={styles.answer} onPress={()=>{const next=score+m.p; const bot=robotScore+(Math.random()>.4?12:5); setScore(next); setRobotScore(bot); setResourceScore(v=>Math.min(100,Math.max(0,v-m.s))); if(round>=4) finish(next,bot); else setRound(v=>v+1);}}><Text style={styles.answerText}>{m.t}</Text></Pressable>)}</View>;
      case 'greedy-split': return <View style={styles.panel}><Text style={styles.panelTitle}>The Fair Deal</Text><Text style={styles.copy}>A team has 100 imaginary project credits. Choose a fair offer for your partner.</Text>{[20,30,40,50,60].map(v=><Pressable key={v} style={styles.answer} onPress={()=>finish(v>=30&&v<=50 ? 80-v : 20, v>=30&&v<=50 ? 50 : 70)}><Text style={styles.answerText}>Offer {v} credits · Keep {100-v}</Text></Pressable>)}</View>;
      default: return <View style={styles.panel}><Text style={styles.panelTitle}>Practice coming soon</Text><Text style={styles.copy}>This game is listed in the catalogue but is not yet playable.</Text></View>;
    }
  };

  return <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#07152D"/>
    <Stack.Screen options={{ title, headerStyle: { backgroundColor: '#07152D' }, headerTintColor: '#FFFFFF', headerShadowVisible: false }}/>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={19} color={GOLD}/><Text style={styles.backText}>Games Arena</Text></Pressable>
      <View style={styles.hero}><View style={[styles.gameIcon,{backgroundColor:`${definition.accent}25`}]}><Ionicons name={definition.icon as keyof typeof Ionicons.glyphMap} size={34} color={definition.accent}/></View><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{definition.description}</Text><View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE DEMO PLAY</Text></View></View>
      {isPlaying && <View style={styles.scoreBar}><Text style={styles.scoreBarText}>YOUR SCORE  {score}</Text><Text style={styles.scoreBarText}>ROUND  {round + 1}</Text></View>}
      {renderGame()}
      <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={18} color={GOLD}/><Text style={styles.noticeText}>Demo points and scores only. They cannot be purchased, transferred or withdrawn. Online multiplayer is not active in this build.</Text></View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#07152D'}, content:{padding:18,paddingBottom:44}, back:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:20}, backText:{color:GOLD,fontWeight:'800'},
  hero:{alignItems:'center',marginBottom:20}, gameIcon:{width:72,height:72,borderRadius:23,alignItems:'center',justifyContent:'center',marginBottom:12,borderWidth:1,borderColor:'#D8B56A'}, title:{fontSize:25,fontWeight:'900',color:'#FFFFFF',textAlign:'center'}, subtitle:{fontSize:13,color:'#B8C6D9',textAlign:'center',lineHeight:20,marginTop:7}, freeBadge:{backgroundColor:'#18365E',borderWidth:1,borderColor:'#D5AC55',borderRadius:20,paddingHorizontal:13,paddingVertical:7,marginTop:12}, freeBadgeText:{color:'#F7D98F',fontSize:10,fontWeight:'900',letterSpacing:1},
  panel:{backgroundColor:'#102747',borderWidth:1,borderColor:'#315078',borderRadius:22,padding:19,alignItems:'center',shadowColor:'#000',shadowOpacity:.28,shadowRadius:12,elevation:7}, panelTitle:{fontSize:20,fontWeight:'900',color:'#FFFFFF',textAlign:'center',marginBottom:9}, copy:{fontSize:13,color:'#C0CDDF',textAlign:'center',lineHeight:20,marginBottom:10}, primary:{minHeight:50,backgroundColor:'#F3C96D',borderRadius:15,paddingHorizontal:20,marginTop:18,alignSelf:'stretch',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,elevation:5,borderBottomWidth:4,borderBottomColor:'#A9772C'}, primaryText:{color:'#142541',fontWeight:'900',fontSize:13,letterSpacing:.5}, modeRow:{flexDirection:'row',gap:8,width:'100%',marginTop:12}, modeButton:{flex:1,padding:12,borderRadius:12,backgroundColor:'#18365A',alignItems:'center',borderWidth:1,borderColor:'#345477'}, modeActive:{backgroundColor:'#D6AD59',borderColor:'#F9D98E'}, modeText:{color:'#D5E0EE',fontWeight:'800',fontSize:12}, modeTextActive:{color:'#10203A'},
  input:{width:'100%',backgroundColor:'#081A33',borderWidth:1,borderColor:'#54749A',borderRadius:13,padding:14,color:'#FFFFFF',fontSize:18,textAlign:'center',marginTop:12}, hint:{color:'#F4D68D',fontSize:13,textAlign:'center',marginTop:14,lineHeight:20}, answer:{width:'100%',padding:15,marginTop:9,backgroundColor:'#1B3A60',borderRadius:13,borderWidth:1,borderColor:'#41658D'}, answerText:{color:'#FFFFFF',fontWeight:'800',fontSize:14,textAlign:'center'}, hud:{width:'100%',flexDirection:'row',justifyContent:'space-between',marginBottom:12}, hudText:{color:'#F4D68D',fontSize:11,fontWeight:'900'}, timer:{color:'#FFFFFF',fontWeight:'900',fontSize:12}, scoreBar:{flexDirection:'row',justifyContent:'space-between',backgroundColor:'#18365A',padding:13,borderRadius:12,marginBottom:12}, scoreBarText:{color:'#F5D68F',fontWeight:'900',fontSize:11}, score:{fontSize:46,color:'#F4CF79',fontWeight:'900',marginVertical:10}, robotScore:{fontSize:20,color:'#B5D5FF',fontWeight:'900'}, scoreRow:{flexDirection:'row',alignItems:'center',gap:12}, resultLine:{color:'#D7E2F0',fontSize:13,textAlign:'center',marginTop:12}, memoryGrid:{width:'100%',flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:8,marginTop:14}, memoryCard:{width:'21%',aspectRatio:1,backgroundColor:'#1C4775',borderRadius:12,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'#6383A9'},memoryOpen:{backgroundColor:'#F0D18B',borderColor:'#FFF0C5'},memoryText:{fontSize:25,color:'#FFFFFF',fontWeight:'900'}, obstacle:{fontSize:55,marginVertical:14},laneRow:{width:'100%',flexDirection:'row',gap:8},laneButton:{flex:1,backgroundColor:'#1A416C',borderRadius:13,paddingVertical:18,alignItems:'center',borderWidth:1,borderColor:'#6082A9'},laneText:{fontSize:11,color:'#FFFFFF',fontWeight:'900'},iceRow:{flexDirection:'row',gap:8,width:'100%',marginTop:15},iceTile:{flex:1,backgroundColor:'#C8F2FF',borderRadius:14,paddingVertical:18,alignItems:'center'},iceLabel:{fontSize:9,color:'#16456A',fontWeight:'900',marginTop:6},scramble:{fontSize:26,color:'#F4D68D',fontWeight:'900',letterSpacing:2,marginVertical:14},notice:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:'#102747',borderRadius:13,padding:14,marginTop:18,borderWidth:1,borderColor:'#29466B'},noticeText:{flex:1,color:'#B7C7DA',fontSize:11,lineHeight:17},
});

export default withThemeBackground(IndividualGameScreen);
