import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '@/hooks/useClients';
import { useClientTransactions } from '@/hooks/useClientTransactions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
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
      if (editingClient) {
        await updateClient.mutateAsync({
          id: editingClient.id,
          ...form,
          fixed_unit_price: form.fixed_price_enabled ? (Number(form.fixed_unit_price) || 0) : null,
        } as any);
        toast.success(t('common.savedSuccess'));
      } else {
        await createClient.mutateAsync({
          ...form,
          fixed_unit_price: form.fixed_price_enabled ? (Number(form.fixed_unit_price) || 0) : null,
        } as any);
        toast.success(t('common.savedSuccess'));
      }
      setDialogOpen(false);
    } catch { toast.error(t('common.errorOccurred')); }
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
    <div className="space-y-4 sm:space-y-6 p-1">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl sm:text-2xl font-cairo font-bold">{t('clients.title')}</h1>
        <Button onClick={openAdd} className="gap-2 font-cairo text-sm sm:text-base h-9 sm:h-10">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">{t('clients.addClient')}</span><span className="sm:hidden">إضافة</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="col-span-2 sm:col-span-1"><CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /></div>
          <div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground font-cairo truncate">{t('clients.totalClients')}</p><p className="text-lg sm:text-xl font-bold font-cairo">{clients?.length ?? 0}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0"><Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" /></div>
          <div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground font-cairo truncate">{t('clients.totalOwed')}</p><p className="text-base sm:text-xl font-bold font-cairo">{formatPrice(totalOwed)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0"><DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /></div>
          <div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground font-cairo truncate">{t('clients.totalCollected')}</p><p className="text-base sm:text-xl font-bold font-cairo">{formatPrice(totalCollected)}</p></div>
        </CardContent></Card>
      </div>

      {/* Search, Filter, Sort, Export */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('clients.searchPlaceholder')} className="ps-9 font-cairo h-9 sm:h-10" />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[110px] sm:w-[140px] font-cairo h-9 sm:h-10 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-cairo">{t('common.all')}</SelectItem>
              <SelectItem value="active" className="font-cairo">{t('common.active')}</SelectItem>
              <SelectItem value="inactive" className="font-cairo">{t('common.inactive')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-1 font-cairo h-9 sm:h-10 text-xs sm:text-sm" onClick={() => {
            if (sortBy === 'name' && sortDir === 'asc') setSortDir('desc');
            else if (sortBy === 'name' && sortDir === 'desc') { setSortBy('balance'); setSortDir('desc'); }
            else if (sortBy === 'balance' && sortDir === 'desc') setSortDir('asc');
            else { setSortBy('name'); setSortDir('asc'); }
          }}>
            <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{sortBy === 'name' ? t('clients.sortByName') : t('clients.sortByBalance')}</span> {sortDir === 'asc' ? '↑' : '↓'}
          </Button>
          <Button variant="outline" size="sm" className="gap-1 font-cairo h-9 sm:h-10 text-xs sm:text-sm" onClick={handleExport}>
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t('common.exportCSV')}</span><span className="sm:hidden">CSV</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(c => {
            const balance = getClientBalance(c.id);
            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
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
                  <div className={`text-sm sm:text-lg font-bold font-cairo ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                    {balance > 0 ? `${t('clients.owes')}: ${formatPrice(balance)}` : t('clients.settled')}
                  </div>
                  <div className="flex gap-1.5 sm:gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="outline" className="gap-1 font-cairo text-xs h-8 px-2 sm:px-3" onClick={() => navigate(`/admin/clients/${c.id}`)}><Eye className="w-3 h-3" /><span className="hidden sm:inline">{t('common.view')}</span></Button>
                    <Button size="sm" variant="outline" className="gap-1 font-cairo text-xs h-8 px-2 sm:px-3" onClick={() => openEdit(c)}><Edit className="w-3 h-3" /><span className="hidden sm:inline">{t('common.edit')}</span></Button>
                    <Button size="sm" variant="destructive" className="gap-1 font-cairo text-xs h-8 px-2" onClick={() => handleDelete(c.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editingClient ? t('clients.editClient') : t('clients.addClient')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div><Label className="font-cairo text-sm">{t('common.name')} *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="font-cairo mt-1" /></div>
            <div><Label className="font-cairo text-sm">{t('common.phone')}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="font-cairo mt-1" /></div>
            <div><Label className="font-cairo text-sm">{t('clients.wilaya')}</Label><Input value={form.wilaya} onChange={e => setForm(f => ({ ...f, wilaya: e.target.value }))} className="font-cairo mt-1" /></div>
            <div><Label className="font-cairo text-sm">{t('clients.address')}</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="font-cairo mt-1" /></div>
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="font-cairo text-sm">تسعير ثابت للعميل</Label>
                <Switch checked={form.fixed_price_enabled} onCheckedChange={(checked) => setForm(f => ({ ...f, fixed_price_enabled: checked }))} />
              </div>
              {form.fixed_price_enabled ? (
                <div>
                  <Label className="font-cairo text-sm">السعر الثابت لكل منتج (دج)</Label>
                  <Input type="number" min={0} value={form.fixed_unit_price} onChange={e => setForm(f => ({ ...f, fixed_unit_price: e.target.value }))} className="font-roboto mt-1" />
                </div>
              ) : null}
            </div>
            <div><Label className="font-cairo text-sm">{t('common.notes')}</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="font-cairo mt-1" /></div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="font-cairo w-full sm:w-auto">{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={createClient.isPending || updateClient.isPending} className="font-cairo w-full sm:w-auto">{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
