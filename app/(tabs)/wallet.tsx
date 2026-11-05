import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { useAuth } from "../../src/auth/AuthProvider";
import {
  fetchWalletData,
  WalletData,
} from "../../src/lib/wallet";
import { useAppTheme } from "../../src/contexts/ThemeContext";

import WalletPinScreen from "../../src/components/wallet/WalletPinScreen";
import WalletPinSetupScreen from "../../src/components/wallet/WalletPinSetupScreen";
import WalletRecoveryScreen from "../../src/components/wallet/WalletRecoveryScreen";

import {
  WalletSecurityProvider,
} from "../../src/lib/walletSecurity";

const EMPTY_WALLET: WalletData = {
  balances: {
    purchased: 0,
    earned: 0,
    promotional: 0,
  },
  transactions: [],
};

type WalletView =
  | "setup"
  | "locked"
  | "wallet"
  | "recovery";

/**
 * SECURITY PLACEHOLDER
 *
 * Real PIN creation, verification and recovery
 * must be implemented using secure Supabase RPCs.
 *
 * This placeholder deliberately refuses all requests.
 * Never replace it with local PIN storage or a
 * hardcoded successful verification.
 */
const walletSecurityProvider: WalletSecurityProvider = {
  async createPin() {
    return {
      success: false,
      message:
        "Secure PIN creation is not connected yet.",
    };
  },

  async verifyPin() {
    return {
      success: false,
      message:
        "Secure PIN verification is not connected yet.",
    };
  },

  async requestPinReset() {
    return {
      success: false,
      message:
        "Secure wallet recovery is not connected yet.",
    };
  },
};

function formatPoints(value: number) {
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  })} pts`;
}

function transactionTitle(type: string) {
  const titles: Record<string, string> = {
    transfer_sent: "Points sent",
    transfer_received: "Points received",
    transfer_fee: "Transfer fee",
    purchase: "Points purchased",
    reward: "Reward received",
    spin_cost: "Mystery Wheel spin",
    cashback: "Cashback",
  };

  return (
    titles[type] ??
    type.replace(/_/g, " ").replace(/\b\w/g, letter =>
      letter.toUpperCase()
    )
  );
}

function transactionIcon(
  type: string
): React.ComponentProps<typeof Ionicons>["name"] {
  if (
    type.includes("received") ||
    type.includes("reward")
  ) {
    return "arrow-down-circle-outline";
  }

  if (
    type.includes("fee") ||
    type.includes("sent")
  ) {
    return "arrow-up-circle-outline";
  }

  if (type.includes("spin")) {
    return "gift-outline";
  }

  return "swap-horizontal-outline";
}

export default function WalletScreen() {
  const { session } = useAuth();
  const { theme } = useAppTheme();

  const [wallet, setWallet] =
    useState<WalletData>(EMPTY_WALLET);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  /**
   * Until the server-side PIN status check is ready,
   * the wallet starts at setup and remains inaccessible.
   */
  const [walletView, setWalletView] =
    useState<WalletView>("setup");

  const styles = createStyles(theme);

  const appState = useRef<AppStateStatus>(
    AppState.currentState
  );

  const loadWallet = useCallback(async () => {
    const userId = session?.user?.id;

    if (!userId) {
      setWallet(EMPTY_WALLET);
      setError("Please sign in to view your wallet.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError("");

      const data = await fetchWalletData(userId);
      setWallet(data);
    } catch (err) {
      console.error("Wallet loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load your wallet."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  /**
   * Lock the wallet whenever this screen loses focus.
   */
  useFocusEffect(
    useCallback(() => {
      setWalletView("setup");

      return () => {
        setWalletView("locked");
      };
    }, [])
  );

  /**
   * Lock the wallet when the app goes into
   * the background or becomes inactive.
   */
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState) => {
        const previousState = appState.current;

        if (
          previousState === "active" &&
          nextState !== "active"
        ) {
          setWalletView("locked");
        }

        appState.current = nextState;
      }
    );

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadWallet();
  }, [loadWallet]);

  /**
   * First-time PIN setup.
   *
   * The server must confirm successful creation.
   * A successful setup still returns the user to
   * the locked screen so they must verify their PIN.
   */
  const handleCreatePin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!walletSecurityProvider.createPin) {
        setError(
          "Secure PIN creation is not available yet."
        );
        return false;
      }

      try {
        const result =
          await walletSecurityProvider.createPin(pin);

        if (!result.success) {
          setError(
            result.message ??
              "Could not create your wallet PIN."
          );
          return false;
        }

        setError("");
        setWalletView("locked");

        return true;
      } catch (err) {
        console.error("PIN setup error:", err);

        setError("PIN setup failed. Please try again.");
        return false;
      }
    },
    []
  );

  /**
   * Verify PIN before opening the wallet.
   */
  const handleVerifyPin = useCallback(
    async (pin: string): Promise<boolean> => {
      try {
        const result =
          await walletSecurityProvider.verifyPin(pin);

        if (!result.success) {
          setError(
            result.message ??
              "Wallet PIN verification failed."
          );
          return false;
        }

        setError("");
        setWalletView("wallet");

        await loadWallet();

        return true;
      } catch (err) {
        console.error("PIN verification error:", err);

        setError(
          "Could not verify your PIN. Please try again."
        );

        return false;
      }
    },
    [loadWallet]
  );

  /**
   * Submit forgotten PIN recovery request.
   */
  const handleRecoveryRequest = useCallback(
    async (reason: string): Promise<boolean> => {
      try {
        const result =
          await walletSecurityProvider.requestPinReset({
            reason,
          });

        if (!result.success) {
          setError(
            result.message ??
              "Wallet recovery is not available yet."
          );
          return false;
        }

        setError("");
        return true;
      } catch (err) {
        console.error("Wallet recovery error:", err);

        setError(
          "Could not submit your recovery request."
        );

        return false;
      }
    },
    []
  );

  const total =
    wallet.balances.purchased +
    wallet.balances.earned +
    wallet.balances.promotional;

  /**
   * First-time PIN setup screen.
   */
  if (walletView === "setup") {
    return (
      <WalletPinSetupScreen
        onCreatePin={handleCreatePin}
        onCancel={() => setWalletView("locked")}
      />
    );
  }

  /**
   * Wallet locked screen.
   */
  if (walletView === "locked") {
    return (
      <WalletPinScreen
        onVerifyPin={handleVerifyPin}
        onForgotPin={() => {
          setError("");
          setWalletView("recovery");
        }}
      />
    );
  }

  /**
   * Forgotten PIN recovery screen.
   */
  if (walletView === "recovery") {
    return (
      <WalletRecoveryScreen
        onSubmitRequest={handleRecoveryRequest}
        onBack={() => setWalletView("locked")}
      />
    );
  }

  /**
   * Main wallet screen.
   */
  return (
    <View style={styles.screen}>
      <FlatList
        data={wallet.transactions}
        keyExtractor={item => String(item.id)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.cyan}
          />
        }
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.brand}>
                  BRITUME
                </Text>

                <Text style={styles.heading}>
                  My Wallet
                </Text>
              </View>

              <Pressable
                style={styles.walletIcon}
                onPress={() => setWalletView("locked")}
                accessibilityLabel="Lock wallet"
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color={theme.cyan}
                />
              </Pressable>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>
                TOTAL POINTS
              </Text>

              {loading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                  size="large"
                />
              ) : (
                <Text style={styles.total}>
                  {formatPoints(total)}
                </Text>
              )}

              <Text style={styles.balanceNote}>
                Your BRITUME wallet balance
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              Your point categories
            </Text>

            <View style={styles.categoryCard}>
              <BalanceRow
                title="Purchased points"
                amount={wallet.balances.purchased}
                icon="cart-outline"
                iconColor={theme.cyan}
                styles={styles}
              />

              <View style={styles.separator} />

              <BalanceRow
                title="Earned points"
                amount={wallet.balances.earned}
                icon="trophy-outline"
                iconColor={theme.cyan}
                styles={styles}
              />

              <View style={styles.separator} />

              <BalanceRow
                title="Promotional points"
                amount={wallet.balances.promotional}
                icon="gift-outline"
                iconColor={theme.cyan}
                styles={styles}
              />
            </View>

            <View style={styles.actions}>
              <Pressable
                style={[
                  styles.actionButton,
                  styles.disabledButton,
                ]}
                disabled
              >
                <Ionicons
                  name="send-outline"
                  size={19}
                  color={theme.muted}
                />

                <Text style={styles.disabledText}>
                  Send points
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>
              Recent transactions
            </Text>

            {!!error && (
              <View style={styles.messageCard}>
                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color={theme.danger}
                />

                <Text style={styles.errorText}>
                  {error}
                </Text>

                <Pressable
                  onPress={() => void loadWallet()}
                >
                  <Text style={styles.retry}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            )}

            {!loading &&
              !error &&
              wallet.transactions.length === 0 && (
                <View style={styles.messageCard}>
                  <Ionicons
                    name="receipt-outline"
                    size={28}
                    color={theme.muted}
                  />

                  <Text style={styles.emptyTitle}>
                    No transactions yet
                  </Text>

                  <Text style={styles.emptyText}>
                    Your wallet activity will appear here.
                  </Text>
                </View>
              )}
          </View>
        }
        renderItem={({ item }) => {
          const isCredit =
            item.entry_type.includes("received") ||
            item.entry_type.includes("reward") ||
            item.entry_type === "purchase" ||
            item.entry_type === "cashback";

          return (
            <View style={styles.transaction}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={transactionIcon(item.entry_type)}
                  size={21}
                  color={theme.cyan}
                />
              </View>

              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>
                  {transactionTitle(item.entry_type)}
                </Text>

                <Text style={styles.transactionDate}>
                  {new Date(
                    item.created_at
                  ).toLocaleString()}
                </Text>
              </View>

              <Text
                style={[
                  styles.transactionAmount,
                  isCredit
                    ? styles.credit
                    : styles.debit,
                ]}
              >
                {isCredit ? "+" : "-"}
                {formatPoints(item.amount)}
              </Text>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ height: 30 }} />
        }
      />
    </View>
  );
}

function BalanceRow({
  title,
  amount,
  icon,
  iconColor,
  styles,
}: {
  title: string;
  amount: number;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  iconColor: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.balanceRow}>
      <View style={styles.categoryLeft}>
        <Ionicons
          name={icon}
          size={21}
          color={iconColor}
        />

        <Text style={styles.categoryTitle}>
          {title}
        </Text>
      </View>

      <Text style={styles.categoryAmount}>
        {formatPoints(amount)}
      </Text>
    </View>
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
      paddingBottom: 30,
    },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },

    brand: {
      color: theme.cyan,
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 2,
    },

    heading: {
      color: theme.text,
      fontSize: 27,
      fontWeight: "800",
      marginTop: 3,
    },

    walletIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.panel,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },

    balanceCard: {
      backgroundColor: theme.cyan,
      borderRadius: 22,
      padding: 23,
      marginBottom: 25,
    },

    balanceLabel: {
      color: "#FFFFFF",
      opacity: 0.85,
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 1.5,
    },

    total: {
      color: "#FFFFFF",
      fontSize: 32,
      fontWeight: "900",
      marginTop: 12,
    },

    balanceNote: {
      color: "#FFFFFF",
      opacity: 0.85,
      marginTop: 8,
      fontSize: 13,
    },

    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 12,
      marginTop: 8,
    },

    categoryCard: {
      backgroundColor: theme.panel,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 15,
    },

    balanceRow: {
      minHeight: 62,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    categoryLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },

    categoryTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },

    categoryAmount: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },

    separator: {
      height: 1,
      backgroundColor: theme.border,
    },

    actions: {
      flexDirection: "row",
      marginVertical: 20,
    },

    actionButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 14,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 9,
    },

    disabledButton: {
      backgroundColor: theme.panel2,
      borderWidth: 1,
      borderColor: theme.border,
    },

    disabledText: {
      color: theme.muted,
      fontWeight: "700",
    },

    messageCard: {
      backgroundColor: theme.panel,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      alignItems: "center",
      gap: 9,
    },

    emptyTitle: {
      color: theme.text,
      fontWeight: "800",
      fontSize: 15,
    },

    emptyText: {
      color: theme.muted,
      textAlign: "center",
      fontSize: 13,
    },

    errorText: {
      color: theme.danger,
      textAlign: "center",
    },

    retry: {
      color: theme.cyan,
      fontWeight: "800",
      padding: 6,
    },

    transaction: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.panel,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 13,
      marginBottom: 9,
      gap: 10,
    },

    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: theme.panel2,
      alignItems: "center",
      justifyContent: "center",
    },

    transactionDetails: {
      flex: 1,
    },

    transactionTitle: {
      color: theme.text,
      fontWeight: "700",
      fontSize: 13,
    },

    transactionDate: {
      color: theme.muted,
      fontSize: 11,
      marginTop: 4,
    },

    transactionAmount: {
      fontSize: 13,
      fontWeight: "800",
    },

    credit: {
      color: "#168B65",
    },

    debit: {
      color: theme.danger,
    },
  });
      }
