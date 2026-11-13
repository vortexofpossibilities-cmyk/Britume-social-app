
import React, { useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Stack, router } from 'expo-router';

import { AuthProvider } from '../src/auth/AuthProvider';
import { ThemeProvider, useAppTheme } from '../src/contexts/ThemeContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';

function FloatingBritumeAI() {
  const { width, height } = useWindowDimensions();

  const buttonSize = 58;
  const edgePadding = 5;

  const initialX = Math.max(edgePadding, width - buttonSize - 16);
  const initialY = Math.max(80, height - 220);

  const position = useRef(
    new Animated.ValueXY({ x: initialX, y: initialY }),
  ).current;

  const currentX = useRef(initialX);
  const currentY = useRef(initialY);
  const startX = useRef(initialX);
  const startY = useRef(initialY);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,

        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5,

        onPanResponderGrant: () => {
          startX.current = currentX.current;
          startY.current = currentY.current;
        },

        onPanResponderMove: (_, gesture) => {
          const x = Math.max(
            edgePadding,
            Math.min(
              width - buttonSize - edgePadding,
              startX.current + gesture.dx,
            ),
          );

          const y = Math.max(
            65,
            Math.min(
              height - buttonSize - 100,
              startY.current + gesture.dy,
            ),
          );

          position.setValue({ x, y });
        },

        onPanResponderRelease: (_, gesture) => {
          const proposedX = Math.max(
            edgePadding,
            Math.min(
              width - buttonSize - edgePadding,
              startX.current + gesture.dx,
            ),
          );

          const finalX =
            proposedX + buttonSize / 2 < width / 2
              ? edgePadding
              : width - buttonSize - edgePadding;

          const finalY = Math.max(
            65,
            Math.min(
              height - buttonSize - 100,
              startY.current + gesture.dy,
            ),
          );

          currentX.current = finalX;
          currentY.current = finalY;

          Animated.spring(position, {
            toValue: { x: finalX, y: finalY },
            useNativeDriver: false,
            speed: 18,
            bounciness: 5,
          }).start();
        },
      }),
    [width, height, position],
  );

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.aiPosition,
        { transform: position.getTranslateTransform() },
      ]}
    >
      <Pressable
        style={styles.aiButton}
        onPress={() => router.push('/ai')}
        accessibilityRole="button"
        accessibilityLabel="Open BRITUME AI assistant"
        hitSlop={8}
      >
        <View style={styles.eye}>
          <View style={styles.pupil} />
        </View>

        <View style={styles.eye}>
          <View style={styles.pupil} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

function RootNavigator() {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: theme.bg,
          },
        }}
      >
        <Stack.Screen
          name="theme-studio"
          options={{
            headerShown: false,
          }}
        />
      </Stack>

      <View pointerEvents="box-none" style={styles.aiOverlay}>
        <FloatingBritumeAI />
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  aiOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 20,
  },

  aiPosition: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 58,
    height: 58,
  },

  aiButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#168BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    elevation: 12,
    shadowColor: '#168BFF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.32,
    shadowRadius: 9,
  },

  eye: {
    width: 15,
    height: 21,
    borderRadius: 12,
    backgroundColor: '#168BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pupil: {
    width: 5,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
