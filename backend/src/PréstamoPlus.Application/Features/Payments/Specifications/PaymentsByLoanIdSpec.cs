using Ardalis.Specification;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Application.Features.Payments.Specifications
{
    public class PaymentsByLoanIdSpec : Specification<Payment>
    {
        public PaymentsByLoanIdSpec(Guid loanId)
        {
            Query
                .Where(p => p.LoanId == loanId)
                .OrderByDescending(p => p.FechaPago)
                .AsNoTracking();
        }
    }

    public class LateFeesByLoanIdSpec : Specification<LateFee>
    {
        public LateFeesByLoanIdSpec(Guid loanId)
        {
            Query
                .Where(lf => lf.LoanId == loanId)
                .OrderByDescending(lf => lf.FechaCalculo)
                .AsNoTracking();
        }
    }

    public class UnpaidLateFeesByLoanIdSpec : Specification<LateFee>
    {
        public UnpaidLateFeesByLoanIdSpec(Guid loanId)
        {
            Query
                .Where(lf => lf.LoanId == loanId && !lf.Pagado)
                .OrderByDescending(lf => lf.FechaCalculo)
                .AsNoTracking();
        }
    }

    public class InstallmentsByLoanIdSpec : Specification<Installment>
    {
        public InstallmentsByLoanIdSpec(Guid loanId)
        {
            Query
                .Where(i => i.LoanId == loanId)
                .OrderBy(i => i.Numero)
                .AsTracking();
        }
    }
}
