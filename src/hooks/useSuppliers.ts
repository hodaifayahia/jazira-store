import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Supplier {
  id: string;
  name: string;
  category: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierWithBalance extends Supplier {
  total_received: number;
  total_given: number;
  balance: number;
}

export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch balances for all suppliers
      const { data: transactions, error: txError } = await supabase
        .from('supplier_transactions')
        .select('supplier_id, items_received, items_given');
      if (txError) throw txError;

      const balanceMap: Record<string, { received: number; given: number }> = {};
      (transactions || []).forEach((tx: any) => {
        if (!balanceMap[tx.supplier_id]) balanceMap[tx.supplier_id] = { received: 0, given: 0 };
        balanceMap[tx.supplier_id].received += Number(tx.items_received || 0);
        balanceMap[tx.supplier_id].given += Number(tx.items_given || 0);
      });

      return (suppliers || []).map((s: any): SupplierWithBalance => ({
        ...s,
        total_received: balanceMap[s.id]?.received || 0,
        total_given: balanceMap[s.id]?.given || 0,
        balance: (balanceMap[s.id]?.received || 0) - (balanceMap[s.id]?.given || 0),
      }));
    },
  });
}

export function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ['supplier', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data as Supplier;
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase.from('suppliers').insert(supplier).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: string }) => {
      const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
}
