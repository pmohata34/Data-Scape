import { useState } from 'react';
import { Globe, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScraperFormProps {
  onScrape: (url: string) => void;
  isLoading: boolean;
}

export const ScraperForm = ({ onScrape, isLoading }: ScraperFormProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onScrape(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter any website URL..."
            className="pl-11 h-12 bg-secondary border-border focus:border-primary focus:glow-primary font-mono text-sm"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !url.trim()}
          variant="glow"
          size="lg"
          className="h-12 px-8 font-mono font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Scrape
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
