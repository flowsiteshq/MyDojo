-- PROPOSED ONLY — DO NOT APPLY WITHOUT APPROVAL
-- MyDojo belt-test PayPal repair
-- Additive and backward-compatible: nullable columns preserve all existing Stripe,
-- FluidPay, and historical belt-test rows. A nullable UNIQUE key permits multiple
-- NULLs in MySQL while preventing reuse of a real PayPal order ID.

ALTER TABLE `beltTestIntents`
  ADD `paypalOrderId` varchar(64) NULL,
  ADD `paypalCaptureId` varchar(64) NULL,
  ADD CONSTRAINT `beltTestIntents_paypalOrderId_unique` UNIQUE (`paypalOrderId`);
