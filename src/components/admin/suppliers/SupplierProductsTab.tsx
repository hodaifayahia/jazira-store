import { useState, useMemo } from 'react';
import { useTranslation } from '@/i18n';
import { useSupplierProducts, useCreateSupplierProducts, useUpdateSupplierProduct, useDeleteSupplierProducts, useBulkUpdateSupplierProducts, SupplierProduct } from '@/hooks/useSupplierProducts';
import ProductBulkEntryForm from './ProductBulkEntryForm';
import ProductBulkActions from './ProductBulkActions';
import ProductCSVImportWizard from './ProductCSVImportWizard';
import DocumentViewer from './DocumentViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Search, FileText, Trash2, Pencil, Package, AlertTriangle, TrendingUp, Clock, Upload } from 'lucide-react';
import { toast } from 'sonner';

type SortField = 'date' | 'quantity_received' | 'unit_price' | 'remaining_stock';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

interface Props {
  supplierId: string;
}

export default function SupplierProductsTab({ supplierId }: Props) {
  const { t } = useTranslation();
  const { data: products, isLoading } = useSupplierProducts(supplierId);
  const createMut = useCreateSupplierProducts();
  const updateMut = useUpdateSupplierProduct();
  const deleteMut = useDeleteSupplierProducts();
  const bulkUpdateMut = useBulkUpdateSupplierProducts();

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [docViewer, setDocViewer] = useState<{ url: string; name: string } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});

  const getStockStatus = (p: SupplierProduct): 'in_stock' | 'low_stock' | 'out_of_stock' => {
    if (Number(p.remaining_stock) <= 0) return 'out_of_stock';
    if (Number(p.remaining_stock) <= p.low_stock_threshold) return 'low_stock';
    return 'in_stock';
  };

  const filtered = useMemo(() => {
    if (!products) return [];
    let list = products.filter(p => {
      const matchSearch = !search || p.product_name.toLowerCase().includes(search.toLowerCase()) || (p.reference_sku?.toLowerCase().includes(search.toLowerCase()));
      const matchStock = stockFilter === 'all' || getStockStatus(p) === stockFilter;
      return matchSearch && matchStock;
    });
    list.sort((a, b) => {
      if (sortBy === 'date') return b.date.localeCompare(a.date);
      return Number(b[sortBy]) - Number(a[sortBy]);
    });
    return list;
  }, [products, search, stockFilter, sortBy]);

  const selectedProducts = filtered.filter(p => selectedIds.has(p.id));

  // Summary stats
  const totalProducts = products?.length || 0;
  const totalValue = products?.reduce((s, p) => s + Number(p.total_price), 0) || 0;
  const lowStockCount = products?.filter(p => getStockStatus(p) === 'low_stock' || getStockStatus(p) === 'out_of_stock').length || 0;
  const lastUpdated = products?.length ? products.reduce((latest, p) => p.created_at > latest ? p.created_at : latest, products[0].created_at) : null;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(p => p.id)));
  };

  const handleAddProducts = async (rows: any[]) => {
    try {
      await createMut.mutateAsync(rows.map(r => ({ ...r, supplier_id: supplierId })));
      toast.success(t('supplierProducts.productsAdded').replace('{n}', String(rows.length)));
      setAddFormOpen(false);
    } catch { toast.error(t('common.errorOccurred')); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync({ ids: [deleteId], supplierId });
      toast.success(t('supplierProducts.productDeleted'));
    } catch { toast.error(t('common.errorOccurred')); }
    setDeleteId(null);
  };

  const handleBulkDelete = async () => {
    try {
      await deleteMut.mutateAsync({ ids: Array.from(selectedIds), supplierId });
      toast.success(t('supplierProducts.bulkDeleted').replace('{n}', String(selectedIds.size)));
      setSelectedIds(new Set());
    } catch { toast.error(t('common.errorOccurred')); }
  };

  const handleBulkEdit = async (updates: Record<string, any>) => {
    try {
      await bulkUpdateMut.mutateAsync({ ids: Array.from(selectedIds), supplierId, updates });
      toast.success(t('supplierProducts.productUpdated'));
      setSelectedIds(new Set());
    } catch { toast.error(t('common.errorOccurred')); }
  };

  const handleImport = async (rows: Record<string, any>[]) => {
    try {
      await createMut.mutateAsync(rows as any);
      toast.success(t('supplierProducts.importSuccess').replace('{n}', String(rows.length)));
      setImportOpen(false);
    } catch { toast.error(t('common.errorOccurred')); }
  };

  const startEdit = (p: SupplierProduct) => {
    setEditingId(p.id);
    setEditValues({ quantity_received: p.quantity_received, unit_price: p.unit_price, low_stock_threshold: p.low_stock_threshold });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateMut.mutateAsync({ id: editingId, supplierId, updates: editValues });
      toast.success(t('supplierProducts.productUpdated'));
    } catch { toast.error(t('common.errorOccurred')); }
    setEditingId(null);
    setEditValues({});
  };

  const stockBadge = (p: SupplierProduct) => {
    const status = getStockStatus(p);
    if (status === 'out_of_stock') return <Badge variant="outline" className="bg-red-500/10 text-red-700 font-cairo text-xs">{t('supplierProducts.outOfStock')}</Badge>;
    if (status === 'low_stock') return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 font-cairo text-xs">{t('supplierProducts.lowStock')}</Badge>;
    return <Badge variant="outline" className="bg-green-500/10 text-green-700 font-cairo text-xs">{t('supplierProducts.inStock')}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4 hover-lift">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-cairo text-xs text-muted-foreground">{t('supplierProducts.totalProducts')}</span>
          </div>
          <p className="font-roboto text-xl font-bold">{totalProducts}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 hover-lift">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="font-cairo text-xs text-muted-foreground">{t('supplierProducts.totalStockValue')}</span>
          </div>
          <p className="font-roboto text-xl font-bold text-green-600">{totalValue.toLocaleString()} DA</p>
        </div>
        <div className="bg-card rounded-xl border p-4 hover-lift">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="font-cairo text-xs text-muted-foreground">{t('supplierProducts.lowStockAlerts')}</span>
          </div>
          <p className={`font-roboto text-xl font-bold ${lowStockCount > 0 ? 'text-yellow-600' : ''}`}>{lowStockCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4 hover-lift">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-cairo text-xs text-muted-foreground">{t('supplierProducts.lastUpdated')}</span>
          </div>
          <p className="font-roboto text-sm font-medium">{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : '—'}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('supplierProducts.searchPlaceholder')} className="ps-9 font-cairo" />
        </div>
        <Select value={stockFilter} onValueChange={v => setStockFilter(v as StockFilter)}>
          <SelectTrigger className="w-40 font-cairo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('supplierProducts.allStock')}</SelectItem>
            <SelectItem value="in_stock">{t('supplierProducts.inStock')}</SelectItem>
            <SelectItem value="low_stock">{t('supplierProducts.lowStock')}</SelectItem>
            <SelectItem value="out_of_stock">{t('supplierProducts.outOfStock')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={v => setSortBy(v as SortField)}>
          <SelectTrigger className="w-40 font-cairo"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t('common.date')}</SelectItem>
            <SelectItem value="quantity_received">{t('supplierProducts.qtyReceived')}</SelectItem>
            <SelectItem value="unit_price">{t('supplierProducts.unitPrice')}</SelectItem>
            <SelectItem value="remaining_stock">{t('supplierProducts.remainingStock')}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setAddFormOpen(true)} className="font-cairo gap-2 hover-lift">
          <Plus className="w-4 h-4" /> {t('supplierProducts.addProducts')}
        </Button>
        <Button variant="outline" onClick={() => setImportOpen(true)} className="font-cairo gap-2">
          <Upload className="w-4 h-4" /> {t('supplierProducts.importProducts')}
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border">
          <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="font-cairo text-muted-foreground">{t('supplierProducts.noProducts')}</p>
          <Button onClick={() => setAddFormOpen(true)} variant="outline" className="font-cairo mt-3 gap-2">
            <Plus className="w-4 h-4" /> {t('supplierProducts.addFirstProduct')}
          </Button>
        </div>
      ) : (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.size === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead className="font-cairo">{t('supplierProducts.productName')}</TableHead>
                  <TableHead className="font-cairo">{t('supplierProducts.referenceSku')}</TableHead>
                  <TableHead className="font-cairo">{t('supplierProducts.unit')}</TableHead>
                  <TableHead className="font-cairo text-center">{t('supplierProducts.qtyReceived')}</TableHead>
                  <TableHead className="font-cairo text-center">{t('supplierProducts.remainingStock')}</TableHead>
                  <TableHead className="font-cairo text-center">{t('supplierProducts.unitPrice')}</TableHead>
                  <TableHead className="font-cairo text-center">{t('supplierProducts.totalPrice')}</TableHead>
                  <TableHead className="font-cairo">{t('common.date')}</TableHead>
                  <TableHead className="font-cairo text-center">{t('common.status')}</TableHead>
                  <TableHead className="font-cairo text-center">{t('suppliers.document')}</TableHead>
                  <TableHead className="font-cairo text-center">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(p => (
                  <TableRow key={p.id} className="row-accent">
                    <TableCell>
                      <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                    </TableCell>
                    <TableCell className="font-cairo font-medium">{p.product_name}</TableCell>
                    <TableCell className="font-roboto text-sm text-muted-foreground">{p.reference_sku || '—'}</TableCell>
                    <TableCell className="font-cairo text-sm">{t(`supplierProducts.unit${p.unit.charAt(0).toUpperCase() + p.unit.slice(1)}`)}</TableCell>
                    <TableCell className="font-roboto text-center">
                      {editingId === p.id ? (
                        <Input type="number" value={editValues.quantity_received ?? ''} onChange={e => setEditValues(v => ({ ...v, quantity_received: Number(e.target.value) }))} className="w-20 h-8 text-center font-roboto" />
                      ) : Number(p.quantity_received)}
                    </TableCell>
                    <TableCell className={`font-roboto text-center font-bold ${Number(p.remaining_stock) <= 0 ? 'text-destructive' : Number(p.remaining_stock) <= p.low_stock_threshold ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Number(p.remaining_stock)}
                    </TableCell>
                    <TableCell className="font-roboto text-center">
                      {editingId === p.id ? (
                        <Input type="number" value={editValues.unit_price ?? ''} onChange={e => setEditValues(v => ({ ...v, unit_price: Number(e.target.value) }))} className="w-20 h-8 text-center font-roboto" />
                      ) : `${Number(p.unit_price).toLocaleString()}`}
                    </TableCell>
                    <TableCell className="font-roboto text-center">{Number(p.total_price).toLocaleString()}</TableCell>
                    <TableCell className="font-roboto text-sm">{p.date}</TableCell>
                    <TableCell className="text-center">{stockBadge(p)}</TableCell>
                    <TableCell className="text-center">
                      {p.document_url ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDocViewer({ url: p.document_url!, name: p.document_name || 'Document' })}>
                              <FileText className="w-4 h-4 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="font-cairo text-xs">{p.document_name}</p></TooltipContent>
                        </Tooltip>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {editingId === p.id ? (
                          <Button size="sm" onClick={saveEdit} disabled={updateMut.isPending} className="font-cairo text-xs h-7">{t('common.save')}</Button>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p className="font-cairo text-xs">{t('common.edit')}</p></TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p className="font-cairo text-xs">{t('common.delete')}</p></TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      <ProductBulkActions
        selected={selectedProducts}
        onDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
        deleting={deleteMut.isPending}
      />

      {/* Modals */}
      <ProductBulkEntryForm
        open={addFormOpen}
        onOpenChange={setAddFormOpen}
        supplierId={supplierId}
        onSave={handleAddProducts}
        saving={createMut.isPending}
      />

      <ProductCSVImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        supplierId={supplierId}
        onImport={handleImport}
        importing={createMut.isPending}
      />

      {docViewer && (
        <DocumentViewer
          open={!!docViewer}
          onOpenChange={() => setDocViewer(null)}
          url={docViewer.url}
          name={docViewer.name}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">{t('common.confirm')}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-cairo">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-cairo">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
