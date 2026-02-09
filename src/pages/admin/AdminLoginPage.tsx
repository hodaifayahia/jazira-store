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

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    return !!data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        const isAdmin = await checkAdminRole(session.user.id);
        if (isAdmin) {
          navigate('/admin');
        }
      }
      setCheckingSession(false);
    });
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const isAdmin = await checkAdminRole(session.user.id);
        if (isAdmin) {
          navigate('/admin');
        }
      }
      setCheckingSession(false);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      toast({ title: 'خطأ', description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', variant: 'destructive' });
      return;
    }

    // Check admin role
    const isAdmin = await checkAdminRole(data.user.id);
    setLoading(false);
    
    if (!isAdmin) {
      await supabase.auth.signOut();
      toast({ title: 'خطأ', description: 'ليس لديك صلاحيات الوصول إلى لوحة التحكم', variant: 'destructive' });
      return;
    }

    navigate('/admin');
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
