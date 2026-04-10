import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram, Linkedin, RefreshCw, Unlink, ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavBar } from '@/components/NavBar';
import { FloatingOrbs } from '@/components/FloatingOrbs';
import { ParticleField } from '@/components/ParticleField';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  disconnectSocialProvider,
  getSocialConnectionStatus,
  startSocialConnection,
  type SocialConnectionStatus,
  type SocialProvider,
} from '@/lib/api/social';

const providerMeta: Record<SocialProvider, {
  title: string;
  description: string;
  icon: typeof Instagram;
  capability: string;
}> = {
  instagram: {
    title: 'Instagram Graph API',
    description: 'Connect a business or creator account to fetch approved profile and media data.',
    icon: Instagram,
    capability: 'Approved data: profile, recent media, comments on owned media.',
  },
  linkedin: {
    title: 'LinkedIn API',
    description: 'Connect your LinkedIn profile to fetch approved account data through the official API.',
    icon: Linkedin,
    capability: 'Approved data: profile, email, and permitted profile fields.',
  },
};

const providerOrder: SocialProvider[] = ['instagram', 'linkedin'];

const Connections = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [connections, setConnections] = useState<SocialConnectionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyProvider, setBusyProvider] = useState<SocialProvider | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (connected && provider) {
      toast({
        title: 'Connection saved',
        description: `${provider.charAt(0).toUpperCase() + provider.slice(1)} account connected successfully.`,
      });
      searchParams.delete('connected');
      searchParams.delete('provider');
      setSearchParams(searchParams, { replace: true });
    }

    if (error) {
      toast({
        title: 'Connection failed',
        description: error,
        variant: 'destructive',
      });
      searchParams.delete('error');
      searchParams.delete('provider');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  const loadConnections = async () => {
    setIsLoading(true);
    try {
      const status = await getSocialConnectionStatus();
      setConnections(status);
    } catch (error) {
      toast({
        title: 'Unable to load connections',
        description: error instanceof Error ? error.message : 'Failed to load social connections',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const getConnection = (provider: SocialProvider) => connections.find((item) => item.provider === provider);

  const connectProvider = async (provider: SocialProvider) => {
    setBusyProvider(provider);
    try {
      const { authUrl } = await startSocialConnection(provider, '/connections');
      window.location.assign(authUrl);
    } catch (error) {
      toast({
        title: 'Could not start OAuth flow',
        description: error instanceof Error ? error.message : 'Failed to start connection flow',
        variant: 'destructive',
      });
      setBusyProvider(null);
    }
  };

  const disconnectProvider = async (provider: SocialProvider) => {
    setBusyProvider(provider);
    try {
      await disconnectSocialProvider(provider);
      toast({ title: 'Disconnected', description: `${providerMeta[provider].title} disconnected.` });
      await loadConnections();
    } catch (error) {
      toast({
        title: 'Disconnect failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect provider',
        variant: 'destructive',
      });
    } finally {
      setBusyProvider(null);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <ParticleField />
      <FloatingOrbs />
      <NavBar />

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-mono font-bold text-gradient-primary">Connections</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Connect official Instagram and LinkedIn APIs so DataScrape can fetch approved account data instead of scraping login-protected pages.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {providerOrder.map((provider) => {
            const meta = providerMeta[provider];
            const Icon = meta.icon;
            const connection = getConnection(provider);
            const isBusy = busyProvider === provider;
            const isConnected = Boolean(connection);

            return (
              <motion.div
                key={provider}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card/75 p-6 space-y-4"
                style={{ backdropFilter: 'blur(16px)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl border border-primary/20 bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-mono font-semibold text-lg">{meta.title}</h2>
                      <p className="text-sm text-muted-foreground">{meta.description}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-mono ${isConnected ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : 'bg-secondary text-muted-foreground'}`}>
                    {isConnected ? 'Connected' : 'Not connected'}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground font-mono">
                  {meta.capability}
                </p>

                {isConnected && connection ? (
                  <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-primary/80 font-mono mb-1">Account</p>
                      <p className="font-mono text-sm">{connection.external_account_name || connection.external_account_id || 'Connected account'}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground font-mono">
                      <div>Connected: {connection.connected_at ? new Date(connection.connected_at).toLocaleString() : 'Unknown'}</div>
                      <div>Expires: {connection.expires_at ? new Date(connection.expires_at).toLocaleString() : 'Not set'}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-mono text-xs"
                        onClick={() => window.open('https://developers.facebook.com/docs/instagram-api' , '_blank')}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Docs
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-mono text-xs"
                        onClick={() => disconnectProvider(provider)}
                        disabled={isBusy}
                      >
                        <Unlink className="h-3.5 w-3.5" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connect your account to unlock approved API data for this provider.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="glow"
                        className="font-mono text-xs"
                        onClick={() => connectProvider(provider)}
                        disabled={isBusy}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                        Connect {meta.title}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-3">
          <h3 className="font-mono font-semibold">Supported approved data</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Instagram: business/creator profile data and recent owned media through the Graph API.</li>
            <li>LinkedIn: approved profile and email data through the official LinkedIn API.</li>
            <li>Public pages still use the existing public scraping path when no connection is available.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Connections;
