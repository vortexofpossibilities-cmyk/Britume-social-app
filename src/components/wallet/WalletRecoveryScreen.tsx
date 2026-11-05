import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  onSubmitRequest: (reason: string) => Promise<boolean>;
  onBack: () => void;
};

export default function WalletRecoveryScreen({
  onSubmitRequest,
  onBack,
}: Props) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError("");

    try {
      setLoading(true);

      const success = await onSubmitRequest(reason.trim());

      if (success) {
        setSubmitted(true);
      } else {
        setError("Your request could not be submitted. Please try again.");
      }
    } catch {
      setError("Recovery service is currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>✓</Text>

        <Text style={styles.title}>Request submitted</Text>

        <Text style={styles.description}>
          Your wallet recovery request has been submitted for review.
        </Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Security review</Text>
          <Text style={styles.noticeText}>
            A 24-hour review period applies. Branch staff may verify your
            identity, but only the owner or an authorized administrator
            can approve or reject your request.
          </Text>
          <Text style={styles.noticeText}>
            Your wallet remains locked until approval. Approval is not
            automatic when the 24-hour period ends.
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Back to wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🛡️</Text>

      <Text style={styles.title}>Recover wallet PIN</Text>

      <Text style={styles.description}>
        If you have forgotten your PIN, you can request a secure identity
        verification and recovery review.
      </Text>

      <Text style={styles.label}>Reason for recovery</Text>

      <TextInput
        style={styles.textArea}
        value={reason}
        onChangeText={setReason}
        placeholder="Explain why you need to reset your wallet PIN..."
        placeholderTextColor="#999"
        multiline
        textAlignVertical="top"
        maxLength={500}
        editable={!loading}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Important</Text>
        <Text style={styles.noticeText}>
          Identity verification is required. Branch employees can verify
          your identity but cannot approve the reset.
        </Text>
        <Text style={styles.noticeText}>
          An authorized administrator must review the request. The wallet
          stays locked while the request is pending.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>
            Submit recovery request
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        disabled={loading}
      >
        <Text style={styles.backText}>Go back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    padding: 24,
  },
  icon: {
    fontSize: 44,
    textAlign: "center",
    marginBottom: 18,
  },
  successIcon: {
    fontSize: 58,
    fontWeight: "800",
    color: "#168447",
    textAlign: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#171717",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },
  textArea: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#171717",
    marginBottom: 16,
  },
  notice: {
    backgroundColor: "#F3F5F7",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  noticeTitle: {
    color: "#171717",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 8,
  },
  noticeText: {
    color: "#555555",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  error: {
    color: "#D32F2F",
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    height: 54,
    backgroundColor: "#171717",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
  },
  backText: {
    color: "#246BFD",
    fontSize: 15,
    fontWeight: "600",
  },
});
