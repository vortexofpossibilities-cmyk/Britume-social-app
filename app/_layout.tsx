
import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { AuthProvider } from '../src/auth/AuthProvider';

function FloatingBritumeAI() {
  return (
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
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
          }}
        />

        <FloatingBritumeAI />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EAF4FF',
  },

  aiButton: {
    position: 'absolute',
    right: 16,
    bottom: 105,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#168BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    elevation: 12,
    shadowColor: '#168BFF',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.32,
    shadowRadius: 9,
    zIndex: 999,
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
