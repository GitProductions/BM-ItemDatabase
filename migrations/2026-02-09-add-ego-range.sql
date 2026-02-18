-- Add missing ego range columns to align with d1-schema.sql
ALTER TABLE items ADD COLUMN egoMin TEXT;
ALTER TABLE items ADD COLUMN egoMax TEXT;
