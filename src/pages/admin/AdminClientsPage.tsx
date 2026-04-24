import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { useClientTransactions } from '@/hooks/useClientTransactions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { formatPrice } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Users, Plus, Search, Phone, MapPin, Eye, Trash2, Edit, DollarSign, Package, Wallet, Download, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';

function useAllClientTransactions() {
  return useQuery({
    queryKey: ['all_client_transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_transactions').select('*');
      if (error) throw error;
      return data;
    },
  });
}

export default function AdminClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClients();
  const { data: allTx } = useAllClientTransactions();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', wilaya: '', notes: '', status: 'active', fixed_price_enabled: false, fixed_unit_price: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'balance'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const openAdd = () => {
    setEditingClient(null);
    setForm({ name: '', phone: '', address: '', wilaya: '', notes: '', status: 'active', fixed_price_enabled: false, fixed_unit_price: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: any) => {
    setEditingClient(c);
    setForm({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      wilaya: c.wilaya || '',
      notes: c.notes || '',
      status: c.status,
      fixed_price_enabled: Boolean((c as any).fixed_price_enabled),
      fixed_unit_price: (c as any).fixed_unit_price != null ? String((c as any).fixed_unit_price) : '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('common.required')); return; }
    try {
      // Build payload without fixed_price fields to avoid schema errors
      // if the migration hasn't been applied yet
      const basePayload: any = {
        name: form.name.trim(),
        phone: form.phone,
        address: form.address,
        wilaya: form.wilaya,
        notes: form.notes,
        status: form.status,
      };

      // Try to include fixed_price fields - they'll be silently ignored
      // if the columns don't exist, but we handle the error gracefully
      const fullPayload = {
        ...basePayload,
        fixed_price_enabled: form.fixed_price_enabled,
        fixed_unit_price: form.fixed_price_enabled ? (Number(form.fixed_unit_price) || 0) : null,
      };

      if (editingClient) {
        // Try with fixed price fields first
        const { error } = await supabase.from('clients').update(fullPayload).eq('id', editingClient.id);
        if (error) {
          // If fixed_price columns don't exist, retry without them
          if (error.code === 'PGRST204' || error.message?.includes('fixed_price')) {
            const { error: retryError } = await supabase.from('clients').update(basePayload).eq('id', editingClient.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        toast.success(t('common.savedSuccess'));
      } else {
        // Try with fixed price fields first
        const { error } = await supabase.from('clients').insert(fullPayload).select().single();
        if (error) {
          // If fixed_price columns don't exist, retry without them
          if (error.code === 'PGRST204' || error.message?.includes('fixed_price')) {
            const { error: retryError } = await supabase.from('clients').insert(basePayload).select().single();
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        toast.success(t('common.savedSuccess'));
      }
      // Invalidate clients cache
      qc.invalidateQueries({ queryKey: ['clients'] });
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err?.message || t('common.errorOccurred'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('clients.deleteConfirm'))) return;
    try {
      await deleteClient.mutateAsync(id);
      toast.success(t('common.deletedSuccess'));
    } catch { toast.error(t('common.errorOccurred')); }
  };

  const getClientBalance = (clientId: string) => {
    if (!allTx) return 0;
    return allTx
      .filter(tx => tx.client_id === clientId)
      .reduce((acc, tx) => {
        if (tx.transaction_type === 'product_given') return acc + Number(tx.amount);
        return acc - Number(tx.amount);
      }, 0);
  };

  const filtered = useMemo(() => {
    let result = (clients ?? []).filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
    );
    if (statusFilter !== 'all') result = result.filter(c => c.status === statusFilter);
    result.sort((a, b) => {
      if (sortBy === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      const balA = getClientBalance(a.id);
      const balB = getClientBalance(b.id);
      return sortDir === 'asc' ? balA - balB : balB - balA;
    });
    return result;
  }, [clients, search, statusFilter, sortBy, sortDir, allTx]);

  const totalOwed = (clients ?? []).reduce((s, c) => s + Math.max(0, getClientBalance(c.id)), 0);
  const totalCollected = (allTx ?? [])
    .filter(tx => tx.transaction_type === 'payment_received')
    .reduce((s, tx) => s + Number(tx.amount), 0);

  const handleExport = () => {
    if (!filtered.length) return;
    const headers = ['Name', 'Phone', 'Wilaya', 'Status', 'Balance'];
    const rows = filtered.map(c => [c.name, c.phone || '', c.wilaya || '', c.status, String(getClientBalance(c.id))]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-1">
      <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
        <h1 className="text-lg sm:text-2xl font-cairo font-bold">{t('clients.title')}</h1>
        <Button onClick={openAdd} size="sm" className="gap-1.5 font-cairo text-xs sm:text-sm h-8 sm:h-9 w-full sm:w-auto">
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {t('clients.addClient')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card><CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></div>
          <div className="text-center sm:text-right min-w-0"><p className="text-[10px] sm:text-sm text-muted-foreground font-cairo leading-tight">{t('clients.totalClients')}</p><p className="text-base sm:text-xl font-bold font-cairo">{clients?.length ?? 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0"><Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" /></div>
          <div className="text-center sm:text-right min-w-0"><p className="text-[10px] sm:text-sm text-muted-foreground font-cairo leading-tight">{t('clients.totalOwed')}</p><p className="text-sm sm:text-xl font-bold font-cairo truncate">{formatPrice(totalOwed)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0"><DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /></div>
          <div className="text-center sm:text-right min-w-0"><p className="text-[10px] sm:text-sm text-muted-foreground font-cairo leading-tight">{t('clients.totalCollected')}</p><p className="text-sm sm:text-xl font-bold font-cairo truncate">{formatPrice(totalCollected)}</p></div>
        </CardContent></Card>
      </div>

      {/* Search, Filter, Sort, Export */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('clients.searchPlaceholder')} className="ps-9 font-cairo" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] font-cairo"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-cairo">{t('common.all')}</SelectItem>
              <SelectItem value="active" className="font-cairo">{t('common.active')}</SelectItem>
              <SelectItem value="inactive" className="font-cairo">{t('common.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 sm:flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 font-cairo w-full sm:w-auto" onClick={() => {
            if (sortBy === 'name' && sortDir === 'asc') setSortDir('desc');
            else if (sortBy === 'name' && sortDir === 'desc') { setSortBy('balance'); setSortDir('desc'); }
            else if (sortBy === 'balance' && sortDir === 'desc') setSortDir('asc');
            else { setSortBy('name'); setSortDir('asc'); }
          }}>
            <ArrowUpDown className="w-4 h-4" />
            <span className="truncate">{sortBy === 'name' ? t('clients.sortByName') : t('clients.sortByBalance')} {sortDir === 'asc' ? '↑' : '↓'}</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 font-cairo w-full sm:w-auto" onClick={handleExport}>
            <Download className="w-4 h-4" />
            <span className="truncate">{t('common.exportCSV')}</span>
          </Button>
        </div>
      </div>

      {/* Client List */}
      {isLoading ? (
        <p className="text-muted-foreground font-cairo">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-cairo text-muted-foreground">{t('clients.noClients')}</p>
          <Button onClick={openAdd} variant="outline" className="mt-3 font-cairo gap-2"><Plus className="w-4 h-4" />{t('clients.addFirst')}</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(c => {
            const balance = getClientBalance(c.id);
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                <CardContent className="p-3 sm:p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-cairo font-bold text-base sm:text-lg truncate">{c.name}</h3>
                      {c.phone && <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3 flex-shrink-0" /><span className="truncate">{c.phone}</span></p>}
                      {c.wilaya && <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{c.wilaya}</span></p>}
                    </div>
                    <Badge variant={c.status === 'active' ? 'default' : 'secondary'} className="font-cairo text-[10px] sm:text-xs flex-shrink-0">
                      {c.status === 'active' ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                  <div className={`text-base sm:text-lg font-bold font-cairo ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {balance > 0 ? `${t('clients.owes')}: ${formatPrice(balance)}` : t('clients.settled')}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="outline" className="gap-1 font-cairo w-full text-[11px] sm:text-xs h-8 sm:h-9 px-1.5 sm:px-3" onClick={() => navigate(`/admin/clients/${c.id}`)}><Eye className="w-3 h-3" /><span className="hidden xs:inline">{t('common.view')}</span></Button>
                    <Button size="sm" variant="outline" className="gap-1 font-cairo w-full text-[11px] sm:text-xs h-8 sm:h-9 px-1.5 sm:px-3" onClick={() => openEdit(c)}><Edit className="w-3 h-3" /><span className="hidden xs:inline">{t('common.edit')}</span></Button>
                    <Button size="sm" variant="destructive" className="gap-1 font-cairo w-full text-[11px] sm:text-xs h-8 sm:h-9 px-1.5 sm:px-3" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editingClient ? t('clients.editClient') : t('clients.addClient')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label className="font-cairo">{t('common.name')} *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo" /></div>
            <div><Label className="font-cairo">{t('common.phone')}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="font-cairo" /></div>
            <div><Label className="font-cairo">{t('clients.wilaya')}</Label><Input value={form.wilaya} onChange={e => setForm(f => ({ ...f, wilaya: e.target.value }))} className="font-cairo" /></div>
            <div><Label className="font-cairo">{t('clients.address')}</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="font-cairo" /></div>
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="font-cairo">تسعير ثابت للعميل</Label>
                <Switch checked={form.fixed_price_enabled} onCheckedChange={(checked) => setForm(f => ({ ...f, fixed_price_enabled: checked }))} />
              </div>
              {form.fixed_price_enabled ? (
                <div>
                  <Label className="font-cairo">السعر الثابت لكل منتج (دج)</Label>
                  <Input type="number" min={0} value={form.fixed_unit_price} onChange={e => setForm(f => ({ ...f, fixed_unit_price: e.target.value }))} className="font-roboto" />
                </div>
              ) : null}
            </div>
            <div><Label className="font-cairo">{t('common.notes')}</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="font-cairo" /></div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-cairo w-full sm:w-auto">{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={createClient.isPending || updateClient.isPending} className="font-cairo w-full sm:w-auto">{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
