export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ReceiptOptions {
  storeName: string;
  logoUrl?: string;
  clientName?: string;
  clientPhone?: string;
  items: ReceiptItem[];
  date?: string;
  reference?: string;
}

function fmt(n: number): string {
  return `${Math.round(n).toLocaleString('ar-DZ')} دج`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds and prints a simple wholesale receipt ("bon") in a new window.
 * The printed bon always shows full (undiscounted) prices.
 */
export function printReceipt(options: ReceiptOptions): void {
  const {
    storeName,
    logoUrl,
    clientName,
    clientPhone,
    items,
    date = new Date().toISOString().split('T')[0],
    reference,
  } = options;

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td class="c">${index + 1}</td>
          <td class="name">${escapeHtml(item.name)}</td>
          <td class="c">${item.quantity}</td>
          <td class="c">${fmt(item.unitPrice)}</td>
          <td class="c">${fmt(item.quantity * item.unitPrice)}</td>
        </tr>`
    )
    .join('');

  const logoHtml = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="logo" class="logo" />`
    : '';

  const clientLine = clientName
    ? `<div class="client"><strong>العميل:</strong> ${escapeHtml(clientName)}${
        clientPhone ? ` — ${escapeHtml(clientPhone)}` : ''
      }</div>`
    : '';

  const refLine = reference
    ? `<div class="ref"><strong>المرجع:</strong> ${escapeHtml(reference)}</div>`
    : '';

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>بون - ${escapeHtml(storeName)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
    margin: 0;
    padding: 16px;
    color: #111;
    background: #fff;
  }
  .receipt { max-width: 420px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px dashed #999; padding-bottom: 12px; margin-bottom: 12px; }
  .logo { max-height: 70px; max-width: 160px; object-fit: contain; margin-bottom: 8px; }
  .store { font-size: 22px; font-weight: 800; margin: 4px 0; }
  .meta { font-size: 12px; color: #555; margin-top: 4px; }
  .client, .ref { font-size: 13px; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
  th, td { padding: 6px 4px; border-bottom: 1px solid #e5e5e5; }
  th { background: #f4f4f4; font-weight: 700; }
  .c { text-align: center; }
  .name { text-align: right; }
  tfoot td { font-weight: 800; font-size: 15px; border-top: 2px solid #333; border-bottom: none; padding-top: 8px; }
  .footer { text-align: center; margin-top: 16px; font-size: 12px; color: #666; border-top: 2px dashed #999; padding-top: 10px; }
  @media print {
    body { padding: 0; }
    @page { margin: 8mm; }
  }
</style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      ${logoHtml}
      <div class="store">${escapeHtml(storeName)}</div>
      <div class="meta">بون تسليم — ${escapeHtml(date)}</div>
    </div>
    ${clientLine}
    ${refLine}
    <table>
      <thead>
        <tr>
          <th class="c">#</th>
          <th class="name">المنتج</th>
          <th class="c">الكمية</th>
          <th class="c">السعر</th>
          <th class="c">المجموع</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td class="c">—</td>
          <td class="name">الإجمالي</td>
          <td class="c">${totalQty}</td>
          <td class="c"></td>
          <td class="c">${fmt(total)}</td>
        </tr>
      </tfoot>
    </table>
    <div class="footer">شكراً لتعاملكم معنا</div>
  </div>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
      setTimeout(function () { window.close(); }, 300);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=480,height=640');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
