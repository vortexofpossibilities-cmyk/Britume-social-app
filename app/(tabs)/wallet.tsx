import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../src/lib/theme";

const categories = [
  {
    title: "Purchased Points",
    subtitle: "Points you purchased",
    icon: "card-outline" as const,
    color: theme.cyan,
  },
  {
    title: "Earned Points",
    subtitle: "Points earned on BRITUME",
    icon: "trophy-outline" as const,
    color: theme.purple,
  },
  {
    title: "Promotional Points",
    subtitle: "Bonuses and promotions",
    icon: "gift-outline" as const,
    color: "#269B79",
  },
];

export default function WalletScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BRITUME</Text>
            <Text style={styles.title}>My Wallet</Text>
            <Text style={styles.subtitle}>
              Your points, all in one place.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons
              name="wallet-outline"
              size={27}
              color={theme.cyan}
            />
          </View>
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>TOTAL POINTS</Text>
          <Text style={styles.totalValue}>—</Text>
          <Text style={styles.totalNote}>
            Your actual balance will appear when the secure wallet
            database is connected.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>My point categories</Text>

        {categories.map((item) => (
          <View key={item.title} style={styles.categoryCard}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: `${item.color}18` },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={item.color}
              />
            </View>

            <View style={styles.categoryInfo}>
              <Text style={styles.categoryTitle}>{item.title}</Text>
              <Text style={styles.categorySubtitle}>
                {item.subtitle}
              </Text>
            </View>

            <Text style={styles.balance}>—</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Transaction history</Text>

        <View style={styles.emptyCard}>
          <Ionicons
            name="receipt-outline"
            size={32}
            color={theme.muted}
          />
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyText}>
            Your wallet activity will appear here.
          </Text>
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color={theme.cyan}
          />
          <Text style={styles.noticeText}>
            Your wallet balances and transfers will be verified
            securely by BRITUME's server.
          </Text>
        </View>

        <Pressable style={styles.sendButton} disabled>
          <Ionicons
            name="paper-plane-outline"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.sendText}>Send Points</Text>
        </Pressable>

        <Text style={styles.comingSoon}>
          Wallet transactions will activate after database integration.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  brand: {
    color: theme.cyan,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  subtitle: {
    color: theme.muted,
    fontSize: 14,
    marginTop: 4,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: "center",
    justifyContent: "center",
  },
  totalCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 22,
    padding: 22,
    marginBottom: 25,
  },
  totalLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  totalValue: {
    color: theme.text,
    fontSize: 42,
    fontWeight: "800",
    marginTop: 8,
  },
  totalNote: {
    color: theme.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 13,
    marginTop: 8,
  },
  categoryCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  categorySubtitle: {
    color: theme.muted,
    fontSize: 11,
    marginTop: 4,
  },
  balance: {
    color: theme.text,
    fontSize: 21,
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyText: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 6,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.panel2,
    borderRadius: 15,
    padding: 14,
    marginTop: 18,
  },
  noticeText: {
    flex: 1,
    color: theme.text,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 10,
  },
  sendButton: {
    backgroundColor: theme.cyan,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.55,
  },
  sendText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 9,
  },
  comingSoon: {
    color: theme.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 9,
  },
});
