select name, sku, stock, price, category
from public.products
where sku in ('HON-001','HON-002','HON-003','HON-004','HON-005','HON-006','HON-007','DAT-001','DAT-002','DAT-005')
order by name;
