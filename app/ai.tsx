
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { askBritumeAI } from '../src/lib/britumeAI';

type Chip = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (customMessage?: string) => {
    const message = (customMessage ?? (reply.trim() || question.trim())).trim();

    if (!message) {
      Alert.alert('Write a message', 'Type what you would like help with first.');
      return;
    }

    if (loading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: message,
    };

    setMessages(previous => [...previous, userMessage]);
    setReply('');
    setQuestion('');
    setLoading(true);

    try {
      const response = await askBritumeAI(message);

      setMessages(previous => [
        ...previous,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: response,
        },
      ]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.';

      setMessages(previous => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: `Sorry, I couldn't respond. ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const showComingSoon = (feature: string) => {
    Alert.alert(
      feature,
      'This feature will be connected in a future BRITUME update.',
    );
  };

  const clearConversation = () => {
    Alert.alert(
      'Clear conversation',
      'Do you want to clear this conversation from the screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => setMessages([]),
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Britume AI</Text>
          <Text style={styles.headerSparkle}>✨</Text>
        </View>

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
              onSubmitEditing={() => sendMessage()}
              editable={!loading}
            />
            <Pressable
              onPress={() => sendMessage()}
              disabled={loading}
              style={styles.questionSend}
            >
              <Ionicons name="send" size={17} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {messages.length > 0 && (
          <View style={styles.conversation}>
            <View style={styles.conversationHeader}>
              <Text style={styles.conversationTitle}>Conversation</Text>
              <Pressable onPress={clearConversation}>
                <Text style={styles.clearText}>Clear</Text>
              </Pressable>
            </View>

            {messages.map(item => (
              <View
                key={item.id}
                style={[
                  styles.messageBubble,
                  item.role === 'user'
                    ? styles.userBubble
                    : styles.aiBubble,
                ]}
              >
                <Text style={styles.messageRole}>
                  {item.role === 'user' ? 'You' : 'BRITUME AI'}
                </Text>
                <Text style={styles.messageText}>{item.content}</Text>
              </View>
            ))}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.cyan} />
                <Text style={styles.loadingText}>
                  BRITUME AI is thinking...
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.chipSection}>
          {chipRows.map((row, rowIndex) => (
            <View
              key={rowIndex}
              style={[
                styles.chipRow,
                rowIndex === 2 && styles.lastChipRow,
              ]}
            >
              {row.map(chip => (
                <Pressable
                  key={chip.label}
                  disabled={loading}
                  onPress={() =>
                    sendMessage(
                      `Help me with ${chip.label}. Give me a useful starting point and guide me step by step.`,
                    )
                  }
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

        <View style={styles.middleSection}>
          <View style={styles.historyPill}>
            <Pressable
              onPress={() => showComingSoon('AI history')}
              style={styles.historyAction}
            >
              <Ionicons name="time-outline" size={20} color={theme.cyan} />
            </Pressable>
            <Pressable
              onPress={() => showComingSoon('Share conversation')}
              style={styles.historyAction}
            >
              <Ionicons name="share-outline" size={20} color={theme.cyan} />
            </Pressable>
            <Pressable
              onPress={clearConversation}
              style={styles.historyAction}
            >
              <Ionicons name="trash-outline" size={20} color={theme.cyan} />
            </Pressable>
            <Text style={styles.deleteLabel}>Delete</Text>
          </View>

          <View style={styles.voiceColumn}>
            <Pressable
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
              onPress={() => showComingSoon('Video call')}
              style={styles.actionCard}
            >
              <Ionicons name="videocam-outline" size={21} color={theme.cyan} />
              <Text style={styles.actionTitle}>Video call</Text>
              <Text style={styles.actionArrow}>→</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                sendMessage('Help me research a topic and explain your findings.')
              }
              style={styles.actionCard}
            >
              <Ionicons name="search-outline" size={21} color={theme.cyan} />
              <Text style={styles.actionTitle}>Research and web search</Text>
              <Text style={styles.actionArrow}>→</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={() => showComingSoon('Share Screen')}
          style={styles.shareScreenButton}
        >
          <Ionicons name="share-outline" size={18} color={theme.cyan} />
          <Text style={styles.shareScreenText}>Share Screen</Text>
        </Pressable>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Ask, learn, research, and create — all in one place.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.composer}>
        <Pressable
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
          onSubmitEditing={() => sendMessage()}
          editable={!loading}
        />

        <Pressable
          onPress={() => showComingSoon('Voice message')}
          style={styles.composerIcon}
        >
          <Ionicons name="mic-outline" size={21} color={theme.muted} />
        </Pressable>

        <Pressable
          onPress={() => sendMessage()}
          disabled={loading}
          style={[styles.sendButton, loading && styles.disabledButton]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="send" size={17} color="#FFFFFF" />
          )}
        </Pressable>

        <Pressable
          onPress={() => setReply('')}
          style={styles.moreButton}
        >
          <Text style={styles.moreGlyph}>•••</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 18 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backButton: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.panel, borderWidth: 1,
    borderColor: theme.border, marginRight: 9,
  },
  backGlyph: { color: theme.text, fontSize: 30, lineHeight: 32, marginTop: -3 },
  headerTitle: { color: theme.text, fontSize: 23, fontWeight: '900', flex: 1 },
  headerSparkle: { fontSize: 25 },
  greetingCard: {
    backgroundColor: theme.panel, borderWidth: 1,
    borderColor: theme.cyan, borderRadius: 22,
    padding: 14, marginBottom: 15,
    shadowColor: theme.cyan, shadowOpacity: 0.16,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  greetingTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 13 },
  greetingBadge: {
    width: 42, height: 42, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.panel2, marginRight: 10,
  },
  greetingB: { color: theme.cyan, fontSize: 25, fontWeight: '900' },
  greetingCopy: { flex: 1 },
  greetingTitle: { color: theme.text, fontSize: 15, fontWeight: '900' },
  greetingSubtitle: { color: theme.muted, fontSize: 11, marginTop: 3 },
  smallSparkle: { color: theme.cyan, fontSize: 21, marginLeft: 5 },
  questionBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.cyan,
    borderRadius: 16, backgroundColor: theme.bg,
    paddingLeft: 12, paddingRight: 5,
  },
  questionInput: {
    flex: 1, color: theme.text, minHeight: 44,
    paddingVertical: 9, fontSize: 13,
  },
  questionSend: {
    width: 33, height: 33, borderRadius: 12,
    backgroundColor: theme.cyan,
    alignItems: 'center', justifyContent: 'center',
  },
  conversation: {
    backgroundColor: theme.panel, borderRadius: 18,
    borderWidth: 1, borderColor: theme.border,
    padding: 12, marginBottom: 16, gap: 10,
  },
  conversationHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationTitle: { color: theme.text, fontWeight: '900', fontSize: 15 },
  clearText: { color: theme.cyan, fontWeight: '800', fontSize: 12 },
  messageBubble: { padding: 11, borderRadius: 14 },
  userBubble: { backgroundColor: theme.panel2, alignSelf: 'flex-end', maxWidth: '90%' },
  aiBubble: { backgroundColor: theme.bg, alignSelf: 'stretch' },
  messageRole: { color: theme.cyan, fontSize: 11, fontWeight: '900', marginBottom: 5 },
  messageText: { color: theme.text, fontSize: 13, lineHeight: 20 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 7 },
  loadingText: { color: theme.muted, fontSize: 12 },
  chipSection: { gap: 9, marginBottom: 19 },
  chipRow: { flexDirection: 'row', gap: 7 },
  lastChipRow: { justifyContent: 'space-between' },
  chip: {
    flex: 1, minWidth: 0, minHeight: 43,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingHorizontal: 7, paddingVertical: 8,
    backgroundColor: theme.panel, borderWidth: 1,
    borderColor: theme.border, borderRadius: 22,
  },
  wideChip: { flex: 1, paddingHorizontal: 9 },
  chipLabel: { flexShrink: 1, color: theme.text, fontSize: 10, fontWeight: '700' },
  middleSection: {
    flexDirection: 'row', alignItems: 'center',
    gap: 8, marginBottom: 17,
  },
  historyPill: {
    width: 42, minHeight: 155, paddingVertical: 9,
    borderRadius: 23, backgroundColor: theme.panel,
    borderWidth: 1, borderColor: theme.border,
    alignItems: 'center', justifyContent: 'space-around',
  },
  historyAction: { width: 34, height: 31, alignItems: 'center', justifyContent: 'center' },
  deleteLabel: { color: theme.muted, fontSize: 8, fontWeight: '700', marginTop: -1 },
  voiceColumn: {
    flex: 1.1, minWidth: 0, alignItems: 'center', justifyContent: 'center',
  },
  voiceHalo: {
    width: 112, height: 112, borderRadius: 56,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#D8ECFF', borderWidth: 1, borderColor: '#B5D9FF',
    shadowColor: theme.cyan, shadowOpacity: 0.4,
    shadowRadius: 15, elevation: 7,
  },
  voiceCircle: {
    width: 91, height: 91, borderRadius: 46,
    backgroundColor: theme.cyan, alignItems: 'center',
    justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF',
  },
  crown: {
    position: 'absolute', top: 7, color: '#FFFFFF',
    fontSize: 17, fontWeight: '900',
  },
  voiceB: { color: '#FFFFFF', fontSize: 45, fontWeight: '900', marginTop: 13 },
  voiceTitle: { color: theme.text, fontSize: 14, fontWeight: '900', marginTop: 10 },
  voiceHint: { color: theme.muted, fontSize: 9, marginTop: 3, textAlign: 'center' },
  actionCards: { flex: 1, gap: 9, minWidth: 0 },
  actionCard: {
    minHeight: 72, backgroundColor: theme.panel,
    borderWidth: 1, borderColor: theme.border,
    borderRadius: 17, paddingHorizontal: 8,
    paddingVertical: 9, justifyContent: 'center', gap: 4,
  },
  actionTitle: { color: theme.text, fontSize: 10, fontWeight: '800', paddingRight: 10 },
  actionArrow: {
    position: 'absolute', right: 8, top: 9,
    color: theme.cyan, fontSize: 17, fontWeight: '900',
  },
  shareScreenButton: {
    alignSelf: 'center', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 22, minHeight: 42,
    borderRadius: 24, backgroundColor: theme.panel,
    borderWidth: 1, borderColor: theme.border,
  },
  shareScreenText: { color: theme.text, fontSize: 12, fontWeight: '800' },
  note: { alignItems: 'center', marginTop: 12, marginBottom: 4 },
  noteText: { color: theme.muted, fontSize: 10, textAlign: 'center' },
  composer: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 9,
    backgroundColor: theme.panel,
    borderTopWidth: 1, borderTopColor: theme.border,
  },
  addButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  replyInput: {
    flex: 1, minWidth: 0, minHeight: 41,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: theme.bg, borderWidth: 1,
    borderColor: theme.border, borderRadius: 22,
    color: theme.text, fontSize: 12,
  },
  composerIcon: { width: 30, height: 38, alignItems: 'center', justifyContent: 'center' },
  sendButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.cyan,
    alignItems: 'center', justifyContent: 'center',
  },
  disabledButton: { opacity: 0.6 },
  moreButton: { width: 28, height: 36, alignItems: 'center', justifyContent: 'center' },
  moreGlyph: { color: theme.muted, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
});
