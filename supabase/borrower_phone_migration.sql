-- ============================================================
-- Borrower Phone — run this in the Supabase SQL Editor
-- Renames borrow_records.borrower_note to borrower_phone and
-- makes it mandatory.
-- ============================================================

ALTER TABLE borrow_records RENAME COLUMN borrower_note TO borrower_phone;
UPDATE borrow_records SET borrower_phone = '' WHERE borrower_phone IS NULL;
ALTER TABLE borrow_records ALTER COLUMN borrower_phone SET NOT NULL;
