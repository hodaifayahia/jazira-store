import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import FormSettingsTab from '@/components/admin/FormSettingsTab';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export default function AdminFormSettingsPage() {
  const { isLoading, mergedSettings, form, updateSetting, handleSave, setField } = useAdminSettings();

  if (isLoading) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <FormSettingsTab
        currentValue={mergedSettings.checkout_form_config}
        onUpdate={v => setField('checkout_form_config', v)}
        onSave={handleSave}
        saving={updateSetting.isPending}
        hasChanges={Object.keys(form).length > 0}
      />
    </div>
  );
}
