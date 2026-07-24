-- One-off: align hosting catalog with Sri Lanka reseller market rates (Jul 2026)
UPDATE "Product" SET "priceCents" = 89900, "description" = '1 site · 5GB SSD · Free SSL · Daily backups · cPanel included.' WHERE slug = 'shared-hosting-starter';
UPDATE "Product" SET "priceCents" = 179900, "description" = '3 sites · 20GB SSD · Priority support · Free migration · cPanel.' WHERE slug = 'business-hosting';
UPDATE "Product" SET "priceCents" = 129900 WHERE slug = 'wordpress-hosting';
UPDATE "Product" SET "priceCents" = 109900, "featured" = true WHERE slug = 'cpanel-hosting';
UPDATE "Product" SET "priceCents" = 399900 WHERE slug = 'cloud-hosting';
UPDATE "Product" SET "priceCents" = 299900 WHERE slug = 'vps-hosting-basic';
UPDATE "Product" SET "priceCents" = 449900 WHERE slug = 'vps-windows';
UPDATE "Product" SET "priceCents" = 2499900 WHERE slug = 'dedicated-server';
UPDATE "Product" SET "priceCents" = 999900 WHERE slug = 'aws-managed-hosting';

UPDATE "PricingMargin" SET "marginCents" = 50000, "marginPercent" = 0, "marginMode" = 'FIXED' WHERE category = 'hosting';

-- Recompute provider wholesale (retail - Rs 500 margin) for linked products
UPDATE "Product" SET "providerPriceCents" = GREATEST(0, "priceCents" - 50000)
WHERE category IN ('hosting', 'cloud', 'vps') AND slug IN (
  'shared-hosting-starter', 'business-hosting', 'wordpress-hosting', 'cpanel-hosting',
  'cloud-hosting', 'vps-hosting-basic', 'vps-windows', 'dedicated-server', 'aws-managed-hosting'
);
