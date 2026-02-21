import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n';
import { Supplier } from '@/hooks/useSuppliers';
import { Check } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
  onSave: (data: any) => void;
  saving?: boolean;
}

export default function SupplierDrawer({ open, onOpenChange, supplier, onSave, saving }: Props) {
  const { t, dir } = useTranslation();
  const [form, setForm] = useState({
    name: '', category: '', contact_name: '', contact_phone: '', contact_email: '', notes: '', status: 'active',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (supplier) {
      setForm({
        name: supplier.name || '',
        category: supplier.category || '',
        contact_name: supplier.contact_name || '',
        contact_phone: supplier.contact_phone || '',
        contact_email: supplier.contact_email || '',
        notes: supplier.notes || '',
        status: supplier.status || 'active',
      });
    } else {
      setForm({ name: '', category: '', contact_name: '', contact_phone: '', contact_email: '', notes: '', status: 'active' });
    }
    setSaved(false);
  }, [supplier, open]);

  const handleSubmit = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={dir === 'rtl' ? 'left' : 'right'} className="w-full sm:max-w-md overflow-y-auto glass">
        <SheetHeader>
          <SheetTitle className="font-cairo">{supplier ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="glow-focus rounded-lg">
            <Label className="font-cairo">{t('suppliers.supplierName')} *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="font-cairo mt-1" />
          </div>
          <div className="glow-focus rounded-lg">
            <Label className="font-cairo">{t('suppliers.category')}</Label>
            <Input value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="font-cairo mt-1" />
          </div>
          <div className="glow-focus rounded-lg">
            <Label className="font-cairo">{t('suppliers.contactName')}</Label>
            <Input value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))} className="font-cairo mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="glow-focus rounded-lg">
              <Label className="font-cairo">{t('suppliers.contactPhone')}</Label>
              <Input value={form.contact_phone} onChange={e => setForm(f => ({...f, contact_phone: e.target.value}))} className="font-roboto mt-1" dir="ltr" />
            </div>
            <div className="glow-focus rounded-lg">
              <Label className="font-cairo">{t('suppliers.contactEmail')}</Label>
              <Input value={form.contact_email} onChange={e => setForm(f => ({...f, contact_email: e.target.value}))} className="font-roboto mt-1" dir="ltr" />
            </div>
          </div>
          <div>
            <Label className="font-cairo">{t('common.status')}</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
              <SelectTrigger className="mt-1 font-cairo"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active" className="font-cairo">{t('suppliers.statusActive')}</SelectItem>
                <SelectItem value="pending" className="font-cairo">{t('suppliers.statusPending')}</SelectItem>
                <SelectItem value="inactive" className="font-cairo">{t('suppliers.statusInactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="glow-focus rounded-lg">
            <Label className="font-cairo">{t('common.notes')}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="font-cairo mt-1" rows={3} />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!form.name.trim() || saving}
            className="w-full font-cairo gap-2 hover-lift"
          >
            {saved ? <Check className="w-4 h-4 animate-check-pulse" /> : null}
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
