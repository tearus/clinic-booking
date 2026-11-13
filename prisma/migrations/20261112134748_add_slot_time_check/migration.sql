-- Add time validity check
ALTER TABLE "Slot"
ADD CONSTRAINT "slot_time_order_check" CHECK ("startsAt" < "endsAt");
