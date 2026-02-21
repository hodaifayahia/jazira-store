import { Users, TrendingDown, ArrowDownToLine, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/i18n';
import { SupplierWithBalance } from '@/hooks/useSuppliers';

interface Props {
  suppliers: SupplierWithBalance[] | undefined;
  isLoading: boolean;
}

export default function SupplierKPICards({ suppliers, isLoading }: Props) {
  const { t } = useTranslation();

  const totalSuppliers = suppliers?.length || 0;
  const totalOwed = suppliers?.reduce((s, sup) => s + Math.max(sup.balance, 0), 0) || 0;
  const totalReceived = suppliers?.reduce((s, sup) => s + sup.total_received, 0) || 0;
  const activeCount = suppliers?.filter(s => s.status === 'active').length || 0;

  const cards = [
    { label: t('suppliers.totalSuppliers'), value: totalSuppliers, icon: Users, color: 'text-primary' },
    { label: t('suppliers.totalOwed'), value: `${totalOwed.toLocaleString()} DA`, icon: TrendingDown, color: 'text-destructive' },
    { label: t('suppliers.totalReceived'), value: `${totalReceived.toLocaleString()} DA`, icon: ArrowDownToLine, color: 'text-success' },
    { label: t('common.active'), value: activeCount, icon: Calendar, color: 'text-secondary' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-card rounded-xl p-5 border">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-card rounded-xl p-5 border hover-lift">
          <div className="flex items-center justify-between mb-3">
            <span className="font-cairo text-sm text-muted-foreground">{card.label}</span>
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <p className="font-roboto text-2xl font-bold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
