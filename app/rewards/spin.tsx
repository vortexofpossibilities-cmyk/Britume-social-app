import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppTheme } from '../../src/contexts/ThemeContext';

const prizes = [
  '5 pts',
  '10 pts',
  '20 pts',
  'Try Again',
  '50 pts',
  '2 pts',
  '100 pts',
  '15 pts',
];

const colors = [
  '#2563EB',
  '#7C3AED',
  '#0891B2',
  '#DC2626',
  '#16A34A',
  '#D97706',
  '#9333EA',
  '#0D9488',
];

const costs = [20, 40, 60, 100];

export default function SpinWheelScreen() {
  const { theme } = useAppTheme();

  const [selectedCost, setSelectedCost] = useState(20);
  const [spinning, setSpinning] = useState(false);
  const [previewResult, setPreviewResult] = useState<string | null>(null);

  const rotation = useRef(new Animated.Value(0)).current;

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    setPreviewResult(null);
    rotation.setValue(0);

    Animated.timing(rotation, {
      toValue: 360 * 5 + Math.floor(Math.random() * 360),
      duration: 4500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      setSpinning(false);

      if (finished) {
        const result =
          prizes[Math.floor(Math.random() * prizes.length)];

        setPreviewResult(result);

        Alert.alert(
          'Spin preview',
          `Your preview result is: ${result}\n\nNo points were charged or awarded. Secure wallet integration is still required.`,
        );
      }
    });
  };

  const spin = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={23}
            color={theme.text}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.title}>Spin Wheel</Text>
          <Text style={styles.subtitle}>
            Try your luck and win rewards
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="gift" size={23} color="#FBBF24" />
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons
          name="information-circle"
          size={20}
          color={theme.cyan}
        />
        <Text style={styles.infoText}>
          Spin preview is available. Real point deductions and prize
          payouts will be activated after secure wallet integration.
        </Text>
      </View>

      <View style={styles.wheelSection}>
        <Text style={styles.wheelHeading}>YOUR LUCKY WHEEL</Text>

        <View style={styles.wheelContainer}>
          <View style={styles.pointer}>
            <Ionicons
              name="caret-down"
              size={38}
              color="#FBBF24"
            />
          </View>

          <Animated.View
            style={[
              styles.wheel,
              { transform: [{ rotate: spin }] },
            ]}
          >
            {prizes.map((prize, index) => {
              const angle = index * 45;

              return (
                <View
                  key={`${prize}-${index}`}
                  style={[
                    styles.prizeSlot,
                    {
                      backgroundColor: colors[index],
                      transform: [
                        { rotate: `${angle}deg` },
                        { translateY: -91 },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.prizeText}>{prize}</Text>
                </View>
              );
            })}

            <View style={styles.wheelCenter}>
              <Ionicons
                name="star"
                size={29}
                color="#FBBF24"
              />
              <Text style={styles.centerText}>BRITUME</Text>
            </View>
          </Animated.View>
        </View>

        {previewResult && (
          <View style={styles.resultCard}>
            <Ionicons
              name="trophy"
              size={23}
              color="#FBBF24"
            />
            <Text style={styles.resultText}>
              Last preview: {previewResult}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.costSection}>
        <Text style={styles.sectionTitle}>
          Choose your spin level
        </Text>
        <Text style={styles.sectionSubtitle}>
          Select a spin level to preview the game.
        </Text>

        <View style={styles.costGrid}>
          {costs.map(cost => {
            const active = selectedCost === cost;

            return (
              <Pressable
                key={cost}
                onPress={() => setSelectedCost(cost)}
                style={[
                  styles.costButton,
                  active && styles.costButtonActive,
                ]}
              >
                <Ionicons
                  name="flash"
                  size={17}
                  color={active ? '#FFFFFF' : theme.cyan}
                />
                <Text
                  style={[
                    styles.costText,
                    active && styles.costTextActive,
                  ]}
                >
                  {cost} points
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={spinWheel}
        disabled={spinning}
        style={[
          styles.spinButton,
          spinning && styles.spinButtonDisabled,
        ]}
      >
        <Ionicons name="sync" size={23} color="#FFFFFF" />
        <Text style={styles.spinButtonText}>
          {spinning ? 'Spinning...' : 'SPIN PREVIEW'}
        </Text>
      </Pressable>

      <Text style={styles.footerNote}>
        Preview mode only. This screen does not charge your wallet or
        issue rewards.
      </Text>
    </ScrollView>
  );
}

function createStyles(theme: any) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    content: {
      padding: 18,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 22,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      marginLeft: 13,
    },
    title: {
      color: theme.text,
      fontSize: 23,
      fontWeight: '900',
    },
    subtitle: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 3,
    },
    headerIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: theme.panel,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.panel,
      borderRadius: 14,
      padding: 13,
      gap: 9,
      marginBottom: 25,
    },
    infoText: {
      flex: 1,
      color: theme.muted,
      fontSize: 12,
      lineHeight: 18,
    },
    wheelSection: {
      alignItems: 'center',
    },
    wheelHeading: {
      color: theme.muted,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 2,
      marginBottom: 20,
    },
    wheelContainer: {
      width: 280,
      height: 280,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pointer: {
      position: 'absolute',
      top: -9,
      zIndex: 5,
    },
    wheel: {
      width: 240,
      height: 240,
      borderRadius: 120,
      backgroundColor: theme.panel,
      borderWidth: 8,
      borderColor: '#FBBF24',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    prizeSlot: {
      position: 'absolute',
      width: 75,
      height: 30,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      left: 74,
      top: 91,
    },
    prizeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
    },
    wheelCenter: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: '#111827',
      borderWidth: 4,
      borderColor: '#FBBF24',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3,
    },
    centerText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '900',
      marginTop: 3,
    },
    resultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.panel,
      padding: 13,
      borderRadius: 13,
      marginTop: 12,
    },
    resultText: {
      color: theme.text,
      fontWeight: '800',
    },
    costSection: {
      marginTop: 25,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '900',
    },
    sectionSubtitle: {
      color: theme.muted,
      fontSize: 12,
      marginTop: 5,
      marginBottom: 14,
    },
    costGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    costButton: {
      width: '48%',
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      borderRadius: 13,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
    },
    costButtonActive: {
      backgroundColor: theme.cyan,
      borderColor: theme.cyan,
    },
    costText: {
      color: theme.text,
      fontWeight: '800',
      fontSize: 13,
    },
    costTextActive: {
      color: '#FFFFFF',
    },
    spinButton: {
      marginTop: 25,
      height: 57,
      borderRadius: 16,
      backgroundColor: '#2563EB',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    spinButtonDisabled: {
      opacity: 0.6,
    },
    spinButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 1,
    },
    footerNote: {
      color: theme.muted,
      fontSize: 11,
      textAlign: 'center',
      marginTop: 13,
      lineHeight: 17,
    },
  });
                }
