import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Upload, Package } from 'lucide-react';
import { uploadSupplierDocument } from '@/hooks/useSupplierTransactions';
import { toast } from 'sonner';

interface ProductRow {
  product_name: string;
  reference_sku: string;
  unit: string;
  quantity_received: number;
  unit_price: number;
  date: string;
  notes: string;
  document_url: string;
  document_name: string;
}

const emptyRow = (): ProductRow => ({
  product_name: '',
  reference_sku: '',
  unit: 'pcs',
  quantity_received: 0,
  unit_price: 0,
  date: new Date().toISOString().split('T')[0],
  notes: '',
  document_url: '',
  document_name: '',
});

const UNITS = ['pcs', 'kg', 'box', 'liter', 'meter'];

const UNIT_LABELS: Record<string, string> = {
  pcs: 'قطعة',
  kg: 'كيلوجرام',
  box: 'صندوق',
  liter: 'لتر',
  meter: 'متر',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  onSave: (rows: ProductRow[]) => void;
  saving: boolean;
}

export default function ProductBulkEntryForm({ open, onOpenChange, supplierId, onSave, saving }: Props) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<ProductRow[]>([emptyRow()]);
  const [productSearch, setProductSearch] = useState<Record<number, string>>({});

  // Fetch existing products for selection
  const { data: existingProducts } = useQuery({
    queryKey: ['products-for-supplier-form'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, sku, price').order('name');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const updateRow = (index: number, field: keyof ProductRow, value: any) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter((_, i) => i !== index));
    setProductSearch(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const selectExistingProduct = (index: number, productId: string) => {
    if (productId === '__manual__') {
      updateRow(index, 'product_name', '');
      updateRow(index, 'reference_sku', '');
      return;
    }
    const product = existingProducts?.find(p => p.id === productId);
    if (product) {
      updateRow(index, 'product_name', product.name);
      updateRow(index, 'reference_sku', product.sku || '');
      if (product.price) updateRow(index, 'unit_price', product.price);
    }
  };

  const handleUpload = async (index: number, file: File) => {
    try {
      const { url, name } = await uploadSupplierDocument(file);
      updateRow(index, 'document_url', url);
      updateRow(index, 'document_name', name);
    } catch {
      toast.error(t('common.errorOccurred'));
    }
  };

  const handleSave = () => {
    const valid = rows.filter(r => r.product_name.trim());
    if (valid.length === 0) return;
    onSave(valid);
    setRows([emptyRow()]);
    setProductSearch({});
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setRows([emptyRow()]);
      setProductSearch({});
    }
    onOpenChange(val);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto glass">
        <SheetHeader>
          <SheetTitle className="font-cairo">{t('supplierProducts.addProducts')}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {rows.map((row, i) => (
            <div key={i} className="bg-muted/30 rounded-xl p-4 space-y-3 border relative">
              {rows.length > 1 && (
                <Button variant="ghost" size="icon" className="absolute top-2 end-2 h-7 w-7 text-destructive" onClick={() => removeRow(i)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}

              {/* Select from existing products */}
              <div>
                <label className="font-cairo text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <Package className="w-3 h-3" />
                  اختر من المنتجات الموجودة (اختياري)
                </label>
                <Select onValueChange={v => selectExistingProduct(i, v)}>
                  <SelectTrigger className="font-cairo text-sm">
                    <SelectValue placeholder="ابحث في المنتجات أو أدخل يدوياً..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="__manual__" className="font-cairo text-muted-foreground">
                      ✏️ إدخال يدوي
                    </SelectItem>
                    {existingProducts?.map(p => (
                      <SelectItem key={p.id} value={p.id} className="font-cairo">
                        <span className="flex flex-col">
                          <span>{p.name}</span>
                          {p.sku && <span className="text-xs text-muted-foreground font-roboto">{p.sku}</span>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">{t('supplierProducts.productName')} *</label>
                  <Input value={row.product_name} onChange={e => updateRow(i, 'product_name', e.target.value)} className="glow-focus" />
                </div>
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">{t('supplierProducts.referenceSku')}</label>
                  <Input value={row.reference_sku} onChange={e => updateRow(i, 'reference_sku', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">الوحدة</label>
                  <Select value={row.unit} onValueChange={v => updateRow(i, 'unit', v)}>
                    <SelectTrigger className="font-cairo"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {UNITS.map(u => (
                        <SelectItem key={u} value={u} className="font-cairo">
                          {UNIT_LABELS[u] || u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">الكمية المستلمة</label>
                  <Input type="number" min={0} value={row.quantity_received || ''} onChange={e => updateRow(i, 'quantity_received', Number(e.target.value))} className="font-roboto" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">سعر الوحدة</label>
                  <Input type="number" min={0} value={row.unit_price || ''} onChange={e => updateRow(i, 'unit_price', Number(e.target.value))} className="font-roboto" />
                </div>
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">المخزون المتبقي</label>
                  <Input readOnly value={row.quantity_received} className="font-roboto bg-muted/50" />
                </div>
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">السعر الإجمالي</label>
                  <Input readOnly value={(row.unit_price * row.quantity_received).toLocaleString()} className="font-roboto bg-muted/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">التاريخ</label>
                  <Input type="date" value={row.date} onChange={e => updateRow(i, 'date', e.target.value)} className="font-roboto" />
                </div>
                <div>
                  <label className="font-cairo text-xs text-muted-foreground">ملاحظات</label>
                  <Input value={row.notes} onChange={e => updateRow(i, 'notes', e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => e.target.files?.[0] && handleUpload(i, e.target.files[0])} />
                  <div className="flex items-center gap-1 text-xs text-primary hover:underline font-cairo">
                    <Upload className="w-3 h-3" />
                    {row.document_name || 'رفع مستند'}
                  </div>
                </label>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={() => setRows(prev => [...prev, emptyRow()])} className="font-cairo gap-2 w-full">
            <Plus className="w-4 h-4" /> {t('supplierProducts.addRow')}
          </Button>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving || !rows.some(r => r.product_name.trim())} className="flex-1 font-cairo hover-lift">
              {saving ? t('common.saving') : t('supplierProducts.saveAll')}
            </Button>
            <Button variant="outline" onClick={() => handleClose(false)} className="font-cairo">{t('common.cancel')}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
