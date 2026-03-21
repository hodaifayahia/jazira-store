import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/i18n';
import { useSupplier } from '@/hooks/useSuppliers';
import { useSupplierTransactions, useCreateTransaction } from '@/hooks/useSupplierTransactions';
import TransactionForm from '@/components/admin/suppliers/TransactionForm';

export default function AdminSupplierTransactionCreatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, dir } = useTranslation();

  const { data: supplier, isLoading: loadingSupplier } = useSupplier(id);
  const { data: transactions } = useSupplierTransactions(id);
  const createTxMut = useCreateTransaction();

  const currentBalance = useMemo(() => {
    if (!transactions) return { received: 0, given: 0 };
    return {
      received: transactions.reduce((sum, tx) => sum + Number(tx.items_received || 0), 0),
      given: transactions.reduce((sum, tx) => sum + Number(tx.items_given || 0), 0),
    };
  }, [transactions]);

  const handleSave = async (data: any) => {
    try {
      await createTxMut.mutateAsync(data);
      toast.success(t('suppliers.transactionAdded'));
      navigate(`/admin/suppliers/${id}`);
    } catch {
      toast.error(t('common.errorOccurred'));
    }
  };

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (loadingSupplier) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[520px] rounded-2xl" />
      </div>
    );
  }

  if (!supplier || !id) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="font-cairo gap-1"
            onClick={() => navigate(`/admin/suppliers/${id}`)}
          >
            <BackIcon className="w-4 h-4" /> {t('common.back')}
          </Button>
          <h1 className="font-cairo font-bold text-xl sm:text-2xl flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            {t('suppliers.addTransaction')}
          </h1>
        </div>
        <p className="font-cairo text-sm text-muted-foreground">
          {supplier.name}
        </p>
      </div>

      <TransactionForm
        mode="page"
        supplierId={id}
        onSave={handleSave}
        saving={createTxMut.isPending}
        currentBalance={currentBalance}
        title={`${t('suppliers.addTransaction')} — ${supplier.name}`}
        onCancel={() => navigate(`/admin/suppliers/${id}`)}
      />
    </div>
  );
}
