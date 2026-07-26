import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, WifiOff } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function AdminLoginPage() {
  const { t, dir } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const update = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  // If we already have a cached session from a previous login, route the user
  // straight to their area. This is what makes the admin PWA usable offline.
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      if (localStorage.getItem(`admin_role:${userId}`) === '1') {
        navigate('/admin');
      } else if (localStorage.getItem(`confirmer_role:${userId}`) === '1') {
        navigate('/confirmer');
      }
    })();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Offline: we cannot reach the auth server, but a cached session may exist.
    if (!navigator.onLine) {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId && localStorage.getItem(`admin_role:${userId}`) === '1') {
        setLoading(false);
        navigate('/admin');
        return;
      }
      if (userId && localStorage.getItem(`confirmer_role:${userId}`) === '1') {
        setLoading(false);
        navigate('/confirmer');
        return;
      }
      setLoading(false);
      toast({ title: t('login.error'), description: t('offline.loginUnavailable'), variant: 'destructive' });
      return;
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      toast({ title: t('login.error'), description: t('login.invalidCredentials'), variant: 'destructive' });
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      setLoading(false);
      toast({ title: t('login.error'), description: t('login.invalidCredentials'), variant: 'destructive' });
      return;
    }

    // Check admin role first
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (isAdmin) {
      localStorage.setItem(`admin_role:${userId}`, '1');
      setLoading(false);
      navigate('/admin');
      return;
    }

    // Check confirmer role
    const { data: isConfirmer } = await supabase.rpc('has_role', { _user_id: userId, _role: 'confirmer' });
    if (isConfirmer) {
      localStorage.setItem(`confirmer_role:${userId}`, '1');
      setLoading(false);
      navigate('/confirmer');
      return;
    }

    // No role - sign out and show error
    await supabase.auth.signOut();
    setLoading(false);
    toast({ title: t('login.error'), description: t('sidebar.noAccess'), variant: 'destructive' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4 sm:p-6" dir={dir}>
      <div className="w-full max-w-sm bg-card border rounded-2xl shadow-sm p-6 sm:p-8 animate-fade-in">
        {isOffline && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-100 text-amber-900 px-3 py-2 text-xs sm:text-sm font-cairo">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>{t('offline.loginNotice')}</span>
          </div>
        )}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-cairo font-bold text-2xl">{t('login.title')}</h1>
          <p className="font-cairo text-sm text-muted-foreground">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label className="font-cairo">{t('login.email')}</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 h-11" dir="ltr" />
          </div>
          <div>
            <Label className="font-cairo">{t('login.password')}</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 h-11" dir="ltr" />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-cairo font-semibold h-11">
            {loading ? t('login.loading') : t('login.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
