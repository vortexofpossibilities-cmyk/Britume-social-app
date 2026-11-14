import React, { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';

import { supabase } from '../../src/lib/supabase';

import { withThemeBackground } from '../../src/components/ThemeScreen';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (busy) return;

    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setMessage('Please enter your email and password.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    const client = supabase;

    if (!client) {
      setMessage(
        'BRITUME cannot connect to Supabase. Please try again later.',
      );
      return;
    }

    setBusy(true);

    try {
      const { error } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace('/(tabs)' as never);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/splash.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.cardWrapper}>
              <BlurView
                intensity={75}
                tint="light"
                style={styles.glass}
              >
                <View style={styles.card}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoLetter}>B</Text>
                  </View>

                  <Text style={styles.brand}>BRITUME</Text>

                  <Text style={styles.tagline}>
                    Vortex of Possibilities
                  </Text>

                  <Text style={styles.heading}>
                    Welcome back
                  </Text>

                  <Text style={styles.description}>
                    Sign in and continue your journey.
                  </Text>

                  <Text style={styles.label}>
                    Email address
                  </Text>

                  <View style={styles.inputBox}>
                    <Ionicons
                      name="mail-outline"
                      size={21}
                      color="#66829B"
                    />

                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={value => {
                        setEmail(value);
                        setMessage('');
                      }}
                      placeholder="Enter your email"
                      placeholderTextColor="#66829B"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      editable={!busy}
                      returnKeyType="next"
                    />
                  </View>

                  <Text style={styles.label}>
                    Password
                  </Text>

                  <View style={styles.inputBox}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={21}
                      color="#66829B"
                    />

                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={value => {
                        setPassword(value);
                        setMessage('');
                      }}
                      placeholder="Enter your password"
                      placeholderTextColor="#66829B"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="current-password"
                      textContentType="password"
                      editable={!busy}
                      returnKeyType="go"
                      onSubmitEditing={submit}
                    />

                    <Pressable
                      onPress={() =>
                        setShowPassword(value => !value)
                      }
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      accessibilityState={{
                        disabled: busy,
                      }}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={
                          showPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={23}
                        color="#168BFF"
                      />
                    </Pressable>
                  </View>

                  {message ? (
                    <View
                      style={styles.message}
                      accessibilityRole="alert"
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color="#B42318"
                      />

                      <Text style={styles.messageText}>
                        {message}
                      </Text>
                    </View>
                  ) : null}

                  <Pressable
                    style={[
                      styles.mainButton,
                      busy && styles.disabled,
                    ]}
                    onPress={submit}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel="Sign in to BRITUME"
                    accessibilityState={{
                      disabled: busy,
                      busy,
                    }}
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>
                          SIGN IN
                        </Text>

                        <Ionicons
                          name="arrow-forward"
                          size={20}
                          color="#FFFFFF"
                        />
                      </>
                    )}
                  </Pressable>

                  <View style={styles.bottomRow}>
                    <Text style={styles.bottomText}>
                      New to BRITUME?
                    </Text>

                    <Link
                      href="/(auth)/sign-up"
                      style={styles.link}
                    >
                      Create account
                    </Link>
                  </View>

                  <Text style={styles.footer}>
                    A world of possibilities begins here.
                  </Text>
                </View>
              </BlurView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 45, 0.30)',
  },

  keyboard: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  cardWrapper: {
    width: '100%',
    maxWidth: 430,
    borderRadius: 28,
    overflow: 'hidden',
  },

  glass: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },

  card: {
    padding: 28,
    backgroundColor: 'rgba(242,248,255,0.76)',
    alignItems: 'stretch',
  },

  logoCircle: {
    width: 55,
    height: 55,
    borderRadius: 19,
    backgroundColor: '#168BFF',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  logoLetter: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
  },

  brand: {
    color: '#168BFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 6,
    textAlign: 'center',
  },

  tagline: {
    color: '#526D87',
    textAlign: 'center',
    fontSize: 11,
    marginTop: 3,
    marginBottom: 25,
  },

  heading: {
    color: '#19334D',
    fontSize: 27,
    fontWeight: '900',
    textAlign: 'center',
  },

  description: {
    color: '#526D87',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 23,
  },

  label: {
    color: '#19334D',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 7,
    marginTop: 12,
  },

  inputBox: {
    minHeight: 53,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(102,130,155,0.35)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 10,
  },

  input: {
    flex: 1,
    color: '#19334D',
    fontSize: 14,
    paddingVertical: 13,
    minWidth: 0,
  },

  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    padding: 11,
    borderRadius: 11,
    backgroundColor: '#FDE8E8',
  },

  messageText: {
    flex: 1,
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
  },

  mainButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: '#168BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 23,
    elevation: 4,
  },

  disabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 23,
  },

  bottomText: {
    color: '#526D87',
    fontSize: 12,
  },

  link: {
    color: '#0879E8',
    fontSize: 12,
    fontWeight: '900',
  },

  footer: {
    color: '#66829B',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 22,
  },
});

export default withThemeBackground(SignIn);
