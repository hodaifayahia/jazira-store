import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, UserCheck, Search, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import { formatDate } from '@/lib/format';

const TYPE_OPTIONS = [
  { value: 'private', label: 'خاص', color: 'bg-primary/10 text-primary' },
  { value: 'external', label: 'خارجي', color: 'bg-secondary/10 text-secondary' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'نشط', color: 'bg-primary/10 text-primary' },
  { value: 'inactive', label: 'غير نشط', color: 'bg-muted text-muted-foreground' },
];

export default function AdminConfirmersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingConfirmer, setEditingConfirmer] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('الكل');
  const [filterStatus, setFilterStatus] = useState('الكل');

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('private');
  const [confirmationPrice, setConfirmationPrice] = useState('0');
  const [cancellationPrice, setCancellationPrice] = useState('0');
  const [notes, setNotes] = useState('');

  const { data: confirmers, isLoading } = useQuery({
    queryKey: ['admin-confirmers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirmers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('confirmers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-confirmers'] });
      toast({ title: 'تم حذف المؤكد' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('confirmers').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-confirmers'] });
      toast({ title: 'تم تحديث حالة المؤكد' });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !phone.trim()) throw new Error('الاسم والهاتف مطلوبان');
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        type,
        confirmation_price: parseFloat(confirmationPrice) || 0,
        cancellation_price: parseFloat(cancellationPrice) || 0,
        notes: notes.trim() || null,
        updated_at: new Date().toISOString(),
      };
      if (editingConfirmer) {
        const { error } = await supabase.from('confirmers').update(payload).eq('id', editingConfirmer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('confirmers').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-confirmers'] });
      toast({ title: editingConfirmer ? 'تم تعديل المؤكد ✅' : 'تمت إضافة المؤكد ✅' });
      setShowForm(false);
    },
    onError: (err: any) => toast({ title: err.message, variant: 'destructive' }),
  });

  const filteredConfirmers = useMemo(() => {
    return (confirmers || []).filter(c => {
      const matchSearch = !searchQuery || c.name.includes(searchQuery) || c.phone.includes(searchQuery);
      const matchType = filterType === 'الكل' || (filterType === 'خاص' && c.type === 'private') || (filterType === 'خارجي' && c.type === 'external');
      const matchStatus = filterStatus === 'الكل' || (filterStatus === 'نشط' && c.status === 'active') || (filterStatus === 'غير نشط' && c.status === 'inactive');
      return matchSearch && matchType && matchStatus;
    });
  }, [confirmers, searchQuery, filterType, filterStatus]);

  const counts = useMemo(() => {
    const all = confirmers || [];
    return {
      total: all.length,
      private: all.filter(c => c.type === 'private').length,
      external: all.filter(c => c.type === 'external').length,
    };
  }, [confirmers]);

  const openCreate = () => {
    setEditingConfirmer(null);
    setName(''); setPhone(''); setType('private');
    setConfirmationPrice('0'); setCancellationPrice('0'); setNotes('');
    setShowForm(true);
  };

  const openEdit = (c: any) => {
    setEditingConfirmer(c);
    setName(c.name); setPhone(c.phone); setType(c.type);
    setConfirmationPrice(String(c.confirmation_price || 0));
    setCancellationPrice(String(c.cancellation_price || 0));
    setNotes(c.notes || '');
    setShowForm(true);
  };

  const typeStyle = (t: string) => TYPE_OPTIONS.find(o => o.value === t)?.color || '';
  const typeLabel = (t: string) => TYPE_OPTIONS.find(o => o.value === t)?.label || t;
  const statusStyle = (s: string) => STATUS_OPTIONS.find(o => o.value === s)?.color || '';
  const statusLabel = (s: string) => STATUS_OPTIONS.find(o => o.value === s)?.label || s;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-cairo font-bold text-2xl text-foreground">إدارة المؤكدين</h2>
            <p className="font-cairo text-sm text-muted-foreground">{counts.total} مؤكد</p>
          </div>
        </div>
        <Button onClick={openCreate} className="font-cairo gap-1.5">
          <Plus className="w-4 h-4" /> إضافة مؤكد جديد
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'كل المؤكدين', value: counts.total, color: 'bg-primary/10 text-primary' },
          { label: 'مؤكدين خاصين', value: counts.private, color: 'bg-accent text-accent-foreground' },
          { label: 'مؤكدين خارجيين', value: counts.external, color: 'bg-secondary/10 text-secondary' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border rounded-xl p-4 text-center">
            <p className="font-cairo text-sm text-muted-foreground">{kpi.label}</p>
            <p className={`font-cairo font-bold text-2xl mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="ابحث عن مؤكد..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 font-cairo h-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-36 font-cairo h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل" className="font-cairo">كل الأنواع</SelectItem>
            <SelectItem value="خاص" className="font-cairo">خاص</SelectItem>
            <SelectItem value="خارجي" className="font-cairo">خارجي</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-36 font-cairo h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل" className="font-cairo">كل الحالات</SelectItem>
            <SelectItem value="نشط" className="font-cairo">نشط</SelectItem>
            <SelectItem value="غير نشط" className="font-cairo">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12 font-cairo text-muted-foreground">جاري التحميل...</div>
      ) : filteredConfirmers.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-card border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-right font-cairo font-semibold">المؤكد</th>
                  <th className="p-3 text-right font-cairo font-semibold">رقم الهاتف</th>
                  <th className="p-3 text-right font-cairo font-semibold">النوع</th>
                  <th className="p-3 text-right font-cairo font-semibold">سعر التأكيد</th>
                  <th className="p-3 text-right font-cairo font-semibold">سعر الإلغاء</th>
                  <th className="p-3 text-right font-cairo font-semibold">الحالة</th>
                  <th className="p-3 text-right font-cairo font-semibold">تاريخ الانضمام</th>
                  <th className="p-3 text-right font-cairo font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredConfirmers.map(c => (
                  <tr key={c.id} className={`hover:bg-muted/30 transition-colors group ${c.status === 'inactive' ? 'opacity-50' : ''}`}>
                    <td className="p-3 font-cairo font-medium text-foreground">{c.name}</td>
                    <td className="p-3 font-roboto text-muted-foreground" dir="ltr">{c.phone}</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-cairo ${typeStyle(c.type)}`}>{typeLabel(c.type)}</span></td>
                    <td className="p-3 font-cairo text-sm">{c.confirmation_price} د.ج</td>
                    <td className="p-3 font-cairo text-sm">{c.cancellation_price} د.ج</td>
                    <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-cairo ${statusStyle(c.status)}`}>{statusLabel(c.status)}</span></td>
                    <td className="p-3 font-cairo text-xs text-muted-foreground">{formatDate(c.created_at)}</td>
                    <td className="p-3">
                      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => toggleStatusMutation.mutate({ id: c.id, currentStatus: c.status })}>
                          {c.status === 'active' ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteDialog(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredConfirmers.map(c => (
              <div key={c.id} className={`bg-card border rounded-xl p-4 space-y-2 ${c.status === 'inactive' ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-cairo font-medium text-sm">{c.name}</span>
                  <div className="flex gap-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-cairo ${typeStyle(c.type)}`}>{typeLabel(c.type)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-cairo ${statusStyle(c.status)}`}>{statusLabel(c.status)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs font-cairo text-muted-foreground">
                  <div>الهاتف: <span className="font-roboto">{c.phone}</span></div>
                  <div>سعر التأكيد: {c.confirmation_price} د.ج</div>
                  <div>سعر الإلغاء: {c.cancellation_price} د.ج</div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-cairo text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => toggleStatusMutation.mutate({ id: c.id, currentStatus: c.status })}>
                      {c.status === 'active' ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-card border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-cairo text-muted-foreground font-medium">لا يوجد مؤكدين بعد</p>
          <Button onClick={openCreate} variant="outline" className="font-cairo mt-4 gap-1">
            <Plus className="w-4 h-4" /> إضافة أول مؤكد
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editingConfirmer ? 'تعديل المؤكد' : 'إضافة مؤكد جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-cairo">الاسم <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="font-cairo mt-1.5" placeholder="اسم المؤكد" />
            </div>
            <div>
              <Label className="font-cairo">رقم الهاتف <span className="text-destructive">*</span></Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="font-roboto mt-1.5" placeholder="0555000000" dir="ltr" />
            </div>
            <div>
              <Label className="font-cairo">النوع</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="font-cairo mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private" className="font-cairo">خاص</SelectItem>
                  <SelectItem value="external" className="font-cairo">خارجي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo">سعر التأكيد (د.ج)</Label>
                <Input type="number" min="0" value={confirmationPrice} onChange={e => setConfirmationPrice(e.target.value)} className="font-roboto mt-1.5" dir="ltr" />
              </div>
              <div>
                <Label className="font-cairo">سعر الإلغاء (د.ج)</Label>
                <Input type="number" min="0" value={cancellationPrice} onChange={e => setCancellationPrice(e.target.value)} className="font-roboto mt-1.5" dir="ltr" />
              </div>
            </div>
            <div>
              <Label className="font-cairo">ملاحظات</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="font-cairo mt-1.5" placeholder="أي ملاحظات إضافية..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="font-cairo">إلغاء</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name.trim() || !phone.trim()} className="font-cairo gap-1.5">
                {saveMutation.isPending ? 'جاري الحفظ...' : editingConfirmer ? 'حفظ التعديلات' : 'إضافة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">حذف المؤكد</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-cairo text-muted-foreground">هل أنت متأكد من حذف هذا المؤكد؟</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)} className="font-cairo px-6">إلغاء</Button>
              <Button variant="destructive" onClick={() => { if (deleteDialog) { deleteMutation.mutate(deleteDialog); setDeleteDialog(null); } }} className="font-cairo px-6">حذف</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
