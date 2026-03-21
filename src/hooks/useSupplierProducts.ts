import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

async function resolveProductTarget(referenceSku: string | null | undefined, productName: string) {
  if (referenceSku) {
    const { data: variantBySku } = await supabase
      .from('product_variants')
      .select('id, product_id')
      .eq('sku', referenceSku)
      .maybeSingle();

    if (variantBySku?.product_id) {
      return { productId: variantBySku.product_id, variantId: variantBySku.id };
    }

    const { data: bySku } = await supabase
      .from('products')
      .select('id')
      .eq('sku', referenceSku)
      .maybeSingle();
    if (bySku?.id) return { productId: bySku.id, variantId: null };
  }

  const { data: byName } = await supabase
    .from('products')
    .select('id')
    .eq('name', productName)
    .maybeSingle();

  return byName?.id ? { productId: byName.id, variantId: null } : null;
}

async function upsertSinglePurchaseCost(productId: string, purchaseCost: number, variantId: string | null) {
  const { data: existing, error: existingError } = await supabase
    .from('product_costs')
    .select('id, packaging_cost, storage_cost, other_cost, other_cost_label')
    .eq('product_id', productId)
    .eq('variant_id', variantId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing?.id) {
    const { error } = await supabase
      .from('product_costs')
      .update({ purchase_cost: purchaseCost, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from('product_costs').insert({
    product_id: productId,
    variant_id: variantId,
    purchase_cost: purchaseCost,
    packaging_cost: 0,
    storage_cost: 0,
    other_cost: 0,
    other_cost_label: null,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

async function syncPurchaseCostToCosts(productId: string, purchaseCost: number, specificVariantId?: string | null) {
  if (specificVariantId) {
    await upsertSinglePurchaseCost(productId, purchaseCost, specificVariantId);
    return;
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('has_variants')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  if (product?.has_variants) {
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId);

    if (variantsError) throw variantsError;

    if ((variants || []).length > 0) {
      for (const variant of variants || []) {
        await upsertSinglePurchaseCost(productId, purchaseCost, variant.id);
      }
      return;
    }
  }

  await upsertSinglePurchaseCost(productId, purchaseCost, null);
}

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

      for (const p of products) {
        const resolved = await resolveProductTarget(p.reference_sku, p.product_name);
        let productId = resolved?.productId || null;
        const variantId = resolved?.variantId || null;

        if (!productId) {
          const { data: insertedProduct, error: insertProductError } = await supabase
            .from('products')
            .insert({
              name: p.product_name,
              price: 0,
              sku: p.reference_sku || null,
              stock: (p.quantity_received || 0) - (p.quantity_returned || 0),
              is_active: false,
              category: ['general'],
              product_type: 'physical',
            })
            .select('id')
            .single();

          if (insertProductError) throw insertProductError;
          productId = insertedProduct.id;
        }

        await syncPurchaseCostToCosts(productId, Number(p.unit_price || 0), variantId);
      }

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

      if (typeof updates.unit_price !== 'undefined') {
        const { data: supplierProduct, error: supplierProductError } = await supabase
          .from('supplier_products')
          .select('product_name, reference_sku, unit_price')
          .eq('id', id)
          .single();

        if (supplierProductError) throw supplierProductError;

        const resolved = await resolveProductTarget(supplierProduct.reference_sku, supplierProduct.product_name);
        if (resolved?.productId) {
          await syncPurchaseCostToCosts(resolved.productId, Number(supplierProduct.unit_price || 0), resolved.variantId);
        }
      }

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

      if (typeof updates.unit_price !== 'undefined') {
        const { data: supplierProducts, error: supplierProductsError } = await supabase
          .from('supplier_products')
          .select('product_name, reference_sku, unit_price')
          .in('id', ids);

        if (supplierProductsError) throw supplierProductsError;

        for (const supplierProduct of supplierProducts || []) {
          const resolved = await resolveProductTarget(supplierProduct.reference_sku, supplierProduct.product_name);
          if (resolved?.productId) {
            await syncPurchaseCostToCosts(resolved.productId, Number(supplierProduct.unit_price || 0), resolved.variantId);
          }
        }
      }

      return supplierId;
    },
    onSuccess: (supplierId) => {
      qc.invalidateQueries({ queryKey: ['supplier-products', supplierId] });
    },
  });
}
