// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Provider = 'instagram' | 'linkedin';

type OAuthStateRow = {
  user_id: string;
  provider: Provider;
  state: string;
  code_verifier: string;
  redirect_to: string;
  app_origin: string;
};

type SocialConnectionRow = {
  user_id: string;
  provider: Provider;
  external_account_id: string | null;
  external_account_name: string | null;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
};

type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  usePkce: boolean;
};

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    ...init,
  });

const redirectTo = (url: string) => Response.redirect(url, 302);

const isProvider = (value: string | null): value is Provider => value === 'instagram' || value === 'linkedin';

const base64UrlEncode = (bytes: Uint8Array) => {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const randomString = (length = 64) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes).slice(0, length);
};

const sha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return new Uint8Array(hash);
};

const createCodeChallenge = async (verifier: string) => base64UrlEncode(await sha256(verifier));

const getServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role configuration is missing');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const getAuthClient = (authHeader: string | null) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase auth configuration is missing');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: authHeader
      ? {
          headers: { Authorization: authHeader },
        }
      : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const requireUser = async (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Authentication required');
  }

  const client = getAuthClient(authHeader);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
};

const getProviderConfig = (provider: Provider): ProviderConfig => {
  if (provider === 'instagram') {
    const clientId = Deno.env.get('FACEBOOK_APP_ID');
    const clientSecret = Deno.env.get('FACEBOOK_APP_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Instagram OAuth is not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.');
    }

    return {
      authUrl: 'https://www.facebook.com/v22.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v22.0/oauth/access_token',
      clientId,
      clientSecret,
      scopes: ['pages_show_list', 'pages_read_engagement', 'instagram_basic'],
      usePkce: false,
    };
  }

  const clientId = Deno.env.get('LINKEDIN_CLIENT_ID');
  const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('LinkedIn OAuth is not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.');
  }

  return {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientId,
    clientSecret,
    scopes: ['openid', 'profile', 'email'],
    usePkce: true,
  };
};

const buildCallbackUrl = (request: Request, provider: Provider) => {
  const url = new URL(request.url);
  url.searchParams.set('action', 'callback');
  url.searchParams.set('provider', provider);
  url.searchParams.delete('redirect_to');
  return url.toString();
};

const exchangeToken = async (provider: Provider, code: string, codeVerifier: string, callbackUrl: string) => {
  const config = getProviderConfig(provider);

  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', code);
  body.set('redirect_uri', callbackUrl);
  body.set('client_id', config.clientId);
  body.set('client_secret', config.clientSecret);
  if (config.usePkce) {
    body.set('code_verifier', codeVerifier);
  }

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || `Token exchange failed with status ${response.status}`);
  }

  return data as {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
  };
};

const fetchLinkedInProfile = async (accessToken: string) => {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.message || `LinkedIn profile fetch failed with status ${response.status}`);
  }

  return data as {
    sub?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    email?: string;
    picture?: string;
  };
};

const fetchInstagramAccount = async (accessToken: string) => {
  const pagesResponse = await fetch('https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=' + encodeURIComponent(accessToken));
  const pagesData = await pagesResponse.json();

  if (!pagesResponse.ok) {
    throw new Error(pagesData.error?.message || `Instagram account fetch failed with status ${pagesResponse.status}`);
  }

  const pages = Array.isArray(pagesData?.data) ? pagesData.data : [];
  const page = pages.find((item: any) => item?.instagram_business_account?.id) || pages[0] || null;
  const instagramBusinessAccount = page?.instagram_business_account || null;

  const summary = {
    page,
    instagramBusinessAccount,
  };

  if (!instagramBusinessAccount?.id) {
    return {
      external_account_id: page?.id || null,
      external_account_name: page?.name || null,
      summary,
    };
  }

  const profileResponse = await fetch(
    `https://graph.facebook.com/v22.0/${encodeURIComponent(instagramBusinessAccount.id)}?fields=id,username,name,media_count,followers_count,biography,website,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
  );
  const profileData = await profileResponse.json();

  if (!profileResponse.ok) {
    throw new Error(profileData.error?.message || `Instagram profile fetch failed with status ${profileResponse.status}`);
  }

  return {
    external_account_id: instagramBusinessAccount.id as string,
    external_account_name: (profileData.username || instagramBusinessAccount.username || page?.name || null) as string | null,
    summary: {
      ...summary,
      profile: profileData,
    },
  };
};

const storeConnection = async (request: Request, provider: Provider, tokenData: Awaited<ReturnType<typeof exchangeToken>>, stateRow: OAuthStateRow) => {
  const admin = getServiceClient();
  const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null;

  let external_account_id: string | null = null;
  let external_account_name: string | null = null;
  let metadata: Record<string, unknown> = {};

  if (provider === 'linkedin') {
    const profile = await fetchLinkedInProfile(tokenData.access_token);
    external_account_id = profile.sub || null;
    external_account_name = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ') || profile.email || null;
    metadata = { profile };
  } else {
    const instagram = await fetchInstagramAccount(tokenData.access_token);
    external_account_id = instagram.external_account_id;
    external_account_name = instagram.external_account_name;
    metadata = instagram.summary;
  }

  const payload: SocialConnectionRow = {
    user_id: stateRow.user_id,
    provider,
    external_account_id,
    external_account_name,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || null,
    token_type: tokenData.token_type || 'bearer',
    scope: tokenData.scope || null,
    expires_at: expiresAt,
    metadata,
  };

  const { error } = await admin
    .from('social_connections')
    .upsert(payload, { onConflict: 'user_id,provider' });

  if (error) {
    throw new Error(error.message);
  }

  await admin.from('oauth_states').delete().eq('state', stateRow.state);
};

const buildAuthUrl = async (request: Request, provider: Provider, redirectToPath: string) => {
  const config = getProviderConfig(provider);
  const callbackUrl = buildCallbackUrl(request, provider);
  const state = randomString(40);
  const codeVerifier = randomString(64);
  const codeChallenge = config.usePkce ? await createCodeChallenge(codeVerifier) : null;
  const appOrigin = request.headers.get('origin') || new URL(request.url).origin;

  const user = await requireUser(request);
  const admin = getServiceClient();

  const { error } = await admin.from('oauth_states').insert({
    user_id: user.id,
    provider,
    state,
    code_verifier: codeVerifier,
    app_origin: appOrigin,
    redirect_to: redirectToPath || '/connections',
  });

  if (error) {
    throw new Error(error.message);
  }

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', config.scopes.join(provider === 'instagram' ? ',' : ' '));
  if (codeChallenge) {
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
  }

  return { authUrl: authUrl.toString(), state };
};

const getConnectionStatus = async (request: Request) => {
  const user = await requireUser(request);
  const admin = getServiceClient();
  const { data, error } = await admin
    .from('social_connections')
    .select('provider, external_account_id, external_account_name, expires_at, connected_at, metadata')
    .eq('user_id', user.id)
    .order('connected_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const disconnectProvider = async (request: Request, provider: Provider) => {
  const user = await requireUser(request);
  const admin = getServiceClient();
  const { error } = await admin.from('social_connections').delete().eq('user_id', user.id).eq('provider', provider);
  if (error) {
    throw new Error(error.message);
  }
  return { success: true };
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const action = String(body?.action || url.searchParams.get('action') || 'start');
    const providerParam = String(body?.provider || url.searchParams.get('provider') || '');

    if (action === 'callback') {
      const provider = providerParam;
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (error) {
        const stateErrorUrl = new URL(url.origin);
        stateErrorUrl.pathname = '/connections';
        stateErrorUrl.searchParams.set('provider', provider || 'unknown');
        stateErrorUrl.searchParams.set('error', errorDescription || error);
        return redirectTo(stateErrorUrl.toString());
      }

      if (!isProvider(provider) || !code || !state) {
        throw new Error('Missing OAuth callback parameters');
      }

      const admin = getServiceClient();
      const { data: stateRow, error: stateError } = await admin
        .from('oauth_states')
        .select('user_id, provider, state, code_verifier, redirect_to, app_origin')
        .eq('state', state)
        .maybeSingle();

      if (stateError || !stateRow) {
        throw new Error('Invalid or expired OAuth state');
      }

      const typedState = stateRow as OAuthStateRow;
      const callbackUrl = buildCallbackUrl(request, typedState.provider);
      const tokenData = await exchangeToken(typedState.provider, code, typedState.code_verifier, callbackUrl);
      await storeConnection(request, typedState.provider, tokenData, typedState);

      const successUrl = new URL('/oauth-complete', typedState.app_origin);
      successUrl.searchParams.set('provider', typedState.provider);
      successUrl.searchParams.set('connected', '1');
      successUrl.searchParams.set('redirect_to', typedState.redirect_to || '/connections');
      return redirectTo(successUrl.toString());
    }

    if (action === 'status') {
      const data = await getConnectionStatus(request);
      return json({ success: true, data });
    }

    if (action === 'disconnect') {
      if (!isProvider(providerParam)) {
        throw new Error('provider is required');
      }
      const result = await disconnectProvider(request, providerParam);
      return json(result);
    }

    if (action === 'start') {
      if (!isProvider(providerParam)) {
        throw new Error('provider is required');
      }

      const redirectToPath = String(body?.redirect_to || url.searchParams.get('redirect_to') || '/connections');
      const result = await buildAuthUrl(request, providerParam, redirectToPath);
      return json({ success: true, ...result });
    }

    return json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process OAuth request';
    return json({ success: false, error: message }, { status: 400 });
  }
});
