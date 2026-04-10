import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

const OAuthComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const provider = searchParams.get('provider') || 'social';
    const redirectTo = searchParams.get('redirect_to') || '/connections';
    const connected = searchParams.get('connected') === '1';

    const withOAuthDoneFlag = (value: string) => {
      try {
        const parsed = new URL(value, window.location.origin);
        parsed.searchParams.set('oauth_done', '1');
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return value;
      }
    };

    const finish = async () => {
      try {
        if (window.opener && !window.opener.closed) {
          const redirectTarget = withOAuthDoneFlag(redirectTo);

          try {
            window.opener.postMessage(
              {
                type: 'oauth-complete',
                provider,
                connected,
                redirectTo: redirectTarget,
              },
              window.location.origin,
            );
          } catch {
            // Ignore cross-window messaging failures; opener navigation below is the fallback.
          }

          if (connected) {
            window.opener.location.href = redirectTarget;
          } else {
            window.opener.location.href = redirectTo;
          }
          window.close();
          return;
        }
      } catch {
        // Fall back to same-tab navigation.
      }

      navigate(connected ? withOAuthDoneFlag(redirectTo) : redirectTo, { replace: true });
    };

    void finish();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-2xl border border-border bg-card/80 p-6 text-center space-y-4"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="font-mono text-lg font-semibold">OAuth complete</h1>
          <p className="text-sm text-muted-foreground">Returning you to DataScrape...</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Closing this tab automatically
        </div>
      </motion.div>
    </div>
  );
};

export default OAuthComplete;
