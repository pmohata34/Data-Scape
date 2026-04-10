import { supabase } from '@/integrations/supabase/client';
import { fetchApprovedSocialData, getSocialProviderFromUrl } from '@/lib/api/social';

export type ScrapeFormat = 'markdown' | 'html' | 'links' | 'rawHtml';

export interface ScrapeResult {
  success: boolean;
  error?: string;
  provider?: string;
  blocked?: boolean;
  requiresConnection?: boolean;
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
      [key: string]: unknown;
    };
  };
}

export async function scrapeWebsite(url: string, formats: ScrapeFormat[]): Promise<ScrapeResult> {
  const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
    body: { url, formats },
  });

  if (error) {
    if (error.message?.includes('non-2xx')) {
      const maybeContext = (error as { context?: Response }).context;
      if (maybeContext?.status === 401) {
        await supabase.auth.signOut();
        return { success: false, error: 'session expired. Please re-authenticate.' };
      }
      
      if (maybeContext) {
        try {
          const details = await maybeContext.json() as { error?: string };
          if (details?.error) {
            return { success: false, error: details.error };
          }
        } catch {
          // Fall through to default error message.
        }
      }
    }

    return { success: false, error: error.message || 'Scrape request failed' };
  }

  return data;
}

export function convertToJSON(result: ScrapeResult): string {
  const exportData = {
    url: result.data?.metadata?.sourceURL,
    title: result.data?.metadata?.title,
    description: result.data?.metadata?.description,
    metadata: result.data?.metadata,
    content: {
      markdown: result.data?.markdown,
      html: result.data?.html,
      links: result.data?.links,
    },
    scrapedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
}

export function convertToCSV(result: ScrapeResult): string {
  const rows: string[][] = [];

  // Metadata
  rows.push(['Field', 'Value']);
  rows.push(['URL', result.data?.metadata?.sourceURL || '']);
  rows.push(['Title', result.data?.metadata?.title || '']);
  rows.push(['Description', result.data?.metadata?.description || '']);
  rows.push(['Language', result.data?.metadata?.language || '']);
  rows.push(['Status Code', String(result.data?.metadata?.statusCode || '')]);
  rows.push(['Scraped At', new Date().toISOString()]);
  rows.push(['', '']);

  // Links
  if (result.data?.links?.length) {
    rows.push(['Links', '']);
    result.data.links.forEach((link, i) => {
      rows.push([`Link ${i + 1}`, link]);
    });
    rows.push(['', '']);
  }

  // Content
  if (result.data?.markdown) {
    rows.push(['Content (Markdown)', result.data.markdown.substring(0, 32000)]);
  }

  return rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
