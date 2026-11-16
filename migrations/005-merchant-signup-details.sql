-- Extra details captured on the business sign-up form: a structured pickup
-- address (unit, province, postal code, map position), the kind of business,
-- how deliveries usually go out, and proof the terms were accepted.
ALTER TABLE merchant_profiles ADD COLUMN business_unit TEXT;
ALTER TABLE merchant_profiles ADD COLUMN business_province TEXT;
ALTER TABLE merchant_profiles ADD COLUMN business_postal_code TEXT;
ALTER TABLE merchant_profiles ADD COLUMN business_lat DOUBLE PRECISION;
ALTER TABLE merchant_profiles ADD COLUMN business_lng DOUBLE PRECISION;
ALTER TABLE merchant_profiles ADD COLUMN industry TEXT;
ALTER TABLE merchant_profiles ADD COLUMN referral_source TEXT;
ALTER TABLE merchant_profiles ADD COLUMN delivery_pattern TEXT;
ALTER TABLE merchant_profiles ADD COLUMN signup_notes TEXT;
ALTER TABLE merchant_profiles ADD COLUMN terms_accepted_at TEXT;
