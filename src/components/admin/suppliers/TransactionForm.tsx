import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/i18n';
import { uploadSupplierDocument } from '@/hooks/useSupplierTransactions';
import { Upload, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  onSave: (data: any) => void;
  saving?: boolean;
}

export default function TransactionForm({ open, onOpenChange, supplierId, onSave, saving }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    transaction_type: 'receipt',
    amount: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && /\.(pdf|jpg|jpeg|png)$/i.test(f.name)) setFile(f);
  }, []);

  const handleSubmit = async () => {
    const amount = parseFloat(form.amount);
    if (!amount) return;

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

    const isReceiptOrReturn = form.transaction_type === 'receipt' || form.transaction_type === 'return';

    onSave({
      supplier_id: supplierId,
      date: form.date,
      description: form.description || null,
      transaction_type: form.transaction_type,
      items_received: isReceiptOrReturn ? amount : 0,
      items_given: !isReceiptOrReturn ? amount : 0,
      notes: form.notes || null,
      document_url: doc_url,
      document_name: doc_name,
    });

    // Reset
    setForm({ date: new Date().toISOString().split('T')[0], description: '', transaction_type: 'receipt', amount: '', notes: '' });
    setFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass">
        <DialogHeader>
          <DialogTitle className="font-cairo">{t('suppliers.addTransaction')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="glow-focus rounded-lg">
              <Label className="font-cairo">{t('common.date')}</Label>
              <Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="font-roboto mt-1" dir="ltr" />
            </div>
            <div>
              <Label className="font-cairo">{t('suppliers.transactionType')}</Label>
              <Select value={form.transaction_type} onValueChange={v => setForm(f => ({...f, transaction_type: v}))}>
                <SelectTrigger className="mt-1 font-cairo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="receipt" className="font-cairo">{t('suppliers.typeReceipt')}</SelectItem>
                  <SelectItem value="payment" className="font-cairo">{t('suppliers.typePayment')}</SelectItem>
                  <SelectItem value="return" className="font-cairo">{t('suppliers.typeReturn')}</SelectItem>
                  <SelectItem value="adjustment" className="font-cairo">{t('suppliers.typeAdjustment')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="glow-focus rounded-lg">
            <Label className="font-cairo">{t('suppliers.amount')} (DA) *</Label>
            <Input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="font-roboto mt-1" dir="ltr" min="0" step="0.01" />
          </div>
          <div className="glow-focus rounded-lg">
            <Label className="font-cairo">{t('common.description')}</Label>
            <Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="font-cairo mt-1" />
          </div>
          <div className="glow-focus rounded-lg">
            <Label className="font-cairo">{t('common.notes')}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} className="font-cairo mt-1" rows={2} />
          </div>

          {/* Document Upload Zone */}
          <div>
            <Label className="font-cairo">{t('suppliers.document')}</Label>
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
            disabled={!form.amount || saving || uploading}
            className="w-full font-cairo gap-2 hover-lift"
          >
            {saving || uploading ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
