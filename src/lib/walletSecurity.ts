File path: "src/lib/walletSecurity.ts"

export const MIN_WALLET_PIN_LENGTH = 4;
export const MAX_WALLET_PIN_LENGTH = 6;

export type WalletPinVerificationResult = {
  success: boolean;
  message?: string;
};

export type WalletPinSetupResult = {
  success: boolean;
  message?: string;
};

export type WalletPinStatusResult = {
  configured: boolean;
  message?: string;
};

export type WalletRecoveryRequest = {
  reason?: string;
};

export type WalletRecoveryStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "rejected";

export type WalletRecoveryRequestResult = {
  success: boolean;
  status?: WalletRecoveryStatus;
  message?: string;
};

export function validateWalletPinFormat(pin: string): boolean {
  return (
    /^\d+$/.test(pin) &&
    pin.length >= MIN_WALLET_PIN_LENGTH &&
    pin.length <= MAX_WALLET_PIN_LENGTH
  );
}

/**
 * Backend integration contract.
 *
 * PIN creation, verification and recovery must happen
 * through secure server-side Supabase functions.
 *
 * Never store plaintext PINs locally.
 */
export interface WalletSecurityProvider {
  checkPinStatus?(): Promise<WalletPinStatusResult>;

  createPin?(
    pin: string
  ): Promise<WalletPinSetupResult>;

  verifyPin(
    pin: string
  ): Promise<WalletPinVerificationResult>;

  requestPinReset(
    request: WalletRecoveryRequest
  ): Promise<WalletRecoveryRequestResult>;
}

Save this replacement, buddy. Don't enter anything in Supabase yet. Next we'll connect the setup screen and security service, then prepare the database migration carefully.
