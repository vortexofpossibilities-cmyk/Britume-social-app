import React, { useState } from 'react';
import {
View,
Text,
Pressable,
ScrollView,
StyleSheet,
Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../../src/contexts/ThemeContext';

const boxes = [
{ id: 'bronze', name: 'Bronze Box', cost: 20, color: '#B77945', icon: 'cube-outline' as const },
{ id: 'silver', name: 'Silver Box', cost: 50, color: '#94A3B8', icon: 'gift-outline' as const },
{ id: 'gold', name: 'Gold Box', cost: 100, color: '#E5A52E', icon: 'diamond-outline' as const },
];

export default function MysteryBoxScreen() {
const { theme } = useAppTheme();
const [selected, setSelected] = useState('bronze');
const [opened, setOpened] = useState(false);

const styles = createStyles(theme);
const selectedBox = boxes.find(box => box.id === selected)!;

const openPreview = () => {
setOpened(false);
Alert.alert(
'Mystery Box Preview',
"${selectedBox.name} selected.\n\nThis is a preview only. No points have been deducted and no prize has been awarded.",
);
setOpened(true);
};

return (
<ScrollView style={styles.screen} contentContainerStyle={styles.content}>
<Pressable style={styles.back} onPress={() => router.back()}>
<Ionicons name="arrow-back" size={23} color={theme.text} />
<Text style={styles.backText}>Rewards Hub</Text>
</Pressable>

  <View style={styles.header}>
    <Text style={styles.eyebrow}>BRITUME REWARDS</Text>
    <Text style={styles.title}>Mystery Boxes</Text>
    <Text style={styles.subtitle}>
      Choose a box and discover what could be inside.
    </Text>
  </View>

  <View style={styles.notice}>
    <Ionicons name="information-circle-outline" size={22} color={theme.cyan} />
    <Text style={styles.noticeText}>
      Preview mode. Real point payments, prize odds and payouts are not active yet.
    </Text>
  </View>

  <View style={styles.boxDisplay}>
    <Ionicons name="gift" size={82} color={selectedBox.color} />
    <Text style={styles.boxName}>{selectedBox.name}</Text>
    <Text style={styles.boxCost}>{selectedBox.cost} points</Text>
    <Text style={styles.boxHint}>Your selected mystery box</Text>
  </View>

  <Text style={styles.sectionTitle}>Choose your box</Text>

  {boxes.map(box => {
    const active = selected === box.id;

    return (
      <Pressable
        key={box.id}
        onPress={() => {
          setSelected(box.id);
          setOpened(false);
        }}
        style={[
          styles.option,
          active && styles.optionActive,
        ]}
      >
        <View style={[styles.optionIcon, { backgroundColor: box.color }]}>
          <Ionicons name={box.icon} size={25} color="#FFFFFF" />
        </View>

        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{box.name}</Text>
          <Text style={styles.optionSubtitle}>
            Preview cost: {box.cost} points
          </Text>
        </View>

        <Ionicons
          name={active ? 'radio-button-on' : 'radio-button-off'}
          size={23}
          color={active ? theme.cyan : theme.muted}
        />
      </Pressable>
    );
  })}

  <Pressable style={styles.openButton} onPress={openPreview}>
    <Ionicons name="lock-open-outline" size={21} color="#FFFFFF" />
    <Text style={styles.openButtonText}>Preview box</Text>
  </Pressable>

  {opened && (
    <View style={styles.result}>
      <Ionicons name="sparkles" size={25} color="#E5A52E" />
      <Text style={styles.resultTitle}>Preview completed</Text>
      <Text style={styles.resultText}>
        The real mystery box prize system will be activated after secure wallet and prize controls are ready.
      </Text>
    </View>
  )}
</ScrollView>

);
}

const createStyles = (theme: any) => StyleSheet.create({
screen: {
flex: 1,
backgroundColor: theme.background,
},
content: {
padding: 20,
paddingBottom: 45,
},
back: {
flexDirection: 'row',
alignItems: 'center',
gap: 9,
marginBottom: 25,
},
backText: {
color: theme.text,
fontSize: 15,
fontWeight: '600',
},
header: {
marginBottom: 20,
},
eyebrow: {
color: theme.cyan,
fontWeight: '800',
fontSize: 12,
letterSpacing: 2,
},
title: {
color: theme.text,
fontSize: 29,
fontWeight: '900',
marginTop: 7,
},
subtitle: {
color: theme.muted,
fontSize: 14,
marginTop: 7,
lineHeight: 21,
},
notice: {
flexDirection: 'row',
alignItems: 'center',
gap: 10,
padding: 14,
borderRadius: 14,
backgroundColor: theme.card,
marginBottom: 22,
},
noticeText: {
color: theme.text,
flex: 1,
fontSize: 13,
lineHeight: 19,
},
boxDisplay: {
alignItems: 'center',
justifyContent: 'center',
padding: 30,
borderRadius: 22,
backgroundColor: theme.card,
marginBottom: 27,
},
boxName: {
color: theme.text,
fontSize: 22,
fontWeight: '800',
marginTop: 14,
},
boxCost: {
color: theme.cyan,
fontSize: 18,
fontWeight: '800',
marginTop: 7,
},
boxHint: {
color: theme.muted,
fontSize: 12,
marginTop: 6,
},
sectionTitle: {
color: theme.text,
fontSize: 19,
fontWeight: '800',
marginBottom: 13,
},
option: {
flexDirection: 'row',
alignItems: 'center',
padding: 14,
borderRadius: 15,
borderWidth: 1,
borderColor: theme.border,
backgroundColor: theme.card,
marginBottom: 11,
gap: 12,
},
optionActive: {
borderColor: theme.cyan,
borderWidth: 2,
},
optionIcon: {
width: 47,
height: 47,
borderRadius: 13,
alignItems: 'center',
justifyContent: 'center',
},
optionText: {
flex: 1,
},
optionTitle: {
color: theme.text,
fontSize: 15,
fontWeight: '800',
},
optionSubtitle: {
color: theme.muted,
fontSize: 12,
marginTop: 5,
},
openButton: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 9,
backgroundColor: '#0D9488',
padding: 16,
borderRadius: 15,
marginTop: 12,
},
openButtonText: {
color: '#FFFFFF',
fontSize: 16,
fontWeight: '800',
},
result: {
alignItems: 'center',
padding: 20,
marginTop: 20,
borderRadius: 16,
backgroundColor: theme.card,
},
resultTitle: {
color: theme.text,
fontWeight: '800',
fontSize: 17,
marginTop: 9,
},
resultText: {
color: theme.muted,
textAlign: 'center',
lineHeight: 20,
marginTop: 7,
fontSize: 13,
},
});
