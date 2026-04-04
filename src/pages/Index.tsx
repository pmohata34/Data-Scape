import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

const howItWorksSteps = [
  {
    icon: Globe,
    step: '01',
    title: 'Enter URL',
    desc: 'Paste any website link — we handle the rest',
    detail: 'Auto-normalized URLs, retries, and rendering support for dynamic pages.',
    color: 'hsl(var(--primary))',
  },
  {
    icon: Cpu,
    step: '02',
    title: 'AI Extraction',
    desc: 'Our engine parses all content types automatically',
    detail: 'Extracts metadata, links, and rich content in a structured output model.',
    color: 'hsl(var(--success))',
  },
  {
    icon: Sparkles,
    step: '03',
    title: 'Export Data',
    desc: 'Download clean JSON or CSV with one click',
    detail: 'Ready for BI dashboards, ETL pipelines, and analytics workflows.',
    color: 'hsl(var(--warning))',
  },
];

interface OrbitCardItem {
  icon: ReactNode;
  title: string;
  subtitle: string;
  frontText: string;
  backText: string;
  accentColor: string;
}

interface CircularCardOrbitProps {
  items: OrbitCardItem[];
  activeIndex: number;
  delay?: number;
}

interface RevolvingFeatureCardProps {
  items: OrbitCardItem[];
  activeIndex: number;
}

const RevolvingFeatureCard = ({ items, activeIndex }: RevolvingFeatureCardProps) => {
  const active = items[activeIndex % items.length];

  return (
    <div className="max-w-2xl mx-auto" style={{ perspective: '1400px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={active.title}
          initial={{ opacity: 0, rotateY: -95, y: 10 }}
          animate={{ opacity: 1, rotateY: 0, y: 0 }}
          exit={{ opacity: 0, rotateY: 95, y: -10 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
          className="relative rounded-2xl border border-primary/20 bg-card/65 p-7 sm:p-8 min-h-[240px]"
          style={{ transformStyle: 'preserve-3d', backdropFilter: 'blur(10px)' }}
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/12 via-transparent to-[hsl(var(--success))]/8 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center border border-primary/25"
                style={{ backgroundColor: `${active.accentColor}22` }}
              >
                {active.icon}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-mono text-primary/70">{active.subtitle}</p>
                <h3 className="font-mono text-lg font-semibold text-foreground">{active.title}</h3>
              </div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed mb-3">{active.frontText}</p>
            <p className="text-xs font-mono text-primary/80">{active.backText}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const CircularCardOrbit = ({ items, activeIndex, delay = 0 }: CircularCardOrbitProps) => {
  const activeItem = items[activeIndex % items.length];
  const angleStep = 360 / items.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="relative"
    >
      <div className="relative h-[230px] sm:h-[250px]">
        {items.map((item, index) => {
          const angle = (index - activeIndex) * angleStep - 90;
          const radians = (angle * Math.PI) / 180;
          const x = Math.cos(radians) * 132;
          const y = Math.sin(radians) * 72;
          const isActive = index === activeIndex;

          return (
            <motion.div
              key={`${item.title}-${index}`}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{
                x,
                y,
                scale: isActive ? 1.1 : 0.86,
                opacity: isActive ? 1 : 0.58,
              }}
              transition={{ type: 'spring', stiffness: 170, damping: 22 }}
              style={{ zIndex: isActive ? 30 : 10 }}
            >
              <div
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-primary/30 bg-card/80 flex items-center justify-center"
                style={{
                  background: `linear-gradient(140deg, ${item.accentColor}22 0%, hsl(var(--card)) 75%)`,
                  boxShadow: isActive ? `0 0 20px ${item.accentColor}66` : 'none',
                }}
              >
                {item.icon}
              </div>
            </motion.div>
          );
        })}

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-primary/20" />
      </div>

      <motion.div
        key={activeItem.title}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="relative rounded-xl border border-border/80 bg-card/60 p-5"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-widest font-mono text-primary/70 mb-1">{activeItem.subtitle}</p>
          <h3 className="font-mono text-base font-semibold text-foreground mb-2">{activeItem.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">{activeItem.frontText}</p>
          <p className="text-xs text-primary/80 font-mono">{activeItem.backText}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

const marketPrimaryPath =
  'M-220 250 L-198 244 L-176 252 L-154 238 L-132 246 L-110 228 L-88 238 L-66 220 L-44 234 L-22 214 L0 224 L22 206 L44 220 L66 196 L88 210 L110 186 L132 198 L154 176 L176 190 L198 170 L220 182 L242 166 L264 178 L286 156 L308 168 L330 148 L352 162 L374 140 L396 154 L418 134 L440 148 L462 126 L484 140 L506 120 L528 134 L550 114 L572 130 L594 108 L616 122 L638 102 L660 116 L682 96 L704 112 L726 90 L748 104 L770 86 L792 98 L814 82 L836 94 L858 78 L880 88 L902 74 L924 84 L946 72';

const marketSecondaryPath =
  'M-220 286 L-196 282 L-172 288 L-148 274 L-124 280 L-100 266 L-76 274 L-52 260 L-28 270 L-4 254 L20 264 L44 248 L68 258 L92 240 L116 252 L140 234 L164 246 L188 228 L212 240 L236 222 L260 234 L284 216 L308 228 L332 210 L356 222 L380 204 L404 216 L428 198 L452 210 L476 192 L500 204 L524 186 L548 198 L572 180 L596 194 L620 176 L644 188 L668 170 L692 184 L716 166 L740 178 L764 160 L788 174 L812 156 L836 168 L860 152 L884 164 L908 148 L932 158 L956 144';

const marketAreaPath =
  'M-220 250 L-198 244 L-176 252 L-154 238 L-132 246 L-110 228 L-88 238 L-66 220 L-44 234 L-22 214 L0 224 L22 206 L44 220 L66 196 L88 210 L110 186 L132 198 L154 176 L176 190 L198 170 L220 182 L242 166 L264 178 L286 156 L308 168 L330 148 L352 162 L374 140 L396 154 L418 134 L440 148 L462 126 L484 140 L506 120 L528 134 L550 114 L572 130 L594 108 L616 122 L638 102 L660 116 L682 96 L704 112 L726 90 L748 104 L770 86 L792 98 L814 82 L836 94 L858 78 L880 88 L902 74 L924 84 L946 72 L946 320 L-220 320 Z';

const realPhotoShowcase = [
  {
    title: 'E-commerce Catalogs',
    caption: 'Extract product titles, pricing, and ratings at scale.',
    image:
      'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1400&q=80',
    alt: 'People shopping in a modern retail store',
  },
  {
    title: 'Travel Intelligence',
    caption: 'Collect destination details, reviews, and useful links.',
    image:
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=80',
    alt: 'Traveler with a backpack looking over a city view',
  },
  {
    title: 'News Monitoring',
    caption: 'Track headlines, summaries, and source metadata in one flow.',
    image:
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1400&q=80',
    alt: 'Person reading printed newspapers',
  },
];

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [activeFeatureCard, setActiveFeatureCard] = useState(0);
  const [activeStepCard, setActiveStepCard] = useState(0);
  const [isHowItWorksRevealed, setIsHowItWorksRevealed] = useState(false);

  useEffect(() => {
    const featureTimer = window.setInterval(() => {
      setActiveFeatureCard((prev) => (prev + 1) % features.length);
    }, 2300);

    const stepTimer = window.setInterval(() => {
      setActiveStepCard((prev) => (prev + 1) % howItWorksSteps.length);
    }, 2600);

    return () => {
      window.clearInterval(featureTimer);
      window.clearInterval(stepTimer);
    };
  }, []);

  useEffect(() => {
    if (!isHowItWorksRevealed) return;

    const hideTimer = window.setTimeout(() => {
      setIsHowItWorksRevealed(false);
    }, 5 * 60 * 1000);

    return () => {
      window.clearTimeout(hideTimer);
    };
  }, [isHowItWorksRevealed]);

  const handleScrape = async (url: string) => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to scrape website data.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

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
              Extract all data from any website.
              Export as JSON or CSV instantly.
            </motion.p>

            <motion.p
              className="text-sm sm:text-base text-muted-foreground/90 max-w-2xl mx-auto mt-4 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              DataScrape helps teams collect clean website intelligence for analytics, lead generation,
              content monitoring, and research workflows without writing custom scraping scripts.
            </motion.p>

            <motion.p
              className="text-xs font-mono tracking-wide text-primary/80 mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              FAST CRAWL  ·  SMART PARSING  ·  READY-TO-EXPORT DATA
            </motion.p>
          </motion.div>

          {!user && !result && !isLoading && (
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <motion.div
                  className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card/40 md:col-span-3"
                  style={{ backdropFilter: 'blur(10px)' }}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-[hsl(var(--success))]/10 pointer-events-none" />
                  <div className="relative h-full min-h-[220px] bg-[hsl(220_48%_10%)]">
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: 'linear-gradient(to right, hsl(190 100% 50% / 0.25) 1px, transparent 1px), linear-gradient(to bottom, hsl(190 100% 50% / 0.2) 1px, transparent 1px)',
                      backgroundSize: '28px 28px',
                    }} />
                    <svg
                      viewBox="0 0 760 320"
                      className="w-full h-full"
                      role="img"
                      aria-label="Animated stock market trend chart"
                    >
                      <motion.path
                        d={marketAreaPath}
                        fill="url(#marketFill)"
                        animate={{ x: [0, -180], opacity: [0.45, 0.6, 0.45] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      />
                      <defs>
                        <linearGradient id="marketFill" x1="0" y1="80" x2="0" y2="320" gradientUnits="userSpaceOnUse">
                          <stop offset="0" stopColor="hsl(190 100% 50% / 0.35)" />
                          <stop offset="1" stopColor="hsl(190 100% 50% / 0.02)" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d={marketSecondaryPath}
                        fill="none"
                        stroke="hsl(var(--success))"
                        strokeOpacity="0.65"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="7 10"
                        animate={{ x: [0, -180], y: [0, 2, -1, 0], strokeDashoffset: [0, -60] }}
                        transition={{ duration: 3.8, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.path
                        d={marketPrimaryPath}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ filter: 'drop-shadow(0 0 10px hsl(190 100% 50% / 0.7))' }}
                        animate={{ x: [0, -180], y: [0, -2, 1, -1, 0] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.circle
                        cy="86"
                        r="4"
                        fill="hsl(var(--primary))"
                        style={{ filter: 'drop-shadow(0 0 10px hsl(190 100% 50% / 0.9))' }}
                        animate={{ x: [80, 730, 80], y: [0, -3, 2, -1, 0] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                      />
                    </svg>
                  </div>
                </motion.div>

                <motion.div
                  className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card/40 md:col-span-2"
                  style={{ backdropFilter: 'blur(10px)' }}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-[hsl(var(--success))]/15 pointer-events-none" />
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80"
                    alt="Team reviewing analytics dashboard on large monitor"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

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

          <RevolvingFeatureCard
            items={features.map(({ icon: Icon, title, desc, color }) => ({
              icon: <Icon className="h-5 w-5" style={{ color }} />,
              title,
              subtitle: 'Why DataScrape',
              frontText: desc,
              backText: `Built for reliability and scale: ${desc}`,
              accentColor: color,
            }))}
            activeIndex={activeFeatureCard}
          />

          {/* How it works */}
          <motion.div
            className="mt-20"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <button
              type="button"
              onClick={() => setIsHowItWorksRevealed(true)}
              className="mx-auto block text-center mb-10"
            >
              <h2 className="text-2xl font-mono font-bold text-foreground">
                How It <span className="text-gradient-primary">Works</span>
              </h2>
              {!isHowItWorksRevealed && (
                <p className="text-xs font-mono text-primary/70 mt-2">Click to reveal all steps</p>
              )}
            </button>

            {!isHowItWorksRevealed ? (
              <div className="relative">
                <motion.div
                  className="opacity-35 blur-[1.5px]"
                  animate={{ opacity: [0.25, 0.4, 0.25] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <CircularCardOrbit
                    items={howItWorksSteps.map(({ icon: Icon, step, title, desc, detail, color }) => ({
                      icon: <Icon className="h-5 w-5" style={{ color }} />,
                      title,
                      subtitle: `Step ${step}`,
                      frontText: desc,
                      backText: detail,
                      accentColor: color,
                    }))}
                    activeIndex={activeStepCard}
                    delay={0.1}
                  />
                </motion.div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {howItWorksSteps.map(({ icon: Icon, step, title, desc, detail, color }, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.12, duration: 0.35 }}
                    className="relative overflow-hidden rounded-xl border border-primary/20 bg-card/60 p-5"
                    style={{ backdropFilter: 'blur(10px)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${color}22` }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <p className="text-[11px] uppercase tracking-widest font-mono text-primary/70">Step {step}</p>
                      <h3 className="font-mono text-sm font-semibold text-foreground mt-1 mb-2">{title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{desc}</p>
                      <p className="text-[11px] font-mono text-primary/80">{detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Real photos */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-mono font-bold text-foreground mb-2">
            Real-World <span className="text-gradient-primary">Use Cases</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            DataScrape fits real industries, from market research to content intelligence.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {realPhotoShowcase.map((card, index) => (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group overflow-hidden rounded-2xl border border-border bg-card/50"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={card.image}
                  alt={card.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-mono font-semibold text-foreground mb-1">{card.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.caption}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

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
