import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { useSupplier } from '@/hooks/useSuppliers';
import { useSupplierTransactions, useCreateTransaction, useDeleteTransaction, SupplierTransaction } from '@/hooks/useSupplierTransactions';
import TransactionForm from '@/components/admin/suppliers/TransactionForm';
import DocumentViewer from '@/components/admin/suppliers/DocumentViewer';
import SupplierProductsTab from '@/components/admin/suppliers/SupplierProductsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowRight, ArrowLeft, Plus, FileText, Trash2, ArrowDownToLine, ArrowUpFromLine, Scale, Receipt, Package } from 'lucide-react';
import { toast } from 'sonner';

const typeIcons: Record<string, any> = {
  receipt: ArrowDownToLine,
  payment: ArrowUpFromLine,
  return: Receipt,
  adjustment: Scale,
};

const typeColors: Record<string, string> = {
  receipt: 'text-green-600',
  payment: 'text-destructive',
  return: 'text-yellow-600',
  adjustment: 'text-secondary',
};

export default function AdminSupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, dir } = useTranslation();
  const navigate = useNavigate();
  const { data: supplier, isLoading: loadingSupplier } = useSupplier(id);
  const { data: transactions, isLoading: loadingTx } = useSupplierTransactions(id);
  const createTxMut = useCreateTransaction();
  const deleteTxMut = useDeleteTransaction();

  const [txFormOpen, setTxFormOpen] = useState(false);
  const [docViewer, setDocViewer] = useState<{ url: string; name: string } | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);

  // Compute running balances
  const txWithBalance = useMemo(() => {
    if (!transactions) return [];
    let balance = 0;
    return transactions.map(tx => {
      balance += Number(tx.items_received) - Number(tx.items_given);
      return { ...tx, runningBalance: balance };
    });
  }, [transactions]);

  const totalReceived = txWithBalance.reduce((s, tx) => s + Number(tx.items_received), 0);
  const totalGiven = txWithBalance.reduce((s, tx) => s + Number(tx.items_given), 0);
  const balance = totalReceived - totalGiven;

  const handleAddTx = async (data: any) => {
    try {
      await createTxMut.mutateAsync(data);
      toast.success(t('suppliers.transactionAdded'));
      setTxFormOpen(false);
    } catch {
      toast.error(t('common.errorOccurred'));
    }
  };

  const handleDeleteTx = async () => {
    if (!deleteTxId || !id) return;
    try {
      await deleteTxMut.mutateAsync({ id: deleteTxId, supplierId: id });
      toast.success(t('suppliers.transactionDeleted'));
    } catch {
      toast.error(t('common.errorOccurred'));
    }
    setDeleteTxId(null);
  };

  if (loadingSupplier) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!supplier) return null;

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/suppliers')} aria-label={t('common.back')}>
          <BackIcon className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-cairo font-bold text-2xl">{supplier.name}</h1>
          <p className="font-cairo text-sm text-muted-foreground">{supplier.category || ''} {supplier.contact_phone ? `· ${supplier.contact_phone}` : ''}</p>
        </div>
        <Badge variant="outline" className={`font-cairo ${
          supplier.status === 'active' ? 'bg-green-500/10 text-green-700' :
          supplier.status === 'pending' ? 'bg-yellow-500/10 text-yellow-700' :
          'bg-muted text-muted-foreground'
        }`}>
          {t(`suppliers.status${supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}`)}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="font-cairo">
          <TabsTrigger value="transactions" className="font-cairo gap-2">
            <Receipt className="w-4 h-4" />
            {t('supplierProducts.transactionsTab')}
          </TabsTrigger>
          <TabsTrigger value="products" className="font-cairo gap-2">
            <Package className="w-4 h-4" />
            {t('supplierProducts.tab')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border p-5 hover-lift">
              <p className="font-cairo text-sm text-muted-foreground mb-1">{t('suppliers.totalReceived')}</p>
              <p className="font-roboto text-2xl font-bold text-green-600">{totalReceived.toLocaleString()} DA</p>
            </div>
            <div className="bg-card rounded-xl border p-5 hover-lift">
              <p className="font-cairo text-sm text-muted-foreground mb-1">{t('suppliers.totalGiven')}</p>
              <p className="font-roboto text-2xl font-bold text-destructive">{totalGiven.toLocaleString()} DA</p>
            </div>
            <div className="bg-card rounded-xl border p-5 hover-lift">
              <p className="font-cairo text-sm text-muted-foreground mb-1">{t('suppliers.balance')}</p>
              <p className={`font-roboto text-2xl font-bold ${balance >= 0 ? 'text-secondary' : 'text-destructive'}`}>{balance.toLocaleString()} DA</p>
            </div>
          </div>

          {/* Transactions Header */}
          <div className="flex items-center justify-between">
            <h2 className="font-cairo font-bold text-lg">{t('suppliers.transactions')}</h2>
            <Button onClick={() => setTxFormOpen(true)} className="font-cairo gap-2 hover-lift">
              <Plus className="w-4 h-4" /> {t('suppliers.addTransaction')}
            </Button>
          </div>

          {/* Transaction Ledger */}
          {loadingTx ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          ) : txWithBalance.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-xl border">
              <Receipt className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="font-cairo text-muted-foreground">{t('suppliers.noTransactions')}</p>
              <Button onClick={() => setTxFormOpen(true)} variant="outline" className="font-cairo mt-3 gap-2">
                <Plus className="w-4 h-4" /> {t('suppliers.addFirstTransaction')}
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-cairo">{t('common.date')}</TableHead>
                      <TableHead className="font-cairo">{t('suppliers.transactionType')}</TableHead>
                      <TableHead className="font-cairo">{t('common.description')}</TableHead>
                      <TableHead className="font-cairo text-center">{t('suppliers.itemsReceived')}</TableHead>
                      <TableHead className="font-cairo text-center">{t('suppliers.itemsGiven')}</TableHead>
                      <TableHead className="font-cairo text-center">{t('suppliers.runningBalance')}</TableHead>
                      <TableHead className="font-cairo text-center">{t('suppliers.document')}</TableHead>
                      <TableHead className="font-cairo text-center">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txWithBalance.map(tx => {
                      const TypeIcon = typeIcons[tx.transaction_type] || Receipt;
                      return (
                        <TableRow key={tx.id} className="row-accent">
                          <TableCell className="font-roboto text-sm">{tx.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className={`w-4 h-4 ${typeColors[tx.transaction_type] || ''}`} />
                              <span className="font-cairo text-sm">{t(`suppliers.type${tx.transaction_type.charAt(0).toUpperCase() + tx.transaction_type.slice(1)}`)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-cairo text-sm text-muted-foreground max-w-[200px] truncate">{tx.description || '—'}</TableCell>
                          <TableCell className="font-roboto text-center text-sm">
                            {Number(tx.items_received) > 0 ? <span className="text-green-600 font-medium">+{Number(tx.items_received).toLocaleString()}</span> : '—'}
                          </TableCell>
                          <TableCell className="font-roboto text-center text-sm">
                            {Number(tx.items_given) > 0 ? <span className="text-destructive font-medium">-{Number(tx.items_given).toLocaleString()}</span> : '—'}
                          </TableCell>
                          <TableCell className={`font-roboto text-center text-sm font-bold ${tx.runningBalance >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                            {tx.runningBalance.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">
                            {tx.document_url ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => setDocViewer({ url: tx.document_url!, name: tx.document_name || 'Document' })}
                                    aria-label={t('suppliers.document')}
                                  >
                                    <FileText className="w-4 h-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p className="font-cairo text-xs">{tx.document_name}</p></TooltipContent>
                              </Tooltip>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTxId(tx.id)} aria-label={t('common.delete')}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p className="font-cairo text-xs">{t('common.delete')}</p></TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="products">
          <SupplierProductsTab supplierId={id!} />
        </TabsContent>
      </Tabs>

      <TransactionForm
        open={txFormOpen}
        onOpenChange={setTxFormOpen}
        supplierId={id!}
        onSave={handleAddTx}
        saving={createTxMut.isPending}
      />

      {docViewer && (
        <DocumentViewer
          open={!!docViewer}
          onOpenChange={() => setDocViewer(null)}
          url={docViewer.url}
          name={docViewer.name}
        />
      )}

      <AlertDialog open={!!deleteTxId} onOpenChange={() => setDeleteTxId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">{t('common.confirm')}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-cairo">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTx} className="bg-destructive text-destructive-foreground font-cairo">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
