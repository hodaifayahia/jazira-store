

## Create Admin User with Role-Based Access Control

### Current Problem
Right now, any authenticated user can access the admin panel — there's no role verification. We need to set up proper admin roles before creating the admin account.

### What will be done

**Step 1: Create a roles system in the database**
- Create an `app_role` enum type (`admin`, `user`)
- Create a `user_roles` table linking users to roles
- Add a `has_role()` helper function for secure role checking
- Update all admin-related RLS policies (products, orders, settings, coupons, wilayas) to use `has_role(auth.uid(), 'admin')` instead of just `auth.uid() IS NOT NULL`

**Step 2: Create admin user via edge function**
- Create a temporary edge function that uses the service role key to create an admin user with these credentials:
  - Email: **admin@dzstore.com**
  - Password: **Admin@2024!**
- The function will also insert the admin role into `user_roles`
- After use, the function can be removed

**Step 3: Protect admin pages with role checking**
- Update `AdminLayout.tsx` to verify the logged-in user has the `admin` role (query `user_roles` table)
- If not admin, redirect to homepage or show access denied
- Update `AdminLoginPage.tsx` to check role after login — if user is not admin, sign them out and show an error

### Your admin credentials
Once complete, you'll log in at `/admin/login` with:
- **Email:** admin@dzstore.com
- **Password:** Admin@2024!

### Files changed

| File | Change |
|------|--------|
| Database migration | Create `app_role` enum, `user_roles` table, `has_role()` function, update RLS policies |
| `supabase/functions/create-admin/index.ts` | New edge function to create admin user + assign role |
| `src/components/AdminLayout.tsx` | Add role check — redirect non-admins |
| `src/pages/admin/AdminLoginPage.tsx` | Verify admin role after login |

