
import { supabase, supabaseConfigured } from './supabase';

import type {
  WalletSecurityProvider,
  WalletPinStatusResult,
  WalletPinSetupResult,
  WalletPinVerificationResult,
  WalletRecoveryRequest,
  WalletRecoveryRequestResult,
  WalletRecoveryStatus,
} from './walletSecurity';

type RpcResult = {
  success?: boolean;
  configured?: boolean;
  status?: WalletRecoveryStatus;
  message?: string;
};

function parseResult(data: unknown): RpcResult {
  if (Array.isArray(data)) {
    return data.length > 0 ? parseResult(data[0]) : {};
  }

  if (typeof data === 'boolean') {
    return { success: data };
  }

  if (
    data !== null &&
    typeof data === 'object'
  ) {
    const value = data as Record<string, unknown>;

    const validStatuses: WalletRecoveryStatus[] = [
      'pending',
      'under_review',
      'approved',
      'rejected',
    ];

    return {
      success:
        typeof value.success === 'boolean'
          ? value.success
          : undefined,
      configured:
        typeof value.configured === 'boolean'
          ? value.configured
          : undefined,
      status:
        typeof value.status === 'string' &&
        validStatuses.includes(value.status as WalletRecoveryStatus)
          ? (value.status as WalletRecoveryStatus)
          : undefined,
      message:
        typeof value.message === 'string'
          ? value.message
          : undefined,
    };
  }

  return {};
}

function unavailable(): string {
  return 'Wallet security service is unavailable. Please try again.';
}

function getClient() {
  const client = supabase;

  if (!supabaseConfigured || !client) {
    return null;
  }

  return client;
}

export const walletSecurityService: WalletSecurityProvider = {
  async checkPinStatus(): Promise<WalletPinStatusResult> {
    const client = getClient();

    if (!client) {
      return {
        configured: false,
        message: unavailable(),
      };
    }

    try {
      const { data, error } = await client.rpc('wallet_pin_status');

      if (error) {
        return {
          configured: false,
          message: unavailable(),
        };
      }

      const result = parseResult(data);

      return {
        configured: result.configured === true,
        message: result.message,
      };
    } catch {
      return {
        configured: false,
        message: unavailable(),
      };
    }
  },

  async createPin(pin: string): Promise<WalletPinSetupResult> {
    if (!/^\d{4,6}$/.test(pin)) {
      return {
        success: false,
        message: 'PIN must contain 4–6 digits.',
      };
    }

    const client = getClient();

    if (!client) {
      return {
        success: false,
        message: unavailable(),
      };
    }

    try {
      const { data, error } = await client.rpc('create_wallet_pin', {
        p_pin: pin,
      });

      if (error) {
        return {
          success: false,
          message: unavailable(),
        };
      }

      const result = parseResult(data);

      return {
        success: result.success === true,
        message: result.message,
      };
    } catch {
      return {
        success: false,
        message: unavailable(),
      };
    }
  },

  async verifyPin(pin: string): Promise<WalletPinVerificationResult> {
    if (!/^\d{4,6}$/.test(pin)) {
      return {
        success: false,
        message: 'PIN must contain 4–6 digits.',
      };
    }

    const client = getClient();

    if (!client) {
      return {
        success: false,
        message: unavailable(),
      };
    }

    try {
      const { data, error } = await client.rpc('verify_wallet_pin', {
        p_pin: pin,
      });

      if (error) {
        return {
          success: false,
          message: unavailable(),
        };
      }

      const result = parseResult(data);

      return {
        success: result.success === true,
        message: result.message,
      };
    } catch {
      return {
        success: false,
        message: unavailable(),
      };
    }
  },

  async requestPinReset(
    request: WalletRecoveryRequest
  ): Promise<WalletRecoveryRequestResult> {
    const reason = request.reason?.trim() ?? '';

    if (reason.length < 5 || reason.length > 500) {
      return {
        success: false,
        message: 'Recovery reason must contain 5–500 characters.',
      };
    }

    const client = getClient();

    if (!client) {
      return {
        success: false,
        message: unavailable(),
      };
    }

    try {
      const { data, error } = await client.rpc(
        'request_wallet_pin_reset',
        {
          p_reason: reason,
        }
      );

      if (error) {
        return {
          success: false,
          message: unavailable(),
        };
      }

      const result = parseResult(data);

      return {
        success: result.success === true,
        status: result.status,
        message: result.message,
      };
    } catch {
      return {
        success: false,
        message: unavailable(),
      };
    }
  },
};
