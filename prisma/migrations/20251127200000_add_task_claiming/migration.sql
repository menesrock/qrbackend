-- Add claiming fields to orders
ALTER TABLE "orders" ADD COLUMN "claimedBy" TEXT;
ALTER TABLE "orders" ADD COLUMN "claimedAt" TIMESTAMP(3);

-- Add claiming fields to call_requests
ALTER TABLE "call_requests" ADD COLUMN "claimedBy" TEXT;
ALTER TABLE "call_requests" ADD COLUMN "claimedAt" TIMESTAMP(3);

-- Add indexes
CREATE INDEX "orders_claimedBy_idx" ON "orders"("claimedBy");
CREATE INDEX "call_requests_claimedBy_idx" ON "call_requests"("claimedBy");

