import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard');
  }, [user, authLoading, navigate]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: 'خطأ في تسجيل الدخول', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'مرحباً بك! 👋' });
      navigate('/dashboard');
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      toast({ title: 'يرجى ملء جميع الحقول', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'خطأ في إنشاء الحساب', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم إنشاء الحساب ✅', description: 'تحقق من بريدك الإلكتروني لتأكيد الحساب' });
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="w-7 h-7 text-primary" />
            </div>
            <h1 className="font-cairo font-bold text-2xl text-foreground">
              {tab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </h1>
            <p className="font-cairo text-muted-foreground text-sm mt-1">
              {tab === 'login' ? 'سجّل دخولك لتتبع طلباتك' : 'أنشئ حساباً لتتبع طلباتك بسهولة'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 rounded-lg font-cairo font-semibold text-sm transition-colors ${
                tab === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2.5 rounded-lg font-cairo font-semibold text-sm transition-colors ${
                tab === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              حساب جديد
            </button>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {tab === 'signup' && (
              <div>
                <Label className="font-cairo">الاسم</Label>
                <div className="relative mt-1">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="اسمك الكامل"
                    className="font-cairo pr-10"
                  />
                </div>
              </div>
            )}
            <div>
              <Label className="font-cairo">البريد الإلكتروني</Label>
              <div className="relative mt-1">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="font-roboto pr-10"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <Label className="font-cairo">كلمة المرور</Label>
              <div className="relative mt-1">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="font-roboto pr-10"
                  dir="ltr"
                />
              </div>
            </div>

            <Button
              onClick={tab === 'login' ? handleLogin : handleSignup}
              disabled={loading}
              className="w-full font-cairo font-bold text-base h-12 rounded-xl gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : tab === 'login' ? (
                <>
                  تسجيل الدخول
                  <ArrowLeft className="w-4 h-4" />
                </>
              ) : (
                <>
                  إنشاء الحساب
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
