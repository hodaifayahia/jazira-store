import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Loader2, Palette, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

type VariationOption = {
  id: string;
  variation_type: string;
  variation_value: string;
  color_code: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminVariationsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VariationOption | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formType, setFormType] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formColorCode, setFormColorCode] = useState('');
  const [formActive, setFormActive] = useState(true);

  const { data: options, isLoading } = useQuery({
    queryKey: ['variation-options'],
    queryFn: async () => {
      const { data } = await supabase
        .from('variation_options')
        .select('*')
        .order('variation_type')
        .order('variation_value');
      return (data || []) as VariationOption[];
    },
  });

  const existingTypes = useMemo(() => {
    if (!options) return [];
    return [...new Set(options.map(o => o.variation_type))];
  }, [options]);

  const filtered = useMemo(() => {
    return (options || []).filter(o => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return o.variation_type.toLowerCase().includes(q) || o.variation_value.toLowerCase().includes(q);
    });
  }, [options, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, VariationOption[]> = {};
    filtered.forEach(o => {
      if (!groups[o.variation_type]) groups[o.variation_type] = [];
      groups[o.variation_type].push(o);
    });
    return groups;
  }, [filtered]);

  const isColorType = (type: string) => {
    const tt = type.toLowerCase();
    return tt.includes('لون') || tt.includes('color') || tt.includes('colour');
  };

  const openCreate = () => {
    setEditing(null);
    setFormType(existingTypes[0] || '');
    setFormValue('');
    setFormColorCode('#000000');
    setFormActive(true);
    setShowForm(true);
  };

  const openEdit = (o: VariationOption) => {
    setEditing(o);
    setFormType(o.variation_type);
    setFormValue(o.variation_value);
    setFormColorCode(o.color_code || '#000000');
    setFormActive(o.is_active);
    setShowForm(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formType.trim() || !formValue.trim()) throw new Error(t('variations.typeAndValueRequired'));
      const payload = {
        variation_type: formType.trim(),
        variation_value: formValue.trim(),
        color_code: isColorType(formType) ? formColorCode : null,
        is_active: formActive,
      };
      if (editing) {
        const { error } = await supabase.from('variation_options').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('variation_options').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variation-options'] });
      setShowForm(false);
      toast({ title: editing ? t('variations.edited') : t('variations.added') });
    },
    onError: (err: any) => toast({ title: err.message || t('common.errorOccurred'), variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('variation_options').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['variation-options'] });
      setDeleteDialog(null);
      toast({ title: t('variations.deleted') });
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-cairo font-bold text-2xl text-foreground">{t('variations.title')}</h2>
          <p className="font-cairo text-sm text-muted-foreground mt-1">
            {options?.length || 0} {t('variations.variationUnit')}
          </p>
        </div>
        <Button onClick={openCreate} className="font-cairo gap-1.5" size="sm">
          <Plus className="w-4 h-4" /> {t('variations.addVariation')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('variations.searchPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pr-10 font-cairo h-10" />
      </div>

      {/* List grouped by type */}
      {isLoading ? (
        <div className="text-center py-12 font-cairo text-muted-foreground">{t('common.loading')}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-xl">
          <Palette className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-cairo text-muted-foreground">{t('variations.noVariations')}</p>
          <Button onClick={openCreate} variant="outline" className="font-cairo mt-4 gap-1">
            <Plus className="w-4 h-4" /> {t('variations.addFirst')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type} className="bg-card border rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                {isColorType(type) && <Palette className="w-4 h-4 text-primary" />}
                <h3 className="font-cairo font-semibold text-sm">{type}</h3>
                <Badge variant="secondary" className="font-roboto text-xs">{items.length}</Badge>
              </div>
              <div className="divide-y">
                {items.map(o => (
                  <div key={o.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                    {o.color_code ? (
                      <div className="w-8 h-8 rounded-lg border-2 border-muted-foreground/20 shrink-0" style={{ backgroundColor: o.color_code }} title={o.color_code} />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Palette className="w-4 h-4 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-cairo font-medium text-sm">{o.variation_value}</span>
                      {o.color_code && <span className="font-roboto text-xs text-muted-foreground mr-2">{o.color_code}</span>}
                    </div>
                    <span className={`text-xs font-cairo ${o.is_active ? 'text-primary' : 'text-destructive'}`}>
                      {o.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                    <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => openEdit(o)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteDialog(o.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cairo">{editing ? t('variations.editVariation') : t('variations.addNewVariation')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="font-cairo text-sm">{t('common.type')} <span className="text-destructive">*</span></Label>
              <Input value={formType} onChange={e => setFormType(e.target.value)} placeholder={t('variations.typePlaceholder')} className="font-cairo mt-1.5" list="variation-types" />
              <datalist id="variation-types">
                {existingTypes.map(tt => <option key={tt} value={tt} />)}
              </datalist>
            </div>
            <div>
              <Label className="font-cairo text-sm">{t('common.value')} <span className="text-destructive">*</span></Label>
              <Input value={formValue} onChange={e => setFormValue(e.target.value)} placeholder={t('variations.valuePlaceholder')} className="font-cairo mt-1.5" />
            </div>
            {isColorType(formType) && (
              <div>
                <Label className="font-cairo text-sm">{t('variations.colorCode')}</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  <input type="color" value={formColorCode || '#000000'} onChange={e => setFormColorCode(e.target.value)} className="w-10 h-10 rounded-lg border cursor-pointer" />
                  <Input value={formColorCode} onChange={e => setFormColorCode(e.target.value)} placeholder="#FF0000" className="font-roboto flex-1" dir="ltr" />
                  <div className="w-10 h-10 rounded-lg border-2" style={{ backgroundColor: formColorCode || '#000' }} />
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label className="font-cairo text-sm">{formActive ? t('common.active') : t('common.inactive')}</Label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="font-cairo">{t('common.cancel')}</Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !formType.trim() || !formValue.trim()} className="font-cairo gap-1.5">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog !== null} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-cairo text-center">{t('variations.deleteVariation')}</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <p className="font-cairo text-muted-foreground">{t('variations.deleteMessage')}</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setDeleteDialog(null)} className="font-cairo px-6">{t('common.cancel')}</Button>
              <Button variant="destructive" onClick={() => deleteDialog && deleteMutation.mutate(deleteDialog)} disabled={deleteMutation.isPending} className="font-cairo px-6">
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.delete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
