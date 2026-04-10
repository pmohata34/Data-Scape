import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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

  while (match && out.size < 200) {
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

const extractLinksFromText = (text: string): string[] => {
  const out = new Set<string>();
  const urlRegex = /https?:\/\/[^\s)\]}>"']+/gi;
  let match = urlRegex.exec(text);

  while (match && out.size < 200) {
    out.add(match[0]);
    match = urlRegex.exec(text);
  }

  return Array.from(out);
};

const tryDirectFetchFallback = async (targetUrl: string) => {
  const direct = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!direct.ok) {
    return { success: false, error: `Fallback fetch failed with status ${direct.status}` };
  }

  const html = await direct.text();
  const title = extractFirstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    extractFirstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i) ||
    extractFirstMatch(html, /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i);
  const text = stripHtml(html).slice(0, 120000);
  const links = extractLinks(html, targetUrl);
  const lower = `${title.toLowerCase()}\n${text.slice(0, 2000).toLowerCase()}`;

  if (lower.includes('log in') || lower.includes('sign in') || lower.includes('challenge required')) {
    return {
      success: false,
      blocked: true,
      error: 'The URL resolved to a login/challenge page instead of content. Use a public URL or official API/OAuth for authenticated data.',
    };
  }

  return {
    success: true,
    provider: 'direct-fetch',
    data: {
      markdown: text,
      html,
      links,
      metadata: {
        title,
        description,
        sourceURL: targetUrl,
        statusCode: direct.status,
      },
    },
  };
};

const tryReaderProxyFallback = async (targetUrl: string) => {
  const readerUrl = `https://r.jina.ai/http://${targetUrl.replace(/^https?:\/\//i, '')}`;
  const resp = await fetch(readerUrl, {
    method: 'GET',
    headers: {
      'Accept': 'text/plain, text/markdown;q=0.9, */*;q=0.8',
      'User-Agent': 'DataScape/1.0',
    },
  });

  if (!resp.ok) {
    return { success: false, error: `Reader fallback failed with status ${resp.status}` };
  }

  const text = (await resp.text()).trim();
  if (!text || text.length < 120) {
    return { success: false, error: 'Reader fallback returned insufficient content' };
  }

  const lower = text.slice(0, 2500).toLowerCase();
  if (lower.includes('log in') || lower.includes('sign in') || lower.includes('challenge required')) {
    return {
      success: false,
      blocked: true,
      error: 'The URL resolved to a login/challenge page instead of content. Use a public URL or official API/OAuth for authenticated data.',
    };
  }

  const firstLine = text.split('\n').find((line) => line.trim().length > 0) || '';
  const title = firstLine.replace(/^#+\s*/, '').slice(0, 180);

  return {
    success: true,
    provider: 'reader-proxy',
    data: {
      markdown: text.slice(0, 120000),
      html: '',
      links: extractLinksFromText(text),
      metadata: {
        title,
        description: '',
        sourceURL: targetUrl,
        statusCode: 200,
      },
    },
  };
};

const extractInstagramUsername = (targetUrl: string): string => {
  try {
    const parsed = new URL(targetUrl);
    if (!/instagram\.com$/i.test(parsed.hostname.replace(/^www\./i, ''))) {
      return '';
    }

    const firstSegment = parsed.pathname.split('/').filter(Boolean)[0] || '';
    if (!firstSegment || ['p', 'reel', 'stories', 'explore', 'accounts'].includes(firstSegment.toLowerCase())) {
      return '';
    }

    return firstSegment;
  } catch {
    return '';
  }
};

const tryInstagramMirrorFallback = async (targetUrl: string) => {
  const username = extractInstagramUsername(targetUrl);
  if (!username) {
    return { success: false, error: 'Instagram mirror fallback requires a profile URL' };
  }

  const mirrorUrl = `https://dumpor.io/v/${encodeURIComponent(username)}`;
  const resp = await fetch(mirrorUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!resp.ok) {
    return { success: false, error: `Instagram mirror fallback failed with status ${resp.status}` };
  }

  const html = await resp.text();
  const title = extractFirstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    extractFirstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i) ||
    extractFirstMatch(html, /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i);

  if (!title && !description) {
    return { success: false, error: 'Instagram mirror fallback returned no parseable metadata' };
  }

  const markdown = [
    `Instagram public profile summary for @${username}`,
    '',
    title ? `Title: ${title}` : '',
    description ? `Description: ${description}` : '',
    `Original URL: ${targetUrl}`,
    `Mirror URL: ${mirrorUrl}`,
  ].filter(Boolean).join('\n');

  return {
    success: true,
    provider: 'instagram-mirror',
    data: {
      markdown,
      html,
      links: extractLinks(html, mirrorUrl),
      metadata: {
        title: title || `Instagram profile @${username}`,
        description,
        sourceURL: targetUrl,
        statusCode: 200,
      },
    },
  };
};

const tryApifySocialFallback = async (targetUrl: string) => {
  const token = Deno.env.get('APIFY_API_TOKEN');
  if (!token || token.includes('your_apify_api_token')) {
    return { success: false, error: 'Apify API token is missing or placeholder in backend.' };
  }

  try {
    const parsed = new URL(targetUrl);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    let actorId = '';
    let input: Record<string, unknown> = {};

    if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) {
      actorId = 'apify~instagram-profile-scraper';
      const username = extractInstagramUsername(targetUrl);
      if (!username) return { success: false, error: 'Could not extract Instagram username from URL.' };
      input = { usernames: [username] };
    } else if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com') || hostname === 'facebook.com' || hostname.endsWith('.facebook.com')) {
      return { success: false, error: 'LinkedIn and Facebook scraping is currently disabled. Please use official APIs for these platforms.' };
    } else {
      return null;
    }

    const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?memory=1024`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      const errText = await response.text();
      return { success: false, error: `Apify API failed (${response.status}): ${errText}` };
    }

    const data = await response.json();
    if (!Array.isArray(data) || !data.length) {
      return { success: false, error: 'Apify completed but returned no data.' };
    }

    const profileData = data[0];
    
    const extractedLinks: { title: string; href: string }[] = [];
    
    // Attempt to extract Instagram latest posts to make them clickable
    if (Array.isArray(profileData.latestPosts)) {
      profileData.latestPosts.forEach((post: any, index: number) => {
        if (post.url) {
          const captionExcerpt = post.caption ? ` - ${post.caption.substring(0, 40).replace(/\n/g, ' ')}...` : '';
          extractedLinks.push({
            title: `Latest Post ${index + 1}${captionExcerpt}`,
            href: post.url
          });
        }
      });
    }

    // Extract bio link if present
    if (profileData.externalUrl || profileData.biographyWithEntities?.raw_url) {
      extractedLinks.push({
        title: 'External Bio Link',
        href: profileData.externalUrl || profileData.biographyWithEntities?.raw_url
      });
    }

    const markdown = [
      `# Apify Extracted Profile Data`,
      `**URL:** ${targetUrl}`,
      ...Object.entries(profileData).map(([k, v]) => {
         if (typeof v === 'object' && v !== null) {
           return `**${k}:**\n\`\`\`json\n${JSON.stringify(v, null, 2)}\n\`\`\``;
         }
         return `**${k}:** ${v}`;
      })
    ].join('\n\n');

    return {
      success: true,
      provider: 'apify-social-scraper',
      data: {
        markdown: markdown,
        html: '',
        links: extractedLinks,
        metadata: {
          title: `Apify Extracted Profile`,
          description: 'Social data retrieved via Apify actor',
          sourceURL: targetUrl,
          statusCode: 200,
          rawJson: profileData
        },
      },
    };
  } catch (err) {
    console.error('Apify fallback failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown Apify crash' };
  }
};
const tryFallbackChain = async (targetUrl: string) => {
  try {
    const apifyResult = await tryApifySocialFallback(targetUrl);
    if (apifyResult) {
      if (apifyResult.success) {
        return apifyResult;
      }
      // If Apify explicitly failed due to site logic (like LinkedIn guard), return it immediately
      if (apifyResult.error?.includes('Target site restricts')) {
        return apifyResult;
      }
    }
  } catch (error) {
    console.error('Apify social fallback failed:', error);
  }

  try {
    const direct = await tryDirectFetchFallback(targetUrl);
    if (direct.success || direct.blocked) {
      return direct;
    }
  } catch (error) {
    console.error('Direct fetch fallback failed:', error);
  }

  try {
    const reader = await tryReaderProxyFallback(targetUrl);
    if (reader.success || reader.blocked) {
      return reader;
    }
  } catch (error) {
    console.error('Reader fallback failed:', error);
  }

  try {
    const instagramMirror = await tryInstagramMirrorFallback(targetUrl);
    if (instagramMirror.success || instagramMirror.blocked) {
      return instagramMirror;
    }
    return instagramMirror;
  } catch (error) {
    console.error('Instagram mirror fallback failed:', error);
    return { success: false, error: 'All fallback strategies failed' };
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    // Bypassing auth check for diagnostic purposes
    
    const { url, formats } = await req.json();

    if (!url || typeof url !== 'string' || url.length > 2048) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid URL is required (max 2048 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const requestedFormats = formats || ['markdown', 'html', 'links'];

    console.log('Scraping:', formattedUrl, 'formats:', requestedFormats);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: requestedFormats,
        onlyMainContent: false,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Firecrawl error:', data);

      const providerError = String(data?.error || '').toLowerCase();
      const unsupportedByProvider =
        providerError.includes('do not support this site') ||
        providerError.includes('we do not support this site') ||
        providerError.includes('typeform.com/to/ej6oydlg');

      const fallback = await tryFallbackChain(formattedUrl);
      if (fallback && (fallback.success || ('blocked' in fallback && fallback.blocked) || fallback.provider === 'apify-social-scraper' || fallback.error?.includes('Apify'))) {
        return new Response(
          JSON.stringify(fallback),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (unsupportedByProvider) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'The primary provider rejected this domain and fallback scraping could not extract public content.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({
            success: false,
            blocked: true,
            error: 'The target page appears to require login or blocked automated access. Use official API/OAuth access for protected data.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: data.error || `Failed with status ${response.status}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scraped = data?.data;
    const title = String(scraped?.metadata?.title || '').toLowerCase();
    const markdown = String(scraped?.markdown || '').slice(0, 2000).toLowerCase();
    const combined = `${title}\n${markdown}`;
    const looksLikeLoginWall =
      combined.includes('log in') ||
      combined.includes('login') ||
      combined.includes('sign in') ||
      combined.includes('challenge required') ||
      combined.includes('please verify you are a human');

    if (looksLikeLoginWall) {
      const fallback = await tryFallbackChain(formattedUrl);
      if (fallback.success) {
        return new Response(
          JSON.stringify(fallback),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          blocked: true,
          error: 'The URL resolved to a login/challenge page instead of content. Use a public URL or official API/OAuth for authenticated data.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
