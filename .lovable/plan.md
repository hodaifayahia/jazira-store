

## Plan: Telegram Admin Bot Integration

### Important Notes

- This project uses a **key-value `settings` table** (not `store_settings`). All Telegram settings will be stored as key-value pairs: `telegram_bot_token`, `telegram_chat_id`, `telegram_enabled`, `telegram_notify_orders`.
- A **Telegram Bot Token** secret will be requested during implementation (via the secrets tool) for edge function access.

---

### Part 1: Database Changes

**1a. Create `telegram_bot_state` table** (migration)

```sql
CREATE TABLE public.telegram_bot_state (
  chat_id text PRIMARY KEY,
  state jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE telegram_bot_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON telegram_bot_state
  FOR ALL USING (false);
```

No changes to the `settings` table schema needed -- the existing key-value structure handles new keys automatically.

---

### Part 2: Edge Functions

**2a. `telegram-notify`** (`supabase/functions/telegram-notify/index.ts`)

- Receives `{ type: "new_order", order_id }` or `{ type: "test" }`
- Reads `telegram_enabled`, `telegram_notify_orders`, `telegram_bot_token`, `telegram_chat_id` from `settings` table
- Fetches order + order_items + product names (service role)
- Sends formatted message to each comma-separated chat ID via Telegram `sendMessage` API
- CORS headers included

**2b. `telegram-bot`** (`supabase/functions/telegram-bot/index.ts`)

Webhook handler for Telegram updates. Commands:

| Command | Action |
|---------|--------|
| `/start` | Welcome message with available commands |
| `/orders` | Paginated recent orders (5/page) with inline keyboard |
| `/products` | Paginated product list with price and status |
| `/categories` | List all categories |
| `/stats` | Revenue summary, order counts, product/customer counts |
| `/help` | Command reference |

Interactive callbacks (inline keyboard):
- `order_detail:{id}` -- Full order details
- `order_status:{id}:{status}` -- Update order status
- `orders_page:{n}` -- Paginate orders
- `product_detail:{id}` -- Product details
- `product_toggle:{id}` -- Activate/deactivate product
- `products_page:{n}` -- Paginate products

Authorization: validates sender `chat_id` against stored admin chat IDs.

Stateful flows via `telegram_bot_state` table (e.g., editing product price -- bot asks for price, stores state, interprets next message as the new value).

**2c. `telegram-set-webhook`** (`supabase/functions/telegram-set-webhook/index.ts`)

- Reads bot token from `settings` table
- Calls Telegram API `setWebhook` pointing to the `telegram-bot` function URL
- Returns result

**Config** -- add to `supabase/config.toml`:
```toml
[functions.telegram-notify]
verify_jwt = false

[functions.telegram-bot]
verify_jwt = false

[functions.telegram-set-webhook]
verify_jwt = false
```

---

### Part 3: Admin Settings UI

**Update `src/pages/admin/AdminSettingsPage.tsx`**

Add a new "بوت تلغرام" section with:

1. **Master toggle** -- `telegram_enabled` switch
2. **Bot Token** -- Password input (type="password"), collapsible
3. **Admin Chat IDs** -- Dynamic multi-input: each ID shown as a removable chip, with an "Add" input. Stored as comma-separated string in `telegram_chat_id`
4. **Notify on new orders** -- `telegram_notify_orders` toggle
5. **Test Notification button** -- Calls `telegram-notify` with `{ type: "test" }`
6. **Connect Webhook button** -- Calls `telegram-set-webhook`

All new fields use the existing `setField`/`handleSave` pattern (key-value in `settings` table).

---

### Part 4: Trigger Notifications on Order Creation

**Update `src/pages/CheckoutPage.tsx`** (or wherever orders are created)

After a successful order insert, fire-and-forget call to the `telegram-notify` edge function with `{ type: "new_order", order_id }`.

---

### Files Summary

| File | Action | Description |
|------|--------|-------------|
| Migration SQL | Create | `telegram_bot_state` table with RLS |
| `supabase/functions/telegram-notify/index.ts` | Create | Push order notifications to Telegram |
| `supabase/functions/telegram-bot/index.ts` | Create | Interactive webhook bot |
| `supabase/functions/telegram-set-webhook/index.ts` | Create | Register webhook URL |
| `supabase/config.toml` | Modify | Add 3 new function entries |
| `src/pages/admin/AdminSettingsPage.tsx` | Modify | Add Telegram settings section |
| `src/pages/CheckoutPage.tsx` | Modify | Trigger notification on order creation |

### Security

- Bot token stored in `settings` table (admin-only RLS) and as a backend secret
- `telegram_bot_state` has RLS blocking all client access (service role only)
- Webhook endpoint validates sender chat_id against admin list
- Edge functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS

