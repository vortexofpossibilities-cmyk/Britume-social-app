
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { validateWalletPinFormat } from '../../lib/walletSecurity';

type Props = {
  onVerifyPin: (pin: string) => Promise<boolean>;
  onForgotPin: () => void;
};

export default function WalletPinScreen({
  onVerifyPin,
  onForgotPin,
}: Props) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (loading) return;

    setError('');

    const normalizedPin = pin.replace(/\D/g, '').slice(0, 6);

    if (!validateWalletPinFormat(normalizedPin)) {
      setError('Enter a valid 4–6 digit PIN.');
      return;
    }

    try {
      setLoading(true);

      const verified = await onVerifyPin(normalizedPin);

      if (!verified) {
        setError('PIN verification failed. Please try again.');
        setPin('');
      }
    } catch {
      setError('Wallet verification is currently unavailable.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = () => {
    if (loading) return;
    onForgotPin();
  };

  return (
    <View style={styles.container}>
      <View
        style={styles.lockCircle}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.lockIcon}>🔒</Text>
      </View>

      <Text style={styles.title}>Wallet locked</Text>

      <Text style={styles.description}>
        Enter your wallet PIN to access your BRITUME wallet.
      </Text>

      <TextInput
        style={styles.pinInput}
        value={pin}
        onChangeText={(value) => {
          setPin(value.replace(/\D/g, '').slice(0, 6));
          setError('');
        }}
        placeholder="Enter wallet PIN"
        placeholderTextColor="#999999"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        editable={!loading}
        accessibilityLabel="Wallet PIN"
        accessibilityHint="Enter your four to six digit wallet PIN."
        returnKeyType="done"
        onSubmitEditing={handleUnlock}
      />

      {!!error && (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.unlockButton,
          loading && styles.disabledButton,
        ]}
        onPress={handleUnlock}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Unlock wallet"
        accessibilityState={{ disabled: loading, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.unlockText}>Unlock wallet</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.forgotButton}
        onPress={handleForgotPin}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Forgot wallet PIN"
        accessibilityState={{ disabled: loading }}
      >
        <Text style={styles.forgotText}>Forgot PIN?</Text>
      </TouchableOpacity>

      <Text style={styles.securityNote}>
        Your wallet remains locked until your PIN is verified.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F1F3F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },
  lockIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#171717',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  pinInput: {
    width: '100%',
    maxWidth: 340,
    height: 56,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 20,
    color: '#171717',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 14,
  },
  error: {
    color: '#D32F2F',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  unlockButton: {
    width: '100%',
    maxWidth: 340,
    height: 54,
    backgroundColor: '#171717',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  unlockText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotButton: {
    padding: 16,
    marginTop: 8,
  },
  forgotText: {
    color: '#246BFD',
    fontSize: 15,
    fontWeight: '600',
  },
  securityNote: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
