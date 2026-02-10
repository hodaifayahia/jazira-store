

## Plan: Make Admin Dashboard Fully Responsive

All admin pages currently use desktop-oriented table layouts that are difficult to use on mobile devices. This plan converts them to card-based layouts on small screens while keeping tables on desktop.

---

### Key Problems

1. **Tables with many columns** are unreadable on mobile (Orders: 9 columns, Products: 9 columns, Leads: 7 columns, Coupons: 7 columns)
2. **Hover-only action buttons** (`opacity-0 group-hover:opacity-100`) are invisible on touch devices
3. **Categories "Add" form** has a horizontal layout that breaks on narrow screens
4. **Bulk action bars** don't wrap well on mobile
5. **Wilayas page** table doesn't adapt to small screens

---

### Solution: Mobile Card Layout Pattern

For each admin page, on screens below `md` (768px), replace the table with a stacked card list. On `md+`, keep the existing table. Action buttons will always be visible on mobile.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/AdminOrdersPage.tsx` | Add mobile card view for orders list; always show actions on mobile; wrap bulk actions |
| `src/pages/admin/AdminProductsPage.tsx` | Add mobile card view for products list; always show actions; fix bulk action bar wrapping |
| `src/pages/admin/AdminLeadsPage.tsx` | Add mobile card view for leads; always show actions |
| `src/pages/admin/AdminCouponsPage.tsx` | Add mobile card view for coupons; always show actions |
| `src/pages/admin/AdminWilayasPage.tsx` | Add mobile card view for wilayas; fix two-price display |
| `src/pages/admin/AdminVariationsPage.tsx` | Always show action buttons (remove hover-only); minor spacing fixes |
| `src/pages/admin/AdminCategoriesPage.tsx` | Stack "add category" form vertically on mobile; fix edit row layout |
| `src/pages/admin/AdminDashboardPage.tsx` | Fix pie chart layout on mobile (stack vertically instead of side-by-side); ensure latest orders table has a mobile card fallback |

---

### Technical Approach

Each page will use a pattern like:

```text
<!-- Hidden on mobile, shown on md+ -->
<div className="hidden md:block">
  <table>...</table>
</div>

<!-- Shown on mobile, hidden on md+ -->
<div className="md:hidden space-y-3">
  {items.map(item => (
    <div className="bg-card border rounded-xl p-4">
      <!-- Card layout with key info -->
    </div>
  ))}
</div>
```

Action buttons will use `flex` without hover-hiding on mobile cards, so they're always tappable.

### Specific Changes Per Page

**AdminOrdersPage:**
- Mobile card: order number + status badge on top row, customer name + phone, wilaya, total, date, and action dropdown always visible

**AdminProductsPage:**
- Mobile card: product image + name + price on top, category + stock + status, action buttons row

**AdminLeadsPage:**
- Mobile card: name + status badge, phone, source, date, action buttons

**AdminCouponsPage:**
- Mobile card: code + type + value, product count badge, expiry, status, actions

**AdminWilayasPage:**
- Mobile card: wilaya name + status, office price + home price, action buttons

**AdminCategoriesPage:**
- Stack the "add new" form inputs vertically on mobile (name, icon selector, add button each on own row)
- Fix edit row to stack on mobile

**AdminDashboardPage:**
- Pie chart section: stack chart and legend vertically on mobile instead of 50/50 side-by-side
- Latest orders: add mobile card fallback

**AdminVariationsPage:**
- Change `opacity-0 group-hover:opacity-100` to always visible on mobile (use `opacity-100 md:opacity-0 md:group-hover:opacity-100`)

