import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { SupplierWithBalance } from '@/hooks/useSuppliers';
import { Phone, Mail, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const statusStyles: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  inactive: 'bg-muted text-muted-foreground',
};

export default function SupplierCard({ supplier }: { supplier: SupplierWithBalance }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-xl border p-5 hover-lift cursor-pointer group" onClick={() => navigate(`/admin/suppliers/${supplier.id}`)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-cairo font-bold text-base">{supplier.name}</h3>
          {supplier.category && <p className="font-cairo text-xs text-muted-foreground">{supplier.category}</p>}
        </div>
        <Badge variant="outline" className={`font-cairo text-xs ${statusStyles[supplier.status] || statusStyles.inactive}`}>
          {t(`suppliers.status${supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}`)}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="font-cairo text-[10px] text-muted-foreground">{t('suppliers.totalReceived')}</p>
          <p className="font-roboto text-sm font-bold text-green-600">{supplier.total_received.toLocaleString()}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="font-cairo text-[10px] text-muted-foreground">{t('suppliers.totalGiven')}</p>
          <p className="font-roboto text-sm font-bold text-destructive">{supplier.total_given.toLocaleString()}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="font-cairo text-[10px] text-muted-foreground">{t('suppliers.balance')}</p>
          <p className={`font-roboto text-sm font-bold ${supplier.balance >= 0 ? 'text-secondary' : 'text-destructive'}`}>
            {supplier.balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {supplier.contact_phone && (
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /><span className="font-roboto" dir="ltr">{supplier.contact_phone}</span></span>
        )}
        {supplier.contact_email && (
          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /><span className="font-roboto truncate max-w-[120px]" dir="ltr">{supplier.contact_email}</span></span>
        )}
      </div>
    </div>
  );
}
