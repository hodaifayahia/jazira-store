

# تطوير نموذج إضافة/تعديل المنتج (Product Form Enhancement)

## ملخص
ترقية نموذج المنتج الحالي ليتوافق مع تصميم Foorweb المرجعي، بإضافة حقول جديدة (السعر القديم، الوصف القصير، التوصيل المجاني، رابط المنتج) ونظام عروض الحزم (Bundle Offers).

## الوضع الحالي
النموذج الحالي يحتوي على:
- اسم المنتج، SKU، الوصف، السعر، المخزون، الفئة، الحالة
- رفع صور متعددة مع اختيار الصورة الرئيسية
- نظام متغيرات (ألوان/مقاسات) مع سعر وصورة ومخزون لكل متغير

## التغييرات المطلوبة

### 1. حقول جديدة في قاعدة البيانات (Migration)
إضافة أعمدة جديدة لجدول `products`:
- `old_price` (numeric, nullable) -- السعر القديم قبل الخصم
- `short_description` (text, nullable) -- وصف قصير يظهر تحت اسم المنتج
- `is_free_shipping` (boolean, default false) -- توصيل مجاني
- `slug` (text, nullable, unique) -- رابط مخصص للمنتج

إنشاء جدول جديد `product_offers` لعروض الحزم:
- `id` (uuid, primary key)
- `product_id` (uuid, FK to products)
- `description` (text) -- وصف العرض مثل "قميصان"
- `quantity` (integer) -- الكمية في الحزمة
- `price` (numeric) -- سعر الحزمة
- `position` (integer, default 0) -- ترتيب العرض
- `created_at` (timestamptz)

مع سياسات RLS مطابقة لجدول products (قراءة عامة + إدارة للأدمن).

### 2. تعديل نموذج المنتج (ProductForm)
تنظيم النموذج في أقسام واضحة:

**قسم الصور** (موجود بالفعل -- بدون تغيير)

**قسم البيانات الأساسية:**
- اسم المنتج (موجود)
- SKU (موجود)
- رابط المنتج (slug) -- حقل جديد مع placeholder "/product/your-slug"
- الفئة (موجود)
- الحالة (موجود)

**قسم الوصف:**
- وصف قصير (حقل جديد - Input عادي)
- وصف تفصيلي (الحقل الحالي - Textarea)

**قسم التسعير والمخزون:**
- السعر الحالي (موجود)
- السعر القديم (حقل جديد -- يظهر كسعر مشطوب)
- المخزون (موجود)
- التوصيل المجاني (Toggle جديد)

**قسم عروض الحزم (جديد):**
- قائمة ديناميكية من العروض (وصف + كمية + سعر)
- زر "إضافة عرض" لإضافة حزمة جديدة
- زر حذف لكل عرض
- تحقق: سعر الحزمة يجب أن يكون اقل من (الكمية * سعر الوحدة)

**قسم المتغيرات** (موجود بالفعل -- بدون تغيير)

### 3. تحديث منطق الحفظ (saveMutation)
- إضافة الحقول الجديدة (old_price, short_description, is_free_shipping, slug) في payload
- بعد حفظ المنتج: حذف العروض القديمة ثم إدراج العروض الجديدة في `product_offers`

---

## التفاصيل التقنية

### Migration SQL
```sql
-- New columns on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_free_shipping boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique 
  ON products(slug) WHERE slug IS NOT NULL AND slug != '';

-- Bundle offers table
CREATE TABLE product_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product offers publicly readable"
  ON product_offers FOR SELECT USING (true);

CREATE POLICY "Admin can manage product offers"
  ON product_offers FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

### الملفات المتأثرة
- `src/pages/admin/AdminProductsPage.tsx` -- تعديل ProductForm:
  1. إضافة state جديد: `oldPrice`, `shortDescription`, `isFreeShipping`, `slug`, `offers[]`
  2. تحميل العروض الحالية عند التعديل (useQuery على product_offers)
  3. إضافة أقسام الحقول الجديدة في JSX
  4. قسم عروض الحزم مع repeatable rows (وصف + كمية + سعر + حذف)
  5. تحديث saveMutation لحفظ الحقول الجديدة + sync offers

### هيكل قسم عروض الحزم في الواجهة
```text
+--------------------------------------------------+
| عروض الحزم                          [+ إضافة عرض] |
+--------------------------------------------------+
| وصف العرض    | الكمية | السعر (دج) |    [حذف]     |
| قميصان       |   2    |   5000     |      X       |
| ثلاث قمصان   |   3    |   8000     |      X       |
+--------------------------------------------------+
```

### تحقق من المدخلات (Validation)
- السعر القديم (إن وجد) يجب أن يكون اكبر من السعر الحالي
- سعر الحزمة يجب أن يكون اقل من (الكمية * سعر الوحدة) -- تحذير فقط وليس منعاً
- الـ slug يقبل فقط حروف لاتينية وأرقام وشرطات
- الوصف القصير محدود بـ 200 حرف

