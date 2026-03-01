import { supabase } from '@/integrations/supabase/client';
import { addToQueue } from './offlineQueue';
import { toast } from 'sonner';

/**
 * Generate a temporary UUID for optimistic offline records.
 * Uses crypto.randomUUID when available, falls back to a timestamp-based id.
 */
function tempId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function offlineInsert(table: string, data: any, priority = 10) {
  if (navigator.onLine) {
    try {
      const result = await supabase.from(table as any).insert(data).select();
      return result;
    } catch {
      // Network error despite navigator.onLine — queue it
    }
  }
  // Generate a temporary ID so the UI can optimistically render it
  const optimisticData = { ...data, id: data.id || tempId() };
  await addToQueue({
    table,
    operation: 'insert',
    data,
    created_at: new Date().toISOString(),
    priority,
  });
  toast.info('أنت غير متصل — تم حفظ بياناتك وسيتم مزامنتها عند العودة للاتصال');
  return { data: [optimisticData], error: null, offline: true };
}

export async function offlineUpdate(table: string, data: any, match: Record<string, any>, priority = 10) {
  if (navigator.onLine) {
    try {
      let q: any = supabase.from(table as any).update(data);
      for (const [key, val] of Object.entries(match)) {
        q = q.eq(key, val);
      }
      return await q;
    } catch {
      // Network error — queue it
    }
  }
  await addToQueue({
    table,
    operation: 'update',
    data,
    match,
    created_at: new Date().toISOString(),
    priority,
  });
  toast.info('أنت غير متصل — تم حفظ التعديلات وسيتم مزامنتها عند العودة للاتصال');
  return { data: null, error: null, offline: true };
}

export async function offlineDelete(table: string, match: Record<string, any>, priority = 10) {
  if (navigator.onLine) {
    try {
      let q: any = supabase.from(table as any).delete();
      for (const [key, val] of Object.entries(match)) {
        q = q.eq(key, val);
      }
      return await q;
    } catch {
      // Network error — queue it
    }
  }
  await addToQueue({
    table,
    operation: 'delete',
    data: null,
    match,
    created_at: new Date().toISOString(),
    priority,
  });
  toast.info('أنت غير متصل — تم حفظ العملية وسيتم تنفيذها عند العودة للاتصال');
  return { data: null, error: null, offline: true };
}
