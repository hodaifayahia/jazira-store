import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierTransaction {
  id: string;
  supplier_id: string;
  date: string;
  description: string | null;
  items_received: number;
  items_given: number;
  transaction_type: string;
  notes: string | null;
  document_url: string | null;
  document_name: string | null;
  created_at: string;
}

export function useSupplierTransactions(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['supplier-transactions', supplierId],
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_transactions')
        .select('*')
        .eq('supplier_id', supplierId!)
        .order('date', { ascending: true });
      if (error) throw error;
      return (data || []) as SupplierTransaction[];
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<SupplierTransaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('supplier_transactions').insert(tx).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['supplier-transactions', vars.supplier_id] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, supplierId }: { id: string; supplierId: string }) => {
      const { error } = await supabase.from('supplier_transactions').delete().eq('id', id);
      if (error) throw error;
      return supplierId;
    },
    onSuccess: (supplierId) => {
      qc.invalidateQueries({ queryKey: ['supplier-transactions', supplierId] });
      qc.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export async function uploadSupplierDocument(file: File): Promise<{ url: string; name: string }> {
  const ext = file.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('supplier-documents').upload(path, file);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('supplier-documents').getPublicUrl(path);
  return { url: publicUrl, name: file.name };
}
