import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrapeResult, convertToJSON, convertToCSV, downloadFile } from '@/lib/api/scraper';
import { useToast } from '@/hooks/use-toast';

interface ResultsPanelProps {
  result: ScrapeResult;
}

export const ResultsPanel = ({ result }: ResultsPanelProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const scraped = result.data || (result as any).data?.data;
  const metadata = scraped?.metadata;
  const markdown = scraped?.markdown;
  const links = scraped?.links || [];

  const handleExportJSON = () => {
    const json = convertToJSON(result);
    const filename = `scrape_${metadata?.title?.replace(/\s+/g, '_').substring(0, 30) || 'data'}.json`;
    downloadFile(json, filename, 'application/json');
    toast({ title: 'Exported', description: 'JSON file downloaded' });
  };

  const handleExportCSV = () => {
    const csv = convertToCSV(result);
    const filename = `scrape_${metadata?.title?.replace(/\s+/g, '_').substring(0, 30) || 'data'}.csv`;
    downloadFile(csv, filename, 'text/csv');
    toast({ title: 'Exported', description: 'CSV file downloaded' });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(convertToJSON(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
      {/* Header with metadata */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-secondary border border-border">
        <div className="min-w-0 flex-1">
          <h3 className="font-mono font-semibold text-foreground truncate">
            {metadata?.title || 'Scraped Data'}
          </h3>
          {metadata?.sourceURL && (
            <a
              href={metadata.sourceURL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
            >
              {metadata.sourceURL}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleCopy} className="font-mono text-xs">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON} className="font-mono text-xs">
            <FileJson className="h-3 w-3" />
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="font-mono text-xs">
            <FileSpreadsheet className="h-3 w-3" />
            CSV
          </Button>
        </div>
      </div>

      {/* Content tabs */}
      <Tabs defaultValue="markdown" className="w-full">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="markdown" className="font-mono text-xs">Content</TabsTrigger>
          <TabsTrigger value="links" className="font-mono text-xs">
            Links ({links.length})
          </TabsTrigger>
          <TabsTrigger value="metadata" className="font-mono text-xs">Metadata</TabsTrigger>
          <TabsTrigger value="raw" className="font-mono text-xs">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="markdown" className="mt-3">
          <div className="rounded-lg bg-secondary border border-border p-4 max-h-[500px] overflow-auto">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {markdown || 'No content extracted'}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="links" className="mt-3">
          <div className="rounded-lg bg-secondary border border-border p-4 max-h-[500px] overflow-auto space-y-1">
            {links.length > 0 ? links.map((link: string, i: number) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:text-primary/80 truncate font-mono"
              >
                {link}
              </a>
            )) : (
              <p className="text-muted-foreground text-sm">No links found</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metadata" className="mt-3">
          <div className="rounded-lg bg-secondary border border-border p-4 max-h-[500px] overflow-auto">
            <pre className="text-sm text-foreground font-mono">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="mt-3">
          <div className="rounded-lg bg-secondary border border-border p-4 max-h-[500px] overflow-auto">
            <pre className="text-xs text-muted-foreground font-mono">
              {JSON.stringify(scraped, null, 2)}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
