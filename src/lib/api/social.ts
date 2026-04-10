import { supabase } from '@/integrations/supabase/client';

export type SocialProvider = 'instagram' | 'linkedin';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

const getInvokeErrorMessage = async (error: { message?: string; context?: Response }) => {
  const maybeContext = error?.context;
  if (maybeContext) {
    try {
      const details = await maybeContext.json() as { error?: string; message?: string; code?: string | number };
      if (details?.error) {
        return details.error;
      }
      if (details?.message) {
        return details.message;
      }
      if (typeof details?.code !== 'undefined') {
        return `Request failed with code ${details.code}`;
      }
    } catch {
      // Fall back to the SDK message.
    }
  }

  return error?.message || 'Edge function request failed';
};

const isInvalidJwtMessage = (message: string) => message.toLowerCase().includes('invalid jwt');

const callSocialDataDirect = async (url: string, resource = 'profile', mediaId?: string, accessToken?: string) => {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/social-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ url, resource, mediaId }),
  });

  const payload = await response.json().catch(() => null) as SocialFetchResult | { error?: string; message?: string } | null;
  if (!payload) {
    return { success: false, error: `social-data failed with status ${response.status}` } as SocialFetchResult;
  }

  if ('success' in payload) {
    return payload as SocialFetchResult;
  }

  if (!response.ok) {
    return {
      success: false,
      error: payload.error || payload.message || `social-data failed with status ${response.status}`,
    } as SocialFetchResult;
  }

  return payload as SocialFetchResult;
};

export interface SocialConnectionStatus {
  provider: SocialProvider;
  external_account_id: string | null;
  external_account_name: string | null;
  expires_at: string | null;
  connected_at: string | null;
  metadata: Record<string, unknown>;
}

export interface SocialFetchResult {
  success: boolean;
  provider?: SocialProvider;
  requiresConnection?: boolean;
  error?: string;
  data?: {
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
      statusCode?: number;
      provider?: SocialProvider;
      approvedOnly?: boolean;
      connectionName?: string | null;
      [key: string]: unknown;
    };
  };
}

export const getSocialProviderFromUrl = (input: string): SocialProvider | null => {
  try {
    const normalized = input.startsWith('http://') || input.startsWith('https://') ? input : `https://${input}`;
    const hostname = new URL(normalized).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) return 'instagram';
    if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) return 'linkedin';
    return null;
  } catch {
    return null;
  }
};

export const startSocialConnection = async (provider: SocialProvider, redirectTo = '/connections') => {
  const { data, error } = await supabase.functions.invoke('social-oauth', {
    body: { action: 'start', provider, redirect_to: redirectTo },
  });

  if (error) {
    throw new Error(await getInvokeErrorMessage(error as { message?: string; context?: Response }));
  }

  return data as { success: boolean; authUrl: string; state: string };
};

export const getSocialConnectionStatus = async () => {
  const { data, error } = await supabase.functions.invoke('social-oauth', {
    body: { action: 'status' },
  });

  if (error) {
    throw new Error(await getInvokeErrorMessage(error as { message?: string; context?: Response }));
  }

  return (data?.data || []) as SocialConnectionStatus[];
};

export const disconnectSocialProvider = async (provider: SocialProvider) => {
  const { data, error } = await supabase.functions.invoke('social-oauth', {
    body: { action: 'disconnect', provider },
  });

  if (error) {
    throw new Error(await getInvokeErrorMessage(error as { message?: string; context?: Response }));
  }

  return data as { success: boolean };
};

export const fetchApprovedSocialData = async (url: string, resource = 'profile', mediaId?: string) => {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const { data, error } = await supabase.functions.invoke('social-data', {
    body: { url, resource, mediaId },
  });

  if (error) {
    const message = await getInvokeErrorMessage(error as { message?: string; context?: Response });

    if (isInvalidJwtMessage(message)) {
      await supabase.auth.signOut();
      const anonymousResult = await callSocialDataDirect(url, resource, mediaId);
      if (anonymousResult?.success) {
        return anonymousResult;
      }

      return {
        success: false,
        error: 'Session expired or invalid. Please log in again.',
      } as SocialFetchResult;
    }

    // Fallback for SDK cases where only a generic non-2xx error is exposed.
    if (message.toLowerCase().includes('non-2xx')) {
      try {
        const direct = await callSocialDataDirect(url, resource, mediaId, accessToken);
        if (direct) {
          return direct;
        }
      } catch {
        // Keep existing message.
      }
    }

    return { success: false, error: message } as SocialFetchResult;
  }

  // If data exists and is successful, return it
  if (data && data.success) {
    return data as SocialFetchResult;
  }

  // If data indicates requiresConnection, that means OAuth is needed
  if (data && data.requiresConnection) {
    return data as SocialFetchResult;
  }

  return data as SocialFetchResult;
};
