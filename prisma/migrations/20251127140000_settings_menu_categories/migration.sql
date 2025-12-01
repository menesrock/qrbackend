-- Add menuCategories column to settings
ALTER TABLE "settings"
ADD COLUMN "menuCategories" JSONB;

