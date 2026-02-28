import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function AdminLoginPage() {
  const { t, dir } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
      navigate('/admin');
      return;
    }

    // Check confirmer role
    const { data: isConfirmer } = await supabase.rpc('has_role', { _user_id: userId, _role: 'confirmer' });
    if (isConfirmer) {
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
    <div className="min-h-screen flex items-center justify-center bg-muted p-4" dir={dir}>
      <div className="w-full max-w-sm bg-card border rounded-lg p-8 animate-fade-in">
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
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" dir="ltr" />
          </div>
          <div>
            <Label className="font-cairo">{t('login.password')}</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1" dir="ltr" />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-cairo font-semibold">
            {loading ? t('login.loading') : t('login.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
