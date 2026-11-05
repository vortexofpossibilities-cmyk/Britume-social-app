export const MIN_WALLET_PIN_LENGTH = 4;
export const MAX_WALLET_PIN_LENGTH = 6;

export type WalletPinVerificationResult = {
  success: boolean;
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

/**
 * Checks the format of a wallet PIN.
 * This does NOT verify the PIN against the server.
 */
export function validateWalletPinFormat(pin: string): boolean {
  return (
    /^\d+$/.test(pin) &&
    pin.length >= MIN_WALLET_PIN_LENGTH &&
    pin.length <= MAX_WALLET_PIN_LENGTH
  );
}

/**
 * Backend integration contract:
 * PIN verification must eventually happen securely on the server.
 * Never store or compare a real PIN in local storage.
 */
export interface WalletSecurityProvider {
  verifyPin(
    pin: string
  ): Promise<WalletPinVerificationResult>;

  requestPinReset(
    request: WalletRecoveryRequest
  ): Promise<WalletRecoveryRequestResult>;
}
