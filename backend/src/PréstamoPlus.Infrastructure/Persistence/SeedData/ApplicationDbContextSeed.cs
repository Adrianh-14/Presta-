using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using PréstamoPlus.Domain.Entities;
using PréstamoPlus.Domain.Entities.Tenancy;
using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Infrastructure.Persistence.SeedData
{
    public static class ApplicationDbContextSeed
    {
        public static async Task SeedAsync(ApplicationDbContext context, string demoPassword)
        {
            if (await context.Tenants.AnyAsync()) return;

            // ── Tenants ──────────────────────────────────────────────
            var tenantBasic = new Tenant
            {
                Id = Guid.NewGuid(),
                Nombre = "Cooperativa La Nacional",
                Slug = "la-nacional",
                RNC = "1-02-34567-8",
                Email = "info@lanacional.com",
                Telefono = "809-555-0001",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var tenantPro = new Tenant
            {
                Id = Guid.NewGuid(),
                Nombre = "Banco Popular del Caribe",
                Slug = "banco-popular",
                RNC = "1-02-87654-3",
                Email = "info@bancopopular.com",
                Telefono = "809-555-0002",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var tenantEnterprise = new Tenant
            {
                Id = Guid.NewGuid(),
                Nombre = "Financiera PrestamoPlus Global",
                Slug = "prestamoplus-global",
                RNC = "1-02-11111-1",
                Email = "admin@prestamoplus.com",
                Telefono = "809-555-0003",
                LogoUrl = "/images/logo-pp.png",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Tenants.AddRange(tenantBasic, tenantPro, tenantEnterprise);
            await context.SaveChangesAsync();

            // ── Subscriptions ────────────────────────────────────────
            context.Subscriptions.AddRange(
                new Subscription
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantBasic.Id,
                    PlanId = "basic",
                    Status = SubscriptionStatus.Active,
                    CurrentPeriodStart = DateTime.UtcNow.AddDays(-15),
                    CurrentPeriodEnd = DateTime.UtcNow.AddDays(15),
                    CreatedAt = DateTime.UtcNow
                },
                new Subscription
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantPro.Id,
                    PlanId = "pro",
                    Status = SubscriptionStatus.Active,
                    CurrentPeriodStart = DateTime.UtcNow.AddDays(-10),
                    CurrentPeriodEnd = DateTime.UtcNow.AddDays(20),
                    CreatedAt = DateTime.UtcNow
                },
                new Subscription
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantEnterprise.Id,
                    PlanId = "enterprise",
                    Status = SubscriptionStatus.Active,
                    CurrentPeriodStart = DateTime.UtcNow.AddDays(-5),
                    CurrentPeriodEnd = DateTime.UtcNow.AddDays(25),
                    CreatedAt = DateTime.UtcNow
                }
            );
            await context.SaveChangesAsync();

            // ── Users (admin por tenant) ─────────────────────────────
            var userBasic = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantBasic.Id,
                Email = "admin@lanacional.com",
                PasswordHash = HashPassword(demoPassword),
                Nombre = "Carlos Mendoza",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var userPro = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantPro.Id,
                Email = "admin@bancopopular.com",
                PasswordHash = HashPassword(demoPassword),
                Nombre = "María Fernández",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var userEnterprise = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantEnterprise.Id,
                Email = "admin@prestamoplus.com",
                PasswordHash = HashPassword(demoPassword),
                Nombre = "Roberto Sánchez",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            // Usuarios adicionales para Enterprise
            var userEnterpriseManager = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantEnterprise.Id,
                Email = "manager@prestamoplus.com",
                PasswordHash = HashPassword(demoPassword),
                Nombre = "Ana García",
                Role = "Manager",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var userEnterpriseOperator = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantEnterprise.Id,
                Email = "operator@prestamoplus.com",
                PasswordHash = HashPassword(demoPassword),
                Nombre = "Pedro López",
                Role = "Operator",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(userBasic, userPro, userEnterprise, userEnterpriseManager, userEnterpriseOperator);
            await context.SaveChangesAsync();

            // ── Clients para Tenant Basic ────────────────────────────
            var clientsBasic = new List<Client>
            {
                CreateClient(tenantBasic.Id, "Juan Pérez García", "001-1234567-8", "juan@email.com", "809-555-1001", new DateTime(1985, 3, 15), EstadoCivil.Casado),
                CreateClient(tenantBasic.Id, "María López de Rodríguez", "001-2345678-9", "maria@email.com", "809-555-1002", new DateTime(1990, 7, 22), EstadoCivil.Soltero),
                CreateClient(tenantBasic.Id, "Carlos Rodríguez", "001-3456789-0", "carlos@email.com", "809-555-1003", new DateTime(1978, 11, 5), EstadoCivil.Casado),
            };
            context.Clients.AddRange(clientsBasic);
            await context.SaveChangesAsync();

            // ── Clients para Tenant Pro ──────────────────────────────
            var clientsPro = new List<Client>
            {
                CreateClient(tenantPro.Id, "Ana Martínez Suárez", "001-4567890-1", "ana.m@email.com", "809-555-2001", new DateTime(1992, 1, 30), EstadoCivil.Soltero),
                CreateClient(tenantPro.Id, "Pedro Sánchez Castillo", "001-5678901-2", "pedro.s@email.com", "809-555-2002", new DateTime(1988, 6, 18), EstadoCivil.Casado),
                CreateClient(tenantPro.Id, "Laura Fernández Vega", "001-6789012-3", "laura.f@email.com", "809-555-2003", new DateTime(1995, 9, 12), EstadoCivil.Soltero),
                CreateClient(tenantPro.Id, "Roberto Jiménez Peña", "001-7890123-4", "roberto.j@email.com", "809-555-2004", new DateTime(1980, 4, 25), EstadoCivil.Divorciado),
                CreateClient(tenantPro.Id, "Sofía Ramírez Cruz", "001-8901234-5", "sofia.r@email.com", "809-555-2005", new DateTime(1993, 12, 8), EstadoCivil.Soltero),
            };
            context.Clients.AddRange(clientsPro);
            await context.SaveChangesAsync();

            // ── Clients para Tenant Enterprise ───────────────────────
            var clientsEnterprise = new List<Client>
            {
                CreateClient(tenantEnterprise.Id, "Miguel Torres Díaz", "001-9012345-6", "miguel.t@email.com", "809-555-3001", new DateTime(1982, 2, 14), EstadoCivil.Casado),
                CreateClient(tenantEnterprise.Id, "Carmen Rosa Pérez", "001-0123456-7", "carmen.p@email.com", "809-555-3002", new DateTime(1987, 8, 3), EstadoCivil.Viudo),
                CreateClient(tenantEnterprise.Id, "Francisco Morales", "001-1111111-1", "francisco.m@email.com", "809-555-3003", new DateTime(1975, 5, 20), EstadoCivil.Casado),
                CreateClient(tenantEnterprise.Id, "Isabel Castillo Rojas", "001-2222222-2", "isabel.c@email.com", "809-555-3004", new DateTime(1991, 10, 7), EstadoCivil.Soltero),
                CreateClient(tenantEnterprise.Id, "Diego Alejandro Reyes", "001-3333333-3", "diego.r@email.com", "809-555-3005", new DateTime(1984, 3, 28), EstadoCivil.Casado),
                CreateClient(tenantEnterprise.Id, "Valentina Herrera Soto", "001-4444444-4", "valentina.h@email.com", "809-555-3006", new DateTime(1996, 7, 16), EstadoCivil.Soltero),
                CreateClient(tenantEnterprise.Id, "Andrés Felipe Castro", "001-5555555-5", "andres.c@email.com", "809-555-3007", new DateTime(1979, 11, 30), EstadoCivil.Casado),
                CreateClient(tenantEnterprise.Id, "Camila Andrea Vargas", "001-6666666-6", "camila.v@email.com", "809-555-3008", new DateTime(1994, 1, 22), EstadoCivil.Soltero),
            };
            context.Clients.AddRange(clientsEnterprise);
            await context.SaveChangesAsync();

            // ── LoanApplications + Loans ─────────────────────────────
            var now = DateTime.UtcNow;

            // Tenant Basic — 2 préstamos activos
            var basic1 = ComputeLoanValues(50000, 2.5m, 6, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 3m);
            var basic2 = ComputeLoanValues(25000, 3.0m, 4, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m);
            var laBasic1 = CreateLoanApplication(tenantBasic.Id, clientsBasic[0].Id, 50000, 2.5m, 6, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 3m, TipoPrestamo.Personal, EstadoSolicitud.Aprobada);
            var laBasic2 = CreateLoanApplication(tenantBasic.Id, clientsBasic[1].Id, 25000, 3.0m, 4, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m, TipoPrestamo.Personal, EstadoSolicitud.Aprobada);
            context.LoanApplications.AddRange(laBasic1, laBasic2);
            await context.SaveChangesAsync();

            context.Loans.AddRange(
                CreateLoan(tenantBasic.Id, clientsBasic[0].Id, laBasic1.Id, basic1.principal, 30m, 6, basic1.cuota, Math.Round(basic1.principal * 42000m / 50000m, 2), EstadoPrestamo.Activo, TipoPrestamo.Personal, now.AddMonths(-3), now.AddMonths(3), FrecuenciaPago.Quincenal),
                CreateLoan(tenantBasic.Id, clientsBasic[1].Id, laBasic2.Id, basic2.principal, 36m, 4, basic2.cuota, Math.Round(basic2.principal * 12000m / 25000m, 2), EstadoPrestamo.Activo, TipoPrestamo.Personal, now.AddMonths(-2), now.AddMonths(2), FrecuenciaPago.Mensual)
            );
            await context.SaveChangesAsync();

            // Tenant Pro — 3 préstamos (2 activos, 1 vencido)
            var pro1 = ComputeLoanValues(150000, 2.0m, 12, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 3m);
            var pro2 = ComputeLoanValues(75000, 2.5m, 8, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m);
            var pro3 = ComputeLoanValues(30000, 3.0m, 6, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 2.5m);
            var laPro1 = CreateLoanApplication(tenantPro.Id, clientsPro[0].Id, 150000, 2.0m, 12, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 3m, TipoPrestamo.Garantia, EstadoSolicitud.Aprobada);
            var laPro2 = CreateLoanApplication(tenantPro.Id, clientsPro[1].Id, 75000, 2.5m, 8, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m, TipoPrestamo.Personal, EstadoSolicitud.Aprobada);
            var laPro3 = CreateLoanApplication(tenantPro.Id, clientsPro[2].Id, 30000, 3.0m, 6, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 2.5m, TipoPrestamo.Personal, EstadoSolicitud.Aprobada);
            context.LoanApplications.AddRange(laPro1, laPro2, laPro3);
            await context.SaveChangesAsync();

            context.Loans.AddRange(
                CreateLoan(tenantPro.Id, clientsPro[0].Id, laPro1.Id, pro1.principal, 24m, 12, pro1.cuota, Math.Round(pro1.principal * 135000m / 150000m, 2), EstadoPrestamo.Activo, TipoPrestamo.Garantia, now.AddMonths(-5), now.AddMonths(7), FrecuenciaPago.Quincenal),
                CreateLoan(tenantPro.Id, clientsPro[1].Id, laPro2.Id, pro2.principal, 30m, 8, pro2.cuota, Math.Round(pro2.principal * 65000m / 75000m, 2), EstadoPrestamo.Activo, TipoPrestamo.Personal, now.AddMonths(-3), now.AddMonths(5), FrecuenciaPago.Mensual),
                CreateLoan(tenantPro.Id, clientsPro[2].Id, laPro3.Id, pro3.principal, 36m, 6, pro3.cuota, Math.Round(pro3.principal * 18500m / 30000m, 2), EstadoPrestamo.Vencido, TipoPrestamo.Personal, now.AddMonths(-8), now.AddMonths(-2), FrecuenciaPago.Quincenal)
            );
            await context.SaveChangesAsync();

            // Tenant Enterprise — 5 préstamos (3 activos, 1 mora, 1 pagado)
            var ent1 = ComputeLoanValues(200000, 1.8m, 24, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m);
            var ent2 = ComputeLoanValues(100000, 2.2m, 12, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 3m);
            var ent3 = ComputeLoanValues(45000, 2.8m, 8, UnidadPlazo.Meses, FrecuenciaPago.Semanal, 2m);
            var ent4 = ComputeLoanValues(80000, 2.5m, 10, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 2.5m);
            var ent5 = ComputeLoanValues(60000, 2.0m, 6, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m);
            var laEnt1 = CreateLoanApplication(tenantEnterprise.Id, clientsEnterprise[0].Id, 200000, 1.8m, 24, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m, TipoPrestamo.Garantia, EstadoSolicitud.Aprobada);
            var laEnt2 = CreateLoanApplication(tenantEnterprise.Id, clientsEnterprise[1].Id, 100000, 2.2m, 12, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 3m, TipoPrestamo.Personal, EstadoSolicitud.Aprobada);
            var laEnt3 = CreateLoanApplication(tenantEnterprise.Id, clientsEnterprise[2].Id, 45000, 2.8m, 8, UnidadPlazo.Meses, FrecuenciaPago.Semanal, 2m, TipoPrestamo.Personal, EstadoSolicitud.Aprobada);
            var laEnt4 = CreateLoanApplication(tenantEnterprise.Id, clientsEnterprise[3].Id, 80000, 2.5m, 10, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 2.5m, TipoPrestamo.Personal, EstadoSolicitud.Aprobada);
            var laEnt5 = CreateLoanApplication(tenantEnterprise.Id, clientsEnterprise[4].Id, 60000, 2.0m, 6, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m, TipoPrestamo.Personal, EstadoSolicitud.Aprobada);
            context.LoanApplications.AddRange(laEnt1, laEnt2, laEnt3, laEnt4, laEnt5);
            await context.SaveChangesAsync();

            context.Loans.AddRange(
                CreateLoan(tenantEnterprise.Id, clientsEnterprise[0].Id, laEnt1.Id, ent1.principal, 21.6m, 24, ent1.cuota, Math.Round(ent1.principal * 180000m / 200000m, 2), EstadoPrestamo.Activo, TipoPrestamo.Garantia, now.AddMonths(-6), now.AddMonths(18), FrecuenciaPago.Mensual),
                CreateLoan(tenantEnterprise.Id, clientsEnterprise[1].Id, laEnt2.Id, ent2.principal, 26.4m, 12, ent2.cuota, Math.Round(ent2.principal * 78000m / 100000m, 2), EstadoPrestamo.Activo, TipoPrestamo.Personal, now.AddMonths(-4), now.AddMonths(8), FrecuenciaPago.Quincenal),
                CreateLoan(tenantEnterprise.Id, clientsEnterprise[2].Id, laEnt3.Id, ent3.principal, 33.6m, 8, ent3.cuota, Math.Round(ent3.principal * 35000m / 45000m, 2), EstadoPrestamo.Mora, TipoPrestamo.Personal, now.AddMonths(-10), now.AddMonths(-2), FrecuenciaPago.Semanal),
                CreateLoan(tenantEnterprise.Id, clientsEnterprise[3].Id, laEnt4.Id, ent4.principal, 30m, 10, ent4.cuota, Math.Round(ent4.principal * 55000m / 80000m, 2), EstadoPrestamo.Activo, TipoPrestamo.Personal, now.AddMonths(-3), now.AddMonths(7), FrecuenciaPago.Quincenal),
                CreateLoan(tenantEnterprise.Id, clientsEnterprise[4].Id, laEnt5.Id, ent5.principal, 24m, 6, ent5.cuota, 0m, EstadoPrestamo.Pagado, TipoPrestamo.Personal, now.AddMonths(-8), now.AddMonths(-2), FrecuenciaPago.Mensual)
            );
            await context.SaveChangesAsync();

            // ── Solicitudes pendientes (solo Enterprise) ─────────────
            context.LoanApplications.AddRange(
                CreateLoanApplication(tenantEnterprise.Id, clientsEnterprise[5].Id, 120000, 2.0m, 18, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 3m, TipoPrestamo.Personal, EstadoSolicitud.Pendiente),
                CreateLoanApplication(tenantEnterprise.Id, clientsEnterprise[6].Id, 90000, 2.3m, 12, UnidadPlazo.Meses, FrecuenciaPago.Mensual, 2m, TipoPrestamo.Garantia, EstadoSolicitud.Pendiente),
                CreateLoanApplication(tenantEnterprise.Id, clientsEnterprise[7].Id, 35000, 2.8m, 6, UnidadPlazo.Meses, FrecuenciaPago.Quincenal, 2.5m, TipoPrestamo.Personal, EstadoSolicitud.Pendiente)
            );
            await context.SaveChangesAsync();
        }

        private static Client CreateClient(Guid tenantId, string nombre, string cedula, string email, string telefono, DateTime fechaNac, EstadoCivil ec)
        {
            return new Client
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Nombre = nombre,
                Cedula = cedula,
                Email = email,
                Telefono = telefono,
                FechaNacimiento = DateTime.SpecifyKind(fechaNac, DateTimeKind.Utc),
                EstadoCivil = ec,
                Estado = EstadoCliente.Activo,
                FechaRegistro = DateTime.UtcNow
            };
        }

        private static (decimal principal, decimal cuota, decimal totalPagar, decimal totalIntereses) ComputeLoanValues(
            decimal monto, decimal tasa, int plazo, UnidadPlazo unidad, FrecuenciaPago freq, decimal gastoCierre)
        {
            var principal = monto + (monto * gastoCierre / 100);
            var tasaDecimal = tasa / 100;

            decimal tasaPorPeriodo;
            int totalPeriodos;

            switch (freq)
            {
                case FrecuenciaPago.Diaria:
                    tasaPorPeriodo = tasaDecimal / 30;
                    totalPeriodos = unidad == UnidadPlazo.Anios ? plazo * 360 : plazo * 30;
                    break;
                case FrecuenciaPago.Semanal:
                    tasaPorPeriodo = tasaDecimal / 4;
                    totalPeriodos = unidad == UnidadPlazo.Anios ? plazo * 48 : plazo * 4;
                    break;
                case FrecuenciaPago.Quincenal:
                    tasaPorPeriodo = tasaDecimal / 2;
                    totalPeriodos = unidad == UnidadPlazo.Anios ? plazo * 24 : plazo * 2;
                    break;
                default:
                    tasaPorPeriodo = tasaDecimal;
                    totalPeriodos = unidad == UnidadPlazo.Anios ? plazo * 12 : plazo;
                    break;
            }

            if (totalPeriodos <= 0 || principal <= 0)
                return (0, 0, 0, 0);

            if (tasaPorPeriodo <= 0)
            {
                var cuotaSimple = principal / totalPeriodos;
                return (principal, Math.Round(cuotaSimple, 2), principal, 0);
            }

            var factor = Math.Pow(1 + (double)tasaPorPeriodo, totalPeriodos);
            var cuotaCalc = principal * (tasaPorPeriodo * (decimal)factor) / ((decimal)factor - 1);
            var totalPagar = cuotaCalc * totalPeriodos;
            var totalIntereses = totalPagar - principal;

            return (principal, Math.Round(cuotaCalc, 2), Math.Round(totalPagar, 2), Math.Round(totalIntereses, 2));
        }

        private static LoanApplication CreateLoanApplication(
            Guid tenantId, Guid clientId, decimal monto, decimal tasa, int plazo,
            UnidadPlazo unidad, FrecuenciaPago freq, decimal gastoCierre,
            TipoPrestamo tipo, EstadoSolicitud estado)
        {
            var (principal, cuota, totalPagar, totalIntereses) = ComputeLoanValues(monto, tasa, plazo, unidad, freq, gastoCierre);

            return new LoanApplication
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = clientId,
                MontoSolicitado = monto,
                TasaInteresMensual = tasa,
                Plazo = plazo,
                UnidadPlazo = unidad,
                FrecuenciaPago = freq,
                GastoCierrePorcentaje = gastoCierre,
                CuotaEstimada = cuota,
                TotalPagar = totalPagar,
                TotalIntereses = totalIntereses,
                TipoPrestamo = tipo,
                Estado = estado,
                FechaSolicitud = DateTime.UtcNow.AddDays(-new Random().Next(1, 30))
            };
        }

        private static Loan CreateLoan(
            Guid tenantId, Guid clientId, Guid loanAppId, decimal monto, decimal tasaAnual,
            int plazoMeses, decimal cuota, decimal saldo, EstadoPrestamo estado,
            TipoPrestamo tipo, DateTime fechaInicio, DateTime fechaVencimiento,
            FrecuenciaPago frecuencia = FrecuenciaPago.Mensual)
        {
            return new Loan
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ClientId = clientId,
                LoanApplicationId = loanAppId,
                MontoOriginal = monto,
                TasaInteresAnual = tasaAnual,
                PlazoMeses = plazoMeses,
                CuotaMensual = cuota,
                SaldoPendiente = saldo,
                Estado = estado,
                Tipo = tipo,
                FrecuenciaPago = frecuencia,
                FechaInicio = fechaInicio,
                FechaVencimiento = fechaVencimiento,
                CreatedAt = DateTime.UtcNow
            };
        }

        private static string HashPassword(string password)
        {
            var salt = new byte[16];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(salt);

            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(20);

            var hashBytes = new byte[36];
            Array.Copy(salt, 0, hashBytes, 0, 16);
            Array.Copy(hash, 0, hashBytes, 16, 20);

            return Convert.ToBase64String(hashBytes);
        }
    }
}
