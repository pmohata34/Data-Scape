// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Provider = 'instagram' | 'linkedin';

type SocialConnection = {
  external_account_id: string | null;
  external_account_name: string | null;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
  metadata: Record<string, unknown>;
};

type SocialResult = {
  success: boolean;
  provider?: Provider;
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
      provider?: Provider;
      approvedOnly?: boolean;
      connectionName?: string | null;
      [key: string]: unknown;
    };
  };
  error?: string;
  requiresConnection?: boolean;
};

const json = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    ...init,
  });

const isProvider = (value: string | null): value is Provider => value === 'instagram' || value === 'linkedin';

const isMissingSocialConnectionsTable = (message: string) => {
  const lower = message.toLowerCase();
  return (
    lower.includes('social_connections') &&
    (lower.includes('schema cache') || lower.includes('does not exist') || lower.includes('relation'))
  );
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

const getOptionalUser = async (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const client = getAuthClient(authHeader);
  const { data: { user } } = await client.auth.getUser();
  return user ?? null;
};

const detectProviderFromUrl = (targetUrl: string): Provider | null => {
  try {
    const hostname = new URL(targetUrl).hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) return 'instagram';
    if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) return 'linkedin';
    return null;
  } catch {
    return null;
  }
};

const extractFirstMatch = (input: string, pattern: RegExp): string => {
  const match = input.match(pattern);
  return match?.[1]?.trim() || '';
};

const stripHtml = (input: string): string => {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

const extractLinks = (html: string, sourceUrl: string): string[] => {
  const out = new Set<string>();
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match = hrefRegex.exec(html);

  while (match && out.size < 100) {
    const href = match[1]?.trim();
    if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('#')) {
      try {
        out.add(new URL(href, sourceUrl).toString());
      } catch {
        // Ignore malformed links.
      }
    }
    match = hrefRegex.exec(html);
  }

  return Array.from(out);
};

const directPublicFetch = async (targetUrl: string) => {
  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const title = extractFirstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    extractFirstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i) ||
    extractFirstMatch(html, /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i) ||
    extractFirstMatch(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i);
  const text = stripHtml(html).slice(0, 80000);

  return {
    html,
    markdown: text,
    title,
    description,
    links: extractLinks(html, targetUrl),
  };
};

const instagramMirrorFetch = async (username: string) => {
  const mirrorUrl = `https://dumpor.io/v/${encodeURIComponent(username)}`;
  const response = await fetch(mirrorUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const title = extractFirstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = extractFirstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i);
  const text = stripHtml(html).slice(0, 80000);

  return {
    html,
    markdown: [
      `Instagram public profile summary for @${username}`,
      '',
      title ? `Title: ${title}` : '',
      description ? `Description: ${description}` : '',
      '',
      text,
    ].filter(Boolean).join('\n'),
    title: title || `Instagram profile @${username}`,
    description,
    links: extractLinks(html, mirrorUrl),
  };
};

const getInstagramUsername = (targetUrl: string): string => {
  try {
    const parsed = new URL(targetUrl);
    const firstSegment = parsed.pathname.split('/').filter(Boolean)[0] || '';
    if (!firstSegment || ['p', 'reel', 'stories', 'explore', 'accounts', 'tv'].includes(firstSegment.toLowerCase())) {
      return '';
    }
    return firstSegment;
  } catch {
    return '';
  }
};

const loadPublicProfileData = async (provider: Provider, inputUrl: string, resource: string | null, mediaId: string | null) => {
  if (provider === 'instagram') {
    if (resource === 'comments' && mediaId) {
      return null;
    }

    // Prefer the lighter mirror path first for Instagram to stay within edge compute limits.
    const username = getInstagramUsername(inputUrl);
    if (!username) {
      return null;
    }

    const mirror = await instagramMirrorFetch(username);
    if (mirror) {
      return {
        title: mirror.title,
        description: mirror.description || 'Public Instagram profile data',
        markdown: mirror.markdown,
        links: mirror.links,
        metadata: { source: 'instagram-mirror' },
      };
    }

    return null;
  }

  const direct = await directPublicFetch(inputUrl);
  if (!direct) {
    return null;
  }

  const content = `${direct.title} ${direct.description} ${direct.markdown}`.toLowerCase();
  if (content.includes('sign in') || content.includes('log in') || content.includes('join linkedin') || content.includes('sign up')) {
    return null;
  }

  return {
    title: direct.title || 'LinkedIn public profile',
    description: direct.description || 'Public LinkedIn profile data',
    markdown: direct.markdown,
    links: direct.links,
    metadata: { source: 'direct-html' },
  };
};

const summarizeInstagramMedia = (media: Array<Record<string, unknown>>) => {
  if (!media.length) return 'No recent media available.';

  return media.slice(0, 10).map((item, index) => {
    const caption = typeof item.caption === 'string' ? item.caption : '';
    const permalink = typeof item.permalink === 'string' ? item.permalink : '';
    const created = typeof item.timestamp === 'string' ? item.timestamp : '';
    const likes = typeof item.like_count === 'number' ? item.like_count : 'N/A';
    const comments = typeof item.comments_count === 'number' ? item.comments_count : 'N/A';
    const mediaType = typeof item.media_type === 'string' ? item.media_type : 'UNKNOWN';
    return `${index + 1}. [${mediaType}] ${caption || '[No caption]'}\n   ${permalink}${created ? `\n   ${created}` : ''}\n   Likes: ${likes} | Comments: ${comments}`;
  }).join('\n');
};

const loadInstagramData = async (accessToken: string, resource: string | null, mediaId: string | null) => {
  if (resource === 'comments' && mediaId) {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${encodeURIComponent(mediaId)}/comments?fields=id,text,timestamp,username,like_count&limit=100&access_token=${encodeURIComponent(accessToken)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Instagram comments fetch failed with status ${response.status}`);
    }

    const comments = Array.isArray(data?.data) ? data.data : [];
    return {
      title: 'Instagram comments',
      description: 'Approved comments from connected media',
      markdown: comments.length
        ? comments.map((comment: Record<string, unknown>, index: number) => {
            const text = String(comment.text || '');
            const author = String(comment.username || 'Unknown');
            const timestamp = String(comment.timestamp || '');
            return `${index + 1}. ${author}: ${text}${timestamp ? ` (${timestamp})` : ''}`;
          }).join('\n')
        : 'No comments available.',
      links: comments
        .map((comment: Record<string, unknown>) => String(comment.permalink || ''))
        .filter(Boolean),
      metadata: { raw: data },
    };
  }

  const pageResponse = await fetch(
    `https://graph.facebook.com/v22.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${encodeURIComponent(accessToken)}`
  );
  const pageData = await pageResponse.json();

  if (!pageResponse.ok) {
    throw new Error(pageData.error?.message || `Instagram account fetch failed with status ${pageResponse.status}`);
  }

  const pages = Array.isArray(pageData?.data) ? pageData.data : [];
  const page = pages.find((item: Record<string, unknown>) => Boolean(item.instagram_business_account && typeof item.instagram_business_account === 'object' && (item.instagram_business_account as Record<string, unknown>).id)) || pages[0] || null;
  const instagramBusinessAccount = page?.instagram_business_account || null;

  if (!instagramBusinessAccount?.id) {
    return {
      title: 'Instagram connection',
      description: 'Connected Facebook Page, but no Instagram business account was found.',
      markdown: `Connected page: ${page?.name || 'Unknown'}\nNo Instagram business account was returned by the Graph API.`,
      links: [],
      metadata: { page, raw: pageData },
    };
  }

  const profileResponse = await fetch(
    `https://graph.facebook.com/v22.0/${encodeURIComponent(instagramBusinessAccount.id)}?fields=id,username,name,media_count,followers_count,biography,website,profile_picture_url&access_token=${encodeURIComponent(accessToken)}`
  );
  const profileData = await profileResponse.json();

  if (!profileResponse.ok) {
    throw new Error(profileData.error?.message || `Instagram profile fetch failed with status ${profileResponse.status}`);
  }

  const mediaResponse = await fetch(
    `https://graph.facebook.com/v22.0/${encodeURIComponent(instagramBusinessAccount.id)}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,thumbnail_url&limit=100&access_token=${encodeURIComponent(accessToken)}`
  );
  const mediaData = await mediaResponse.json();

  if (!mediaResponse.ok) {
    throw new Error(mediaData.error?.message || `Instagram media fetch failed with status ${mediaResponse.status}`);
  }

  const media = Array.isArray(mediaData?.data) ? mediaData.data : [];
  const title = `Instagram profile @${profileData.username || instagramBusinessAccount.username || 'connected-account'}`;
  const description = profileData.biography || 'Approved Instagram business account data';

  return {
    title,
    description,
    markdown: [
      `Instagram approved data for @${profileData.username || instagramBusinessAccount.username || 'connected-account'}`,
      '',
      `Name: ${profileData.name || page?.name || 'Unknown'}`,
      `Followers: ${profileData.followers_count ?? 'Unavailable'}`,
      `Media count: ${profileData.media_count ?? 'Unavailable'}`,
      `Website: ${profileData.website || 'Unavailable'}`,
      `Returned posts: ${media.length}`,
      '',
      'Recent posts:',
      summarizeInstagramMedia(media),
    ].join('\n'),
    links: media.map((item: Record<string, unknown>) => String(item.permalink || '')).filter(Boolean),
    metadata: {
      page,
      profile: profileData,
      mediaCount: media.length,
    },
  };
};

const loadLinkedInData = async (accessToken: string, resource: string | null) => {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.message || `LinkedIn profile fetch failed with status ${response.status}`);
  }

  const title = `LinkedIn profile ${data.name || data.email || data.sub || ''}`.trim();
  const description = 'Approved LinkedIn profile data';
  const markdown = [
    `LinkedIn approved data`,
    '',
    `Name: ${data.name || 'Unavailable'}`,
    `Email: ${data.email || 'Unavailable'}`,
    `Given name: ${data.given_name || 'Unavailable'}`,
    `Family name: ${data.family_name || 'Unavailable'}`,
    `Picture: ${data.picture || 'Unavailable'}`,
    `Resource: ${resource || 'profile'}`,
  ].join('\n');

  return {
    title,
    description,
    markdown,
    links: data.picture ? [String(data.picture)] : [],
    metadata: { profile: data },
  };
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await getOptionalUser(request);
    const url = new URL(request.url);
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const inputUrl = String(body?.url || url.searchParams.get('url') || '');
    const resource = String(body?.resource || url.searchParams.get('resource') || 'profile');
    const mediaId = body?.mediaId ? String(body.mediaId) : url.searchParams.get('mediaId');
    const provider = detectProviderFromUrl(inputUrl);

    if (!provider) {
      return json({ success: false, error: 'URL does not belong to Instagram or LinkedIn' }, { status: 400 });
    }

    let connection: SocialConnection | null = null;
    if (user) {
      const admin = getServiceClient();
      const { data, error } = await admin
        .from('social_connections')
        .select('external_account_id, external_account_name, access_token, refresh_token, token_type, scope, expires_at, metadata')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .maybeSingle();

      if (error) {
        if (!isMissingSocialConnectionsTable(error.message || '')) {
          throw new Error(error.message);
        }
      }

      connection = (data as SocialConnection | null) ?? null;
    }

    let approved;
    let typedConnection: SocialConnection | null = null;
    if (connection) {
      typedConnection = connection;
      approved = provider === 'instagram'
        ? await loadInstagramData(typedConnection.access_token, resource, mediaId)
        : await loadLinkedInData(typedConnection.access_token, resource);
    } else {
      approved = await loadPublicProfileData(provider, inputUrl, resource, mediaId);

      if (!approved && provider === 'instagram') {
        return json({
          success: false,
          provider,
          requiresConnection: true,
          error: 'This Instagram page is private or blocked. Official account connection is required to extract it.',
        }, { status: 200 });
      }
    }

    if (!approved) {
      return json({
        success: false,
        provider,
        requiresConnection: true,
        error: `No approved ${provider} connection found and public extraction could not read this page. Connect your account first or try a public URL.`,
      }, { status: 200 });
    }

    const sourceLabel = typedConnection
      ? provider === 'instagram'
        ? `Connected Instagram account ${typedConnection.external_account_name || typedConnection.external_account_id || ''}`.trim()
        : `Connected LinkedIn account ${typedConnection.external_account_name || typedConnection.external_account_id || ''}`.trim()
      : `${provider === 'instagram' ? 'Public Instagram' : 'Public LinkedIn'} extraction`;

    const result: SocialResult = {
      success: true,
      provider,
      data: {
        markdown: approved.markdown,
        html: '',
        rawHtml: '',
        links: approved.links,
        metadata: {
          title: approved.title,
          description: approved.description,
          sourceURL: inputUrl,
          statusCode: 200,
          provider,
          approvedOnly: Boolean(typedConnection),
          connectionName: typedConnection?.external_account_name || null,
          sourceLabel,
          connection: typedConnection?.metadata || {},
          ...approved.metadata,
        },
      },
    };

    return json(result);
  } catch (error) {
    return json({ success: false, error: error instanceof Error ? error.message : 'Failed to fetch social data' }, { status: 400 });
  }
});
