

# Fix: Payment Methods Not Showing Correctly on Checkout

## Problem
Two issues found:

1. **RLS policy blocks payment details**: The security policy on the settings table blocks public access to `ccp_number`, `flexy_number`, and related keys. This means even when Baridimob or Flexy is enabled, customers can't see the CCP/Flexy numbers needed to make payment.

2. **Missing payment settings in database**: The `flexy_enabled` setting doesn't exist in the database yet, so it defaults to falsy. The `cod_enabled` is set to `true` but may not display if there's a rendering issue.

## Root Cause
The recent security migration added an RLS policy that excludes these keys from public reads:
- `ccp_number`
- `ccp_key`  
- `flexy_number`
- `baridimob_rip`

While hiding these from unauthenticated browsing is correct, the **checkout page needs them** to display payment instructions to the customer.

## Solution

### 1. Update the RLS policy to allow payment-related keys
Modify the public read policy on `settings` to only block truly sensitive keys (Telegram credentials), but allow payment detail keys that customers need:

**Block list (keep restricted):**
- `telegram_bot_token`
- `telegram_chat_id`

**Allow list (make readable again):**
- `ccp_number`, `ccp_name`, `ccp_key`
- `flexy_number`, `flexy_deposit_amount`
- `baridimob_rip`
- `baridimob_enabled`, `flexy_enabled`, `cod_enabled`

### 2. Ensure missing settings exist
Insert default rows for any missing payment settings (`flexy_enabled`, `cod_enabled`, etc.) so the checkout page can reliably check them.

## Technical Details

### Database Migration
- Drop and recreate the `Public can read non-sensitive settings` policy on `settings` table
- New policy will only block `telegram_bot_token` and `telegram_chat_id`
- Insert default `flexy_enabled = false` row if it doesn't exist

### Files Modified
- No code file changes needed -- the checkout page logic is already correct, it just can't read the settings due to the RLS policy

