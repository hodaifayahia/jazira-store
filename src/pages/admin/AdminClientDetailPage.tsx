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
import { ArrowLeft, Package, DollarSign, RotateCcw, Wallet, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminClientDetailPage() {
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
      const { data } = await supabase.from('products').select('id, name, price, stock').eq('is_active', true);
      return data ?? [];
    },
  });

  // Give product form
  const [giveForm, setGiveForm] = useState({ product_id: '', quantity: 1, unit_price: 0, notes: '' });
  // Payment form
  const [payForm, setPayForm] = useState({ amount: 0, notes: '', date: new Date().toISOString().split('T')[0] });
  // Return form
  const [returnForm, setReturnForm] = useState({ product_id: '', quantity: 1, unit_price: 0, notes: '' });

  const selectedProduct = products?.find(p => p.id === giveForm.product_id);
  const selectedReturnProduct = products?.find(p => p.id === returnForm.product_id);

  const handleGiveProduct = async () => {
    if (!giveForm.product_id || giveForm.quantity <= 0) { toast.error(t('common.required')); return; }
    const product = products?.find(p => p.id === giveForm.product_id);
    if (!product) return;
    
    const amount = giveForm.quantity * giveForm.unit_price;
    try {
      await createTx.mutateAsync({
        client_id: id!,
        transaction_type: 'product_given',
        product_id: giveForm.product_id,
        product_name: product.name,
        quantity: giveForm.quantity,
        unit_price: giveForm.unit_price,
        amount,
        date: new Date().toISOString().split('T')[0],
        notes: giveForm.notes || null,
      });
      // Deduct stock
      await supabase.from('products').update({ stock: Math.max(0, (product.stock ?? 0) - giveForm.quantity) }).eq('id', product.id);
      toast.success(t('clients.productGivenSuccess'));
      setGiveForm({ product_id: '', quantity: 1, unit_price: 0, notes: '' });
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
        <TabsList className="w-full grid grid-cols-3 font-cairo">
          <TabsTrigger value="give" className="gap-1 font-cairo"><Package className="w-4 h-4" />{t('clients.giveProduct')}</TabsTrigger>
          <TabsTrigger value="payment" className="gap-1 font-cairo"><DollarSign className="w-4 h-4" />{t('clients.recordPayment')}</TabsTrigger>
          <TabsTrigger value="return" className="gap-1 font-cairo"><RotateCcw className="w-4 h-4" />{t('clients.recordReturn')}</TabsTrigger>
        </TabsList>

        {/* Give Product Tab */}
        <TabsContent value="give">
          <Card><CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="font-cairo">{t('common.product')} *</Label>
                <Select value={giveForm.product_id} onValueChange={v => {
                  const p = products?.find(pr => pr.id === v);
                  setGiveForm(f => ({ ...f, product_id: v, unit_price: p?.price ?? 0 }));
                }}>
                  <SelectTrigger className="font-cairo"><SelectValue placeholder={t('clients.selectProduct')} /></SelectTrigger>
                  <SelectContent>{products?.map(p => (
                    <SelectItem key={p.id} value={p.id} className="font-cairo">{p.name} ({t('products.stock')}: {p.stock})</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-cairo">{t('common.quantity')} *</Label>
                <Input type="number" min={1} value={giveForm.quantity} onChange={e => setGiveForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="font-cairo" />
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
