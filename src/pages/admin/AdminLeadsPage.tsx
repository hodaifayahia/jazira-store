import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Pencil, Users, Phone, User, StickyNote, Check, X, Search, Download, ChevronLeft, ChevronRight, TrendingUp, MessageCircle, PhoneCall } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { useTranslation } from '@/i18n';

const STATUS_OPTIONS = [
  { value: 'جديد', labelKey: 'leads.statusNew', color: 'bg-secondary/10 text-secondary' },
  { value: 'تم التواصل', labelKey: 'leads.statusContacted', color: 'bg-primary/10 text-primary' },
  { value: 'مهتم', labelKey: 'leads.statusInterested', color: 'bg-accent text-accent-foreground' },
  { value: 'غير مهتم', labelKey: 'leads.statusNotInterested', color: 'bg-muted text-muted-foreground' },
  { value: 'تم التحويل', labelKey: 'leads.statusConverted', color: 'bg-primary/10 text-primary' },
];

const SOURCE_OPTIONS_KEYS = [
  { value: 'موقع', labelKey: 'leads.sourceWebsite' },
  { value: 'فيسبوك', labelKey: 'leads.sourceFacebook' },
  { value: 'إنستغرام', labelKey: 'leads.sourceInstagram' },
  { value: 'واتساب', labelKey: 'leads.sourceWhatsapp' },
  { value: 'إحالة', labelKey: 'leads.sourceReferral' },
  { value: 'أخرى', labelKey: 'leads.sourceOther' },
];

export default function AdminLeadsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['admin-leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-leads'] });
      toast({ title: t('leads.leadDeleted') });
    },
  });

  const filteredLeads = (leads || []).filter(l => {
    const matchSearch = !searchQuery || l.name.includes(searchQuery) || l.phone.includes(searchQuery);
    const matchStatus = filterStatus === 'الكل' || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // KPI calculations
  const kpis = useMemo(() => {
    const all = leads || [];
    const newCount = all.filter(l => l.status === 'جديد').length;
    const contacted = all.filter(l => l.status === 'تم التواصل').length;
    const interested = all.filter(l => l.status === 'مهتم').length;
    const converted = all.filter(l => l.status === 'تم التحويل').length;
    const convRate = all.length > 0 ? Math.round((converted / all.length) * 100) : 0;
    return { total: all.length, newCount, contacted, interested, converted, convRate };
  }, [leads]);

  // Pagination
  const ITEMS_PER_PAGE = 15;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Export CSV
  const handleExport = () => {
    if (!leads?.length) return;
    const headers = ['Name', 'Phone', 'Source', 'Status', 'Notes', 'Date'];
    const rows = filteredLeads.map(l => [l.name, l.phone, l.source || '', l.status || '', l.notes || '', l.created_at || '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('موقع');
  const [status, setStatus] = useState('جديد');
  const [notes, setNotes] = useState('');

  const openCreate = () => {
    setEditingLead(null);
    setName(''); setPhone(''); setSource('موقع'); setStatus('جديد'); setNotes('');
    setShowForm(true);
  };

  const openEdit = (lead: any) => {
    setEditingLead(lead);
    setName(lead.name); setPhone(lead.phone); setSource(lead.source || 'موقع');
    setStatus(lead.status || 'جديد'); setNotes(lead.notes || '');
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim() || !phone.trim()) throw new Error(t('leads.nameRequired'));
      const payload = { name: name.trim(), phone: phone.trim(), source, status, notes: notes.trim() || null };
      if (editingLead) {
        const { error } = await supabase.from('leads').update(payload).eq('id', editingLead.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('leads').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-leads'] });
      toast({ title: editingLead ? t('leads.leadEdited') : t('leads.leadAdded') });
      setShowForm(false);
    },
    onError: (err: any) => toast({ title: err.message, variant: 'destructive' }),
  });

  const statusLabel = (val: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === val);
    return opt ? t(opt.labelKey) : val;
  };

  const sourceLabel = (val: string) => {
    const opt = SOURCE_OPTIONS_KEYS.find(s => s.value === val);
    return opt ? t(opt.labelKey) : val;
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-cairo font-bold text-2xl text-foreground">{t('leads.title')}</h2>
            <p className="font-cairo text-sm text-muted-foreground">{leads?.length || 0} {t('common.product')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="font-cairo gap-1.5" size="sm" disabled={!filteredLeads.length}>
            <Download className="w-3.5 h-3.5" /> {t('common.exportCSV')}
          </Button>
          <Button onClick={openCreate} className="font-cairo gap-1.5">
            <Plus className="w-4 h-4" /> {t('leads.addLead')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground font-cairo">{t('leads.totalLeads')}</p><p className="text-xl font-bold font-roboto">{kpis.total}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0"><Phone className="w-5 h-5 text-secondary" /></div>
          <div><p className="text-xs text-muted-foreground font-cairo">{t('leads.contacted')}</p><p className="text-xl font-bold font-roboto">{kpis.contacted}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0"><User className="w-5 h-5 text-accent-foreground" /></div>
          <div><p className="text-xs text-muted-foreground font-cairo">{t('leads.interested')}</p><p className="text-xl font-bold font-roboto">{kpis.interested}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0"><Check className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xs text-muted-foreground font-cairo">{t('leads.statusConverted')}</p><p className="text-xl font-bold font-roboto">{kpis.converted}</p></div>
        </CardContent></Card>
        <Card className="col-span-2 sm:col-span-1"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground font-cairo">{t('leads.conversionRate')}</p><p className="text-xl font-bold font-roboto">{kpis.convRate}%</p></div>
        </CardContent></Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('leads.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 font-cairo h-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40 font-cairo h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="الكل" className="font-cairo">{t('common.allStatuses')}</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value} className="font-cairo">{t(s.labelKey)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 font-cairo text-muted-foreground">{t('common.loading')}</div>
      ) : filteredLeads.length > 0 ? (
        <>
          <div className="hidden md:block bg-card border rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="p-3 text-right font-cairo font-semibold">{t('common.name')}</th>
                  <th className="p-3 text-right font-cairo font-semibold">{t('common.phone')}</th>
                  <th className="p-3 text-right font-cairo font-semibold">{t('common.source')}</th>
                  <th className="p-3 text-right font-cairo font-semibold">{t('common.status')}</th>
                  <th className="p-3 text-right font-cairo font-semibold">{t('common.notes')}</th>
                  <th className="p-3 text-right font-cairo font-semibold">{t('common.date')}</th>
                  <th className="p-3 text-right font-cairo font-semibold">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedLeads.map(l => {
                  const statusStyle = STATUS_OPTIONS.find(s => s.value === l.status)?.color || 'bg-muted text-muted-foreground';
                  return (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-3 font-cairo font-medium text-foreground">{l.name}</td>
                      <td className="p-3 font-roboto text-muted-foreground" dir="ltr">{l.phone}</td>
                      <td className="p-3 font-cairo text-xs text-muted-foreground">{sourceLabel(l.source)}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full font-cairo ${statusStyle}`}>{statusLabel(l.status)}</span></td>
                      <td className="p-3 font-cairo text-xs text-muted-foreground max-w-[150px] truncate">{l.notes || '—'}</td>
                      <td className="p-3 font-cairo text-xs text-muted-foreground">{formatDate(l.created_at)}</td>
                      <td className="p-3">
                        <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <a href={`tel:${l.phone}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-green-50 hover:text-green-600 transition-colors" title={t('leads.callNow')}><PhoneCall className="w-3.5 h-3.5" /></a>
                          <a href={`https://wa.me/${l.phone.replace(/^0/, '213')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-green-50 hover:text-green-600 transition-colors" title={t('leads.whatsapp')}><MessageCircle className="w-3.5 h-3.5" /></a>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(l)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteDialog(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {paginatedLeads.map(l => {
              const statusStyle = STATUS_OPTIONS.find(s => s.value === l.status)?.color || 'bg-muted text-muted-foreground';
              return (
                <div key={l.id} className="bg-card border rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-cairo font-medium text-sm">{l.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-cairo ${statusStyle}`}>{statusLabel(l.status)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs font-cairo text-muted-foreground">
                    <div>{t('common.phone')}: <span className="font-roboto">{l.phone}</span></div>
                    <div>{t('common.source')}: {sourceLabel(l.source)}</div>
                    <div className="col-span-2 truncate">{t('common.notes')}: {l.notes || '—'}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-cairo text-xs text-muted-foreground">{formatDate(l.created_at)}</span>
                    <div className="flex gap-1">
                      <a href={`tel:${l.phone}`} className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-green-50 transition-colors"><PhoneCall className="w-3.5 h-3.5" /></a>
                      <a href={`https://wa.me/${l.phone.replace(/^0/, '213')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-green-50 transition-colors"><MessageCircle className="w-3.5 h-3.5" /></a>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteDialog(l.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="font-cairo text-xs text-muted-foreground">
                {t('common.showing')} {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length)} / {filteredLeads.length} {t('common.results')}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                  return (
                    <Button key={p} variant={currentPage === p ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => setCurrentPage(p)}>{p}</Button>
                  );
                })}
                <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-card border rounded-xl">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-cairo text-muted-foreground font-medium">{t('leads.noLeads')}</p>
          <Button onClick={openCreate} variant="outline" className="font-cairo mt-4 gap-1">
            <Plus className="w-4 h-4" /> {t('leads.addFirst')}
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editingLead ? t('leads.editLead') : t('leads.addNewLead')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="font-cairo">{t('common.name')} <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="font-cairo mt-1.5" placeholder={t('leads.customerName')} />
            </div>
            <div>
              <Label className="font-cairo">{t('common.phone')} <span className="text-destructive">*</span></Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="font-roboto mt-1.5" placeholder="0555000000" dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-cairo">{t('common.source')}</Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="font-cairo mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS_KEYS.map(s => <SelectItem key={s.value} value={s.value} className="font-cairo">{t(s.labelKey)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-cairo">{t('common.status')}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="font-cairo mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value} className="font-cairo">{t(s.labelKey)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="font-cairo">{t('common.notes')}</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="font-cairo mt-1.5" placeholder="..." />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="font-cairo">{t('common.cancel')}</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !name.trim() || !phone.trim()} className="font-cairo gap-1.5">
                {saveMutation.isPending ? t('common.saving') : editingLead ? t('leads.saveChanges') : t('common.add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">{t('leads.deleteLead')}</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-cairo text-muted-foreground">{t('leads.deleteMessage')}</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)} className="font-cairo px-6">{t('common.cancel')}</Button>
              <Button variant="destructive" onClick={() => { if (deleteDialog) { deleteMutation.mutate(deleteDialog); setDeleteDialog(null); } }} className="font-cairo px-6">{t('common.delete')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
