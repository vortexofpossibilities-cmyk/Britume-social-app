
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { askBritumeAI } from '../src/lib/britumeAI';

const C = {
  background: '#070B1B',
  background2: '#0B1430',
  panel: '#111C38',
  panel2: '#182747',
  blue: '#168BFF',
  blueLight: '#45B5FF',
  purple: '#895CFF',
  purpleLight: '#B18BFF',
  gold: '#FFD447',
  goldDark: '#DCA923',
  text: '#F6F8FF',
  muted: '#A9B4CC',
  border: '#29385E',
  userBubble: '#153D70',
  assistantBubble: '#172342',
  danger: '#FF626F',
};

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
    const message = (
      customMessage ?? (reply.trim() || question.trim())
    ).trim();

    if (!message) {
      Alert.alert('Write a message', 'Type what you would like help with first.');
      return;
    }

    if (loading) return;

    setMessages(previous => [
      ...previous,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        content: message,
      },
    ]);

    setReply('');
    setQuestion('');
    setLoading(true);

    try {
      // Keep the existing Supabase Edge Function connection.
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
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={21} color={C.text} />
          </Pressable>

          <View style={styles.headerBrand}>
            <Text style={styles.headerTitle}>BRITUME AI</Text>
            <Text style={styles.headerSubtitle}>VORTEX INTELLIGENCE</Text>
          </View>

          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>AI</Text>
          </View>
        </View>

        {/* AI introduction */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>YOUR CREATIVE PARTNER</Text>
              <Text style={styles.heroTitle}>
                Hey! I'm Brilliant T. Mere.
              </Text>
              <Text style={styles.heroSubtitle}>
                Think bigger. Create more. Discover possibilities.
              </Text>
            </View>

            <View style={styles.miniOrb}>
              <Text style={styles.miniOrbB}>B</Text>
              <View style={styles.miniOrbDot} />
            </View>
          </View>

          <View style={styles.heroQuestion}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder="How can I help you?"
              placeholderTextColor={C.muted}
              style={styles.heroInput}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
              editable={!loading}
            />

            <Pressable
              onPress={() => sendMessage()}
              disabled={loading}
              style={styles.heroSend}
            >
              <Ionicons name="send" size={18} color={C.background} />
            </Pressable>
          </View>
        </View>

        {/* Conversation */}
        {messages.length > 0 && (
          <View style={styles.conversation}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Your conversation</Text>
                <Text style={styles.sectionSubtitle}>
                  Your AI discussion
                </Text>
              </View>

              <Pressable
                onPress={clearConversation}
                style={styles.clearButton}
              >
                <Ionicons name="trash-outline" size={15} color={C.gold} />
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
                    : styles.assistantBubble,
                ]}
              >
                <View style={styles.messageHeading}>
                  <View
                    style={[
                      styles.messageAvatar,
                      item.role === 'user'
                        ? styles.userAvatar
                        : styles.aiAvatar,
                    ]}
                  >
                    {item.role === 'user' ? (
                      <Ionicons
                        name="person"
                        size={13}
                        color={C.text}
                      />
                    ) : (
                      <Text style={styles.messageB}>B</Text>
                    )}
                  </View>

                  <Text style={styles.messageRole}>
                    {item.role === 'user' ? 'YOU' : 'BRITUME AI'}
                  </Text>
                </View>

                <Text style={styles.messageText}>{item.content}</Text>
              </View>
            ))}

            {loading && (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={C.blueLight} />
                <Text style={styles.loadingText}>
                  BRITUME AI is thinking...
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Suggestions */}
        <View style={styles.suggestions}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Explore possibilities</Text>
              <Text style={styles.sectionSubtitle}>
                Choose something to get started
              </Text>
            </View>
            <Ionicons name="sparkles" size={23} color={C.gold} />
          </View>

          {chipRows.map((row, index) => (
            <View key={index} style={styles.chipRow}>
              {row.map(chip => (
                <Pressable
                  key={chip.label}
                  disabled={loading}
                  onPress={() =>
                    sendMessage(
                      `Help me with ${chip.label}. Give me a useful starting point and guide me step by step.`,
                    )
                  }
                  style={styles.chip}
                >
                  <Ionicons
                    name={chip.icon}
                    size={17}
                    color={index === 1 ? C.purpleLight : C.blueLight}
                  />
                  <Text style={styles.chipText} numberOfLines={1}>
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {/* AI energy centre */}
        <View style={styles.energySection}>
          <Text style={styles.energyEyebrow}>MEET YOUR AI ASSISTANT</Text>

          <Pressable
            onPress={() => showComingSoon('Voice talk')}
            style={styles.orbArea}
          >
            <View style={styles.orbOuter}>
              <View style={styles.orbMiddle}>
                <View style={styles.orbInner}>
                  <Text style={styles.crown}>♛</Text>
                  <Text style={styles.orbB}>B</Text>
                  <Text style={styles.orbName}>BRITUME</Text>
                </View>
              </View>
            </View>
          </Pressable>

          <Text style={styles.voiceTitle}>Voice talk</Text>
          <Text style={styles.voiceSubtitle}>
            A new way to connect with Brilliant
          </Text>

          <Pressable
            onPress={() => showComingSoon('Voice talk')}
            style={styles.voiceButton}
          >
            <Ionicons name="mic" size={18} color={C.background} />
            <Text style={styles.voiceButtonText}>START VOICE TALK</Text>
            <Ionicons name="sparkles" size={17} color={C.background} />
          </Pressable>
        </View>

        {/* Extra tools */}
        <View style={styles.toolsSection}>
          <Text style={styles.sectionTitle}>More possibilities</Text>

          <View style={styles.toolRow}>
            <Pressable
              onPress={() => showComingSoon('AI history')}
              style={styles.toolCard}
            >
              <View style={styles.toolIconBlue}>
                <Ionicons name="time-outline" size={22} color={C.blueLight} />
              </View>
              <Text style={styles.toolTitle}>AI history</Text>
              <Text style={styles.toolSubtitle}>Past conversations</Text>
            </Pressable>

            <Pressable
              onPress={() => showComingSoon('Video call')}
              style={styles.toolCard}
            >
              <View style={styles.toolIconPurple}>
                <Ionicons
                  name="videocam-outline"
                  size={22}
                  color={C.purpleLight}
                />
              </View>
              <Text style={styles.toolTitle}>Video call</Text>
              <Text style={styles.toolSubtitle}>Meet your AI</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() =>
              sendMessage('Help me research a topic and explain your findings.')
            }
            style={styles.researchCard}
          >
            <View style={styles.researchIcon}>
              <Ionicons name="globe-outline" size={23} color={C.gold} />
            </View>

            <View style={styles.researchCopy}>
              <Text style={styles.toolTitle}>Research and discovery</Text>
              <Text style={styles.toolSubtitle}>
                Ask BRITUME AI to help explore a topic
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={19} color={C.gold} />
          </Pressable>

          <Pressable
            onPress={() => showComingSoon('Share Screen')}
            style={styles.shareScreen}
          >
            <Ionicons name="share-outline" size={19} color={C.blueLight} />
            <Text style={styles.shareScreenText}>Share Screen</Text>
            <Ionicons name="lock-closed-outline" size={13} color={C.muted} />
          </Pressable>
        </View>

        <Text style={styles.footer}>
          BRITUME AI · VORTEX OF POSSIBILITIES
        </Text>
      </ScrollView>

      {/* Message composer */}
      <View style={styles.composer}>
        <Pressable
          onPress={() => showComingSoon('Add attachment')}
          style={styles.composerAdd}
        >
          <Ionicons name="add" size={25} color={C.blueLight} />
        </Pressable>

        <TextInput
          value={reply}
          onChangeText={setReply}
          placeholder="Message BRITUME AI..."
          placeholderTextColor={C.muted}
          style={styles.composerInput}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
          editable={!loading}
        />

        <Pressable
          onPress={() => showComingSoon('Voice message')}
          style={styles.composerMic}
        >
          <Ionicons name="mic-outline" size={21} color={C.purpleLight} />
        </Pressable>

        <Pressable
          onPress={() => sendMessage()}
          disabled={loading}
          style={[styles.composerSend, loading && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={C.background} size="small" />
          ) : (
            <Ionicons name="send" size={17} color={C.background} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 25,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  headerBrand: {
    flex: 1,
  },
  headerTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    color: C.blueLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 3,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: C.panel2,
    borderWidth: 1,
    borderColor: C.border,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.gold,
  },
  onlineText: {
    color: C.text,
    fontSize: 10,
    fontWeight: '900',
  },

  heroCard: {
    backgroundColor: C.panel,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 19,
    shadowColor: C.blue,
    shadowOpacity: 0.22,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },
  heroCopy: {
    flex: 1,
    paddingRight: 8,
  },
  eyebrow: {
    color: C.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  heroTitle: {
    color: C.text,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 26,
  },
  heroSubtitle: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  miniOrb: {
    width: 67,
    height: 67,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.blue,
    borderWidth: 2,
    borderColor: C.gold,
    shadowColor: C.purple,
    shadowOpacity: 0.8,
    shadowRadius: 13,
    elevation: 7,
  },
  miniOrbB: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
  },
  miniOrbDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.gold,
    top: 4,
    right: 4,
  },
  heroQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 13,
    paddingRight: 6,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: C.blue,
    backgroundColor: C.background2,
  },
  heroInput: {
    flex: 1,
    minHeight: 47,
    color: C.text,
    fontSize: 13,
    paddingVertical: 9,
  },
  heroSend: {
    width: 37,
    height: 37,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.gold,
  },

  conversation: {
    backgroundColor: C.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 13,
    marginBottom: 20,
    gap: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: C.muted,
    fontSize: 10,
    marginTop: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  clearText: {
    color: C.gold,
    fontSize: 11,
    fontWeight: '800',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '96%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: C.userBubble,
    borderWidth: 1,
    borderColor: C.blue,
  },
  assistantBubble: {
    alignSelf: 'stretch',
    backgroundColor: C.assistantBubble,
    borderWidth: 1,
    borderColor: C.border,
  },
  messageHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 7,
  },
  messageAvatar: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    backgroundColor: C.blue,
  },
  aiAvatar: {
    backgroundColor: C.purple,
  },
  messageB: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  messageRole: {
    color: C.gold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  messageText: {
    color: C.text,
    fontSize: 13,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 8,
  },
  loadingText: {
    color: C.blueLight,
    fontSize: 12,
  },

  suggestions: {
    marginBottom: 23,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 7,
    marginBottom: 8,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 7,
    borderRadius: 15,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipText: {
    flexShrink: 1,
    color: C.text,
    fontSize: 10,
    fontWeight: '700',
  },

  energySection: {
    alignItems: 'center',
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 25,
    padding: 19,
    marginBottom: 22,
  },
  energyEyebrow: {
    color: C.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 17,
  },
  orbArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 7,
  },
  orbOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#241A52',
    borderWidth: 2,
    borderColor: C.purple,
    shadowColor: C.purple,
    shadowOpacity: 0.9,
    shadowRadius: 27,
    elevation: 12,
  },
  orbMiddle: {
    width: 153,
    height: 153,
    borderRadius: 77,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#103B79',
    borderWidth: 3,
    borderColor: C.gold,
    shadowColor: C.blue,
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 10,
  },
  orbInner: {
    width: 125,
    height: 125,
    borderRadius: 63,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.blue,
    borderWidth: 2,
    borderColor: C.blueLight,
  },
  crown: {
    color: C.gold,
    fontSize: 23,
    marginBottom: -5,
  },
  orbB: {
    color: '#FFFFFF',
    fontSize: 67,
    fontWeight: '900',
    lineHeight: 76,
    textShadowColor: C.purple,
    textShadowRadius: 13,
  },
  orbName: {
    color: C.gold,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 2,
  },
  voiceTitle: {
    color: C.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: 13,
  },
  voiceSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 5,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.gold,
    borderRadius: 23,
    paddingHorizontal: 23,
    minHeight: 45,
    marginTop: 15,
  },
  voiceButtonText: {
    color: C.background,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  toolsSection: {
    marginBottom: 16,
  },
  toolRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  toolCard: {
    flex: 1,
    minHeight: 116,
    padding: 13,
    borderRadius: 18,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
  },
  toolIconBlue: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#102D53',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolIconPurple: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: '#2B2054',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  toolTitle: {
    color: C.text,
    fontSize: 12,
    fontWeight: '900',
  },
  toolSubtitle: {
    color: C.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  researchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 13,
    marginBottom: 10,
  },
  researchIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#3A3018',
    alignItems: 'center',
    justifyContent: 'center',
  },
  researchCopy: {
    flex: 1,
  },
  shareScreen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minHeight: 43,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.panel,
  },
  shareScreenText: {
    color: C.text,
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 10,
  },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 9,
    backgroundColor: C.background2,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  composerAdd: {
    width: 34,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 43,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: C.panel,
    borderWidth: 1,
    borderColor: C.border,
    color: C.text,
    fontSize: 12,
  },
  composerMic: {
    width: 31,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerSend: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.gold,
  },
  disabled: {
    opacity: 0.55,
  },
});
