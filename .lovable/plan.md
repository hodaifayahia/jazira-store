

## Admin Coupons and Settings Pages

Both pages already exist with basic functionality. This plan covers the gaps to match your requirements.

### Page 1: Admin Coupons (`src/pages/admin/AdminCouponsPage.tsx`)

**Current gaps:**
- Delete uses browser `confirm()` instead of shadcn AlertDialog
- No "expired" badge for past-date coupons
- Discount type uses Select dropdown instead of radio buttons
- No percentage max-100 validation
- No date picker component (uses plain HTML date input)

**Changes:**
- Replace `confirm()` delete with AlertDialog confirmation dialog ("هل أنت متأكد من حذف هذا الكوبون؟")
- Add RadioGroup for discount type (نسبة مئوية / مبلغ ثابت) instead of Select
- Add validation: if percentage, cap value at 100 and show error
- Replace HTML date input with shadcn Popover + Calendar date picker
- Add expired badge: if `expiry_date` is in the past, show gray "منتهي" badge alongside the active/inactive badge
- Add Loader2 spinner on save button

### Page 2: Admin Settings (`src/pages/admin/AdminSettingsPage.tsx`)

**Current gaps:**
- No store logo image upload
- Uses `update` instead of `upsert` (would fail if a key doesn't exist yet)
- Toast message doesn't include checkmark
- No loading spinner on save

**Changes:**
- Add logo upload section: file input, preview thumbnail, upload to `store` storage bucket, save URL as `store_logo_url` setting
- Switch from `update` to `upsert` (on conflict by `key`) so new settings are created automatically
- Update toast to "تم حفظ الإعدادات بنجاح ✅"
- Add Loader2 spinner on save button

### Technical Details

**Files modified (2 only):**
- `src/pages/admin/AdminCouponsPage.tsx` -- full rewrite
- `src/pages/admin/AdminSettingsPage.tsx` -- full rewrite

**No other files touched.** Routes and layout already configured in App.tsx. The `store` storage bucket already exists and is public. Settings table already has the `store_logo_url` key.

**Coupons page imports added:** AlertDialog components, RadioGroup, Calendar, Popover, Loader2, `format` from date-fns

**Settings page upsert approach:** Use `supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })` to handle both existing and new settings keys

**Logo upload flow:** Upload image to `store` bucket with path `logo-{timestamp}.{ext}`, get public URL, store in `store_logo_url` setting, show preview thumbnail

