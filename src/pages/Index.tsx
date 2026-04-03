import { useState } from 'react';
import { Braces, Shield, Zap, Database } from 'lucide-react';
import { ScraperForm } from '@/components/ScraperForm';
import { ResultsPanel } from '@/components/ResultsPanel';
import { scrapeWebsite, ScrapeResult } from '@/lib/api/scraper';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  const handleScrape = async (url: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const data = await scrapeWebsite(url, ['markdown', 'html', 'links']);

      if (data.success || data.data) {
        setResult(data);
        toast({ title: 'Scrape complete', description: 'Data extracted successfully' });
      } else {
        toast({
          title: 'Scrape failed',
          description: data.error || 'Could not extract data',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to connect. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Subtle grid bg */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(190 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190 100% 50%) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-12">
          {/* Logo / title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-mono text-primary">Web Data Extractor</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-mono font-bold tracking-tight mb-4">
              <span className="text-gradient-primary">DataScrape</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">
              Extract all data from any website — structured or unstructured. Export as JSON or CSV instantly.
            </p>
          </div>

          {/* Scraper form */}
          <div className="mb-8">
            <ScraperForm onScrape={handleScrape} isLoading={isLoading} />
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-12 animate-in fade-in-0">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <p className="text-sm font-mono text-muted-foreground">Extracting data...</p>
            </div>
          )}

          {/* Results */}
          {result && !isLoading && <ResultsPanel result={result} />}
        </div>
      </div>

      {/* Features */}
      {!result && !isLoading && (
        <div className="max-w-4xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Zap, title: 'Fast Extraction', desc: 'Scrape any page in seconds' },
              { icon: Database, title: 'All Data Types', desc: 'Structured & unstructured' },
              { icon: Braces, title: 'JSON & CSV', desc: 'Export in any format' },
              { icon: Shield, title: 'Any Website', desc: 'Handles JS-rendered pages' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-4 rounded-lg bg-card border border-border hover:border-glow transition-colors"
              >
                <Icon className="h-5 w-5 text-primary mb-2" />
                <h3 className="font-mono text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
