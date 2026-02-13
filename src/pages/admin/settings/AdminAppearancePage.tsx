import AppearanceTab from '@/components/admin/AppearanceTab';
import { useAdminSettings } from '@/hooks/useAdminSettings';

export default function AdminAppearancePage() {
  const { isLoading, mergedSettings, form, updateSetting, handleSave, setField } = useAdminSettings();

  if (isLoading) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <AppearanceTab
        currentValue={mergedSettings.store_template || 'classic'}
        onUpdate={v => setField('store_template', v)}
        onSave={handleSave}
        saving={updateSetting.isPending}
        hasChanges={Object.keys(form).length > 0}
      />
    </div>
  );
}
