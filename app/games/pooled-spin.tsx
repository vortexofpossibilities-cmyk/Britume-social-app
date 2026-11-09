
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  StatusBar,
} from 'react-native';
import { Stack, router } from 'expo-router';

const COLOUR = {
  background: '#071B16',
  card: '#102B23',
  green: '#16A36A',
  gold: '#F5C451',
  white: '#FFFFFF',
  muted: '#A8C0B5',
};

type Reward = {
  id: number;
  label: string;
  colour: string;
  amount?: number;
  type: 'coins' | 'double' | 'zero' | 'mystery';
};

const REWARDS: Reward[] = [
  { id: 1, label: '2B', amount: 2, colour: '#176B87', type: 'coins' },
  { id: 2, label: '5B', amount: 5, colour: '#8B5CF6', type: 'coins' },
  { id: 3, label: '12B', amount: 12, colour: '#B45309', type: 'coins' },
  { id: 4, label: '20B', amount: 20, colour: '#047857', type: 'coins' },
  { id: 5, label: '25B', amount: 25, colour: '#BE185D', type: 'coins' },
  { id: 6, label: '30B', amount: 30, colour: '#2563EB', type: 'coins' },
  { id: 7, label: 'DOUBLE', colour: '#A16207', type: 'double' },
  { id: 8, label: '0B', amount: 0, colour: '#475569', type: 'zero' },
  { id: 9, label: 'MYSTERY', colour: '#9333EA', type: 'mystery' },
  { id: 10, label: '15B', amount: 15, colour: '#0E7490', type: 'coins' },
  { id: 11, label: '20B', amount: 20, colour: '#C2410C', type: 'coins' },
  { id: 12, label: 'MYSTERY', colour: '#0F766E', type: 'mystery' },
];

const MAILS = [
  { id: 1, label: 'Mail 1', amount: 29 },
  { id: 2, label: 'Mail 2', amount: 38 },
  { id: 3, label: 'Mail 3', amount: 49 },
];

export default function PooledSpinScreen() {
  const rotation = useRef(new Animated.Value(0)).current;

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Reward | null>(null);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailResult, setMailResult] = useState<number | null>(null);
  const [doubleSpin, setDoubleSpin] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [spinCount, setSpinCount] = useState(0);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  const currentRotation = useRef(0);

  const rotate = rotation.interpolate({
    inputRange: [0, 100000],
    outputRange: ['0deg', '100000deg'],
  });

  const startSpin = () => {
    if (spinning) return;

    setSpinning(true);
    setResult(null);
    setMailOpen(false);
    setMailResult(null);

    // Free practice selection only.
    const selectedIndex = Math.floor(Math.random() * REWARDS.length);
    const selected = REWARDS[selectedIndex];

    const targetAngle = (360 - selectedIndex * 30) % 360;
    const previousAngle = currentRotation.current % 360;
    const extraAngle =
      (targetAngle - previousAngle + 360) % 360;

    const finalRotation =
      currentRotation.current + 1800 + extraAngle;

    Animated.timing(rotation, {
      toValue: finalRotation,
      duration: 4500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        setSpinning(false);
        return;
      }

      currentRotation.current = finalRotation % 360;
      rotation.setValue(currentRotation.current);

      setResult(selected);
      setSpinCount(count => count + 1);

      if (selected.type === 'double') {
        setDoubleSpin(true);
      }

      if (selected.type === 'mystery') {
        setMailOpen(true);
      }

      const label =
        selected.type === 'coins'
          ? `${selected.amount}B`
          : selected.label;

      setHistory(old => [label, ...old].slice(0, 8));
      setSpinning(false);
    });
  };

  const chooseMail = (amount: number) => {
    setMailResult(amount);
    setMailOpen(false);
    setHistory(old => [`Mystery Mail: ${amount}B`, ...old].slice(0, 8));
  };

  const closeAnnouncement = () => {
    setAnnouncementVisible(false);
  };

  const renderResult = () => {
    if (!result) return null;

    return (
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>YOUR RESULT</Text>

        {result.type === 'coins' && (
          <>
            <Text style={styles.resultEmoji}>🪙</Text>
            <Text style={styles.resultAmount}>{result.amount}B</Text>
            <Text style={styles.resultDescription}>
              Practice coin result
            </Text>
          </>
        )}

        {result.type === 'zero' && (
          <>
            <Text style={styles.resultEmoji}>🎯</Text>
            <Text style={styles.resultAmount}>0B</Text>
            <Text style={styles.resultDescription}>
              No coins in this practice round
            </Text>
          </>
        )}

        {result.type === 'double' && (
          <>
            <Text style={styles.resultEmoji}>🔄</Text>
            <Text style={styles.resultAmount}>DOUBLE SPIN!</Text>
            <Text style={styles.resultDescription}>
              You unlocked one extra free practice spin.
            </Text>
          </>
        )}

        {result.type === 'mystery' && (
          <>
            <Text style={styles.resultEmoji}>💌</Text>
            <Text style={styles.resultAmount}>MYSTERY MAIL</Text>
            <Text style={styles.resultDescription}>
              Choose one of the three sealed practice mails below.
            </Text>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>

          <Text style={styles.logo}>BRITUME</Text>
          <Text style={styles.subtitle}>POOLED SPIN WHEEL</Text>
        </View>

        {announcementVisible && (
          <View style={styles.announcement}>
            <Text style={styles.announcementTag}>
              🎄 SPECIAL ANNOUNCEMENT
            </Text>

            <Text style={styles.announcementTitle}>
              DECEMBER 25
            </Text>

            <Text style={styles.announcementText}>
              A special BRITUME announcement is coming!
            </Text>

            <Text style={styles.announcementNote}>
              Details of future features will be announced separately.
            </Text>

            <Pressable
              style={styles.announcementClose}
              onPress={closeAnnouncement}
            >
              <Text style={styles.announcementCloseText}>Dismiss</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🪙 BRITUME COIN WHEEL</Text>
          <Text style={styles.infoText}>
            Explore 12 colourful reward slices in free practice mode.
          </Text>
          <Text style={styles.infoSmall}>
            Practice coins have no cash value and cannot be withdrawn.
          </Text>
        </View>

        <View style={styles.wheelArea}>
          <View style={styles.pointer}>
            <Text style={styles.pointerText}>▼</Text>
          </View>

          <Animated.View
            style={[
              styles.wheel,
              { transform: [{ rotate }] },
            ]}
          >
            {REWARDS.map((reward, index) => {
              const angle = index * 30;
              const radians = (angle * Math.PI) / 180;
              const radius = 83;
              const x = 100 + Math.sin(radians) * radius - 25;
              const y = 100 - Math.cos(radians) * radius - 25;

              return (
                <View
                  key={reward.id}
                  style={[
                    styles.slice,
                    {
                      left: x,
                      top: y,
                      backgroundColor: reward.colour,
                    },
                  ]}
                >
                  <Text style={styles.sliceText}>
                    {reward.label}
                  </Text>
                </View>
              );
            })}

            <View style={styles.wheelCenter}>
              <Text style={styles.centerEmoji}>🪙</Text>
              <Text style={styles.centerText}>BRITUME</Text>
            </View>
          </Animated.View>
        </View>

        <Pressable
          style={[
            styles.spinButton,
            spinning && styles.disabledButton,
          ]}
          onPress={startSpin}
          disabled={spinning}
        >
          <Text style={styles.spinButtonText}>
            {spinning ? 'SPINNING...' : '🎡 SPIN NOW'}
          </Text>
        </Pressable>

        {doubleSpin && (
          <View style={styles.doubleCard}>
            <Text style={styles.doubleTitle}>
              🔄 FREE DOUBLE SPIN UNLOCKED
            </Text>
            <Text style={styles.infoText}>
              You have an extra practice spin available.
            </Text>
            <Pressable
              style={styles.smallButton}
              onPress={() => {
                setDoubleSpin(false);
                startSpin();
              }}
              disabled={spinning}
            >
              <Text style={styles.smallButtonText}>
                USE EXTRA SPIN
              </Text>
            </Pressable>
          </View>
        )}

        {renderResult()}

        {mailOpen && (
          <View style={styles.mailCard}>
            <Text style={styles.mailTitle}>✉️ MYSTERY MAILBOX</Text>
            <Text style={styles.infoText}>
              Choose one sealed practice mail.
            </Text>

            <View style={styles.mailRow}>
              {MAILS.map(mail => (
                <Pressable
                  key={mail.id}
                  style={styles.mail}
                  onPress={() => chooseMail(mail.amount)}
                >
                  <Text style={styles.mailEmoji}>💌</Text>
                  <Text style={styles.mailLabel}>
                    {mail.label}
                  </Text>
                  <Text style={styles.mailHidden}>SEALED</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {mailResult !== null && (
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>💌</Text>
            <Text style={styles.resultTitle}>MAIL OPENED</Text>
            <Text style={styles.resultAmount}>{mailResult}B</Text>
            <Text style={styles.resultDescription}>
              Practice coin result
            </Text>
          </View>
        )}

        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>SPIN HISTORY</Text>

          {history.length === 0 ? (
            <Text style={styles.infoText}>
              Your practice spin results will appear here.
            </Text>
          ) : (
            history.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.historyRow}>
                <Text style={styles.historyText}>
                  Spin {spinCount - index}
                </Text>
                <Text style={styles.historyReward}>{item}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            BRITUME · POOLED SPIN
          </Text>
          <Text style={styles.footerSmall}>
            Free practice experience · Non-cash rewards
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLOUR.background,
  },
  content: {
    padding: 18,
    paddingBottom: 45,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  back: {
    color: COLOUR.gold,
    fontSize: 16,
    alignSelf: 'flex-start',
    position: 'absolute',
    right: 125,
    top: 0,
    width: 80,
  },
  logo: {
    color: COLOUR.gold,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: 4,
  },
  subtitle: {
    color: COLOUR.white,
    fontSize: 12,
    letterSpacing: 3,
    marginTop: 5,
  },
  announcement: {
    backgroundColor: '#472B16',
    borderColor: COLOUR.gold,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
    alignItems: 'center',
  },
  announcementTag: {
    color: COLOUR.gold,
    fontWeight: '800',
    fontSize: 11,
  },
  announcementTitle: {
    color: COLOUR.white,
    fontSize: 30,
    fontWeight: '900',
    marginVertical: 7,
  },
  announcementText: {
    color: COLOUR.white,
    fontWeight: '700',
    textAlign: 'center',
  },
  announcementNote: {
    color: '#E7D5B5',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
  },
  announcementClose: {
    padding: 8,
    marginTop: 6,
  },
  announcementCloseText: {
    color: COLOUR.gold,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: COLOUR.card,
    padding: 17,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoTitle: {
    color: COLOUR.gold,
    fontSize: 16,
    fontWeight: '900',
  },
  infoText: {
    color: COLOUR.white,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  infoSmall: {
    color: COLOUR.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  wheelArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    paddingTop: 12,
  },
  pointer: {
    zIndex: 10,
    marginBottom: -12,
  },
  pointerText: {
    color: COLOUR.gold,
    fontSize: 34,
    fontWeight: '900',
  },
  wheel: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#203A32',
    borderWidth: 7,
    borderColor: COLOUR.gold,
    position: 'relative',
    elevation: 10,
  },
  slice: {
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  sliceText: {
    color: COLOUR.white,
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  wheelCenter: {
    position: 'absolute',
    left: 48,
    top: 48,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLOUR.background,
    borderColor: COLOUR.gold,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerEmoji: {
    fontSize: 28,
  },
  centerText: {
    color: COLOUR.gold,
    fontSize: 9,
    fontWeight: '900',
  },
  spinButton: {
    backgroundColor: COLOUR.gold,
    borderRadius: 30,
    padding: 17,
    alignItems: 'center',
    marginBottom: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  spinButtonText: {
    color: '#17231C',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: COLOUR.card,
    borderColor: COLOUR.gold,
    borderWidth: 1,
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 18,
  },
  resultTitle: {
    color: COLOUR.gold,
    fontWeight: '900',
    fontSize: 14,
  },
  resultEmoji: {
    fontSize: 42,
    marginTop: 10,
  },
  resultAmount: {
    color: COLOUR.white,
    fontSize: 29,
    fontWeight: '900',
    marginTop: 5,
  },
  resultDescription: {
    color: COLOUR.muted,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  doubleCard: {
    backgroundColor: '#473615',
    padding: 16,
    borderRadius: 16,
    marginBottom: 18,
    alignItems: 'center',
  },
  doubleTitle: {
    color: COLOUR.gold,
    fontWeight: '900',
    textAlign: 'center',
  },
  smallButton: {
    backgroundColor: COLOUR.gold,
    padding: 12,
    borderRadius: 22,
    marginTop: 13,
  },
  smallButtonText: {
    color: '#17231C',
    fontWeight: '900',
  },
  mailCard: {
    backgroundColor: COLOUR.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  mailTitle: {
    color: COLOUR.gold,
    fontWeight: '900',
    textAlign: 'center',
    fontSize: 17,
  },
  mailRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
  },
  mail: {
    flex: 1,
    backgroundColor: '#243C34',
    borderRadius: 13,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLOUR.gold,
  },
  mailEmoji: {
    fontSize: 30,
  },
  mailLabel: {
    color: COLOUR.white,
    fontWeight: '800',
    fontSize: 11,
    marginTop: 7,
  },
  mailHidden: {
    color: COLOUR.gold,
    fontSize: 9,
    marginTop: 5,
  },
  historyCard: {
    backgroundColor: COLOUR.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 5,
  },
  sectionTitle: {
    color: COLOUR.gold,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#28443A',
  },
  historyText: {
    color: COLOUR.muted,
    fontSize: 12,
  },
  historyReward: {
    color: COLOUR.white,
    fontWeight: '800',
  },
  footer: {
    alignItems: 'center',
    marginTop: 25,
  },
  footerText: {
    color: COLOUR.gold,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footerSmall: {
    color: COLOUR.muted,
    fontSize: 10,
    marginTop: 6,
  },
});
