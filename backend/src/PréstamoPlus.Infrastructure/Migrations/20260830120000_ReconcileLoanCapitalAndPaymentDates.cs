using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PréstamoPlus.Infrastructure.Migrations;

public partial class ReconcileLoanCapitalAndPaymentDates : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_LedgerAccounts_TenantId_Code", table: "LedgerAccounts");
        migrationBuilder.CreateIndex(name: "IX_LedgerAccounts_TenantId_Code_Currency", table: "LedgerAccounts", columns: new[] { "TenantId", "Code", "Currency" }, unique: true);

        // Normaliza cuotas históricas: la primera nunca vence el mismo día del desembolso.
        migrationBuilder.Sql(@"
            WITH numbered AS (
                SELECT i.""Id"", i.""LoanId"", i.""Numero"", l.""FechaInicio"", l.""FrecuenciaPago""
                FROM ""Installments"" i JOIN ""Loans"" l ON l.""Id"" = i.""LoanId""
            )
            UPDATE ""Installments"" i SET ""FechaPago"" = CASE n.""FrecuenciaPago""
                WHEN 'Diaria' THEN n.""FechaInicio"" + (n.""Numero"" || ' days')::interval
                WHEN 'Semanal' THEN n.""FechaInicio"" + (n.""Numero"" * 7 || ' days')::interval
                WHEN 'Quincenal' THEN n.""FechaInicio"" + (n.""Numero"" * 15 || ' days')::interval
                ELSE n.""FechaInicio"" + (n.""Numero"" || ' months')::interval END
            FROM numbered n WHERE i.""Id"" = n.""Id"";");

        // Registra desembolsos antiguos que no tenían asiento, descontándolos del efectivo.
        migrationBuilder.Sql(@"
            DO $$ DECLARE r RECORD; e uuid; cash uuid; receivable uuid; commission uuid; c text; fee numeric;
            BEGIN
              FOR r IN SELECT l.""Id"" loan_id, l.""TenantId"" tenant_id, l.""MontoOriginal"" principal, l.""Moneda"" currency, COALESCE(a.""MontoSolicitado"", l.""MontoOriginal"") requested
                FROM ""Loans"" l LEFT JOIN ""LoanApplications"" a ON a.""Id""=l.""LoanApplicationId""
                WHERE NOT EXISTS (SELECT 1 FROM ""JournalEntries"" j WHERE j.""SourceId""=l.""Id"" AND j.""SourceType"" IN ('loan.disbursement','legacy.loan.disbursement')) LOOP
                c := upper(COALESCE(NULLIF(r.currency,''),'DOP'));
                fee := greatest(r.principal-r.requested,0);
                SELECT ""Id"" INTO cash FROM ""LedgerAccounts"" WHERE ""TenantId""=r.tenant_id AND ""Code""='CASH' AND ""Currency""=c;
                IF cash IS NULL THEN cash:=gen_random_uuid(); INSERT INTO ""LedgerAccounts"" (""Id"",""TenantId"",""Code"",""Name"",""Currency"",""IsActive"",""CreatedAt"") VALUES (cash,r.tenant_id,'CASH','Caja y bancos',c,true,now()); END IF;
                SELECT ""Id"" INTO receivable FROM ""LedgerAccounts"" WHERE ""TenantId""=r.tenant_id AND ""Code""='LOAN_RECEIVABLE' AND ""Currency""=c;
                IF receivable IS NULL THEN receivable:=gen_random_uuid(); INSERT INTO ""LedgerAccounts"" (""Id"",""TenantId"",""Code"",""Name"",""Currency"",""IsActive"",""CreatedAt"") VALUES (receivable,r.tenant_id,'LOAN_RECEIVABLE','Cartera de préstamos',c,true,now()); END IF;
                e:=gen_random_uuid(); INSERT INTO ""JournalEntries"" (""Id"",""TenantId"",""SourceType"",""SourceId"",""PostedAt"",""Hash"") VALUES (e,r.tenant_id,'legacy.loan.disbursement',r.loan_id,now(),md5(e::text));
                INSERT INTO ""JournalLines"" (""Id"",""JournalEntryId"",""LedgerAccountId"",""Debit"",""Credit"",""Description"") VALUES (gen_random_uuid(),e,receivable,r.principal,0,'Conciliación de desembolso histórico'),(gen_random_uuid(),e,cash,0,r.requested,'Salida de efectivo histórica');
                IF fee>0 THEN SELECT ""Id"" INTO commission FROM ""LedgerAccounts"" WHERE ""TenantId""=r.tenant_id AND ""Code""='COMMISSION_INCOME' AND ""Currency""=c; IF commission IS NULL THEN commission:=gen_random_uuid(); INSERT INTO ""LedgerAccounts"" (""Id"",""TenantId"",""Code"",""Name"",""Currency"",""IsActive"",""CreatedAt"") VALUES (commission,r.tenant_id,'COMMISSION_INCOME','Ingresos por comisión',c,true,now()); END IF; INSERT INTO ""JournalLines"" (""Id"",""JournalEntryId"",""LedgerAccountId"",""Debit"",""Credit"",""Description"") VALUES (gen_random_uuid(),e,commission,0,fee,'Gasto de cierre histórico'); END IF;
              END LOOP; END $$;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_LedgerAccounts_TenantId_Code_Currency", table: "LedgerAccounts");
        migrationBuilder.CreateIndex(name: "IX_LedgerAccounts_TenantId_Code", table: "LedgerAccounts", columns: new[] { "TenantId", "Code" }, unique: true);
    }
}
