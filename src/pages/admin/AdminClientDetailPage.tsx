import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClient } from '@/hooks/useClients';
import { useClientTransactions, useCreateClientTransaction, useDeleteClientTransaction, useClientBalance } from '@/hooks/useClientTransactions';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { formatPrice, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Package, DollarSign, RotateCcw, Wallet, TrendingUp, TrendingDown, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminClientDetailPage() {
  type ProductRow = {
    id: string;
    name: string;
    price: number;
    stock: number | null;
    has_variants: boolean | null;
  };

  type VariationRow = {
    id: string;
    product_id: string;
    variation_type: string;
    variation_value: string;
    price_adjustment: number | null;
    stock: number | null;
    image_url: string | null;
    is_active: boolean | null;
  };

  type SelectedVariations = Record<string, string>;

  type BulkProduct = {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    notes: string;
    original_price: number;
    selected_variations: SelectedVariations;
  };

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: client, isLoading } = useClient(id!);
  const { balance, totalGiven, totalPaid, totalReturned, transactions } = useClientBalance(id!);
  const createTx = useCreateClientTransaction();
  const deleteTx = useDeleteClientTransaction();

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, name, price, stock, has_variants').eq('is_active', true);
      return (data ?? []) as ProductRow[];
    },
  });

  // Fetch product variations for products that have variants
  const { data: allVariations } = useQuery({
    queryKey: ['product-variations'],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_variations')
        .select('id, product_id, variation_type, variation_value, price_adjustment, stock, image_url, is_active')
        .eq('is_active', true);
      return (data ?? []) as VariationRow[];
    },
  });

  // Give product form
  const [giveForm, setGiveForm] = useState({
    product_id: '',
    quantity: 1,
    unit_price: 0,
    notes: '',
    selected_variations: {} as SelectedVariations,
  });
  // Payment form
  const [payForm, setPayForm] = useState({ amount: 0, notes: '', date: new Date().toISOString().split('T')[0] });
  // Return form
  const [returnForm, setReturnForm] = useState({ product_id: '', quantity: 1, unit_price: 0, notes: '' });
  
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const selectedProduct = products?.find(p => p.id === giveForm.product_id);
  const selectedReturnProduct = products?.find(p => p.id === returnForm.product_id);

  // Get variations for a product
  const getProductVariations = (productId: string) => {
    return allVariations?.filter(v => v.product_id === productId) ?? [];
  };

  // Get unique variation types for a product
  const getVariationTypes = (productId: string) => {
    const variations = getProductVariations(productId);
    return [...new Set(variations.map(v => v.variation_type))];
  };

  // Get variation values for a specific type and product
  const getVariationValues = (productId: string, variationType: string) => {
    return getProductVariations(productId).filter(v => v.variation_type === variationType);
  };

  const buildDefaultSelectedVariations = (productId: string): SelectedVariations => {
    const selected: SelectedVariations = {};
    const variationTypes = getVariationTypes(productId);
    variationTypes.forEach(type => {
      const values = getVariationValues(productId, type);
      if (values.length > 0) {
        selected[type] = values[0].variation_value;
      }
    });
    return selected;
  };

  const calculateVariationAdjustment = (productId: string, selectedVariations: SelectedVariations) => {
    return Object.entries(selectedVariations).reduce((sum, [variationType, variationValue]) => {
      const matched = allVariations?.find(
        v =>
          v.product_id === productId &&
          v.variation_type === variationType &&
          v.variation_value === variationValue
      );
      return sum + (matched?.price_adjustment ?? 0);
    }, 0);
  };

  const calculateUnitPrice = (productId: string, selectedVariations: SelectedVariations) => {
    const basePrice = products?.find(pr => pr.id === productId)?.price ?? 0;
    return basePrice + calculateVariationAdjustment(productId, selectedVariations);
  };

  const getEffectiveStock = (productId: string, selectedVariations: SelectedVariations) => {
    const baseStock = products?.find(p => p.id === productId)?.stock ?? 0;
    const variationStocks = Object.entries(selectedVariations)
      .map(([variationType, variationValue]) =>
        allVariations?.find(
          v =>
            v.product_id === productId &&
            v.variation_type === variationType &&
            v.variation_value === variationValue
        )?.stock
      )
      .filter((stock): stock is number => typeof stock === 'number');

    if (variationStocks.length === 0) return baseStock;
    return Math.min(baseStock, ...variationStocks);
  };

  const buildVariationLabel = (selectedVariations: SelectedVariations) => {
    const entries = Object.entries(selectedVariations);
    if (entries.length === 0) return '';
    return entries.map(([type, value]) => `${type}: ${value}`).join(' | ');
  };

  // Toggle product selection for bulk add
  const toggleProductSelection = (productId: string, product: any) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
      setBulkProducts(bulkProducts.filter(p => p.product_id !== productId));
    } else {
      newSelected.add(productId);
      const defaultVariations = product.has_variants ? buildDefaultSelectedVariations(productId) : {};
      const bulkProduct: BulkProduct = {
        product_id: productId,
        product_name: product.name,
        quantity: 1,
        unit_price: calculateUnitPrice(productId, defaultVariations),
        notes: '',
        original_price: product.price ?? 0,
        selected_variations: defaultVariations,
      };

      setBulkProducts([...bulkProducts, bulkProduct]);
    }
    setSelectedProductIds(newSelected);
  };

  // Update bulk product quantity
  const updateBulkProduct = (productId: string, field: keyof BulkProduct, value: any) => {
    setBulkProducts(bulkProducts.map(p =>
      p.product_id === productId ? { ...p, [field]: value } : p
    ));
  };

  // Update bulk product category/variation
  const updateBulkProductVariation = (productId: string, variationType: string, variationValue: string) => {
    setBulkProducts(bulkProducts.map(p => {
      if (p.product_id !== productId) return p;

      const selectedVariations: SelectedVariations = {
        ...p.selected_variations,
        [variationType]: variationValue,
      };

      return {
        ...p,
        selected_variations: selectedVariations,
        unit_price: calculateUnitPrice(productId, selectedVariations),
      };
    }));
  };

  const updateGiveFormVariation = (variationType: string, variationValue: string) => {
    setGiveForm(current => {
      const selectedVariations: SelectedVariations = {
        ...current.selected_variations,
        [variationType]: variationValue,
      };
      return {
        ...current,
        selected_variations: selectedVariations,
        unit_price: calculateUnitPrice(current.product_id, selectedVariations),
      };
    });
  };

  // Remove product from bulk list
  const removeBulkProduct = (productId: string) => {
    setBulkProducts(bulkProducts.filter(p => p.product_id !== productId));
    const newSelected = new Set(selectedProductIds);
    newSelected.delete(productId);
    setSelectedProductIds(newSelected);
  };

  // Calculate total bulk amount
  const bulkTotalAmount = useMemo(() => {
    return bulkProducts.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
  }, [bulkProducts]);

  // Handle bulk add products
  const handleBulkAddProducts = async () => {
    if (bulkProducts.length === 0) {
      toast.error(t('clients.noProductsSelected'));
      return;
    }

    // Validate all products
    for (const product of bulkProducts) {
      if (product.quantity <= 0) {
        toast.error(t('common.required'));
        return;
      }
      const stock = getEffectiveStock(product.product_id, product.selected_variations);
      if (product.quantity > stock) {
        toast.error(`${t('clients.insufficientStock')} ${stock} ${product.product_name}`);
        return;
      }
    }

    try {
      // Add all transactions
      for (const product of bulkProducts) {
        const amount = product.quantity * product.unit_price;
        await createTx.mutateAsync({
          client_id: id!,
          transaction_type: 'product_given',
          product_id: product.product_id,
          product_name: `${product.product_name}${buildVariationLabel(product.selected_variations) ? ` (${buildVariationLabel(product.selected_variations)})` : ''}`,
          quantity: product.quantity,
          unit_price: product.unit_price,
          amount,
          date: new Date().toISOString().split('T')[0],
          notes: product.notes || null,
        });

        // Deduct stock
        const stock = products?.find(p => p.id === product.product_id)?.stock ?? 0;
        await supabase
          .from('products')
          .update({ stock: Math.max(0, stock - product.quantity) })
          .eq('id', product.product_id);
      }

      toast.success(t('clients.bulkProductsSuccess'));
      setBulkProducts([]);
      setSelectedProductIds(new Set());
    } catch (error) {
      toast.error(t('common.errorOccurred'));
    }
  };

  const handleGiveProduct = async () => {
    if (!giveForm.product_id || giveForm.quantity <= 0) { toast.error(t('common.required')); return; }
    const product = products?.find(p => p.id === giveForm.product_id);
    if (!product) return;
    
    // Stock validation
    const availableStock = getEffectiveStock(giveForm.product_id, giveForm.selected_variations);
    if (giveForm.quantity > availableStock) {
      toast.error(`${t('clients.insufficientStock')} ${availableStock}`);
      return;
    }
    
    const amount = giveForm.quantity * giveForm.unit_price;
    try {
      await createTx.mutateAsync({
        client_id: id!,
        transaction_type: 'product_given',
        product_id: giveForm.product_id,
        product_name: `${product.name}${buildVariationLabel(giveForm.selected_variations) ? ` (${buildVariationLabel(giveForm.selected_variations)})` : ''}`,
        quantity: giveForm.quantity,
        unit_price: giveForm.unit_price,
        amount,
        date: new Date().toISOString().split('T')[0],
        notes: giveForm.notes || null,
      });
      // Deduct stock
      await supabase.from('products').update({ stock: Math.max(0, (product.stock ?? 0) - giveForm.quantity) }).eq('id', product.id);
      toast.success(t('clients.productGivenSuccess'));
      setGiveForm({ product_id: '', quantity: 1, unit_price: 0, notes: '', selected_variations: {} });
    } catch { toast.error(t('common.errorOccurred')); }
  };

  const handlePayment = async () => {
    if (payForm.amount <= 0) { toast.error(t('common.required')); return; }
    try {
      await createTx.mutateAsync({
        client_id: id!,
        transaction_type: 'payment_received',
        product_id: null,
        product_name: null,
        quantity: 0,
        unit_price: 0,
        amount: payForm.amount,
        date: payForm.date,
        notes: payForm.notes || null,
      });
      toast.success(t('clients.paymentSuccess'));
      setPayForm({ amount: 0, notes: '', date: new Date().toISOString().split('T')[0] });
    } catch { toast.error(t('common.errorOccurred')); }
  };

  const handleReturn = async () => {
    if (!returnForm.product_id || returnForm.quantity <= 0) { toast.error(t('common.required')); return; }
    const product = products?.find(p => p.id === returnForm.product_id);
    if (!product) return;

    const amount = returnForm.quantity * returnForm.unit_price;
    try {
      await createTx.mutateAsync({
        client_id: id!,
        transaction_type: 'product_returned',
        product_id: returnForm.product_id,
        product_name: product.name,
        quantity: returnForm.quantity,
        unit_price: returnForm.unit_price,
        amount,
        date: new Date().toISOString().split('T')[0],
        notes: returnForm.notes || null,
      });
      // Add back stock
      await supabase.from('products').update({ stock: (product.stock ?? 0) + returnForm.quantity }).eq('id', product.id);
      toast.success(t('clients.returnSuccess'));
      setReturnForm({ product_id: '', quantity: 1, unit_price: 0, notes: '' });
    } catch { toast.error(t('common.errorOccurred')); }
  };

  const handleDeleteTx = async (txId: string) => {
    if (!confirm(t('clients.deleteTxConfirm'))) return;
    try {
      await deleteTx.mutateAsync({ id: txId, clientId: id! });
      toast.success(t('common.deletedSuccess'));
    } catch { toast.error(t('common.errorOccurred')); }
  };

  if (isLoading) return <p className="p-4 font-cairo">{t('common.loading')}</p>;
  if (!client) return <p className="p-4 font-cairo">{t('common.noData')}</p>;

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/clients')}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-cairo font-bold">{client.name}</h1>
          <p className="text-sm text-muted-foreground font-cairo">{client.phone} {client.wilaya && `• ${client.wilaya}`}</p>
        </div>
        <Badge variant={client.status === 'active' ? 'default' : 'secondary'} className="font-cairo ms-auto">
          {client.status === 'active' ? t('common.active') : t('common.inactive')}
        </Badge>
      </div>

      {/* Balance KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Wallet className="w-5 h-5 mx-auto mb-1 text-destructive" />
          <p className="text-xs text-muted-foreground font-cairo">{t('clients.currentBalance')}</p>
          <p className={`text-lg font-bold font-cairo ${balance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatPrice(Math.abs(balance))}</p>
          <p className="text-xs font-cairo text-muted-foreground">{balance > 0 ? t('clients.owes') : t('clients.settled')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-xs text-muted-foreground font-cairo">{t('clients.totalGiven')}</p>
          <p className="text-lg font-bold font-cairo">{formatPrice(totalGiven)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-600" />
          <p className="text-xs text-muted-foreground font-cairo">{t('clients.totalPaid')}</p>
          <p className="text-lg font-bold font-cairo">{formatPrice(totalPaid)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <TrendingDown className="w-5 h-5 mx-auto mb-1 text-orange-500" />
          <p className="text-xs text-muted-foreground font-cairo">{t('clients.totalReturnedAmount')}</p>
          <p className="text-lg font-bold font-cairo">{formatPrice(totalReturned)}</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="give" className="w-full">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 gap-1 font-cairo h-auto p-1">
          <TabsTrigger value="give" className="gap-1 font-cairo text-xs sm:text-sm"><Package className="w-4 h-4" /><span className="hidden sm:inline">{t('clients.giveProduct')}</span><span className="sm:hidden">Product</span></TabsTrigger>
          <TabsTrigger value="bulk" className="gap-1 font-cairo text-xs sm:text-sm"><Plus className="w-4 h-4" /><span className="hidden sm:inline">{t('clients.bulkAddProducts')}</span><span className="sm:hidden">Bulk</span></TabsTrigger>
          <TabsTrigger value="payment" className="gap-1 font-cairo text-xs sm:text-sm"><DollarSign className="w-4 h-4" /><span className="hidden sm:inline">{t('clients.recordPayment')}</span><span className="sm:hidden">Pay</span></TabsTrigger>
          <TabsTrigger value="return" className="gap-1 font-cairo text-xs sm:text-sm"><RotateCcw className="w-4 h-4" /><span className="hidden sm:inline">{t('clients.recordReturn')}</span><span className="sm:hidden">Return</span></TabsTrigger>
        </TabsList>

        {/* Give Product Tab */}
        <TabsContent value="give">
          <Card><CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-cairo">{t('common.product')} *</Label>
                <Select value={giveForm.product_id} onValueChange={v => {
                  const p = products?.find(pr => pr.id === v);
                  const selectedVariations = p?.has_variants ? buildDefaultSelectedVariations(v) : {};
                  setGiveForm(f => ({
                    ...f,
                    product_id: v,
                    selected_variations: selectedVariations,
                    unit_price: calculateUnitPrice(v, selectedVariations),
                  }));
                }}>
                  <SelectTrigger className="font-cairo"><SelectValue placeholder={t('clients.selectProduct')} /></SelectTrigger>
                  <SelectContent>{products?.map(p => (
                    <SelectItem key={p.id} value={p.id} className="font-cairo">{p.name} ({t('products.stock')}: {p.stock})</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              {selectedProduct?.has_variants && (
                <div className="space-y-2 rounded-md border bg-muted/20 p-3 md:col-span-2">
                  <Label className="font-cairo">{t('common.variants')}</Label>
                  {getVariationTypes(giveForm.product_id).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getVariationTypes(giveForm.product_id).map(variationType => {
                      const values = getVariationValues(giveForm.product_id, variationType);
                      return (
                        <div key={variationType}>
                          <Label className="font-cairo text-xs text-muted-foreground">{variationType}</Label>
                          <Select
                            value={giveForm.selected_variations[variationType] ?? ''}
                            onValueChange={value => updateGiveFormVariation(variationType, value)}
                          >
                            <SelectTrigger className="font-cairo">
                              <SelectValue placeholder={t('common.select')} />
                            </SelectTrigger>
                            <SelectContent>
                              {values.map(v => (
                                <SelectItem key={v.id} value={v.variation_value} className="font-cairo">
                                  {v.variation_value}
                                  {v.price_adjustment ? ` (+${formatPrice(v.price_adjustment)})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground font-cairo">{t('common.noData')}</p>
                  )}
                </div>
              )}
              <div>
                <Label className="font-cairo">
                  {t('common.quantity')} * {selectedProduct && (
                    <span className="text-xs text-muted-foreground">({t('products.stock')}: {getEffectiveStock(giveForm.product_id, giveForm.selected_variations)})</span>
                  )}
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={Math.max(1, getEffectiveStock(giveForm.product_id, giveForm.selected_variations))}
                  value={giveForm.quantity}
                  onChange={e => setGiveForm(f => ({ ...f, quantity: Number(e.target.value) }))}
                  className="font-cairo"
                />
              </div>
              <div>
                <Label className="font-cairo">{t('clients.unitPrice')}</Label>
                <Input type="number" min={0} value={giveForm.unit_price} onChange={e => setGiveForm(f => ({ ...f, unit_price: Number(e.target.value) }))} className="font-cairo" />
              </div>
              <div>
                <Label className="font-cairo">{t('common.total')}</Label>
                <p className="text-lg font-bold font-cairo mt-1">{formatPrice(giveForm.quantity * giveForm.unit_price)}</p>
              </div>
            </div>
            <div><Label className="font-cairo">{t('common.notes')}</Label><Input value={giveForm.notes} onChange={e => setGiveForm(f => ({ ...f, notes: e.target.value }))} className="font-cairo" /></div>
            <Button onClick={handleGiveProduct} disabled={createTx.isPending} className="font-cairo gap-2"><Package className="w-4 h-4" />{t('clients.giveProduct')}</Button>
          </CardContent></Card>
        </TabsContent>

        {/* Bulk Add Products Tab */}
        <TabsContent value="bulk">
          <Card><CardContent className="p-4 space-y-4">
            {/* Products Selection */}
            <div>
              <Label className="font-cairo font-semibold mb-3 block">{t('clients.selectProductsForBulk')} *</Label>
              <div className="border rounded-lg p-3 space-y-3 max-h-96 overflow-y-auto bg-muted/30">
                {!products?.length ? (
                  <p className="text-sm text-muted-foreground font-cairo text-center py-4">{t('common.noData')}</p>
                ) : (
                  products.map(product => (
                    <div key={product.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={selectedProductIds.has(product.id)}
                        onCheckedChange={() => toggleProductSelection(product.id, product)}
                        id={`product-${product.id}`}
                      />
                      <label htmlFor={`product-${product.id}`} className="flex-1 cursor-pointer font-cairo text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          {product.has_variants && (
                            <Badge variant="secondary" className="text-xs font-cairo">{t('common.variants')}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t('products.stock')}: {product.stock} • {t('common.price')}: {formatPrice(product.price)}
                        </div>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Products Details */}
            {bulkProducts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-cairo font-semibold">{t('clients.selectedProducts')} ({bulkProducts.length})</Label>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-cairo text-xs sm:text-sm">{t('common.product')}</TableHead>
                          <TableHead className="font-cairo text-xs sm:text-sm w-32">{t('common.variants')}</TableHead>
                          <TableHead className="font-cairo text-xs sm:text-sm">{t('common.quantity')}</TableHead>
                          <TableHead className="font-cairo text-xs sm:text-sm">{t('clients.unitPrice')}</TableHead>
                          <TableHead className="font-cairo text-xs sm:text-sm">{t('common.total')}</TableHead>
                          <TableHead className="font-cairo text-xs sm:text-sm">{t('common.notes')}</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bulkProducts.map(bulkProduct => {
                          const product = products?.find(p => p.id === bulkProduct.product_id);
                          const variationTypes = getVariationTypes(bulkProduct.product_id);
                          return (
                          <TableRow key={bulkProduct.product_id} className="hover:bg-muted/30">
                            <TableCell className="font-cairo text-xs sm:text-sm font-medium">{bulkProduct.product_name}</TableCell>
                            <TableCell className="p-2">
                              {product?.has_variants ? (
                                getVariationTypes(bulkProduct.product_id).length > 0 ? (
                                <div className="space-y-2">
                                  {variationTypes.map(vType => {
                                    const values = getVariationValues(bulkProduct.product_id, vType);
                                    return (
                                      <div key={vType} className="flex flex-col gap-1">
                                        <label className="text-xs font-cairo text-muted-foreground">{vType}</label>
                                        <Select
                                          value={bulkProduct.selected_variations[vType] ?? ''}
                                          onValueChange={(value) => updateBulkProductVariation(bulkProduct.product_id, vType, value)}
                                        >
                                          <SelectTrigger className="font-cairo h-7 text-xs">
                                            <SelectValue placeholder={t('common.select')} />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {values.map(v => (
                                              <SelectItem key={v.id} value={v.variation_value} className="font-cairo text-xs">
                                                {v.variation_value}
                                                {v.price_adjustment ? ` (+${formatPrice(v.price_adjustment)})` : ''}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    );
                                  })}
                                </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground font-cairo">{t('common.noData')}</span>
                                )
                              ) : (
                                <span className="text-xs text-muted-foreground font-cairo">—</span>
                              )}
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                min={1}
                                max={Math.max(1, getEffectiveStock(bulkProduct.product_id, bulkProduct.selected_variations))}
                                value={bulkProduct.quantity}
                                onChange={(e) => updateBulkProduct(bulkProduct.product_id, 'quantity', Number(e.target.value))}
                                className="font-cairo h-8 text-xs sm:text-sm w-16"
                              />
                              <p className="mt-1 text-[10px] text-muted-foreground font-cairo">
                                {t('products.stock')}: {getEffectiveStock(bulkProduct.product_id, bulkProduct.selected_variations)}
                              </p>
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={bulkProduct.unit_price}
                                onChange={(e) => updateBulkProduct(bulkProduct.product_id, 'unit_price', Number(e.target.value))}
                                className="font-cairo h-8 text-xs sm:text-sm w-20"
                              />
                            </TableCell>
                            <TableCell className="font-cairo text-xs sm:text-sm font-bold text-right">
                              {formatPrice(bulkProduct.quantity * bulkProduct.unit_price)}
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="text"
                                placeholder={t('common.notes')}
                                value={bulkProduct.notes}
                                onChange={(e) => updateBulkProduct(bulkProduct.product_id, 'notes', e.target.value)}
                                className="font-cairo h-8 text-xs sm:text-sm"
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeBulkProduct(bulkProduct.product_id)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">{t('common.quantity')}</p>
                    <p className="text-lg font-bold font-cairo">{bulkProducts.reduce((sum, p) => sum + p.quantity, 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">{t('clients.selectedProducts')}</p>
                    <p className="text-lg font-bold font-cairo">{bulkProducts.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">{t('clients.totalAmount')}</p>
                    <p className="text-lg font-bold font-cairo text-primary">{formatPrice(bulkTotalAmount)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button
                onClick={handleBulkAddProducts}
                disabled={bulkProducts.length === 0 || createTx.isPending}
                className="font-cairo gap-2 flex-1"
              >
                <Plus className="w-4 h-4" />
                {t('clients.addSelectedProducts')}
              </Button>
              {bulkProducts.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkProducts([]);
                    setSelectedProductIds(new Set());
                  }}
                  className="font-cairo gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('common.clear')}
                </Button>
              )}
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card><CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-cairo">{t('clients.paymentAmount')} *</Label>
                <Input type="number" min={0} value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: Number(e.target.value) }))} className="font-cairo" />
              </div>
              <div>
                <Label className="font-cairo">{t('common.date')}</Label>
                <Input type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} className="font-cairo" />
              </div>
            </div>
            <div><Label className="font-cairo">{t('common.notes')}</Label><Input value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} className="font-cairo" /></div>
            <Button onClick={handlePayment} disabled={createTx.isPending} className="font-cairo gap-2"><DollarSign className="w-4 h-4" />{t('clients.recordPayment')}</Button>
          </CardContent></Card>
        </TabsContent>

        {/* Return Tab */}
        <TabsContent value="return">
          <Card><CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-cairo">{t('common.product')} *</Label>
                <Select value={returnForm.product_id} onValueChange={v => {
                  const p = products?.find(pr => pr.id === v);
                  setReturnForm(f => ({ ...f, product_id: v, unit_price: p?.price ?? 0 }));
                }}>
                  <SelectTrigger className="font-cairo"><SelectValue placeholder={t('clients.selectProduct')} /></SelectTrigger>
                  <SelectContent>{products?.map(p => (
                    <SelectItem key={p.id} value={p.id} className="font-cairo">{p.name}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-cairo">{t('common.quantity')} *</Label>
                <Input type="number" min={1} value={returnForm.quantity} onChange={e => setReturnForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="font-cairo" />
              </div>
              <div>
                <Label className="font-cairo">{t('clients.unitPrice')}</Label>
                <Input type="number" min={0} value={returnForm.unit_price} onChange={e => setReturnForm(f => ({ ...f, unit_price: Number(e.target.value) }))} className="font-cairo" />
              </div>
              <div>
                <Label className="font-cairo">{t('common.total')}</Label>
                <p className="text-lg font-bold font-cairo mt-1">{formatPrice(returnForm.quantity * returnForm.unit_price)}</p>
              </div>
            </div>
            <div><Label className="font-cairo">{t('common.notes')}</Label><Input value={returnForm.notes} onChange={e => setReturnForm(f => ({ ...f, notes: e.target.value }))} className="font-cairo" /></div>
            <Button onClick={handleReturn} disabled={createTx.isPending} className="font-cairo gap-2"><RotateCcw className="w-4 h-4" />{t('clients.recordReturn')}</Button>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Transaction History */}
      <Card>
        <CardHeader><CardTitle className="font-cairo">{t('clients.transactionHistory')}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!transactions?.length ? (
            <p className="p-6 text-center text-muted-foreground font-cairo">{t('common.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="font-cairo">{t('common.date')}</TableHead>
                  <TableHead className="font-cairo">{t('common.type')}</TableHead>
                  <TableHead className="font-cairo">{t('common.product')}</TableHead>
                  <TableHead className="font-cairo">{t('common.quantity')}</TableHead>
                  <TableHead className="font-cairo">{t('common.total')}</TableHead>
                  <TableHead className="font-cairo">{t('common.notes')}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {transactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-cairo text-sm">{tx.date}</TableCell>
                      <TableCell>
                        <Badge variant={tx.transaction_type === 'product_given' ? 'destructive' : tx.transaction_type === 'payment_received' ? 'default' : 'secondary'} className="font-cairo text-xs">
                          {tx.transaction_type === 'product_given' && t('clients.typeGiven')}
                          {tx.transaction_type === 'payment_received' && t('clients.typePayment')}
                          {tx.transaction_type === 'product_returned' && t('clients.typeReturn')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-cairo text-sm">{tx.product_name || '—'}</TableCell>
                      <TableCell className="font-cairo text-sm">{tx.quantity || '—'}</TableCell>
                      <TableCell className="font-cairo font-bold text-sm">{formatPrice(tx.amount)}</TableCell>
                      <TableCell className="font-cairo text-xs text-muted-foreground max-w-[150px] truncate">{tx.notes || '—'}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteTx(tx.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
