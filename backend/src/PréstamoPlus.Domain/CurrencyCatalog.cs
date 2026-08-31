namespace PréstamoPlus.Domain;

/// <summary>ISO 4217 currencies initially enabled for international operation.</summary>
public static class CurrencyCatalog
{
    public static readonly IReadOnlyDictionary<string, CurrencyDefinition> All =
        new Dictionary<string, CurrencyDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            ["DOP"] = new("DOP", "🇩🇴", "Pesos dominicanos"),
            ["USD"] = new("USD", "🇺🇸", "Dólares estadounidenses"),
            ["EUR"] = new("EUR", "🇪🇺", "Euros"),
            ["MXN"] = new("MXN", "🇲🇽", "Pesos mexicanos"),
            ["GTQ"] = new("GTQ", "🇬🇹", "Quetzales guatemaltecos"),
            ["HNL"] = new("HNL", "🇭🇳", "Lempiras hondureños"),
            ["NIO"] = new("NIO", "🇳🇮", "Córdobas nicaragüenses"),
            ["CRC"] = new("CRC", "🇨🇷", "Colones costarricenses"),
            ["PAB"] = new("PAB", "🇵🇦", "Balboas panameños"),
            ["COP"] = new("COP", "🇨🇴", "Pesos colombianos"),
            ["PEN"] = new("PEN", "🇵🇪", "Soles peruanos"),
            ["BRL"] = new("BRL", "🇧🇷", "Reales brasileños"),
            ["ARS"] = new("ARS", "🇦🇷", "Pesos argentinos"),
            ["CLP"] = new("CLP", "🇨🇱", "Pesos chilenos"),
            ["CAD"] = new("CAD", "🇨🇦", "Dólares canadienses"),
            ["GBP"] = new("GBP", "🇬🇧", "Libras esterlinas"),
        };

    public static bool IsSupported(string? code) => !string.IsNullOrWhiteSpace(code) && All.ContainsKey(code.Trim());
    public static string Normalize(string? code) => IsSupported(code) ? code!.Trim().ToUpperInvariant() : "DOP";
}

public sealed record CurrencyDefinition(string Code, string Flag, string Name);
