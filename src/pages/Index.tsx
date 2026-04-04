import { useState } from 'react';
import { motion } from 'framer-motion';
import { Braces, Shield, Zap, Database, Globe, Cpu, Sparkles, Layers } from 'lucide-react';
import { ScraperForm } from '@/components/ScraperForm';
import { ResultsPanel } from '@/components/ResultsPanel';
import { ParticleField } from '@/components/ParticleField';
import { FloatingOrbs } from '@/components/FloatingOrbs';
import { GlitchText } from '@/components/GlitchText';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { NavBar } from '@/components/NavBar';
import { scrapeWebsite, ScrapeResult } from '@/lib/api/scraper';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const features = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Extract data in seconds with parallel processing', color: 'hsl(var(--primary))' },
  { icon: Database, title: 'All Data Types', desc: 'Structured, unstructured — we handle everything', color: 'hsl(var(--success))' },
  { icon: Braces, title: 'JSON & CSV', desc: 'Export in any format with one click', color: 'hsl(var(--warning))' },
  { icon: Shield, title: 'JS Rendering', desc: 'Handles dynamic JS-rendered pages', color: 'hsl(270, 80%, 60%)' },
];

const stats = [
  { label: 'Pages Scraped', value: 10000, suffix: '+' },
  { label: 'Data Points', value: 5000000, suffix: '+' },
  { label: 'Formats', value: 4, suffix: '' },
];

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
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

        // Save to history if logged in
        if (user) {
          const meta = data.data?.metadata;
          await supabase.from('scrape_history').insert({
            user_id: user.id,
            url,
            title: meta?.title || null,
            description: meta?.description || null,
            status_code: meta?.statusCode || null,
            links_count: data.data?.links?.length || 0,
            content_length: data.data?.markdown?.length || 0,
          });
        }
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
    <div className="min-h-screen bg-background relative">
      <ParticleField />
      <FloatingOrbs />
      <NavBar />

      {/* Hero */}
      <div className="relative overflow-hidden z-10">
        {/* Animated grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(hsl(190 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(190 100% 50%) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 pt-28 pb-12">
          {/* Badge */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8"
              animate={{ boxShadow: ['0 0 20px hsl(190 100% 50% / 0.1)', '0 0 40px hsl(190 100% 50% / 0.2)', '0 0 20px hsl(190 100% 50% / 0.1)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-xs font-mono text-primary tracking-wider uppercase">Web Data Extractor v2.0</span>
            </motion.div>

            <GlitchText
              text="DataScrape"
              className="text-5xl sm:text-7xl font-mono font-bold text-gradient-primary block mb-4"
            />

            <motion.p
              className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Extract <span className="text-primary font-semibold">all data</span> from any website — structured or unstructured.
              Export as JSON or CSV instantly.
            </motion.p>
          </motion.div>

          {/* Stats */}
          {!result && !isLoading && (
            <motion.div
              className="flex justify-center gap-8 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-mono font-bold text-foreground">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Scraper form */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ScraperForm onScrape={handleScrape} isLoading={isLoading} />
          </motion.div>

          {/* Loading state */}
          {isLoading && (
            <motion.div
              className="flex flex-col items-center gap-4 py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="relative w-20 h-20">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute inset-2 rounded-full border-2 border-[hsl(var(--success))]/30 border-b-transparent"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-mono text-foreground">Extracting data...</p>
                <motion.p
                  className="text-xs font-mono text-muted-foreground"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Parsing DOM, collecting assets, building dataset
                </motion.p>
              </div>
            </motion.div>
          )}

          {/* Results */}
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ResultsPanel result={result} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Features */}
      {!result && !isLoading && (
        <div className="relative z-10 max-w-4xl mx-auto px-4 pb-20">
          <motion.h2
            className="text-center text-2xl font-mono font-bold text-foreground mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Why <span className="text-gradient-primary">DataScrape</span>?
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc, color }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group p-5 rounded-xl bg-card/60 border border-border hover:border-primary/30 transition-all relative overflow-hidden"
                style={{ backdropFilter: 'blur(10px)' }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <motion.div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${color}15` }}
                    whileHover={{ rotate: 12 }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </motion.div>
                  <h3 className="font-mono text-sm font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How it works */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-center text-2xl font-mono font-bold text-foreground mb-10">
              How It <span className="text-gradient-primary">Works</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Globe, step: '01', title: 'Enter URL', desc: 'Paste any website link — we handle the rest' },
                { icon: Cpu, step: '02', title: 'AI Extraction', desc: 'Our engine parses all content types automatically' },
                { icon: Sparkles, step: '03', title: 'Export Data', desc: 'Download clean JSON or CSV with one click' },
              ].map(({ icon: Icon, step, title, desc }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center p-6"
                >
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4"
                    whileHover={{ scale: 1.1, rotate: 6 }}
                  >
                    <Icon className="w-6 h-6 text-primary" />
                  </motion.div>
                  <span className="text-xs font-mono text-primary/60 block mb-2">{step}</span>
                  <h3 className="font-mono font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            © 2026 DataScrape — Built with precision
          </span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-primary/40"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
