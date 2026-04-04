import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, History, LogOut, User } from 'lucide-react';

export const NavBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50"
      style={{ backdropFilter: 'blur(20px)', backgroundColor: 'hsl(var(--background) / 0.8)' }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <motion.button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 group"
          whileHover={{ scale: 1.02 }}
        >
          <motion.div
            className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4 }}
          >
            <Zap className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="font-mono font-bold text-gradient-primary text-lg">
            DataScrape
          </span>
        </motion.button>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                variant={location.pathname === '/history' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigate('/history')}
                className="font-mono text-xs gap-1.5"
              >
                <History className="w-3.5 h-3.5" />
                History
              </Button>
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-mono text-muted-foreground hidden sm:block max-w-[120px] truncate">
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-muted-foreground hover:text-destructive p-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <Button
              variant="glow"
              size="sm"
              onClick={() => navigate('/auth')}
              className="font-mono text-xs"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};
