-- Cuadra los desembolsos de los 10 préstamos demo con el capital disponible.
DO $$
DECLARE
  tenant_id uuid := '71b5634c-fc37-49a9-b218-7c205f49e2ef';
  cash_id uuid;
  receivable_id uuid;
  loan record;
  entry_id uuid;
BEGIN
  SELECT "Id" INTO cash_id FROM "LedgerAccounts" WHERE "TenantId" = tenant_id AND "Code" = 'CASH' AND "Currency" = 'DOP';
  SELECT "Id" INTO receivable_id FROM "LedgerAccounts" WHERE "TenantId" = tenant_id AND "Code" = 'LOAN_RECEIVABLE' AND "Currency" = 'DOP';
  FOR loan IN SELECT "Id", "MontoOriginal" FROM "Loans" WHERE "TenantId" = tenant_id AND "Id" IN (
    'b2eb0527-ce14-4e08-b280-0717318ab381', '43e42bba-da4f-4018-adae-8ffdbbdab016',
    'e89a7532-6c32-49c8-a603-90a069a26108', 'ee0caf95-4a4b-43c0-8878-583edcab8b0d',
    '3fbf75d1-a7f3-418c-af67-4685f9d2d717', 'c51d614b-effd-475c-bfbb-8cf0b9eb80df',
    'ff8971ee-8a55-4018-8078-8a97b2c0ff02', 'b343fcf1-4e4d-45ca-a328-2343d3770a42',
    '6fc089b0-dd93-4685-be90-fbe3698c87b0', '9cf5ed39-c1fe-4a9b-ad58-9938d6f7a98c'
  ) LOOP
    IF EXISTS (SELECT 1 FROM "JournalEntries" WHERE "TenantId" = tenant_id AND "SourceType" = 'test-seed-disbursement' AND "SourceId" = loan."Id") THEN
      CONTINUE;
    END IF;
    entry_id := gen_random_uuid();
    INSERT INTO "JournalEntries" ("Id", "TenantId", "SourceType", "SourceId", "PostedAt", "Hash")
    VALUES (entry_id, tenant_id, 'test-seed-disbursement', loan."Id", now(), md5(entry_id::text));
    INSERT INTO "JournalLines" ("Id", "JournalEntryId", "LedgerAccountId", "Debit", "Credit", "Description") VALUES
      (gen_random_uuid(), entry_id, receivable_id, loan."MontoOriginal", 0, 'Desembolso préstamo demo'),
      (gen_random_uuid(), entry_id, cash_id, 0, loan."MontoOriginal", 'Salida de caja préstamo demo');
  END LOOP;
END $$;
