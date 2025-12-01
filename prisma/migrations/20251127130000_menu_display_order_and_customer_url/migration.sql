-- Add displayOrder column to menu_items
ALTER TABLE "menu_items"
ADD COLUMN "displayOrder" INTEGER;

-- Add customerMenuBaseUrl column to settings
ALTER TABLE "settings"
ADD COLUMN "customerMenuBaseUrl" TEXT;

