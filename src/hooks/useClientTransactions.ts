import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientTransaction {
  id: string;
  client_id: string;
  transaction_type: string; // 'product_given' | 'product_returned' | 'payment_received'
  product_id: string | null;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

export function useClientTransactions(clientId: string) {
  return useQuery({
    queryKey: ['client_transactions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_transactions')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as ClientTransaction[];
    },
    enabled: !!clientId,
  });
}

export function useCreateClientTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<ClientTransaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('client_transactions').insert(tx).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['client_transactions', variables.client_id] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClientTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase.from('client_transactions').delete().eq('id', id);
      if (error) throw error;
      return clientId;
    },
    onSuccess: (clientId) => {
      qc.invalidateQueries({ queryKey: ['client_transactions', clientId] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useClientBalance(clientId: string) {
  const { data: transactions } = useClientTransactions(clientId);

  const balance = (transactions ?? []).reduce((acc, tx) => {
    if (tx.transaction_type === 'product_given') return acc + tx.amount;
    if (tx.transaction_type === 'payment_received') return acc - tx.amount;
    if (tx.transaction_type === 'product_returned') return acc - tx.amount;
    return acc;
  }, 0);

  const totalGiven = (transactions ?? [])
    .filter(tx => tx.transaction_type === 'product_given')
    .reduce((s, tx) => s + tx.amount, 0);

  const totalPaid = (transactions ?? [])
    .filter(tx => tx.transaction_type === 'payment_received')
    .reduce((s, tx) => s + tx.amount, 0);

  const totalReturned = (transactions ?? [])
    .filter(tx => tx.transaction_type === 'product_returned')
    .reduce((s, tx) => s + tx.amount, 0);

  return { balance, totalGiven, totalPaid, totalReturned, transactions };
}
