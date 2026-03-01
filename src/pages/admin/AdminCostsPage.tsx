import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { Search, DollarSign, TrendingUp, TrendingDown, AlertTriangle, Pencil, Package } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface ProductWithCost {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  is_active: boolean;
  stock: number | null;
  cost?: {
    id: string;
    purchase_cost: number;
    packaging_cost: number;
    storage_cost: number;
    other_cost: number;
    other_cost_label: string | null;
    total_cost_per_unit: number;
  } | null;
}

function getMarginColor(margin: number) {
  if (margin < 0) return 'text-red-700 bg-red-100';
  if (margin < 10) return 'text-red-600 bg-red-50';
  if (margin < 30) return 'text-yellow-700 bg-yellow-50';
  return 'text-green-700 bg-green-50';
}

function getMarginIcon(margin: number) {
  if (margin < 10) return <TrendingDown className="w-3.5 h-3.5" />;
  return <TrendingUp className="w-3.5 h-3.5" />;
}

export default function AdminCostsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editProduct, setEditProduct] = useState<ProductWithCost | null>(null);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['admin-products-for-costs'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, price, images, is_active, stock').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: costs, isLoading: loadingCosts } = useQuery({
    queryKey: ['product-costs'],
    queryFn: async () => {
      const { data } = await supabase.from('product_costs').select('*').is('variant_id', null);
      return data || [];
    },
  });

  const productsWithCosts: ProductWithCost[] = useMemo(() => {
    if (!products) return [];
    const costMap = new Map((costs || []).map(c => [c.product_id, c]));
    return products.map(p => ({
      ...p,
      cost: costMap.get(p.id) ? {
        id: costMap.get(p.id)!.id,
        purchase_cost: Number(costMap.get(p.id)!.purchase_cost),
        packaging_cost: Number(costMap.get(p.id)!.packaging_cost),
        storage_cost: Number(costMap.get(p.id)!.storage_cost),
        other_cost: Number(costMap.get(p.id)!.other_cost),
        other_cost_label: costMap.get(p.id)!.other_cost_label,
        total_cost_per_unit: Number(costMap.get(p.id)!.total_cost_per_unit),
      } : null,
    }));
  }, [products, costs]);

  const filtered = useMemo(() => {
    if (!search) return productsWithCosts;
    const q = search.toLowerCase();
    return productsWithCosts.filter(p => p.name.toLowerCase().includes(q));
  }, [productsWithCosts, search]);

  // KPIs
  const kpis = useMemo(() => {
    const withCost = productsWithCosts.filter(p => p.cost);
    const noCost = productsWithCosts.filter(p => !p.cost);
    const profitable = withCost.filter(p => {
      const margin = ((p.price - p.cost!.total_cost_per_unit) / p.price) * 100;
      return margin >= 10;
    });
    const lowMargin = withCost.filter(p => {
      const margin = ((p.price - p.cost!.total_cost_per_unit) / p.price) * 100;
      return margin < 10;
    });
    return { total: productsWithCosts.length, noCost: noCost.length, profitable: profitable.length, lowMargin: lowMargin.length };
  }, [productsWithCosts]);

  const isLoading = loadingProducts || loadingCosts;

  return (
    <div className="space-y-5 min-w-0">
      <div>
        <h2 className="font-cairo font-bold text-2xl text-foreground">{t('costs.title')}</h2>
        <p className="font-cairo text-sm text-muted-foreground mt-1">{t('costs.subtitle')}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Package className="w-5 h-5 text-primary" /></div>
          <div><p className="font-cairo text-xs text-muted-foreground">{t('costs.allProducts')}</p><p className="font-roboto font-bold text-xl text-foreground">{kpis.total}</p></div>
        </CardContent></Card>
        <Card className="border"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
          <div><p className="font-cairo text-xs text-muted-foreground">{t('costs.noCost')}</p><p className="font-roboto font-bold text-xl text-foreground">{kpis.noCost}</p></div>
        </CardContent></Card>
        <Card className="border"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0"><TrendingUp className="w-5 h-5 text-green-600" /></div>
          <div><p className="font-cairo text-xs text-muted-foreground">{t('costs.goodMargin')}</p><p className="font-roboto font-bold text-xl text-foreground">{kpis.profitable}</p></div>
        </CardContent></Card>
        <Card className="border"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><TrendingDown className="w-5 h-5 text-red-600" /></div>
          <div><p className="font-cairo text-xs text-muted-foreground">{t('costs.lowMargin')}</p><p className="font-roboto font-bold text-xl text-foreground">{kpis.lowMargin}</p></div>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('costs.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pr-10 font-cairo h-10" />
      </div>

      {/* Table - Desktop */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <>
        <div className="border rounded-lg overflow-x-auto max-w-full hidden md:block">
          <table className="text-sm min-w-[900px] whitespace-nowrap">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-right font-cairo font-semibold px-4 py-3 sticky right-0 z-10 bg-muted/30 min-w-[180px]">{t('common.product')}</th>
                <th className="text-right font-cairo font-semibold px-4 py-3 sticky right-[180px] z-10 bg-muted/30 min-w-[100px] border-l border-border/30">{t('costs.sellingPrice')}</th>
                <th className="text-right font-cairo font-semibold px-4 py-3">{t('costs.purchaseCost')}</th>
                <th className="text-right font-cairo font-semibold px-4 py-3">{t('costs.packagingCost')}</th>
                <th className="text-right font-cairo font-semibold px-4 py-3">{t('costs.totalCost')}</th>
                <th className="text-right font-cairo font-semibold px-4 py-3">{t('costs.profit')}</th>
                <th className="text-right font-cairo font-semibold px-4 py-3">{t('costs.margin')}</th>
                <th className="text-center font-cairo font-semibold px-4 py-3">{t('costs.action')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const hasCost = !!p.cost;
                const totalCost = p.cost?.total_cost_per_unit ?? 0;
                const grossProfit = p.price - totalCost;
                const margin = p.price > 0 ? ((grossProfit / p.price) * 100) : 0;

                return (
                  <tr key={p.id} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 sticky right-0 z-10 bg-card min-w-[180px]">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded bg-muted flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div>
                        )}
                        <span className="font-cairo font-medium text-foreground truncate max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-roboto text-foreground sticky right-[180px] z-10 bg-card min-w-[100px] border-l border-border/30">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3 font-roboto text-foreground">
                      {hasCost ? formatPrice(p.cost!.purchase_cost) : <span className="text-destructive font-cairo text-xs">{t('costs.notSet')}</span>}
                    </td>
                    <td className="px-4 py-3 font-roboto text-foreground">
                      {hasCost ? formatPrice(p.cost!.packaging_cost) : '—'}
                    </td>
                    <td className="px-4 py-3 font-roboto font-medium text-foreground">
                      {hasCost ? formatPrice(totalCost) : '—'}
                    </td>
                    <td className="px-4 py-3 font-roboto font-medium">
                      {hasCost ? (
                        <span className={grossProfit >= 0 ? 'text-green-700' : 'text-red-600'}>{formatPrice(grossProfit)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {hasCost ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getMarginColor(margin)}`}>
                          {getMarginIcon(margin)}
                          {margin.toFixed(1)}%
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="ghost" className="font-cairo gap-1.5 h-8" onClick={() => setEditProduct(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                        {hasCost ? t('common.edit') : t('common.add')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center font-cairo text-muted-foreground">{t('costs.noProducts')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center font-cairo text-muted-foreground">{t('costs.noProducts')}</CardContent></Card>
          ) : filtered.map(p => {
            const hasCost = !!p.cost;
            const totalCost = p.cost?.total_cost_per_unit ?? 0;
            const grossProfit = p.price - totalCost;
            const margin = p.price > 0 ? ((grossProfit / p.price) * 100) : 0;
            return (
              <Card key={p.id} className="border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0"><Package className="w-4 h-4 text-muted-foreground" /></div>
                    )}
                    <span className="font-cairo font-semibold text-foreground truncate flex-1">{p.name}</span>
                    <Button size="sm" variant="ghost" className="font-cairo gap-1 h-8 shrink-0" onClick={() => setEditProduct(p)}>
                      <Pencil className="w-3.5 h-3.5" />
                      {hasCost ? t('common.edit') : t('common.add')}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="font-cairo text-xs text-muted-foreground">{t('costs.sellingPrice')}</p>
                      <p className="font-roboto font-bold">{formatPrice(p.price)}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="font-cairo text-xs text-muted-foreground">{t('costs.totalCost')}</p>
                      <p className="font-roboto font-bold">{hasCost ? formatPrice(totalCost) : <span className="text-destructive text-xs font-cairo">{t('costs.notSet')}</span>}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="font-cairo text-xs text-muted-foreground">{t('costs.profit')}</p>
                      <p className={`font-roboto font-bold ${hasCost ? (grossProfit >= 0 ? 'text-green-700' : 'text-red-600') : ''}`}>{hasCost ? formatPrice(grossProfit) : '—'}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-2">
                      <p className="font-cairo text-xs text-muted-foreground">{t('costs.margin')}</p>
                      {hasCost ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getMarginColor(margin)}`}>
                          {getMarginIcon(margin)} {margin.toFixed(1)}%
                        </span>
                      ) : <p className="font-roboto">—</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </>
      )}

      {/* Edit Cost Dialog */}
      {editProduct && (
        <CostEditDialog product={editProduct} onClose={() => { setEditProduct(null); qc.invalidateQueries({ queryKey: ['product-costs'] }); }} />
      )}
    </div>
  );
}

function CostEditDialog({ product, onClose }: { product: ProductWithCost; onClose: () => void }) {
  const { t } = useTranslation();
  const [purchaseCost, setPurchaseCost] = useState(String(product.cost?.purchase_cost ?? ''));
  const [packagingCost, setPackagingCost] = useState(String(product.cost?.packaging_cost ?? 0));
  const [storageCost, setStorageCost] = useState(String(product.cost?.storage_cost ?? 0));
  const [otherCost, setOtherCost] = useState(String(product.cost?.other_cost ?? 0));
  const [otherLabel, setOtherLabel] = useState(product.cost?.other_cost_label ?? '');
  const [saving, setSaving] = useState(false);

  const purchase = Number(purchaseCost) || 0;
  const packaging = Number(packagingCost) || 0;
  const storage = Number(storageCost) || 0;
  const other = Number(otherCost) || 0;
  const totalCost = purchase + packaging + storage + other;
  const grossProfit = product.price - totalCost;
  const margin = product.price > 0 ? ((grossProfit / product.price) * 100) : 0;

  const handleSave = async () => {
    if (purchase <= 0) {
      toast.error(t('costs.purchaseRequired'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        product_id: product.id,
        variant_id: null as string | null,
        purchase_cost: purchase,
        packaging_cost: packaging,
        storage_cost: storage,
        other_cost: other,
        other_cost_label: otherLabel || null,
        updated_at: new Date().toISOString(),
      };

      if (product.cost?.id) {
        const { error } = await supabase.from('product_costs').update(payload).eq('id', product.cost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('product_costs').insert(payload);
        if (error) throw error;
      }
      toast.success(t('costs.costSaved'));
      onClose();
    } catch (err: any) {
      toast.error(err.message || t('costs.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-cairo text-lg">{t('costs.editCost')}: {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-cairo text-sm">{t('costs.purchaseCostLabel')}</Label>
              <Input type="number" min={0} value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} className="font-roboto mt-1" placeholder="0" />
            </div>
            <div>
              <Label className="font-cairo text-sm">{t('costs.packagingCostLabel')}</Label>
              <Input type="number" min={0} value={packagingCost} onChange={e => setPackagingCost(e.target.value)} className="font-roboto mt-1" placeholder="0" />
            </div>
            <div>
              <Label className="font-cairo text-sm">{t('costs.storageCost')}</Label>
              <Input type="number" min={0} value={storageCost} onChange={e => setStorageCost(e.target.value)} className="font-roboto mt-1" placeholder="0" />
            </div>
            <div>
              <Label className="font-cairo text-sm">{t('costs.otherCost')}</Label>
              <Input type="number" min={0} value={otherCost} onChange={e => setOtherCost(e.target.value)} className="font-roboto mt-1" placeholder="0" />
            </div>
          </div>
          {Number(otherCost) > 0 && (
            <div>
              <Label className="font-cairo text-sm">{t('costs.otherCostDesc')}</Label>
              <Input value={otherLabel} onChange={e => setOtherLabel(e.target.value)} className="font-cairo mt-1" placeholder={t('costs.otherCostPlaceholder')} />
            </div>
          )}

          {/* Profit Preview */}
          <Card className="border">
            <CardContent className="p-4 space-y-2">
              <h4 className="font-cairo font-semibold text-sm text-muted-foreground">{t('costs.profitPreview')}</h4>
              <div className="flex justify-between font-cairo text-sm">
                <span>{t('costs.sellingPrice')}</span>
                <span className="font-roboto font-medium">{formatPrice(product.price)}</span>
              </div>
              <div className="flex justify-between font-cairo text-sm">
                <span>{t('costs.totalCost')}</span>
                <span className="font-roboto font-medium">{formatPrice(totalCost)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-cairo text-sm font-bold">
                <span>{t('costs.grossProfit')}</span>
                <span className={`font-roboto ${grossProfit >= 0 ? 'text-green-700' : 'text-red-600'}`}>{formatPrice(grossProfit)}</span>
              </div>
              <div className="flex justify-between font-cairo text-sm">
                <span>{t('costs.profitMargin')}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${getMarginColor(margin)}`}>
                  {margin.toFixed(1)}%
                </span>
              </div>
              {/* Visual bar */}
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${margin >= 30 ? 'bg-green-500' : margin >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full font-cairo gap-2">
            <DollarSign className="w-4 h-4" />
            {saving ? t('common.saving') : t('costs.saveCost')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
