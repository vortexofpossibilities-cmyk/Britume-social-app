
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
  onCreatePin: (pin: string) => Promise<boolean>;
  onCancel: () => void;
};

export default function WalletPinSetupScreen({
  onCreatePin,
  onCancel,
}: Props) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreatePin = async () => {
    if (loading) return;

    setError('');

    const normalizedPin = pin.replace(/\D/g, '').slice(0, 6);
    const normalizedConfirmation = confirmPin
      .replace(/\D/g, '')
      .slice(0, 6);

    if (!validateWalletPinFormat(normalizedPin)) {
      setError('Your PIN must contain 4–6 digits.');
      return;
    }

    if (normalizedPin !== normalizedConfirmation) {
      setError('The PINs do not match.');
      return;
    }

    try {
      setLoading(true);

      const success = await onCreatePin(normalizedPin);

      if (!success) {
        setError('Secure PIN setup is not available yet.');
        setPin('');
        setConfirmPin('');
      }
    } catch {
      setError('Could not create your wallet PIN. Try again.');
      setPin('');
      setConfirmPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (loading) return;

    setPin('');
    setConfirmPin('');
    setError('');
    onCancel();
  };

  return (
    <View style={styles.container}>
      <Text
        style={styles.icon}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        🔐
      </Text>

      <Text style={styles.title}>Create wallet PIN</Text>

      <Text style={styles.description}>
        Create a private 4–6 digit PIN to protect your BRITUME wallet.
        You will need it whenever you open your wallet.
      </Text>

      <Text style={styles.label}>New PIN</Text>

      <TextInput
        style={styles.input}
        value={pin}
        onChangeText={(value) => {
          setPin(value.replace(/\D/g, '').slice(0, 6));
          setError('');
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="Enter new PIN"
        placeholderTextColor="#999999"
        editable={!loading}
        accessibilityLabel="New wallet PIN"
        accessibilityHint="Enter a four to six digit PIN."
        returnKeyType="next"
      />

      <Text style={styles.label}>Confirm PIN</Text>

      <TextInput
        style={styles.input}
        value={confirmPin}
        onChangeText={(value) => {
          setConfirmPin(value.replace(/\D/g, '').slice(0, 6));
          setError('');
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
        placeholder="Confirm your PIN"
        placeholderTextColor="#999999"
        editable={!loading}
        accessibilityLabel="Confirm wallet PIN"
        accessibilityHint="Enter the same PIN again."
        returnKeyType="done"
        onSubmitEditing={handleCreatePin}
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
        style={[styles.button, loading && styles.disabled]}
        onPress={handleCreatePin}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Create secure wallet PIN"
        accessibilityState={{ disabled: loading, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Create secure PIN</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={handleCancel}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Cancel wallet PIN setup"
        accessibilityState={{ disabled: loading }}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>

      <Text style={styles.securityNote}>
        Never share your wallet PIN with anyone, including BRITUME staff.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 18,
  },
  title: {
    color: '#171717',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 26,
  },
  label: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 19,
    color: '#171717',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 18,
  },
  error: {
    color: '#D32F2F',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  button: {
    height: 54,
    backgroundColor: '#171717',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#246BFD',
    fontSize: 15,
    fontWeight: '600',
  },
  securityNote: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
});
