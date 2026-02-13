

# Facebook Pixel Integration

## Overview
Add Facebook Pixel tracking to the website so you can connect it to your Facebook Ads account. The Pixel ID will be configurable from the admin settings panel -- no code changes needed when you change your Pixel ID.

## How It Works

1. **Admin Settings**: A new "Facebook Pixel" field in the admin settings page where you enter your Pixel ID
2. **Automatic Script Injection**: The Pixel script loads automatically on every page when a Pixel ID is configured
3. **Event Tracking**: Key e-commerce events are tracked automatically:
   - **PageView** -- every page visit
   - **ViewContent** -- when a customer views a product
   - **AddToCart** -- when a product is added to cart
   - **InitiateCheckout** -- when checkout page is opened
   - **Purchase** -- when an order is confirmed

## What You Will Need
- A Facebook Pixel ID (found in your Facebook Business Manager under Events Manager)

## Technical Details

### Database
- Add a new setting key `facebook_pixel_id` to the `settings` table (same pattern as existing settings like `store_name`)

### Files Created
- `src/hooks/useFacebookPixel.ts` -- Hook that injects the Facebook Pixel base script into the page head and provides a `trackEvent()` function

### Files Modified
- `src/pages/admin/AdminSettingsPage.tsx` -- Add a "Facebook Pixel ID" input field in the settings form
- `src/App.tsx` -- Initialize the Facebook Pixel hook at the app level
- `src/pages/SingleProductPage.tsx` -- Fire `ViewContent` event
- `src/contexts/CartContext.tsx` -- Fire `AddToCart` event
- `src/pages/CheckoutPage.tsx` -- Fire `InitiateCheckout` event
- `src/pages/OrderConfirmationPage.tsx` -- Fire `Purchase` event with order value

### No New Dependencies
Uses the standard Facebook Pixel JavaScript snippet injected via a React hook (no third-party npm packages needed).

