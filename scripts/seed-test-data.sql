-- Datos sintéticos para pruebas locales. No usa correos reales.
DO $$
DECLARE
  tenant_id uuid := '71b5634c-fc37-49a9-b218-7c205f49e2ef';
  client_id uuid;
  application_id uuid;
  loan_id uuid;
  i integer;
  n integer;
  amount numeric(18,2);
  rate numeric := 0.05;
  payment numeric(18,2);
  balance numeric(18,2);
  interest numeric(18,2);
  principal numeric(18,2);
  due_date timestamptz;
BEGIN
  FOR i IN 1..10 LOOP
    IF EXISTS (SELECT 1 FROM "Clients" WHERE "TenantId" = tenant_id AND "Cedula" = 'TEST-' || lpad(i::text, 3, '0')) THEN
      CONTINUE;
    END IF;

    client_id := gen_random_uuid();
    amount := 1000 + (i * 250);
    payment := round((amount * rate * power(1 + rate, 6) / (power(1 + rate, 6) - 1))::numeric, 2);
    application_id := gen_random_uuid();
    loan_id := gen_random_uuid();

    INSERT INTO "Clients" ("Id", "TenantId", "Nombre", "Cedula", "Email", "Telefono", "FechaNacimiento", "EstadoCivil", "Estado", "FechaRegistro")
    VALUES (client_id, tenant_id, 'Cliente Demo ' || lpad(i::text, 2, '0'), 'TEST-' || lpad(i::text, 3, '0'), 'demo' || lpad(i::text, 2, '0') || '@prestamoplus.test', '809-555-' || lpad((1000 + i)::text, 4, '0'), '1990-01-01'::timestamptz, 'Soltero', 'Activo', now());

    INSERT INTO "LoanApplications" ("Id", "TenantId", "ClientId", "MontoSolicitado", "TasaInteresMensual", "Plazo", "UnidadPlazo", "FrecuenciaPago", "GastoCierrePorcentaje", "CuotaEstimada", "TotalPagar", "TotalIntereses", "Estado", "TipoPrestamo", "FechaSolicitud", "FirstApprovedAt", "SecondApprovedAt", "Moneda")
    VALUES (application_id, tenant_id, client_id, amount, 5, 6, 'Meses', 'Mensual', 0, payment, payment * 6, (payment * 6) - amount, 'Aprobada', CASE WHEN i % 2 = 0 THEN 'Garantia' ELSE 'Personal' END, now(), now(), now(), 'DOP');

    INSERT INTO "Loans" ("Id", "TenantId", "ClientId", "LoanApplicationId", "MontoOriginal", "TasaInteresAnual", "PlazoMeses", "CuotaMensual", "SaldoPendiente", "Estado", "Tipo", "FrecuenciaPago", "FechaInicio", "FechaVencimiento", "CreatedAt", "Moneda")
    VALUES (loan_id, tenant_id, client_id, application_id, amount, 60, 6, payment, amount, 'Activo', CASE WHEN i % 2 = 0 THEN 'Garantia' ELSE 'Personal' END, 'Mensual', now(), now() + interval '6 months', now(), 'DOP');

    balance := amount;
    FOR n IN 1..6 LOOP
      due_date := date_trunc('day', now()) + (n || ' months')::interval;
      interest := round(balance * rate, 2);
      principal := CASE WHEN n = 6 THEN balance ELSE least(balance, payment - interest) END;
      INSERT INTO "Installments" ("Id", "LoanId", "Numero", "FechaPago", "Capital", "Interes", "Cuota", "CapitalPagado", "InteresPagado", "MoraPagada", "Estado")
      VALUES (gen_random_uuid(), loan_id, n, due_date, principal, interest, principal + interest, 0, 0, 0, 'Pendiente');
      balance := balance - principal;
    END LOOP;
  END LOOP;
END $$;
