import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Package, Search, Settings2, ChevronDown, ChevronUp,
  Check, X, Plus, AlertTriangle, PackageX, DollarSign, Layers,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

// ── Types ──
interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number | null;
  images: string[] | null;
  has_variants: boolean | null;
  is_active: boolean | null;
}

interface Variant {
  id: string;
  product_id: string;
  option_values: Json;
  price: number;
  quantity: number;
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

const COLUMNS = [
  { key: 'image', label: 'صورة المنتج' },
  { key: 'name', label: 'اسم المنتج' },
  { key: 'sku', label: 'رمز SKU' },
  { key: 'quantity', label: 'الكمية' },
  { key: 'price', label: 'السعر' },
  { key: 'status', label: 'الحالة' },
] as const;

type ColumnKey = (typeof COLUMNS)[number]['key'];

const DEFAULT_COLS: Record<ColumnKey, boolean> = {
  image: true, name: true, sku: true, quantity: true, price: true, status: true,
};

const PAGE_SIZE = 15;

function getColumnPrefs(): Record<ColumnKey, boolean> {
  try {
    const saved = localStorage.getItem('inventory_column_prefs');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { ...DEFAULT_COLS };
}

function variantLabel(optionValues: Json): string {
  if (typeof optionValues === 'object' && optionValues && !Array.isArray(optionValues)) {
    const vals = Object.values(optionValues as Record<string, string>);
    if (vals.length > 0) return vals.join(' / ');
  }
  return 'قياس موحد';
}

function stockStatus(qty: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (qty <= 0) return 'out_of_stock';
  if (qty <= 5) return 'low_stock';
  return 'in_stock';
}

const STATUS_DOT: Record<string, string> = {
  in_stock: 'bg-green-500',
  low_stock: 'bg-yellow-500',
  out_of_stock: 'bg-red-500',
};

const STATUS_LABEL: Record<string, string> = {
  in_stock: 'متوفر',
  low_stock: 'منخفض',
  out_of_stock: 'نفد',
};

const FILTER_TABS: { key: StockFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'in_stock', label: 'متوفر' },
  { key: 'low_stock', label: 'منخفض' },
  { key: 'out_of_stock', label: 'نفد المخزون' },
];

// ── Component ──
export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [page, setPage] = useState(0);
  const [columns, setColumns] = useState<Record<ColumnKey, boolean>>(getColumnPrefs);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Data
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku, price, stock, images, has_variants, is_active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: allVariants = [], isLoading: loadingVariants } = useQuery({
    queryKey: ['inventory-variants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, product_id, option_values, price, quantity');
      if (error) throw error;
      return (data ?? []) as Variant[];
    },
  });

  const variantsByProduct = useMemo(() => {
    const map: Record<string, Variant[]> = {};
    allVariants.forEach(v => {
      (map[v.product_id] ??= []).push(v);
    });
    return map;
  }, [allVariants]);

  // Compute total quantity per product
  const totalQty = useCallback((p: Product) => {
    if (p.has_variants) {
      const vars = variantsByProduct[p.id];
      if (!vars?.length) return 0;
      return vars.reduce((s, v) => s + v.quantity, 0);
    }
    return p.stock ?? 0;
  }, [variantsByProduct]);

  // KPIs
  const kpis = useMemo(() => {
    let total = 0, outOfStock = 0, lowStock = 0, inventoryValue = 0;
    products.forEach(p => {
      total++;
      const qty = totalQty(p);
      const st = stockStatus(qty);
      if (st === 'out_of_stock') outOfStock++;
      else if (st === 'low_stock') lowStock++;

      if (p.has_variants) {
        (variantsByProduct[p.id] ?? []).forEach(v => {
          inventoryValue += v.quantity * v.price;
        });
      } else {
        inventoryValue += (p.stock ?? 0) * p.price;
      }
    });
    return { total, outOfStock, lowStock, inventoryValue };
  }, [products, variantsByProduct, totalQty]);

  // Filtered + searched + paginated
  const filtered = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q));
    }
    if (filter !== 'all') {
      list = list.filter(p => stockStatus(totalQty(p)) === filter);
    }
    return list;
  }, [products, search, filter, totalQty]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Column prefs
  const toggleCol = (key: ColumnKey) => {
    setColumns(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('inventory_column_prefs', JSON.stringify(next));
      return next;
    });
  };

  const isCol = (key: ColumnKey) => columns[key];

  if (loadingProducts || loadingVariants) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={Package} label="إجمالي المنتجات" value={kpis.total} color="text-primary" />
        <KpiCard icon={PackageX} label="نفد المخزون" value={kpis.outOfStock} color="text-destructive" />
        <KpiCard icon={AlertTriangle} label="مخزون منخفض" value={kpis.lowStock} color="text-yellow-500" />
        <KpiCard icon={DollarSign} label="قيمة المخزون" value={formatPrice(kpis.inventoryValue)} color="text-primary" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(t => (
            <Button
              key={t.key}
              size="sm"
              variant={filter === t.key ? 'default' : 'outline'}
              onClick={() => { setFilter(t.key); setPage(0); }}
              className="font-cairo text-xs"
            >
              {t.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="البحث عن منتج..."
              className="pr-8 h-9 font-cairo text-sm"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 font-cairo text-xs shrink-0">
                <Settings2 className="w-3.5 h-3.5" />
                إعدادات العرض
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-3 space-y-2">
              {COLUMNS.map(c => (
                <label key={c.key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={columns[c.key]} onCheckedChange={() => toggleCol(c.key)} />
                  <span className="font-cairo text-sm">{c.label}</span>
                </label>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table (desktop) / Cards (mobile) */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {isCol('image') && <th className="p-3 text-right font-cairo font-semibold w-16">صورة</th>}
                  {isCol('name') && <th className="p-3 text-right font-cairo font-semibold">المنتج</th>}
                  {isCol('sku') && <th className="p-3 text-right font-cairo font-semibold">SKU</th>}
                  {isCol('quantity') && <th className="p-3 text-right font-cairo font-semibold">الكمية</th>}
                  {isCol('price') && <th className="p-3 text-right font-cairo font-semibold">السعر</th>}
                  {isCol('status') && <th className="p-3 text-right font-cairo font-semibold">الحالة</th>}
                  <th className="p-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {paged.map(p => {
                  const qty = totalQty(p);
                  const st = stockStatus(qty);
                  const expanded = expandedId === p.id;
                  return (
                    <ProductRows
                      key={p.id}
                      product={p}
                      qty={qty}
                      st={st}
                      expanded={expanded}
                      onToggle={() => setExpandedId(expanded ? null : p.id)}
                      variants={variantsByProduct[p.id] ?? []}
                      columns={columns}
                      queryClient={queryClient}
                    />
                  );
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground font-cairo">لا توجد منتجات</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y">
            {paged.map(p => {
              const qty = totalQty(p);
              const st = stockStatus(qty);
              const expanded = expandedId === p.id;
              return (
                <MobileProductCard
                  key={p.id}
                  product={p}
                  qty={qty}
                  st={st}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : p.id)}
                  variants={variantsByProduct[p.id] ?? []}
                  queryClient={queryClient}
                />
              );
            })}
            {paged.length === 0 && (
              <div className="p-8 text-center text-muted-foreground font-cairo">لا توجد منتجات</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="font-cairo gap-1">
            <ChevronRight className="w-4 h-4" />
            السابق
          </Button>
          <span className="font-cairo text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="font-cairo gap-1">
            التالي
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ──
function KpiCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-muted ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-cairo text-xs text-muted-foreground">{label}</p>
          <p className="font-cairo font-bold text-lg">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Desktop Product Rows ──
function ProductRows({
  product: p, qty, st, expanded, onToggle, variants, columns, queryClient,
}: {
  product: Product; qty: number; st: string; expanded: boolean;
  onToggle: () => void; variants: Variant[];
  columns: Record<ColumnKey, boolean>; queryClient: any;
}) {
  const img = p.images?.[0];
  const isCol = (k: ColumnKey) => columns[k];
  const colCount = COLUMNS.filter(c => columns[c.key]).length + 1;

  return (
    <>
      <tr className="border-b hover:bg-muted/30 transition-colors cursor-pointer" onClick={onToggle}>
        {isCol('image') && (
          <td className="p-3">
            {img ? <img src={img} alt="" className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted" />}
          </td>
        )}
        {isCol('name') && <td className="p-3 font-cairo font-medium">{p.name}</td>}
        {isCol('sku') && <td className="p-3 font-cairo text-muted-foreground text-xs">{p.sku || '—'}</td>}
        {isCol('quantity') && <td className="p-3 font-cairo font-semibold">{qty}</td>}
        {isCol('price') && <td className="p-3 font-cairo">{formatPrice(p.price)}</td>}
        {isCol('status') && (
          <td className="p-3">
            <span className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[st]}`} />
              <span className="font-cairo text-xs">{STATUS_LABEL[st]}</span>
            </span>
          </td>
        )}
        <td className="p-3">
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={colCount} className="bg-muted/20 p-0">
            <VariantDetails product={p} variants={variants} queryClient={queryClient} />
          </td>
        </tr>
      )}
    </>
  );
}

// ── Mobile Product Card ──
function MobileProductCard({
  product: p, qty, st, expanded, onToggle, variants, queryClient,
}: {
  product: Product; qty: number; st: string; expanded: boolean;
  onToggle: () => void; variants: Variant[]; queryClient: any;
}) {
  const img = p.images?.[0];
  return (
    <div className="p-3">
      <button onClick={onToggle} className="w-full flex items-center gap-3 text-right">
        {img ? <img src={img} alt="" className="w-12 h-12 rounded object-cover shrink-0" /> : <div className="w-12 h-12 rounded bg-muted shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="font-cairo font-medium text-sm truncate">{p.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[st]}`} />
            <span className="font-cairo text-xs text-muted-foreground">{qty} قطعة</span>
            <span className="font-cairo text-xs text-muted-foreground">· {formatPrice(p.price)}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {expanded && (
        <div className="mt-2">
          <VariantDetails product={p} variants={variants} queryClient={queryClient} />
        </div>
      )}
    </div>
  );
}

// ── Variant Details (shared desktop/mobile) ──
function VariantDetails({ product, variants, queryClient }: { product: Product; variants: Variant[]; queryClient: any }) {
  const rows = product.has_variants && variants.length > 0
    ? variants.map(v => ({ id: v.id, label: variantLabel(v.option_values), price: v.price, quantity: v.quantity, isVariant: true }))
    : [{ id: product.id, label: 'المنتج الأساسي', price: product.price, quantity: product.stock ?? 0, isVariant: false }];

  return (
    <div className="p-3 md:px-6">
      <p className="font-cairo font-semibold text-xs text-muted-foreground mb-2">تفاصيل المقاسات والأسعار</p>
      <div className="space-y-1">
        {rows.map(row => (
          <VariantRow key={row.id} row={row} productId={product.id} hasVariants={!!product.has_variants} queryClient={queryClient} />
        ))}
      </div>
    </div>
  );
}

// ── Single Variant Row with inline edit + add stock ──
function VariantRow({
  row, productId, hasVariants, queryClient,
}: {
  row: { id: string; label: string; price: number; quantity: number; isVariant: boolean };
  productId: string; hasVariants: boolean; queryClient: any;
}) {
  const [editing, setEditing] = useState(false);
  const [editQty, setEditQty] = useState(row.quantity);
  const [editPrice, setEditPrice] = useState(row.price);
  const [adding, setAdding] = useState(false);
  const [addAmount, setAddAmount] = useState(1);
  const [saving, setSaving] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-variants'] });
  };

  const syncParentStock = async () => {
    if (!hasVariants) return;
    const { data } = await supabase.from('product_variants').select('quantity').eq('product_id', productId);
    if (data) {
      const total = data.reduce((s: number, v: any) => s + v.quantity, 0);
      await supabase.from('products').update({ stock: total }).eq('id', productId);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (row.isVariant) {
        await supabase.from('product_variants').update({ quantity: editQty, price: editPrice }).eq('id', row.id);
        await syncParentStock();
      } else {
        await supabase.from('products').update({ stock: editQty, price: editPrice }).eq('id', row.id);
      }
      toast.success('تم الحفظ بنجاح');
      invalidate();
      setEditing(false);
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (addAmount <= 0) return;
    setSaving(true);
    try {
      if (row.isVariant) {
        await supabase.from('product_variants').update({ quantity: row.quantity + addAmount }).eq('id', row.id);
        await syncParentStock();
      } else {
        await supabase.from('products').update({ stock: (row.quantity) + addAmount }).eq('id', row.id);
      }
      toast.success(`تم إضافة ${addAmount} وحدة`);
      invalidate();
      setAdding(false);
      setAddAmount(1);
    } catch {
      toast.error('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const st = stockStatus(row.quantity);

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-background border text-sm">
      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[st]}`} />
      <span className="font-cairo font-medium flex-1 min-w-[80px]">{row.label}</span>

      {editing ? (
        <>
          <div className="flex items-center gap-1">
            <span className="font-cairo text-xs text-muted-foreground">الكمية:</span>
            <Input type="number" min={0} value={editQty} onChange={e => setEditQty(Number(e.target.value))} className="w-20 h-7 text-xs" />
          </div>
          <div className="flex items-center gap-1">
            <span className="font-cairo text-xs text-muted-foreground">السعر:</span>
            <Input type="number" min={0} value={editPrice} onChange={e => setEditPrice(Number(e.target.value))} className="w-24 h-7 text-xs" />
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} disabled={saving}>
            <Check className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(false); setEditQty(row.quantity); setEditPrice(row.price); }}>
            <X className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </>
      ) : adding ? (
        <>
          <div className="flex items-center gap-1">
            <span className="font-cairo text-xs text-muted-foreground">إضافة:</span>
            <Input type="number" min={1} value={addAmount} onChange={e => setAddAmount(Number(e.target.value))} className="w-20 h-7 text-xs" />
          </div>
          <Button size="sm" variant="default" className="h-7 text-xs font-cairo" onClick={handleAdd} disabled={saving}>
            تأكيد
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setAdding(false)}>
            <X className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </>
      ) : (
        <>
          <span className="font-cairo text-xs text-muted-foreground">{row.quantity} قطعة</span>
          <span className="font-cairo text-xs text-muted-foreground">· {formatPrice(row.price)}</span>
          <Button size="sm" variant="outline" className="h-7 text-xs font-cairo gap-1" onClick={() => { setEditing(true); setEditQty(row.quantity); setEditPrice(row.price); }}>
            تعديل
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs font-cairo gap-1" onClick={() => setAdding(true)}>
            <Plus className="w-3 h-3" />
            إضافة مخزون
          </Button>
        </>
      )}
    </div>
  );
}
