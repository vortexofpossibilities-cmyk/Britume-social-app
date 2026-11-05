import { supabase } from './supabase';

import type {
  WalletSecurityProvider,
  WalletPinStatusResult,
  WalletPinSetupResult,
  WalletPinVerificationResult,
  WalletRecoveryRequest,
  WalletRecoveryRequestResult,
} from './walletSecurity';

type RpcResult = {
  success?: boolean;
  configured?: boolean;
  status?: 'pending' | 'under_review' | 'approved' | 'rejected';
  message?: string;
};

function parseResult(data: unknown): RpcResult {
  if (Array.isArray(data)) {
    return parseResult(data[0]);
  }

  if (typeof data === 'boolean') {
    return { success: data };
  }

  if (data && typeof data === 'object') {
    return data as RpcResult;
  }

  return {};
}

function unavailable(): string {
  return 'Wallet security service is unavailable. Please try again.';
}

export const walletSecurityService: WalletSecurityProvider = {
  async checkPinStatus(): Promise<WalletPinStatusResult> {
    if (!supabase) {
      return { configured: false, message: unavailable() };
    }

    const { data, error } = await supabase.rpc('wallet_pin_status');

    if (error) {
      return { configured: false, message: error.message };
    }

    const result = parseResult(data);

    return {
      configured: result.configured === true,
      message: result.message,
    };
  },

  async createPin(pin: string): Promise<WalletPinSetupResult> {
    if (!supabase) {
      return { success: false, message: unavailable() };
    }

    const { data, error } = await supabase.rpc('create_wallet_pin', {
      p_pin: pin,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const result = parseResult(data);

    return {
      success: result.success === true,
      message: result.message,
    };
  },

  async verifyPin(pin: string): Promise<WalletPinVerificationResult> {
    if (!supabase) {
      return { success: false, message: unavailable() };
    }

    const { data, error } = await supabase.rpc('verify_wallet_pin', {
      p_pin: pin,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    const result = parseResult(data);

    return {
      success: result.success === true,
      message: result.message,
    };
  },

  async requestPinReset(
    request: WalletRecoveryRequest,
  ): Promise<WalletRecoveryRequestResult> {
    if (!supabase) {
      return { success: false, message: unavailable() };
    }

    const { data, error } = await supabase.rpc(
      'request_wallet_pin_reset',
      {
        p_reason: request.reason?.trim() ?? '',
      },
    );

    if (error) {
      return { success: false, message: error.message };
    }

    const result = parseResult(data);

    return {
      success: result.success === true,
      status: result.status,
      message: result.message,
    };
  },
};
