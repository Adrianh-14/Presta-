namespace PréstamoPlus.Application.Common;

/// <summary>
/// Reloj de negocio de Bonexa. Las fechas de cuotas y vencimientos son
/// calendarios de la operación, no instantes UTC.
/// </summary>
public static class BusinessClock
{
    private static readonly TimeZoneInfo DominicanTimeZone = ResolveTimeZone();

    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, DominicanTimeZone);
    public static DateTime Today => Now.Date;

    private static TimeZoneInfo ResolveTimeZone()
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById("America/Santo_Domingo"); }
        catch (TimeZoneNotFoundException) { return TimeZoneInfo.FindSystemTimeZoneById("SA Western Standard Time"); }
        catch (InvalidTimeZoneException) { return TimeZoneInfo.Utc; }
    }
}
