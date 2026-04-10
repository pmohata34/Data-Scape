import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { downloadFile } from '@/lib/api/scraper';
import { ParticleField } from '@/components/ParticleField';
import { FloatingOrbs } from '@/components/FloatingOrbs';
import { NavBar } from '@/components/NavBar';
import {
  Globe, Link2, FileText, Trash2, ExternalLink,
  ArrowLeft, Search, Calendar, FileJson, FileSpreadsheet, X
} from 'lucide-react';

interface HistoryItem {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  status_code: number | null;
  links_count: number | null;
  content_length: number | null;
  scraped_at: string;
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('scrape_history')
      .select('*')
      .order('scraped_at', { ascending: false });
    setHistory((data as HistoryItem[]) || []);
    setLoading(false);
  };

  const deleteItem = async (id: string) => {
    await supabase.from('scrape_history').delete().eq('id', id);
    setHistory(history.filter(h => h.id !== id));
  };

  const filtered = history.filter(h =>
    h.url.toLowerCase().includes(search.toLowerCase()) ||
    h.title?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const buildHistoryPayload = (item: HistoryItem) => ({
    id: item.id,
    url: item.url,
    title: item.title,
    description: item.description,
    statusCode: item.status_code,
    linksCount: item.links_count,
    contentLength: item.content_length,
    scrapedAt: item.scraped_at,
  });

  const toSafeFilename = (item: HistoryItem) => {
    let fallbackHost = 'history_item';
    try {
      fallbackHost = new URL(item.url).hostname || fallbackHost;
    } catch {
      fallbackHost = item.url || fallbackHost;
    }

    return (item.title || fallbackHost)
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .substring(0, 40);
  };

  const downloadHistoryAsJSON = (item: HistoryItem) => {
    const content = JSON.stringify(buildHistoryPayload(item), null, 2);
    downloadFile(content, `history_${toSafeFilename(item)}.json`, 'application/json');
  };

  const downloadHistoryAsCSV = (item: HistoryItem) => {
    const payload = buildHistoryPayload(item);
    const rows = [
      ['Field', 'Value'],
      ['ID', payload.id],
      ['URL', payload.url],
      ['Title', payload.title || ''],
      ['Description', payload.description || ''],
      ['Status Code', String(payload.statusCode || '')],
      ['Links Count', String(payload.linksCount || '')],
      ['Content Length', String(payload.contentLength || '')],
      ['Scraped At', payload.scrapedAt],
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    downloadFile(csv, `history_${toSafeFilename(item)}.csv`, 'text/csv');
  };

  return (
    <div className="min-h-screen bg-background mesh-bg relative">
      <ParticleField />
      <FloatingOrbs />
      <NavBar />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ x: -4 }}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <h1 className="text-3xl font-mono font-bold text-gradient-primary">
              Scrape History
            </h1>
          </div>
          <p className="text-muted-foreground ml-8">
            {history.length} total scrapes performed
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search history..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl glass-panel font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </motion.div>

        {/* History list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div
              className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Globe className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground font-mono">
              {search ? 'No results found' : 'No scraping history yet'}
            </p>
            {!search && (
              <Button
                variant="glow"
                className="mt-4 font-mono"
                onClick={() => navigate('/')}
              >
                Start Scraping
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  onClick={() => setSelectedItem(item)}
                  className="group rounded-xl glass-panel p-5 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden"
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-primary shrink-0" />
                        <h3 className="font-mono font-semibold text-foreground truncate">
                          {item.title || 'Untitled Page'}
                        </h3>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-muted-foreground hover:text-primary font-mono truncate block mb-3"
                      >
                        {item.url}
                        <ExternalLink className="inline-block w-3 h-3 ml-1" />
                      </a>

                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.scraped_at)}
                        </span>
                        {item.links_count !== null && (
                          <span className="flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            {item.links_count} links
                          </span>
                        )}
                        {item.content_length !== null && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {(item.content_length / 1024).toFixed(1)}KB
                          </span>
                        )}
                        {item.status_code && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                            item.status_code === 200 
                              ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]'
                              : 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]'
                          }`}>
                            {item.status_code}
                          </span>
                        )}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
          >
            <div className="absolute inset-0 bg-black/60" />
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg rounded-2xl glass-panel p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-primary font-mono mb-1">History Export</p>
                  <h3 className="font-mono text-foreground font-semibold truncate max-w-[280px]">
                    {selectedItem.title || 'Untitled Page'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground font-mono truncate mb-5">{selectedItem.url}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="font-mono text-xs"
                  onClick={() => downloadHistoryAsJSON(selectedItem)}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  Download JSON
                </Button>
                <Button
                  variant="outline"
                  className="font-mono text-xs"
                  onClick={() => downloadHistoryAsCSV(selectedItem)}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Download CSV
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default History;
