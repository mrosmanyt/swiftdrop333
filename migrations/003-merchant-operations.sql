-- Merchant operations fields, captured at signup so ops can plan capacity
-- and the admin review queue shows where a business operates and roughly
-- how many parcels a day to expect.
ALTER TABLE merchant_profiles ADD COLUMN business_city TEXT;
ALTER TABLE merchant_profiles ADD COLUMN daily_volume TEXT;
