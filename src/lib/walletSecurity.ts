
export type WalletPinStatusResult = {
  configured: boolean;
  message?: string;
};

export type WalletPinSetupResult = {
  success: boolean;
  message?: string;
};

export type WalletPinVerificationResult = {
  success: boolean;
  message?: string;
};

export type WalletRecoveryStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type WalletRecoveryRequest = {
  reason?: string;
};

export type WalletRecoveryRequestResult = {
  success: boolean;
  status?: WalletRecoveryStatus;
  message?: string;
};

export type WalletSecurityProvider = {
  checkPinStatus(): Promise<WalletPinStatusResult>;

  createPin(pin: string): Promise<WalletPinSetupResult>;

  verifyPin(pin: string): Promise<WalletPinVerificationResult>;

  requestPinReset(
    request: WalletRecoveryRequest
  ): Promise<WalletRecoveryRequestResult>;
};

/**
 * Validates a wallet PIN.
 * A valid PIN must contain exactly 4, 5, or 6 numeric digits.
 */
export function validateWalletPinFormat(pin: string): boolean {
  return typeof pin === 'string' && /^\d{4,6}$/.test(pin);
}

/**
 * Validates the reason supplied when requesting wallet PIN recovery.
 * The reason must contain 5–500 characters after trimming whitespace.
 */
export function validateRecoveryReason(reason: string): boolean {
  if (typeof reason !== 'string') {
    return false;
  }

  const trimmed = reason.trim();

  return trimmed.length >= 5 && trimmed.length <= 500;
}
