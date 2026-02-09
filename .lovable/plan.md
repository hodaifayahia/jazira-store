

## Plan: Real-time Order Notifications for Admin

### Overview
Add instant notifications when a new order arrives. Admins will hear a sound, see a toast notification, and have a notification bell icon in the admin header showing unread count.

---

### 1. Database: Enable Realtime on Orders Table

Run a migration:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```

This allows the Supabase Realtime client to listen for new inserts on the `orders` table.

---

### 2. Notification Sound

Create a simple notification sound using the Web Audio API (no external file needed). A short beep will play when a new order arrives.

---

### 3. AdminLayout Changes (`src/components/AdminLayout.tsx`)

This is the main wrapper for all admin pages, making it the ideal place to subscribe to realtime events.

- **Realtime subscription:** Subscribe to `postgres_changes` on the `orders` table for `INSERT` events inside a `useEffect`.
- **Notification bell:** Add a `Bell` icon in the admin header (next to the page title) that shows an unread count badge.
- **Toast notification:** When a new order arrives, show a Sonner toast with the order number and customer name.
- **Sound alert:** Play a short beep sound using the Web Audio API.
- **State:** Track `newOrderCount` in local state. Clicking the bell resets the count and navigates to `/admin/orders`.
- **Cleanup:** Unsubscribe from the channel on component unmount.

**Key code additions:**
- `useEffect` with `supabase.channel('new-orders').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, handler).subscribe()`
- Bell icon with badge in the header bar
- `playNotificationSound()` utility using `AudioContext`
- Toast via `sonner` toast function

---

### Technical Details

| File | Changes |
|------|---------|
| Migration | `ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;` |
| `src/components/AdminLayout.tsx` | Add realtime subscription, bell icon with badge, toast + sound on new order |

No new files or dependencies needed. Uses existing `sonner` toast and `lucide-react` Bell icon.

