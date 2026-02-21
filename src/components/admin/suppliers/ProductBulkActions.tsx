import { useState } from 'react';
import { useTranslation } from '@/i18n';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Trash2, Download, Pencil } from 'lucide-react';
import { SupplierProduct } from '@/hooks/useSupplierProducts';

interface Props {
  selected: SupplierProduct[];
  onDelete: () => void;
  onBulkEdit: (updates: Record<string, any>) => void;
  deleting: boolean;
}

export default function ProductBulkActions({ selected, onDelete, onBulkEdit, deleting }: Props) {
  const { t } = useTranslation();
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const count = selected.length;

  if (count === 0) return null;

  const handleExport = () => {
    const headers = ['Product Name', 'SKU', 'Unit', 'Qty Received', 'Qty Returned', 'Remaining', 'Unit Price', 'Total Price', 'Date', 'Notes'];
    const rows = selected.map(p => [
      p.product_name, p.reference_sku || '', p.unit, p.quantity_received, p.quantity_returned,
      p.remaining_stock, p.unit_price, p.total_price, p.date, p.notes || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier-products-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkEdit = () => {
    const updates: Record<string, any> = {};
    if (editDate) updates.date = editDate;
    if (editCategory) updates.category = editCategory;
    if (Object.keys(updates).length > 0) {
      onBulkEdit(updates);
    }
    setShowEdit(false);
    setEditDate('');
    setEditCategory('');
  };

  return (
    <>
      <div className="fixed bottom-6 start-4 end-4 sm:start-1/2 sm:end-auto sm:-translate-x-1/2 z-50 bg-card border rounded-xl shadow-lg p-3 flex flex-wrap items-center gap-2 sm:gap-3 animate-fade-in glass">
        <span className="font-cairo text-sm font-medium px-2">
          {t('suppliers.selectedCount').replace('{n}', String(count))}
        </span>
        <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)} className="font-cairo gap-1">
          <Trash2 className="w-4 h-4" /> {t('suppliers.bulkDelete')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} className="font-cairo gap-1">
          <Download className="w-4 h-4" /> {t('supplierProducts.bulkExport')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="font-cairo gap-1">
          <Pencil className="w-4 h-4" /> {t('supplierProducts.bulkEdit')}
        </Button>
      </div>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">{t('supplierProducts.bulkDeleteConfirm').replace('{n}', String(count))}</AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">{t('supplierProducts.bulkDeleteMessage').replace('{n}', String(count))}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-cairo">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onDelete(); setShowDelete(false); }} disabled={deleting} className="bg-destructive text-destructive-foreground font-cairo">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">{t('supplierProducts.bulkEditTitle').replace('{n}', String(count))}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="font-cairo text-sm text-muted-foreground">{t('common.date')}</label>
              <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="font-roboto" />
            </div>
            <div>
              <label className="font-cairo text-sm text-muted-foreground">{t('products.category')}</label>
              <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)} className="font-cairo">{t('common.cancel')}</Button>
            <Button onClick={handleBulkEdit} className="font-cairo">{t('common.apply')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
