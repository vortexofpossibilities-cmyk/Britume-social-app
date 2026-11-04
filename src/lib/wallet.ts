
import { supabase } from "./supabase";

export type WalletCategory =
  | "purchased"
  | "earned"
  | "promotional";

export type WalletBalances = Record<WalletCategory, number>;

export type WalletLedgerEntry = {
  id: number;
  transfer_id: string | null;
  category: WalletCategory;
  entry_type: string;
  amount: number;
  created_at: string;
};

export type WalletData = {
  balances: WalletBalances;
  transactions: WalletLedgerEntry[];
};

const EMPTY_BALANCES: WalletBalances = {
  purchased: 0,
  earned: 0,
  promotional: 0,
};

function getClient() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Check your environment variables."
    );
  }

  return supabase;
}

export async function fetchWalletData(
  userId: string
): Promise<WalletData> {
  if (!userId) {
    throw new Error("You must be signed in to view your wallet.");
  }

  const client = getClient();

  const [balancesResult, transactionsResult] =
    await Promise.all([
      client
        .from("wallet_balances")
        .select("category, balance")
        .eq("user_id", userId),

      client
        .from("wallet_ledger")
        .select(
          "id, transfer_id, category, entry_type, amount, created_at"
        )
        .eq("account_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (balancesResult.error) {
    throw balancesResult.error;
  }

  if (transactionsResult.error) {
    throw transactionsResult.error;
  }

  const balances: WalletBalances = { ...EMPTY_BALANCES };

  for (const row of balancesResult.data ?? []) {
    if (
      row.category === "purchased" ||
      row.category === "earned" ||
      row.category === "promotional"
    ) {
      const category = row.category as WalletCategory;
      balances[category] = Number(row.balance ?? 0);
    }
  }

  const transactions: WalletLedgerEntry[] = (
    transactionsResult.data ?? []
  ).map((row) => ({
    id: Number(row.id),
    transfer_id: row.transfer_id,
    category: row.category as WalletCategory,
    entry_type: row.entry_type,
    amount: Number(row.amount),
    created_at: row.created_at,
  }));

  return { balances, transactions };
}
