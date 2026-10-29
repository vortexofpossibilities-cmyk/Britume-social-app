import React, { useState } from 'react';
import {
Alert,
Pressable,
ScrollView,
StyleSheet,
Text,
TextInput,
View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../src/lib/theme';

type Chip = {
label: string;
icon: React.ComponentProps<typeof Ionicons>['name'];
};

const chipRows: Chip[][] = [
[
{ label: 'Business plans', icon: 'briefcase-outline' },
{ label: 'Exam Preparation', icon: 'school-outline' },
{ label: 'Spirituality', icon: 'leaf-outline' },
],
[
{ label: 'Deep Research', icon: 'search-outline' },
{ label: 'Create videos', icon: 'videocam-outline' },
{ label: 'Create images', icon: 'image-outline' },
],
[
{ label: 'World deep Research', icon: 'globe-outline' },
{ label: 'Create write a song', icon: 'musical-notes-outline' },
],
];

export default function BritumeAIScreen() {
const [reply, setReply] = useState('');
const [question, setQuestion] = useState('');

const showComingSoon = (feature: string) => {
Alert.alert(
feature,
'This BRITUME AI action is ready for its interface. Connect the AI service to make it generate real results.',
);
};

const sendMessage = () => {
const message = reply.trim() || question.trim();

if (!message) {
  Alert.alert(
    'Write a message',
    'Type what you would like help with first.',
  );
  return;
}

Alert.alert(
  'BRITUME AI',
  'Your message is ready. Connect the secure AI service to receive a real reply.',
);
setReply('');
setQuestion('');

};

return (
<View style={styles.screen}>
<ScrollView
contentContainerStyle={styles.content}
keyboardShouldPersistTaps="handled"
showsVerticalScrollIndicator={false}
>
{/* HEADER */}
<View style={styles.header}>
<Pressable
accessibilityRole="button"
accessibilityLabel="Go back"
onPress={() => router.back()}
style={styles.backButton}
>
<Text style={styles.backGlyph}>‹</Text>
</Pressable>

      <Text style={styles.headerTitle}>Britume AI</Text>
      <Text style={styles.headerSparkle}>✨</Text>
    </View>

    {/* GREETING CARD */}
    <View style={styles.greetingCard}>
      <View style={styles.greetingTop}>
        <View style={styles.greetingBadge}>
          <Text style={styles.greetingB}>B</Text>
        </View>

        <View style={styles.greetingCopy}>
          <Text style={styles.greetingTitle}>
            Hey! I'm Brilliant T. Mere.
          </Text>
          <Text style={styles.greetingSubtitle}>
            Your creative and learning partner
          </Text>
        </View>

        <Text style={styles.smallSparkle}>✦</Text>
      </View>

      <View style={styles.questionBox}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="How can I help you?"
          placeholderTextColor={theme.muted}
          style={styles.questionInput}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send question to BRITUME AI"
          onPress={sendMessage}
          style={styles.questionSend}
        >
          <Ionicons name="send" size={17} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>

    {/* THREE ROWS OF AI SHORTCUTS */}
    <View style={styles.chipSection}>
      {chipRows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[
            styles.chipRow,
            rowIndex === 2 && styles.lastChipRow,
          ]}
        >
          {row.map((chip) => (
            <Pressable
              key={chip.label}
              accessibilityRole="button"
              onPress={() => showComingSoon(chip.label)}
              style={[
                styles.chip,
                rowIndex === 2 && styles.wideChip,
              ]}
            >
              <Ionicons
                name={chip.icon}
                size={17}
                color={theme.cyan}
              />
              <Text style={styles.chipLabel} numberOfLines={1}>
                {chip.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>

    {/* HISTORY, VOICE TALK AND ACTION CARDS */}
    <View style={styles.middleSection}>
      <View style={styles.historyPill}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View AI history"
          onPress={() => showComingSoon('AI history')}
          style={styles.historyAction}
        >
          <Ionicons
            name="time-outline"
            size={20}
            color={theme.cyan}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share AI conversation"
          onPress={() => showComingSoon('Share conversation')}
          style={styles.historyAction}
        >
          <Ionicons
            name="share-outline"
            size={20}
            color={theme.cyan}
          />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete AI history"
          onPress={() =>
            Alert.alert(
              'Delete history',
              'There is no saved AI history to delete yet.',
            )
          }
          style={styles.historyAction}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={theme.cyan}
          />
        </Pressable>

        <Text style={styles.deleteLabel}>Delete</Text>
      </View>

      <View style={styles.voiceColumn}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start voice talk"
          onPress={() => showComingSoon('Voice talk')}
          style={styles.voiceHalo}
        >
          <View style={styles.voiceCircle}>
            <Text style={styles.crown}>♛</Text>
            <Text style={styles.voiceB}>B</Text>
          </View>
        </Pressable>

        <Text style={styles.voiceTitle}>Voice talk</Text>
        <Text style={styles.voiceHint}>Talk with Brilliant</Text>
      </View>

      <View style={styles.actionCards}>
        <Pressable
          accessibilityRole="button"
          onPress={() => showComingSoon('Video call')}
          style={styles.actionCard}
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="videocam-outline"
              size={20}
              color={theme.cyan}
            />
          </View>
          <Text style={styles.actionTitle}>Video call</Text>
          <Text style={styles.actionArrow}>→</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            showComingSoon('Note reply and web search')
          }
          style={styles.actionCard}
        >
          <View style={styles.actionIcon}>
            <Ionicons
              name="search-outline"
              size={20}
              color={theme.cyan}
            />
          </View>
          <Text style={styles.actionTitle}>
            Note reply and web search
          </Text>
          <Text style={styles.actionArrow}>→</Text>
        </Pressable>
      </View>
    </View>

    {/* SHARE SCREEN */}
    <Pressable
      accessibilityRole="button"
      onPress={() => showComingSoon('Share Screen')}
      style={styles.shareScreenButton}
    >
      <Ionicons
        name="share-outline"
        size={18}
        color={theme.cyan}
      />
      <Text style={styles.shareScreenText}>Share Screen</Text>
    </Pressable>

    <View style={styles.note}>
      <Text style={styles.noteText}>
        Ask, learn, research, and create — all in one place.
      </Text>
    </View>
  </ScrollView>

  {/* FIXED REPLY BAR */}
  <View style={styles.composer}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add attachment"
      onPress={() => showComingSoon('Add attachment')}
      style={styles.addButton}
    >
      <Ionicons name="add" size={24} color={theme.cyan} />
    </Pressable>

    <TextInput
      value={reply}
      onChangeText={setReply}
      placeholder="Reply to me"
      placeholderTextColor={theme.muted}
      style={styles.replyInput}
      returnKeyType="send"
      onSubmitEditing={sendMessage}
    />

    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voice message"
      onPress={() => showComingSoon('Voice message')}
      style={styles.composerIcon}
    >
      <Ionicons
        name="mic-outline"
        size={21}
        color={theme.muted}
      />
    </Pressable>

    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Send message"
      onPress={sendMessage}
      style={styles.sendButton}
    >
      <Ionicons name="send" size={17} color="#FFFFFF" />
    </Pressable>

    <Pressable
      accessibilityRole="button"
      accessibilityLabel="More AI options"
      onPress={() =>
        Alert.alert('More options', 'Choose an AI option.', [
          {
            text: 'Clear message',
            onPress: () => setReply(''),
          },
          { text: 'Cancel', style: 'cancel' },
        ])
      }
      style={styles.moreButton}
    >
      <Text style={styles.moreGlyph}>•••</Text>
    </Pressable>
  </View>
</View>

);
}

const styles = StyleSheet.create({
screen: {
flex: 1,
backgroundColor: theme.bg,
},
content: {
paddingHorizontal: 14,
paddingTop: 12,
paddingBottom: 18,
},
header: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 14,
},
backButton: {
width: 34,
height: 34,
borderRadius: 17,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
marginRight: 9,
},
backGlyph: {
color: theme.text,
fontSize: 30,
lineHeight: 32,
marginTop: -3,
},
headerTitle: {
color: theme.text,
fontSize: 23,
fontWeight: '900',
flex: 1,
},
headerSparkle: {
fontSize: 25,
},
greetingCard: {
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.cyan,
borderRadius: 22,
padding: 14,
marginBottom: 15,
shadowColor: theme.cyan,
shadowOpacity: 0.16,
shadowRadius: 12,
shadowOffset: { width: 0, height: 4 },
elevation: 3,
},
greetingTop: {
flexDirection: 'row',
alignItems: 'center',
marginBottom: 13,
},
greetingBadge: {
width: 42,
height: 42,
borderRadius: 15,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: theme.panel2,
marginRight: 10,
},
greetingB: {
color: theme.cyan,
fontSize: 25,
fontWeight: '900',
},
greetingCopy: {
flex: 1,
},
greetingTitle: {
color: theme.text,
fontSize: 15,
fontWeight: '900',
},
greetingSubtitle: {
color: theme.muted,
fontSize: 11,
marginTop: 3,
},
smallSparkle: {
color: theme.cyan,
fontSize: 21,
marginLeft: 5,
},
questionBox: {
flexDirection: 'row',
alignItems: 'center',
borderWidth: 1.5,
borderColor: theme.cyan,
borderRadius: 16,
backgroundColor: theme.bg,
paddingLeft: 12,
paddingRight: 5,
shadowColor: theme.cyan,
shadowOpacity: 0.12,
shadowRadius: 6,
shadowOffset: { width: 0, height: 0 },
},
questionInput: {
flex: 1,
color: theme.text,
minHeight: 44,
paddingVertical: 9,
fontSize: 13,
},
questionSend: {
width: 33,
height: 33,
borderRadius: 12,
backgroundColor: theme.cyan,
alignItems: 'center',
justifyContent: 'center',
},
chipSection: {
gap: 9,
marginBottom: 19,
},
chipRow: {
flexDirection: 'row',
gap: 7,
},
lastChipRow: {
justifyContent: 'space-between',
},
chip: {
flex: 1,
minWidth: 0,
minHeight: 43,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 5,
paddingHorizontal: 7,
paddingVertical: 8,
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
borderRadius: 22,
shadowColor: '#19334D',
shadowOpacity: 0.05,
shadowRadius: 5,
shadowOffset: { width: 0, height: 2 },
elevation: 1,
},
wideChip: {
flex: 1,
paddingHorizontal: 9,
},
chipLabel: {
flexShrink: 1,
color: theme.text,
fontSize: 10,
fontWeight: '700',
},
middleSection: {
flexDirection: 'row',
alignItems: 'center',
gap: 8,
marginBottom: 17,
},
historyPill: {
width: 42,
minHeight: 155,
paddingVertical: 9,
borderRadius: 23,
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
alignItems: 'center',
justifyContent: 'space-around',
shadowColor: '#19334D',
shadowOpacity: 0.06,
shadowRadius: 6,
shadowOffset: { width: 0, height: 2 },
elevation: 2,
},
historyAction: {
width: 34,
height: 31,
alignItems: 'center',
justifyContent: 'center',
},
deleteLabel: {
color: theme.muted,
fontSize: 8,
fontWeight: '700',
marginTop: -1,
},
voiceColumn: {
flex: 1.1,
minWidth: 0,
alignItems: 'center',
justifyContent: 'center',
},
voiceHalo: {
width: 112,
height: 112,
borderRadius: 56,
alignItems: 'center',
justifyContent: 'center',
backgroundColor: '#D8ECFF',
borderWidth: 1,
borderColor: '#B5D9FF',
shadowColor: theme.cyan,
shadowOpacity: 0.4,
shadowRadius: 15,
shadowOffset: { width: 0, height: 0 },
elevation: 7,
},
voiceCircle: {
width: 91,
height: 91,
borderRadius: 46,
backgroundColor: theme.cyan,
alignItems: 'center',
justifyContent: 'center',
borderWidth: 3,
borderColor: '#FFFFFF',
},
crown: {
position: 'absolute',
top: 7,
color: '#FFFFFF',
fontSize: 17,
fontWeight: '900',
},
voiceB: {
color: '#FFFFFF',
fontSize: 45,
fontWeight: '900',
marginTop: 13,
},
voiceTitle: {
color: theme.text,
fontSize: 14,
fontWeight: '900',
marginTop: 10,
},
voiceHint: {
color: theme.muted,
fontSize: 9,
marginTop: 3,
textAlign: 'center',
},
actionCards: {
flex: 1,
gap: 9,
minWidth: 0,
},
actionCard: {
minHeight: 72,
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
borderRadius: 17,
paddingHorizontal: 8,
paddingVertical: 9,
justifyContent: 'center',
shadowColor: '#19334D',
shadowOpacity: 0.06,
shadowRadius: 5,
shadowOffset: { width: 0, height: 2 },
elevation: 2,
},
actionIcon: {
width: 29,
height: 27,
borderRadius: 10,
backgroundColor: theme.panel2,
alignItems: 'center',
justifyContent: 'center',
marginBottom: 4,
},
actionTitle: {
color: theme.text,
fontSize: 10,
fontWeight: '800',
paddingRight: 10,
},
actionArrow: {
position: 'absolute',
right: 8,
top: 9,
color: theme.cyan,
fontSize: 17,
fontWeight: '900',
},
shareScreenButton: {
alignSelf: 'center',
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 8,
paddingHorizontal: 22,
minHeight: 42,
borderRadius: 24,
backgroundColor: theme.panel,
borderWidth: 1,
borderColor: theme.border,
shadowColor: '#19334D',
shadowOpacity: 0.06,
shadowRadius: 5,
shadowOffset: { width: 0, height: 2 },
elevation: 1,
},
shareScreenText: {
color: theme.text,
fontSize: 12,
fontWeight: '800',
},
note: {
alignItems: 'center',
marginTop: 12,
marginBottom: 4,
},
noteText: {
color: theme.muted,
fontSize: 10,
textAlign: 'center',
},
composer: {
flexDirection: 'row',
alignItems: 'center',
gap: 5,
paddingHorizontal: 9,
paddingVertical: 9,
backgroundColor: theme.panel,
borderTopWidth: 1,
borderTopColor: theme.border,
},
addButton: {
width: 34,
height: 38,
alignItems: 'center',
justifyContent: 'center',
},
replyInput: {
flex: 1,
minWidth: 0,
minHeight: 41,
paddingHorizontal: 12,
paddingVertical: 8,
backgroundColor: theme.bg,
borderWidth: 1,
borderColor: theme.border,
borderRadius: 22,
color: theme.text,
fontSize: 12,
},
composerIcon: {
width: 30,
height: 38,
alignItems: 'center',
justifyContent: 'center',
},
sendButton: {
width: 36,
height: 36,
borderRadius: 18,
backgroundColor: theme.cyan,
alignItems: 'center',
justifyContent: 'center',
},
moreButton: {
width: 28,
height: 36,
alignItems: 'center',
justifyContent: 'center',
},
moreGlyph: {
color: theme.muted,
fontSize: 15,
fontWeight: '900',
letterSpacing: 1,
},
});
