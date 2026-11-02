import React, { useMemo, useRef, useState } from 'react';
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
import { useAppTheme } from '../src/contexts/ThemeContext';
import { askBritumeAI } from '../src/lib/britumeAI';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export default function BritumeAIScreen() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const scrollRef = useRef<ScrollView>(null);

  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (value: string) => {
    const message = value.trim();

    if (!message || loading) return;

    setQuestion('');
    setReply('');

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: message,
    };

    setMessages((previous) => [...previous, userMessage]);
    setLoading(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await askBritumeAI(message);

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content:
          typeof response === 'string'
            ? response
            : String(response ?? 'I could not generate a response. Please try again.'),
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content:
          'Sorry, I could not connect right now. Please check your connection and try again.',
      };

      setMessages((previous) => [...previous, errorMessage]);
    } finally {
      setLoading(false);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const clearConversation = () => {
    if (messages.length === 0) return;

    Alert.alert(
      'Clear conversation',
      'Are you sure you want to delete this conversation?',
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={23} color={theme.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>B</Text>
          </View>

          <View>
            <Text style={styles.headerTitle}>BRITUME AI</Text>
            <Text style={styles.headerSubtitle}>Vortex Intelligence</Text>
          </View>
        </View>

        {messages.length > 0 ? (
          <Pressable
            style={styles.headerButton}
            onPress={clearConversation}
          >
            <Ionicons
              name="trash-outline"
              size={21}
              color={theme.text}
            />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      {/* Conversation */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome */}
        <View style={styles.welcome}>
          <View style={styles.welcomeOrb}>
            <Text style={styles.welcomeOrbText}>B</Text>
            <View style={styles.orbSparkle}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </View>
          </View>

          <Text style={styles.welcomeTitle}>
            Hey! I'm Brilliant T. Mere.
          </Text>

          <Text style={styles.welcomeDescription}>
            Welcome to BRITUME AI. Ask me anything and let's explore
            possibilities together.
          </Text>
        </View>

        {/* Main question input */}
        {messages.length === 0 && (
          <View style={styles.questionCard}>
            <Text style={styles.questionTitle}>
              How can I help you?
            </Text>

            <TextInput
              style={styles.questionInput}
              placeholder="Type your question here..."
              placeholderTextColor={theme.muted}
              value={question}
              onChangeText={setQuestion}
              multiline
              textAlignVertical="top"
              editable={!loading}
            />

            <Pressable
              style={[
                styles.askButton,
                (!question.trim() || loading) && styles.disabledButton,
              ]}
              onPress={() => sendMessage(question)}
              disabled={!question.trim() || loading}
            >
              <Text style={styles.askButtonText}>Ask BRITUME AI</Text>
              <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.role === 'user'
                ? styles.userMessageRow
                : styles.assistantMessageRow,
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.smallLogo}>
                <Text style={styles.smallLogoText}>B</Text>
              </View>
            )}

            <View
              style={[
                styles.messageBubble,
                message.role === 'user'
                  ? styles.userBubble
                  : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user'
                    ? styles.userMessageText
                    : styles.assistantMessageText,
                ]}
              >
                {message.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingRow}>
            <View style={styles.smallLogo}>
              <Text style={styles.smallLogoText}>B</Text>
            </View>

            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={theme.cyan} />
              <Text style={styles.loadingText}>BRITUME AI is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom composer */}
      <View style={styles.composerArea}>
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="Message BRITUME AI..."
            placeholderTextColor={theme.muted}
            value={reply}
            onChangeText={setReply}
            multiline
            editable={!loading}
          />

          <Pressable
            style={[
              styles.sendButton,
              (!reply.trim() || loading) && styles.disabledButton,
            ]}
            onPress={() => sendMessage(reply)}
            disabled={!reply.trim() || loading}
          >
            <Ionicons name="send" size={19} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          BRITUME • Vortex of Possibilities
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    header: {
      minHeight: 76,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },

    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    logo: {
      width: 43,
      height: 43,
      borderRadius: 15,
      backgroundColor: theme.cyan,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },

    logoText: {
      fontSize: 25,
      fontWeight: '900',
      color: '#FFFFFF',
    },

    headerTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 1,
    },

    headerSubtitle: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 3,
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      padding: 18,
      paddingBottom: 25,
      flexGrow: 1,
    },

    welcome: {
      alignItems: 'center',
      paddingTop: 24,
      paddingBottom: 25,
    },

    welcomeOrb: {
      width: 92,
      height: 92,
      borderRadius: 32,
      backgroundColor: theme.cyan,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      elevation: 8,
      shadowColor: theme.shadow,
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
    },

    welcomeOrbText: {
      color: '#FFFFFF',
      fontSize: 55,
      fontWeight: '900',
    },

    orbSparkle: {
      position: 'absolute',
      right: -5,
      top: -5,
      width: 31,
      height: 31,
      borderRadius: 12,
      backgroundColor: theme.purple,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.bg,
    },

    welcomeTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.text,
      textAlign: 'center',
    },

    welcomeDescription: {
      fontSize: 13,
      lineHeight: 21,
      color: theme.muted,
      textAlign: 'center',
      marginTop: 9,
      maxWidth: 300,
    },

    questionCard: {
      backgroundColor: theme.panel,
      borderRadius: 25,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 5,
      shadowColor: theme.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 5 },
    },

    questionTitle: {
      fontSize: 17,
      fontWeight: '900',
      color: theme.text,
      marginBottom: 13,
    },

    questionInput: {
      minHeight: 110,
      backgroundColor: theme.panel2,
      borderRadius: 17,
      padding: 14,
      color: theme.text,
      fontSize: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },

    askButton: {
      minHeight: 49,
      borderRadius: 16,
      backgroundColor: theme.cyan,
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      elevation: 3,
    },

    askButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '900',
    },

    disabledButton: {
      opacity: 0.45,
    },

    messageRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 17,
      gap: 9,
    },

    userMessageRow: {
      justifyContent: 'flex-end',
    },

    assistantMessageRow: {
      justifyContent: 'flex-start',
    },

    smallLogo: {
      width: 31,
      height: 31,
      borderRadius: 11,
      backgroundColor: theme.cyan,
      alignItems: 'center',
      justifyContent: 'center',
    },

    smallLogoText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 18,
    },

    messageBubble: {
      maxWidth: '82%',
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderRadius: 19,
      borderWidth: 1,
    },

    userBubble: {
      backgroundColor: theme.cyan,
      borderColor: theme.cyan,
      borderBottomRightRadius: 5,
    },

    assistantBubble: {
      backgroundColor: theme.panel,
      borderColor: theme.border,
      borderBottomLeftRadius: 5,
    },

    messageText: {
      fontSize: 14,
      lineHeight: 21,
    },

    userMessageText: {
      color: '#FFFFFF',
    },

    assistantMessageText: {
      color: theme.text,
    },

    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 15,
    },

    loadingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.panel,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 15,
      paddingVertical: 12,
    },

    loadingText: {
      color: theme.muted,
      fontSize: 12,
    },

    composerArea: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 20 : 12,
      backgroundColor: theme.bg,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },

    composer: {
      minHeight: 54,
      backgroundColor: theme.panel,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 15,
      paddingRight: 7,
      elevation: 4,
      shadowColor: theme.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },

    composerInput: {
      flex: 1,
      minHeight: 43,
      maxHeight: 100,
      paddingVertical: 10,
      color: theme.text,
      fontSize: 14,
    },

    sendButton: {
      width: 42,
      height: 42,
      borderRadius: 15,
      backgroundColor: theme.cyan,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },

    footerText: {
      color: theme.muted,
      fontSize: 10,
      textAlign: 'center',
      marginTop: 9,
      letterSpacing: 0.5,
    },
  });
      }
