import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_name: string;
  reference_sku: string | null;
  unit: string;
  quantity_received: number;
  quantity_returned: number;
  remaining_stock: number;
  unit_price: number;
  total_price: number;
  date: string;
  notes: string | null;
  document_url: string | null;
  document_name: string | null;
  low_stock_threshold: number;
  category: string | null;
  created_at: string;
}

export function useSupplierProducts(supplierId: string | undefined) {
  return useQuery({
    queryKey: ['supplier-products', supplierId],
    enabled: !!supplierId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId!)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as SupplierProduct[];
    },
  });
}

export function useCreateSupplierProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (products: Array<{
      supplier_id: string;
      product_name: string;
      reference_sku?: string;
      unit?: string;
      quantity_received?: number;
      quantity_returned?: number;
      unit_price?: number;
      date?: string;
      notes?: string;
      document_url?: string;
      document_name?: string;
      low_stock_threshold?: number;
      category?: string;
    }>) => {
      const { data, error } = await supabase.from('supplier_products').insert(products).select();
      if (error) throw error;

      // Auto-create inactive products in the main products table
      const productInserts = products.map(p => ({
        name: p.product_name,
        price: p.unit_price || 0,
        sku: p.reference_sku || null,
        stock: (p.quantity_received || 0) - (p.quantity_returned || 0),
        is_active: false,
        category: ['general'],
        product_type: 'physical',
      }));
      await supabase.from('products').insert(productInserts);

      return data;
    },
    onSuccess: (_, vars) => {
      if (vars.length > 0) {
        qc.invalidateQueries({ queryKey: ['supplier-products', vars[0].supplier_id] });
      }
    },
  });
}

export function useUpdateSupplierProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, supplierId, updates }: {
      id: string;
      supplierId: string;
      updates: Record<string, any>;
    }) => {
      const { error } = await supabase.from('supplier_products').update(updates).eq('id', id);
      if (error) throw error;
      return supplierId;
    },
    onSuccess: (supplierId) => {
      qc.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
    },
  });
}

export function useDeleteSupplierProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, supplierId }: { ids: string[]; supplierId: string }) => {
      const { error } = await supabase.from('supplier_products').delete().in('id', ids);
      if (error) throw error;
      return supplierId;
    },
    onSuccess: (supplierId) => {
      qc.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
    },
  });
}

export function useBulkUpdateSupplierProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, supplierId, updates }: {
      ids: string[];
      supplierId: string;
      updates: Record<string, any>;
    }) => {
      const { error } = await supabase.from('supplier_products').update(updates).in('id', ids);
      if (error) throw error;
      return supplierId;
    },
    onSuccess: (supplierId) => {
      qc.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
    },
  });
}
