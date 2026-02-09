import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) navigate('/admin');
      setCheckingSession(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) navigate('/admin');
      setCheckingSession(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'خطأ', description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', variant: 'destructive' });
    } else {
      navigate('/admin');
    }
  };

  if (checkingSession) return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-sm bg-card border rounded-lg p-8 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-cairo font-bold text-2xl">لوحة التحكم</h1>
          <p className="font-cairo text-sm text-muted-foreground">تسجيل الدخول</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label className="font-cairo">البريد الإلكتروني</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" dir="ltr" />
          </div>
          <div>
            <Label className="font-cairo">كلمة المرور</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1" dir="ltr" />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-cairo font-semibold">
            {loading ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري الدخول...</> : 'تسجيل الدخول'}
          </Button>
        </form>
      </div>
    </div>
  );
}
