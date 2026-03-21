import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n';
import { uploadSupplierDocument } from '@/hooks/useSupplierTransactions';
import { Upload, FileText, ArrowDownCircle, ArrowUpCircle, AlertCircle, Plus, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  supplierId: string;
  onSave: (data: any) => void;
  saving?: boolean;
  currentBalance?: { received: number; given: number };
  mode?: 'dialog' | 'page';
  onCancel?: () => void;
  title?: string;
}

const TRANSACTION_TYPES = [
  { value: 'receipt', labelKey: 'suppliers.typeReceipt', icon: ArrowDownCircle, color: 'text-green-600' },
  { value: 'payment', labelKey: 'suppliers.typePayment', icon: ArrowUpCircle, color: 'text-red-600' },
];

interface ReceiptLine {
  product_id: string;
  quantity: number;
  unit_price: number;
  selected_variations: Record<string, string>;
}

const emptyReceiptLine = (): ReceiptLine => ({
  product_id: '',
  quantity: 1,
  unit_price: 0,
  selected_variations: {},
});

export default function TransactionForm({
  open = false,
  onOpenChange,
  supplierId,
  onSave,
  saving,
  currentBalance,
  mode = 'dialog',
  onCancel,
  title,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    transaction_type: 'receipt',
    items_given: '',
    notes: '',
  });
  const [receiptLines, setReceiptLines] = useState<ReceiptLine[]>([emptyReceiptLine()]);
  const [extraCosts, setExtraCosts] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: products = [] } = useQuery({
    queryKey: ['supplier-tx-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: variations = [] } = useQuery({
    queryKey: ['supplier-tx-product-variations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variations')
        .select('product_id, variation_type, variation_value')
        .eq('is_active', true)
        .order('variation_type')
        .order('variation_value');
      if (error) throw error;
      return data || [];
    },
  });

  const variationsByProduct = useMemo(() => {
    const byProduct: Record<string, Record<string, string[]>> = {};
    (variations || []).forEach((v: any) => {
      if (!byProduct[v.product_id]) byProduct[v.product_id] = {};
      if (!byProduct[v.product_id][v.variation_type]) byProduct[v.product_id][v.variation_type] = [];
      if (!byProduct[v.product_id][v.variation_type].includes(v.variation_value)) {
        byProduct[v.product_id][v.variation_type].push(v.variation_value);
      }
    });
    return byProduct;
  }, [variations]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && /\.(pdf|jpg|jpeg|png)$/i.test(f.name)) setFile(f);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const given = parseFloat(form.items_given) || 0;
    const receiptTotal = receiptLines.reduce((sum, line) => sum + (Number(line.quantity || 0) * Number(line.unit_price || 0)), 0);
    const totalWithCosts = receiptTotal + (parseFloat(extraCosts) || 0);

    if (form.transaction_type === 'payment' && given <= 0) {
      newErrors.amount = 'يجب إدخال قيمة صادر أكبر من 0';
    }

    if (form.transaction_type === 'receipt') {
      const hasAnyLine = receiptLines.some(line => line.product_id && Number(line.quantity) > 0 && Number(line.unit_price) >= 0);
      if (!hasAnyLine || totalWithCosts <= 0) {
        newErrors.amount = 'يرجى إضافة منتج واحد على الأقل بقيمة صحيحة';
      }
    }

    if (!form.date) {
      newErrors.date = 'التاريخ مطلوب';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const receiptProductsTotal = receiptLines.reduce((sum, line) => sum + (Number(line.quantity || 0) * Number(line.unit_price || 0)), 0);
  const extraCostsValue = parseFloat(extraCosts) || 0;
  const itemsReceived = receiptProductsTotal + extraCostsValue;
  const itemsGiven = parseFloat(form.items_given) || 0;

  // Balance preview
  const prevReceived = currentBalance?.received || 0;
  const prevGiven = currentBalance?.given || 0;
  const prevBalance = prevReceived - prevGiven;
  const newBalance = prevBalance + itemsReceived - itemsGiven;

  const handleSubmit = async () => {
    if (!validate()) return;

    // Confirmation for large amounts
    const totalAmount = form.transaction_type === 'receipt' ? itemsReceived : itemsGiven;
    if (totalAmount > 100000) {
      const confirmed = window.confirm(`المبلغ كبير (${totalAmount.toLocaleString()} DA). هل تريد المتابعة؟`);
      if (!confirmed) return;
    }

    let doc_url: string | null = null;
    let doc_name: string | null = null;

    if (file) {
      setUploading(true);
      try {
        const res = await uploadSupplierDocument(file);
        doc_url = res.url;
        doc_name = res.name;
      } catch {
        toast.error(t('common.errorOccurred'));
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const receiptSummary = form.transaction_type === 'receipt'
      ? receiptLines
          .filter(line => line.product_id && Number(line.quantity) > 0)
          .map((line, idx) => {
            const product = products.find((p: any) => p.id === line.product_id);
            const vars = Object.values(line.selected_variations).filter(Boolean).join(' / ');
            return `${idx + 1}) ${product?.name || 'منتج'}${vars ? ` (${vars})` : ''} × ${line.quantity} = ${(Number(line.quantity) * Number(line.unit_price)).toLocaleString()} DA`;
          })
          .join(' | ')
      : '';

    onSave({
      supplier_id: supplierId,
      date: form.date,
      description: form.description || (form.transaction_type === 'receipt' ? `استلام بضاعة${receiptSummary ? `: ${receiptSummary}` : ''}` : 'دفعة مالية'),
      transaction_type: form.transaction_type,
      items_received: form.transaction_type === 'receipt' ? itemsReceived : 0,
      items_given: form.transaction_type === 'payment' ? itemsGiven : 0,
      notes: form.transaction_type === 'receipt'
        ? [form.notes, `تكاليف إضافية: ${extraCostsValue.toLocaleString()} DA`, `إجمالي الاستلام: ${itemsReceived.toLocaleString()} DA`].filter(Boolean).join(' | ')
        : (form.notes || null),
      document_url: doc_url,
      document_name: doc_name,
    });

    // Reset
    setForm({ date: new Date().toISOString().split('T')[0], description: '', transaction_type: 'receipt', items_given: '', notes: '' });
    setReceiptLines([emptyReceiptLine()]);
    setExtraCosts('');
    setFile(null);
    setErrors({});
  };

  const selectedType = TRANSACTION_TYPES.find(t => t.value === form.transaction_type);
  const TypeIcon = selectedType?.icon || ArrowDownCircle;

  // Auto-suggest description based on type
  const handleTypeChange = (v: string) => {
    const suggestions: Record<string, string> = {
      receipt: 'استلام بضاعة',
      payment: 'دفعة مالية',
    };
    setForm(f => ({
      ...f,
      transaction_type: v,
      description: f.description || suggestions[v] || '',
      items_given: '',
    }));
    setErrors({});
  };

  const isReceiveType = form.transaction_type === 'receipt';

  const updateReceiptLine = (index: number, field: keyof ReceiptLine, value: any) => {
    setReceiptLines(prev => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  };

  const updateVariation = (index: number, variationType: string, variationValue: string) => {
    setReceiptLines(prev => prev.map((line, i) => (
      i === index
        ? { ...line, selected_variations: { ...line.selected_variations, [variationType]: variationValue } }
        : line
    )));
  };

  const removeReceiptLine = (index: number) => {
    if (receiptLines.length <= 1) return;
    setReceiptLines(prev => prev.filter((_, i) => i !== index));
  };

  const formContent = (
    <div className="space-y-4 mt-2">
          {/* Transaction Type - Visual Cards */}
          <div>
            <Label className="font-cairo text-sm mb-2 block">{t('suppliers.transactionType')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTION_TYPES.map(tt => {
                const Icon = tt.icon;
                return (
                  <button
                    key={tt.value}
                    type="button"
                    onClick={() => handleTypeChange(tt.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm ${
                      form.transaction_type === tt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${tt.color}`} />
                    <span className="font-cairo font-medium">{t(tt.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="font-cairo text-sm">{t('common.date')} *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={e => { setForm(f => ({...f, date: e.target.value})); setErrors(e2 => ({...e2, date: ''})); }}
                className={`font-roboto mt-1 ${errors.date ? 'border-destructive' : ''}`}
                dir="ltr"
              />
              {errors.date && <p className="text-destructive text-xs font-cairo mt-1">{errors.date}</p>}
            </div>
            <div>
              <Label className="font-cairo text-sm">{t('common.description')}</Label>
              <Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="font-cairo mt-1" />
            </div>
          </div>

          {/* Amount Fields */}
          {isReceiveType ? (
            <div className="space-y-3">
              {receiptLines.map((line, index) => {
                const lineVariations = line.product_id ? variationsByProduct[line.product_id] || {} : {};
                const variationTypes = Object.keys(lineVariations);
                const lineTotal = Number(line.quantity || 0) * Number(line.unit_price || 0);

                return (
                  <div key={index} className="rounded-xl border p-3 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <p className="font-cairo text-xs text-muted-foreground">منتج #{index + 1}</p>
                      {receiptLines.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeReceiptLine(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label className="font-cairo text-sm flex items-center gap-1"><Package className="w-3 h-3" />المنتج</Label>
                      <Select
                        value={line.product_id}
                        onValueChange={v => {
                          updateReceiptLine(index, 'product_id', v);
                          updateReceiptLine(index, 'unit_price', 0);
                          updateReceiptLine(index, 'selected_variations', {});
                          setErrors(e2 => ({ ...e2, amount: '' }));
                        }}
                      >
                        <SelectTrigger className="font-cairo mt-1"><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id} className="font-cairo">{product.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {variationTypes.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {variationTypes.map(type => (
                          <div key={type}>
                            <Label className="font-cairo text-xs text-muted-foreground">{type}</Label>
                            <Select
                              value={line.selected_variations[type] || ''}
                              onValueChange={value => updateVariation(index, type, value)}
                            >
                              <SelectTrigger className="font-cairo mt-1 h-9"><SelectValue placeholder={`اختر ${type}`} /></SelectTrigger>
                              <SelectContent>
                                {lineVariations[type].map(value => (
                                  <SelectItem key={`${type}-${value}`} value={value} className="font-cairo">{value}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="font-cairo text-sm">الكمية</Label>
                        <Input type="number" min="1" step="1" value={line.quantity || ''} onChange={e => updateReceiptLine(index, 'quantity', Number(e.target.value))} className="font-roboto mt-1" dir="ltr" />
                      </div>
                      <div>
                        <Label className="font-cairo text-sm">سعر الوحدة (DA)</Label>
                        <Input type="number" min="0" step="0.01" value={line.unit_price || ''} onChange={e => updateReceiptLine(index, 'unit_price', Number(e.target.value))} className="font-roboto mt-1" dir="ltr" />
                      </div>
                      <div>
                        <Label className="font-cairo text-sm">الإجمالي</Label>
                        <Input readOnly value={lineTotal.toLocaleString()} className="font-roboto mt-1 bg-muted/60" dir="ltr" />
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button type="button" variant="outline" className="w-full font-cairo gap-2" onClick={() => setReceiptLines(prev => [...prev, emptyReceiptLine()])}>
                <Plus className="w-4 h-4" /> إضافة منتج
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="font-cairo text-sm">تكاليف/دين إضافي (DA)</Label>
                  <Input type="number" min="0" step="0.01" value={extraCosts} onChange={e => setExtraCosts(e.target.value)} className="font-roboto mt-1" dir="ltr" placeholder="0" />
                </div>
                <div>
                  <Label className="font-cairo text-sm flex items-center gap-1">
                    <ArrowDownCircle className="w-3 h-3 text-green-600" />
                    وارد (DA)
                  </Label>
                  <Input readOnly value={itemsReceived.toLocaleString()} className={`font-roboto mt-1 bg-green-500/5 ${errors.amount ? 'border-destructive' : ''}`} dir="ltr" />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label className="font-cairo text-sm flex items-center gap-1">
                <ArrowUpCircle className="w-3 h-3 text-red-600" />
                صادر (DA)
              </Label>
              <Input
                type="number"
                value={form.items_given}
                onChange={e => { setForm(f => ({...f, items_given: e.target.value})); setErrors(e2 => ({...e2, amount: ''})); }}
                className={`font-roboto mt-1 ${errors.amount ? 'border-destructive' : ''}`}
                dir="ltr"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
          )}
          {errors.amount && (
            <div className="flex items-center gap-1.5 text-destructive text-xs font-cairo">
              <AlertCircle className="w-3 h-3" />
              {errors.amount}
            </div>
          )}

          {/* Balance Preview */}
          {currentBalance && (
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-sm font-cairo border">
              <p className="text-muted-foreground text-xs font-semibold">معاينة الرصيد</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الرصيد الحالي</span>
                <span className={`font-roboto font-bold ${prevBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {prevBalance.toLocaleString()} DA
                </span>
              </div>
              {(itemsReceived > 0 || itemsGiven > 0) && (
                <>
                  <hr className="border-border" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الرصيد بعد المعاملة</span>
                    <span className={`font-roboto font-bold ${newBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {newBalance.toLocaleString()} DA
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <div>
            <Label className="font-cairo text-sm">{t('common.notes')}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="font-cairo mt-1" rows={2} />
          </div>

          {/* Document Upload Zone */}
          <div>
            <Label className="font-cairo text-sm">{t('suppliers.document')}</Label>
            <div
              className={`upload-zone rounded-xl p-6 text-center cursor-pointer mt-1 ${dragging ? 'dragging' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('supplier-doc-input')?.click()}
            >
              <input
                id="supplier-doc-input"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]); }}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-cairo text-sm">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-cairo text-sm text-muted-foreground">{t('suppliers.dragDropHint')}</p>
                  <p className="font-cairo text-xs text-muted-foreground/60 mt-1">{t('suppliers.supportedFormats')}</p>
                </>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="w-full font-cairo gap-2 hover-lift"
          >
            {saving || uploading ? t('common.saving') : t('common.save')}
          </Button>
          {mode === 'page' && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full font-cairo"
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>
  );

  if (mode === 'page') {
    return (
      <div className="bg-card border rounded-2xl p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2">
          <TypeIcon className={`w-5 h-5 ${selectedType?.color}`} />
          <h2 className="font-cairo font-bold text-lg">{title || t('suppliers.addTransaction')}</h2>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto glass">
        <DialogHeader>
          <DialogTitle className="font-cairo flex items-center gap-2">
            <TypeIcon className={`w-5 h-5 ${selectedType?.color}`} />
            {title || t('suppliers.addTransaction')}
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
