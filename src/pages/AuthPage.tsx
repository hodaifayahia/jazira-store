import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { lovable } from '@/integrations/lovable/index';

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

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground font-cairo">أو</span></div>
            </div>

            <Button
              variant="outline"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth('google', {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast({ title: 'خطأ في تسجيل الدخول بـ Google', description: error.message, variant: 'destructive' });
                }
              }}
              className="w-full font-cairo font-semibold h-12 rounded-xl gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              تسجيل الدخول بحساب Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
