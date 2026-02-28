import { supabase } from '@/integrations/supabase/client';
import { addToQueue } from './offlineQueue';
import { toast } from 'sonner';

export async function offlineInsert(table: string, data: any) {
  if (navigator.onLine) {
    return supabase.from(table as any).insert(data).select();
  }
  await addToQueue({
    table,
    operation: 'insert',
    data,
    created_at: new Date().toISOString(),
  });
  toast.info('أنت غير متصل — تم حفظ بياناتك وسيتم مزامنتها عند العودة للاتصال');
  return { data: null, error: null, offline: true };
}

export async function offlineUpdate(table: string, data: any, match: Record<string, any>) {
  if (navigator.onLine) {
    let q: any = supabase.from(table as any).update(data);
    for (const [key, val] of Object.entries(match)) {
      q = q.eq(key, val);
    }
    return q;
  }
  await addToQueue({
    table,
    operation: 'update',
    data,
    match,
    created_at: new Date().toISOString(),
  });
  toast.info('أنت غير متصل — تم حفظ التعديلات وسيتم مزامنتها عند العودة للاتصال');
  return { data: null, error: null, offline: true };
}

export async function offlineDelete(table: string, match: Record<string, any>) {
  if (navigator.onLine) {
    let q: any = supabase.from(table as any).delete();
    for (const [key, val] of Object.entries(match)) {
      q = q.eq(key, val);
    }
    return q;
  }
  await addToQueue({
    table,
    operation: 'delete',
    data: null,
    match,
    created_at: new Date().toISOString(),
  });
  toast.info('أنت غير متصل — تم حفظ العملية وسيتم تنفيذها عند العودة للاتصال');
  return { data: null, error: null, offline: true };
}
