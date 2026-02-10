import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Trash2, Loader2, Shield } from 'lucide-react';

interface Props {
  toast: (opts: { title: string; description?: string; variant?: 'destructive' }) => void;
}

export default function AdminUserManagement({ toast }: Props) {
  const qc = useQueryClient();
  const [adminEmail, setAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: adminUsers = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('id, user_id, role')
        .eq('role', 'admin');
      return data || [];
    },
  });

  const handleAddAdmin = async () => {
    if (!adminEmail.trim()) return;
    setAddingAdmin(true);
    try {
      const res = await supabase.functions.invoke('manage-admin', {
        body: { action: 'add', email: adminEmail.trim() },
      });
      if (res.data?.error) {
        toast({ title: res.data.error, variant: 'destructive' });
      } else {
        toast({ title: 'تم إضافة المسؤول بنجاح ✅' });
        setAdminEmail('');
        qc.invalidateQueries({ queryKey: ['admin-users'] });
      }
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    setRemovingId(userId);
    try {
      const res = await supabase.functions.invoke('manage-admin', {
        body: { action: 'remove', userId },
      });
      if (res.data?.error) {
        toast({ title: res.data.error, variant: 'destructive' });
      } else {
        toast({ title: 'تم إزالة صلاحيات المسؤول' });
        qc.invalidateQueries({ queryKey: ['admin-users'] });
      }
    } catch {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="font-cairo font-bold text-xl">إدارة المسؤولين</h2>
      </div>
      <p className="font-cairo text-sm text-muted-foreground">إضافة أو إزالة مسؤولين من لوحة التحكم</p>

      {/* Current admins */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="font-cairo text-sm">جاري التحميل...</span>
        </div>
      ) : adminUsers.length > 0 ? (
        <div className="space-y-2">
          <Label className="font-cairo text-sm">المسؤولون الحاليون ({adminUsers.length})</Label>
          {adminUsers.map(admin => (
            <div key={admin.id} className="flex items-center justify-between bg-muted rounded-lg px-4 py-2.5">
              <span className="font-roboto text-sm">{admin.user_id}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAdmin(admin.user_id)}
                disabled={removingId === admin.user_id}
                className="text-destructive hover:text-destructive h-8"
              >
                {removingId === admin.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {/* Add new admin */}
      <div>
        <Label className="font-cairo">إضافة مسؤول جديد (بالبريد الإلكتروني)</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={adminEmail}
            onChange={e => setAdminEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddAdmin()}
            placeholder="admin@example.com"
            className="font-roboto"
            dir="ltr"
          />
          <Button onClick={handleAddAdmin} disabled={addingAdmin || !adminEmail.trim()} className="font-cairo gap-2 shrink-0">
            {addingAdmin ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            إضافة
          </Button>
        </div>
        <p className="font-cairo text-xs text-muted-foreground mt-1">يجب أن يكون المستخدم مسجلاً مسبقاً</p>
      </div>
    </div>
  );
}
