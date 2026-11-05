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

export type WalletRecoveryRequest = {
  reason?: string;
};

export type WalletRecoveryRequestResult = {
  success: boolean;
  status?: 'pending' | 'under_review' | 'approved' | 'rejected';
  message?: string;
};

export type WalletSecurityProvider = {
  checkPinStatus(): Promise<WalletPinStatusResult>;

  createPin(pin: string): Promise<WalletPinSetupResult>;

  verifyPin(pin: string): Promise<WalletPinVerificationResult>;

  requestPinReset(
    request: WalletRecoveryRequest,
  ): Promise<WalletRecoveryRequestResult>;
};

export function validateWalletPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

export function validateRecoveryReason(reason: string): boolean {
  return reason.trim().length >= 5 && reason.trim().length <= 500;
}
