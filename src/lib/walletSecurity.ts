import { supabase } from "./supabase";

import {
  WalletSecurityProvider,
  WalletPinStatusResult,
  WalletPinSetupResult,
  WalletPinVerificationResult,
  WalletRecoveryRequest,
  WalletRecoveryRequestResult,
} from "./walletSecurity";

type RpcResult = {
  success?: boolean;
  configured?: boolean;
  status?: "pending" | "under_review" | "approved" | "rejected";
  message?: string;
};

function getResult(data: unknown): RpcResult {
  if (typeof data === "boolean") {
    return { success: data };
  }

  if (Array.isArray(data)) {
    return getResult(data[0]);
  }

  if (data && typeof data === "object") {
    return data as RpcResult;
  }

  return {};
}

function unavailableMessage() {
  return "Wallet security service is unavailable. Please try again later.";
}

export const walletSecurityService: WalletSecurityProvider & {
  checkPinStatus(): Promise<WalletPinStatusResult>;
  createPin(pin: string): Promise<WalletPinSetupResult>;
} = {
  async checkPinStatus() {
    if (!supabase) {
      return {
        configured: false,
        message: unavailableMessage(),
      };
    }

    const { data, error } = await supabase.rpc(
      "wallet_pin_status"
    );

    if (error) {
      return {
        configured: false,
        message: error.message,
      };
    }

    const result = getResult(data);

    return {
      configured: result.configured === true,
      message: result.message,
    };
  },

  async createPin(pin: string) {
    if (!supabase) {
      return {
        success: false,
        message: unavailableMessage(),
      };
    }

    const { data, error } = await supabase.rpc(
      "create_wallet_pin",
      {
        p_pin: pin,
      }
    );

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    const result = getResult(data);

    return {
      success: result.success === true,
      message: result.message,
    };
  },

  async verifyPin(pin: string): Promise<WalletPinVerificationResult> {
    if (!supabase) {
      return {
        success: false,
        message: unavailableMessage(),
      };
    }

    const { data, error } = await supabase.rpc(
      "verify_wallet_pin",
      {
        p_pin: pin,
      }
    );

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    const result = getResult(data);

    return {
      success: result.success === true,
      message: result.message,
    };
  },

  async requestPinReset(
    request: WalletRecoveryRequest
  ): Promise<WalletRecoveryRequestResult> {
    if (!supabase) {
      return {
        success: false,
        message: unavailableMessage(),
      };
    }

    const { data, error } = await supabase.rpc(
      "request_wallet_pin_reset",
      {
        p_reason: request.reason ?? "",
      }
    );

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    const result = getResult(data);

    return {
      success: result.success === true,
      status: result.status,
      message: result.message,
    };
  },
};
