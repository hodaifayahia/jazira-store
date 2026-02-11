import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, BarChart3, Upload, Loader2 } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { ALGERIA_WILAYAS } from '@/data/algeria-wilayas';
import { useTranslation } from '@/i18n';

export default function AdminWilayasPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', shipping_price: '', shipping_price_home: '', is_active: true });

  // Stats dialog
  const [statsWilaya, setStatsWilaya] = useState<any>(null);
  const [statsOpen, setStatsOpen] = useState(false);

  const { data: wilayas } = useQuery({
    queryKey: ['admin-wilayas'],
    queryFn: async () => {
      const { data } = await supabase.from('wilayas').select('*').order('name');
      return data || [];
    },
  });

  const { data: statsOrders, isLoading: statsLoading } = useQuery({
    queryKey: ['wilaya-stats', statsWilaya?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, status, total_amount')
        .eq('wilaya_id', statsWilaya.id);
      return data || [];
    },
    enabled: !!statsWilaya?.id,
  });

  const statsData = statsOrders ? (() => {
    const totalOrders = statsOrders.length;
    const totalRevenue = statsOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0);
    const byStatus: Record<string, number> = {};
    statsOrders.forEach(o => {
      const st = o.status || 'غير محدد';
      byStatus[st] = (byStatus[st] || 0) + 1;
    });
    return { totalOrders, totalRevenue, byStatus };
  })() : null;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: form.name, shipping_price: Number(form.shipping_price), shipping_price_home: Number(form.shipping_price_home), is_active: form.is_active };
      if (editing) {
        await supabase.from('wilayas').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('wilayas').insert(payload);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wilayas'] }); setDialogOpen(false); toast({ title: t('common.savedSuccess') }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from('wilayas').delete().eq('id', id); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-wilayas'] }); toast({ title: t('common.deletedSuccess') }); },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async () => {
      for (const w of ALGERIA_WILAYAS) {
        // Check if wilaya already exists
        const { data: existing } = await supabase.from('wilayas').select('id').eq('name', w.name).maybeSingle();
        let wilayaId: string;
        if (existing) {
          wilayaId = existing.id;
        } else {
          const { data: inserted, error } = await supabase.from('wilayas').insert({ name: w.name, shipping_price: 0, shipping_price_home: 0, is_active: true }).select('id').single();
          if (error || !inserted) continue;
          wilayaId = inserted.id;
        }
        // Insert baladiyat (skip duplicates)
        for (const b of w.baladiyat) {
          const { data: bExists } = await supabase.from('baladiyat').select('id').eq('name', b).eq('wilaya_id', wilayaId).maybeSingle();
          if (!bExists) {
            await supabase.from('baladiyat').insert({ name: b, wilaya_id: wilayaId, is_active: true });
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-wilayas'] });
      toast({ title: t('wilayas.imported').replace('{n}', String(ALGERIA_WILAYAS.length)) });
    },
    onError: () => toast({ title: t('wilayas.importError'), variant: 'destructive' }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h2 className="font-cairo font-bold text-xl">{t('wilayas.title')} ({wilayas?.length || 0})</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { if (confirm(t('wilayas.importConfirm'))) bulkImportMutation.mutate(); }} disabled={bulkImportMutation.isPending} className="font-cairo gap-1" size="sm">
            {bulkImportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {t('wilayas.importAll')} ({ALGERIA_WILAYAS.length})
          </Button>
          <Button onClick={() => { setEditing(null); setForm({ name: '', shipping_price: '', shipping_price_home: '', is_active: true }); setDialogOpen(true); }} className="font-cairo gap-1" size="sm"><Plus className="w-4 h-4" /> {t('wilayas.addWilaya')}</Button>
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block bg-card border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-right font-cairo">{t('wilayas.wilayaName')}</th>
              <th className="p-3 text-right font-cairo">{t('wilayas.officeDelivery')}</th>
              <th className="p-3 text-right font-cairo">{t('wilayas.homeDelivery')}</th>
              <th className="p-3 text-right font-cairo">{t('common.status')}</th>
              <th className="p-3 text-right font-cairo">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {wilayas?.map(w => (
              <tr key={w.id} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => { setStatsWilaya(w); setStatsOpen(true); }}>
                <td className="p-3 font-cairo">{w.name}</td>
                <td className="p-3 font-roboto">{formatPrice(Number(w.shipping_price))}</td>
                <td className="p-3 font-roboto">{formatPrice(Number(w.shipping_price_home))}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-cairo ${w.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{w.is_active ? t('common.active') : t('common.inactive')}</span></td>
                <td className="p-3">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setStatsWilaya(w); setStatsOpen(true); }}><BarChart3 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(w); setForm({ name: w.name, shipping_price: String(w.shipping_price), shipping_price_home: String(w.shipping_price_home), is_active: w.is_active ?? true }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(t('common.delete') + '?')) deleteMutation.mutate(w.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {wilayas?.map(w => (
          <div key={w.id} className="bg-card border rounded-xl p-4 space-y-2" onClick={() => { setStatsWilaya(w); setStatsOpen(true); }}>
            <div className="flex items-center justify-between">
              <span className="font-cairo font-medium text-sm">{w.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-cairo ${w.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{w.is_active ? t('common.active') : t('common.inactive')}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs font-cairo text-muted-foreground">
              <div>مكتب: <span className="font-roboto font-bold text-foreground">{formatPrice(Number(w.shipping_price))}</span></div>
              <div>منزل: <span className="font-roboto font-bold text-foreground">{formatPrice(Number(w.shipping_price_home))}</span></div>
            </div>
            <div className="flex justify-end gap-1 pt-2 border-t" onClick={e => e.stopPropagation()}>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setStatsWilaya(w); setStatsOpen(true); }}><BarChart3 className="w-3.5 h-3.5" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditing(w); setForm({ name: w.name, shipping_price: String(w.shipping_price), shipping_price_home: String(w.shipping_price_home), is_active: w.is_active ?? true }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm(t('common.delete') + '?')) deleteMutation.mutate(w.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-cairo">{editing ? t('wilayas.editWilaya') : t('wilayas.addWilaya')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="font-cairo">{t('wilayas.wilayaName')}</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo mt-1" /></div>
            <div><Label className="font-cairo">{t('wilayas.officePrice')}</Label><Input type="number" value={form.shipping_price} onChange={e => setForm(f => ({ ...f, shipping_price: e.target.value }))} className="font-roboto mt-1" /></div>
            <div><Label className="font-cairo">{t('wilayas.homePrice')}</Label><Input type="number" value={form.shipping_price_home} onChange={e => setForm(f => ({ ...f, shipping_price_home: e.target.value }))} className="font-roboto mt-1" /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label className="font-cairo">{t('common.active')}</Label></div>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full font-cairo font-semibold">{t('common.save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-cairo flex items-center gap-2"><BarChart3 className="w-5 h-5" /> {t('wilayas.stats')} — {statsWilaya?.name}</DialogTitle></DialogHeader>
          {statsLoading ? (
            <p className="font-cairo text-muted-foreground text-center py-8">{t('common.loading')}</p>
          ) : statsData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-roboto font-bold">{statsData.totalOrders}</p>
                  <p className="text-xs font-cairo text-muted-foreground mt-1">{t('wilayas.totalOrders')}</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-roboto font-bold">{formatPrice(statsData.totalRevenue)}</p>
                  <p className="text-xs font-cairo text-muted-foreground mt-1">{t('wilayas.totalRevenue')}</p>
                </div>
              </div>
              {Object.keys(statsData.byStatus).length > 0 ? (
                <div>
                  <p className="font-cairo font-semibold text-sm mb-2">حسب الحالة</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statsData.byStatus).map(([status, count]) => (
                      <Badge key={status} variant="secondary" className="font-cairo gap-1">
                        {status} <span className="font-roboto font-bold">{count}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="font-cairo text-muted-foreground text-center text-sm">لا توجد طلبات لهذه الولاية</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
