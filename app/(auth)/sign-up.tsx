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

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const clearMessage = () => {
    setMessage('');
    setSuccess(false);
  };

  const submit = async () => {
    if (busy) return;

    clearMessage();

    // Keep a local reference so TypeScript can safely narrow the client.
    const client = supabase;

    if (!client) {
      setMessage(
        'BRITUME cannot connect to Supabase. Please try again later.'
      );
      return;
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setMessage('Please enter your display name.');
      return;
    }

    if (cleanName.length > 60) {
      setMessage('Your display name must be 60 characters or fewer.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8 || !/[0-9]/.test(password)) {
      setMessage(
        'Use at least 8 characters and include at least one number.'
      );
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: cleanName,
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace('/(tabs)' as never);
        return;
      }

      setSuccess(true);
      setMessage(
        'Your account request was received! Check your email for a confirmation link before signing in.'
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
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
          >
            <View style={styles.cardWrapper}>
              <BlurView intensity={75} tint="light" style={styles.glass}>
                <View style={styles.card}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoLetter}>B</Text>
                  </View>

                  <Text style={styles.brand}>BRITUME</Text>
                  <Text style={styles.tagline}>
                    Vortex of Possibilities
                  </Text>

                  <Text style={styles.heading}>Create account</Text>
                  <Text style={styles.description}>
                    Become part of our growing community.
                  </Text>

                  <Text style={styles.label}>Display name</Text>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="person-outline"
                      size={21}
                      color="#66829B"
                    />
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={(value) => {
                        setName(value);
                        clearMessage();
                      }}
                      placeholder="What should we call you?"
                      placeholderTextColor="#66829B"
                      autoCapitalize="words"
                      autoComplete="name"
                      maxLength={60}
                      editable={!busy}
                      accessibilityLabel="Display name"
                    />
                  </View>

                  <Text style={styles.label}>Email address</Text>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="mail-outline"
                      size={21}
                      color="#66829B"
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(value) => {
                        setEmail(value);
                        clearMessage();
                      }}
                      placeholder="Enter your email"
                      placeholderTextColor="#66829B"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      editable={!busy}
                      accessibilityLabel="Email address"
                    />
                  </View>

                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputBox}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={21}
                      color="#66829B"
                    />
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        clearMessage();
                      }}
                      placeholder="At least 8 characters"
                      placeholderTextColor="#66829B"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="new-password"
                      editable={!busy}
                      accessibilityLabel="Password"
                    />

                    <Pressable
                      onPress={() =>
                        setShowPassword((value) => !value)
                      }
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword ? 'Hide password' : 'Show password'
                      }
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

                  <Text style={styles.hint}>
                    Use at least 8 characters and one number.
                  </Text>

                  {message ? (
                    <View
                      style={[
                        styles.message,
                        success && styles.successMessage,
                      ]}
                      accessibilityRole="alert"
                    >
                      <Text
                        style={[
                          styles.messageText,
                          success && styles.successText,
                        ]}
                      >
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
                    accessibilityLabel="Create account"
                    accessibilityState={{ disabled: busy }}
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>
                          CREATE ACCOUNT
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
                      Already a member?
                    </Text>
                    <Link
                      href="/(auth)/sign-in"
                      style={styles.link}
                    >
                      Sign in
                    </Link>
                  </View>

                  <Text style={styles.footer}>
                    Your possibilities start here.
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
    marginBottom: 22,
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
    marginBottom: 15,
  },
  label: {
    color: '#19334D',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 7,
    marginTop: 11,
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
  },
  hint: {
    color: '#66829B',
    fontSize: 10,
    marginTop: 7,
  },
  message: {
    marginTop: 13,
    padding: 11,
    borderRadius: 11,
    backgroundColor: '#FDE8E8',
  },
  successMessage: {
    backgroundColor: '#E4F8EC',
  },
  messageText: {
    color: '#B42318',
    fontSize: 12,
    lineHeight: 18,
  },
  successText: {
    color: '#167344',
  },
  mainButton: {
    minHeight: 54,
    borderRadius: 15,
    backgroundColor: '#168BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
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
    marginTop: 21,
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
    marginTop: 19,
  },
});
