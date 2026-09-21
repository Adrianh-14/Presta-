using PréstamoPlus.Domain.Enums;

namespace PréstamoPlus.Application.Common;

/// <summary>
/// Converts a rate expressed in its declared frequency to the payment period.
/// Existing monthly rates remain compatible: monthly + quincenal payment is
/// still divided by two, while a daily rate is used as a daily rate.
/// </summary>
public static class InterestRateCalculator
{
    public static decimal PeriodsPerMonth(FrecuenciaPago frequency) => frequency switch
    {
        FrecuenciaPago.Diaria => 30m,
        FrecuenciaPago.Semanal => 4m,
        FrecuenciaPago.Quincenal => 2m,
        _ => 1m
    };

    public static decimal PeriodsPerMonth(FrecuenciaInteres frequency) => frequency switch
    {
        FrecuenciaInteres.Diaria => 30m,
        FrecuenciaInteres.Semanal => 4m,
        FrecuenciaInteres.Quincenal => 2m,
        _ => 1m
    };

    public static decimal RatePerPaymentPeriod(
        decimal ratePercent,
        FrecuenciaInteres interestFrequency,
        FrecuenciaPago paymentFrequency)
    {
        var monthlyRate = ratePercent / 100m * PeriodsPerMonth(interestFrequency);
        return monthlyRate / PeriodsPerMonth(paymentFrequency);
    }

    public static decimal AnnualRate(decimal ratePercent, FrecuenciaInteres interestFrequency) =>
        ratePercent * PeriodsPerMonth(interestFrequency) * 12m;
}
