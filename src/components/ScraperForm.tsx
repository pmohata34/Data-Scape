import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScraperFormProps {
  onScrape: (url: string) => void;
  isLoading: boolean;
}

export const ScraperForm = ({ onScrape, isLoading }: ScraperFormProps) => {
  const [url, setUrl] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onScrape(url.trim());
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="w-full"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl border bg-card/60"
        style={{ backdropFilter: 'blur(20px)' }}
        animate={{
          borderColor: focused
            ? 'hsl(190 100% 50% / 0.4)'
            : 'hsl(220 15% 18% / 1)',
          boxShadow: focused
            ? '0 0 30px hsl(190 100% 50% / 0.15)'
            : '0 0 0 transparent',
        }}
      >
        <div className="relative flex-1">
          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Enter any website URL..."
            className="pl-12 h-12 bg-transparent border-0 shadow-none focus-visible:ring-0 font-mono text-sm"
            disabled={isLoading}
          />
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            type="submit"
            disabled={isLoading || !url.trim()}
            variant="glow"
            size="lg"
            className="h-12 px-8 font-mono font-semibold rounded-xl"
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
        </motion.div>
      </motion.div>
    </motion.form>
  );
};
