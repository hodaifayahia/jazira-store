import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { useAdminSettings } from '@/hooks/useAdminSettings';
import { useTranslation } from '@/i18n';

export default function AdminPaymentPage() {
  const { t } = useTranslation();
  const { isLoading, mergedSettings, form, updateSetting, handleSave, setField } = useAdminSettings();

  if (isLoading) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="font-cairo font-bold text-xl">إعدادات الدفع</h2>
        <div className="space-y-4 border-b pb-4">
          <h3 className="font-cairo font-semibold">{t('settings.paymentSettings')}</h3>

          {/* COD */}
          <div className="flex items-center gap-2 bg-muted/20 p-3 rounded-lg">
            <Switch checked={mergedSettings.cod_enabled === 'true'} onCheckedChange={v => setField('cod_enabled', String(v))} />
            <Label className="font-cairo font-medium cursor-pointer">{t('settings.codPayment')}</Label>
          </div>

          {/* BaridiMob */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={mergedSettings.baridimob_enabled === 'true'} onCheckedChange={v => setField('baridimob_enabled', String(v))} />
              <Label className="font-cairo font-medium">{t('orders.baridimob')}</Label>
            </div>
            {mergedSettings.baridimob_enabled === 'true' && (
              <div className="mr-8 space-y-3 pl-2 border-r-2 border-muted pr-4">
                <div>
                  <Label className="font-cairo text-sm text-muted-foreground">{t('settings.ccpNumber')}</Label>
                  <Input value={mergedSettings.ccp_number || ''} onChange={e => setField('ccp_number', e.target.value)} className="font-roboto mt-1" dir="ltr" />
                </div>
                <div>
                  <Label className="font-cairo text-sm text-muted-foreground">{t('settings.ccpName')}</Label>
                  <Input value={mergedSettings.ccp_name || ''} onChange={e => setField('ccp_name', e.target.value)} className="font-cairo mt-1" />
                </div>
              </div>
            )}
          </div>

          {/* Flexy */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Switch checked={mergedSettings.flexy_enabled === 'true'} onCheckedChange={v => setField('flexy_enabled', String(v))} />
              <Label className="font-cairo font-medium">{t('orders.flexy')}</Label>
            </div>
            {mergedSettings.flexy_enabled === 'true' && (
              <div className="mr-8 space-y-3 pl-2 border-r-2 border-muted pr-4">
                <div>
                  <Label className="font-cairo text-sm text-muted-foreground">{t('settings.flexyPhone')}</Label>
                  <Input value={mergedSettings.flexy_number || ''} onChange={e => setField('flexy_number', e.target.value)} className="font-roboto mt-1" dir="ltr" />
                </div>
                <div>
                  <Label className="font-cairo text-sm text-muted-foreground">{t('settings.flexyAmount')}</Label>
                  <Input type="number" value={mergedSettings.flexy_deposit_amount || ''} onChange={e => setField('flexy_deposit_amount', e.target.value)} className="font-roboto mt-1" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateSetting.isPending || Object.keys(form).length === 0} className="font-cairo font-semibold gap-2">
        <Save className="w-4 h-4" />
        {updateSetting.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </Button>
    </div>
  );
}
