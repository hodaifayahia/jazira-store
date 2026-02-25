import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n';
import { uploadSupplierDocument } from '@/hooks/useSupplierTransactions';
import { Upload, FileText, ArrowDownCircle, ArrowUpCircle, RotateCcw, Settings2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  onSave: (data: any) => void;
  saving?: boolean;
  currentBalance?: { received: number; given: number };
}

const TRANSACTION_TYPES = [
  { value: 'receipt', labelKey: 'suppliers.typeReceipt', icon: ArrowDownCircle, color: 'text-green-600' },
  { value: 'payment', labelKey: 'suppliers.typePayment', icon: ArrowUpCircle, color: 'text-red-600' },
  { value: 'return', labelKey: 'suppliers.typeReturn', icon: RotateCcw, color: 'text-yellow-600' },
  { value: 'adjustment', labelKey: 'suppliers.typeAdjustment', icon: Settings2, color: 'text-blue-600' },
];

export default function TransactionForm({ open, onOpenChange, supplierId, onSave, saving, currentBalance }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    transaction_type: 'receipt',
    items_received: '',
    items_given: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && /\.(pdf|jpg|jpeg|png)$/i.test(f.name)) setFile(f);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const received = parseFloat(form.items_received) || 0;
    const given = parseFloat(form.items_given) || 0;
    if (received === 0 && given === 0) {
      newErrors.amount = 'يجب إدخال قيمة واحدة على الأقل';
    }
    if (!form.date) {
      newErrors.date = 'التاريخ مطلوب';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const itemsReceived = parseFloat(form.items_received) || 0;
  const itemsGiven = parseFloat(form.items_given) || 0;

  // Balance preview
  const prevReceived = currentBalance?.received || 0;
  const prevGiven = currentBalance?.given || 0;
  const prevBalance = prevReceived - prevGiven;
  const newBalance = prevBalance + itemsReceived - itemsGiven;

  const handleSubmit = async () => {
    if (!validate()) return;

    // Confirmation for large amounts
    const totalAmount = itemsReceived + itemsGiven;
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

    onSave({
      supplier_id: supplierId,
      date: form.date,
      description: form.description || null,
      transaction_type: form.transaction_type,
      items_received: itemsReceived,
      items_given: itemsGiven,
      notes: form.notes || null,
      document_url: doc_url,
      document_name: doc_name,
    });

    // Reset
    setForm({ date: new Date().toISOString().split('T')[0], description: '', transaction_type: 'receipt', items_received: '', items_given: '', notes: '' });
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
      return: 'إرجاع بضاعة',
      adjustment: 'تعديل رصيد',
    };
    setForm(f => ({
      ...f,
      transaction_type: v,
      description: f.description || suggestions[v] || '',
      items_received: '',
      items_given: '',
    }));
  };

  const isReceiveType = form.transaction_type === 'receipt' || form.transaction_type === 'return';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto glass">
        <DialogHeader>
          <DialogTitle className="font-cairo flex items-center gap-2">
            <TypeIcon className={`w-5 h-5 ${selectedType?.color}`} />
            {t('suppliers.addTransaction')}
          </DialogTitle>
        </DialogHeader>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-cairo text-sm flex items-center gap-1">
                <ArrowDownCircle className="w-3 h-3 text-green-600" />
                وارد (DA)
              </Label>
              <Input
                type="number"
                value={form.items_received}
                onChange={e => { setForm(f => ({...f, items_received: e.target.value})); setErrors(e2 => ({...e2, amount: ''})); }}
                className={`font-roboto mt-1 ${errors.amount ? 'border-destructive' : ''}`}
                dir="ltr"
                min="0"
                step="0.01"
                placeholder="0"
              />
            </div>
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
          </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
