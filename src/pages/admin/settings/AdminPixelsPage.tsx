import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Facebook, Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function AdminPixelsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newPixelId, setNewPixelId] = useState('');
  const [newPixelName, setNewPixelName] = useState('');

  const { data: pixels, isLoading } = useQuery({
    queryKey: ['facebook-pixels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('facebook_pixels')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const addPixel = useMutation({
    mutationFn: async () => {
      if (!newPixelId.trim()) throw new Error(t('pixels.idRequired'));
      const { error } = await supabase.from('facebook_pixels').insert({
        pixel_id: newPixelId.trim(),
        name: newPixelName.trim() || `Pixel ${(pixels?.length || 0) + 1}`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facebook-pixels'] });
      setNewPixelId('');
      setNewPixelName('');
      toast({ title: t('pixels.added') });
    },
    onError: (e: any) => toast({ title: e.message, variant: 'destructive' }),
  });

  const togglePixel = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('facebook_pixels').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facebook-pixels'] });
    },
  });

  const deletePixel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('facebook_pixels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['facebook-pixels'] });
      toast({ title: t('common.deletedSuccess') });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cairo font-bold text-2xl">{t('pixels.title')}</h1>
        <p className="font-cairo text-sm text-muted-foreground mt-1">{t('pixels.description')}</p>
      </div>

      {/* Add New Pixel */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <h2 className="font-cairo font-semibold text-base flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          {t('pixels.addPixel')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label className="font-cairo text-xs">{t('pixels.pixelId')} *</Label>
            <Input
              value={newPixelId}
              onChange={e => setNewPixelId(e.target.value)}
              placeholder="123456789012345"
              className="mt-1 font-roboto"
              dir="ltr"
            />
          </div>
          <div>
            <Label className="font-cairo text-xs">{t('pixels.pixelName')}</Label>
            <Input
              value={newPixelName}
              onChange={e => setNewPixelName(e.target.value)}
              placeholder={t('pixels.namePlaceholder')}
              className="mt-1 font-cairo"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => addPixel.mutate()}
              disabled={addPixel.isPending || !newPixelId.trim()}
              className="font-cairo gap-1.5 w-full"
            >
              {addPixel.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t('pixels.addPixel')}
            </Button>
          </div>
        </div>
      </div>

      {/* Pixel List */}
      <div className="bg-card border rounded-xl">
        <div className="p-4 border-b">
          <h2 className="font-cairo font-semibold text-base flex items-center gap-2">
            <Facebook className="w-4 h-4 text-blue-600" />
            {t('pixels.activePixels')} ({pixels?.filter(p => p.is_active).length || 0})
          </h2>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <p className="p-6 text-center font-cairo text-muted-foreground">{t('common.loading')}</p>
          ) : pixels && pixels.length > 0 ? (
            pixels.map(pixel => (
              <div key={pixel.id} className="flex items-center gap-4 p-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pixel.is_active ? 'bg-blue-500/10' : 'bg-muted'}`}>
                  <Facebook className={`w-5 h-5 ${pixel.is_active ? 'text-blue-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-cairo text-sm font-semibold">{pixel.name || 'Unnamed Pixel'}</p>
                  <p className="font-roboto text-xs text-muted-foreground" dir="ltr">{pixel.pixel_id}</p>
                </div>
                <Switch
                  checked={pixel.is_active}
                  onCheckedChange={(checked) => togglePixel.mutate({ id: pixel.id, is_active: checked })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive h-9 w-9"
                  onClick={() => deletePixel.mutate(pixel.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Facebook className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-cairo text-sm text-muted-foreground">{t('pixels.noPixels')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
