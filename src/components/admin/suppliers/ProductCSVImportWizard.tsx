import { useState, useCallback } from 'react';
import { useTranslation } from '@/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Download, AlertCircle } from 'lucide-react';

const APP_FIELDS = [
  'product_name', 'reference_sku', 'unit', 'quantity_received',
  'unit_price', 'date', 'notes', 'category',
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  onImport: (rows: Record<string, any>[]) => void;
  importing: boolean;
}

export default function ProductCSVImportWizard({ open, onOpenChange, supplierId, onImport, importing }: Props) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<number[]>([]);

  const reset = () => { setStep(1); setCsvHeaders([]); setCsvRows([]); setMapping({}); setErrors([]); };

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return;
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      const rows = lines.slice(1).map(l => l.split(',').map(c => c.replace(/"/g, '').trim()));
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-map by fuzzy match
      const autoMap: Record<string, string> = {};
      headers.forEach(h => {
        const lower = h.toLowerCase();
        APP_FIELDS.forEach(f => {
          if (lower.includes(f.replace('_', ' ')) || lower.includes(f.replace('_', ''))) {
            autoMap[h] = f;
          }
        });
      });
      setMapping(autoMap);
      setStep(2);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handlePreview = () => {
    const errs: number[] = [];
    csvRows.forEach((row, i) => {
      const nameCol = csvHeaders.findIndex(h => mapping[h] === 'product_name');
      if (nameCol === -1 || !row[nameCol]?.trim()) errs.push(i);
    });
    setErrors(errs);
    setStep(3);
  };

  const handleImport = () => {
    const validRows = csvRows
      .filter((_, i) => !errors.includes(i))
      .map(row => {
        const obj: Record<string, any> = { supplier_id: supplierId };
        csvHeaders.forEach((h, ci) => {
          const field = mapping[h];
          if (!field) return;
          let val: any = row[ci] || '';
          if (['quantity_received', 'quantity_returned', 'unit_price'].includes(field)) {
            val = Number(val) || 0;
          }
          obj[field] = val;
        });
        if (!obj.product_name) return null;
        return obj;
      })
      .filter(Boolean);
    onImport(validRows as Record<string, any>[]);
  };

  const downloadTemplate = () => {
    const csv = 'product_name,reference_sku,unit,quantity_received,unit_price,date,notes,category\nExample Product,SKU-001,pcs,100,500,2026-01-01,Sample note,General';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'supplier-products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-cairo">{t('supplierProducts.csvImport')}</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div
              className="upload-zone rounded-xl p-12 text-center cursor-pointer"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-cairo text-muted-foreground">{t('suppliers.dragDropHint')}</p>
              <p className="font-cairo text-xs text-muted-foreground mt-1">CSV</p>
              <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <Button variant="outline" onClick={downloadTemplate} className="font-cairo gap-2">
              <Download className="w-4 h-4" /> {t('supplierProducts.downloadTemplate')}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="font-cairo text-sm text-muted-foreground">{t('supplierProducts.step2Map')}</p>
            <div className="space-y-2">
              {csvHeaders.map(h => (
                <div key={h} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="font-cairo text-sm sm:w-40 truncate">{h}</span>
                  <span className="text-muted-foreground hidden sm:inline">→</span>
                  <Select value={mapping[h] || '__skip'} onValueChange={v => setMapping(prev => ({ ...prev, [h]: v === '__skip' ? '' : v }))}>
                    <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip">{t('supplierProducts.skip')}</SelectItem>
                      {APP_FIELDS.map(f => <SelectItem key={f} value={f}>{t(`supplierProducts.${f === 'product_name' ? 'productName' : f === 'reference_sku' ? 'referenceSku' : f === 'quantity_received' ? 'qtyReceived' : f === 'unit_price' ? 'unitPrice' : f}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)} className="font-cairo">{t('common.previous')}</Button>
              <Button onClick={handlePreview} disabled={!Object.values(mapping).includes('product_name')} className="font-cairo">{t('common.next')}</Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            {errors.length > 0 && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 flex items-center gap-2 font-cairo text-sm">
                <AlertCircle className="w-4 h-4" />
                {t('supplierProducts.errorsFound').replace('{n}', String(errors.length))}
              </div>
            )}
            <div className="overflow-x-auto max-h-60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    {csvHeaders.filter(h => mapping[h]).map(h => (
                      <TableHead key={h} className="font-cairo text-xs">{mapping[h]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvRows.slice(0, 50).map((row, i) => (
                    <TableRow key={i} className={errors.includes(i) ? 'bg-destructive/5' : ''}>
                      <TableCell className="font-roboto text-xs">{i + 1}</TableCell>
                      {csvHeaders.filter(h => mapping[h]).map((h, ci) => (
                        <TableCell key={ci} className="font-roboto text-xs">{row[csvHeaders.indexOf(h)] || '—'}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {importing && <Progress value={60} className="h-2" />}
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)} className="font-cairo">{t('common.previous')}</Button>
              <Button onClick={handleImport} disabled={importing} className="font-cairo">
                {importing ? t('supplierProducts.importing') : `${t('common.import')} (${csvRows.length - errors.length})`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
