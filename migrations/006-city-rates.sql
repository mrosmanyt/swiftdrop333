-- Distance-based delivery rates for the eight cities SwiftDrop serves:
-- a base fare plus an amount per kilometre driven. The service type
-- (Batch, Next Day, Same Day, Direct) then scales the total in
-- src/lib/pricing.ts.
--
-- A city only gets a rate here if it has none yet, so rates an admin has
-- already created (admin console, Zones and pricing) are never replaced.
-- Larger, slower-to-cross cities carry a slightly higher fare.
INSERT INTO zones (id, city, name, base_rate_cents, per_km_cents)
SELECT v.id, v.city, 'City-wide', v.base_rate_cents, v.per_km_cents
FROM (VALUES
  ('zone-citywide-toronto',   'Toronto',   1245, 38),
  ('zone-citywide-vancouver', 'Vancouver', 1245, 38),
  ('zone-citywide-ottawa',    'Ottawa',    1190, 35),
  ('zone-citywide-calgary',   'Calgary',   1190, 35),
  ('zone-citywide-edmonton',  'Edmonton',  1190, 35),
  ('zone-citywide-hamilton',  'Hamilton',  1155, 34),
  ('zone-citywide-oshawa',    'Oshawa',    1155, 34),
  ('zone-citywide-winnipeg',  'Winnipeg',  1155, 34)
) AS v(id, city, base_rate_cents, per_km_cents)
WHERE NOT EXISTS (SELECT 1 FROM zones z WHERE LOWER(TRIM(z.city)) = LOWER(v.city));
