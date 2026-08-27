using System.Globalization;
using System.Text;
using PréstamoPlus.Domain.Entities;

namespace PréstamoPlus.Application.Common
{
    public static class AmortizationPdfBuilder
    {
        private const int RowsFirstPage = 18;
        private const int RowsOtherPages = 24;

        public static byte[] Build(Loan loan, Client client)
        {
            var installments = loan.Installments.OrderBy(i => i.Numero).ToList();
            var pages = Paginate(installments);
            var objects = new List<byte[]>();
            var pageObjectIds = new List<int>();
            var contentObjectIds = new List<int>();

            AddObject(objects, "<< /Type /Catalog /Pages 2 0 R >>");
            AddObject(objects, string.Empty);
            AddObject(objects, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
            AddObject(objects, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

            for (var index = 0; index < pages.Count; index++)
            {
                var content = BuildPage(loan, client, pages[index], index, pages.Count);
                var contentId = objects.Count + 1;
                AddStream(objects, content);
                var pageId = objects.Count + 1;
                AddObject(objects,
                    $"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents {contentId} 0 R >>");
                contentObjectIds.Add(contentId);
                pageObjectIds.Add(pageId);
            }

            objects[1] = Latin1($"<< /Type /Pages /Count {pageObjectIds.Count} /Kids [{string.Join(" ", pageObjectIds.Select(id => $"{id} 0 R"))}] >>");
            return WritePdf(objects);
        }

        private static List<List<Installment>> Paginate(List<Installment> rows)
        {
            var pages = new List<List<Installment>>();
            var offset = 0;
            var pageSize = RowsFirstPage;
            while (offset < rows.Count)
            {
                pages.Add(rows.Skip(offset).Take(pageSize).ToList());
                offset += pageSize;
                pageSize = RowsOtherPages;
            }
            if (pages.Count == 0) pages.Add(new List<Installment>());
            return pages;
        }

        private static string BuildPage(
            Loan loan,
            Client client,
            IReadOnlyList<Installment> rows,
            int pageIndex,
            int pageCount)
        {
            var sb = new StringBuilder();
            Text(sb, 38, 570, 20, true, "PrestamoPlus");
            Text(sb, 38, 550, 12, true, "Tabla de amortizacion");
            TextRight(sb, 754, 570, 9, $"Pagina {pageIndex + 1} de {pageCount}");
            Line(sb, 38, 540, 754, 540, 0.2, 0.4, 0.85, 2);

            var tableTop = 515d;
            if (pageIndex == 0)
            {
                Text(sb, 38, 516, 9, true, "INFORMACION DEL CLIENTE");
                Text(sb, 38, 499, 9, false, $"Nombre: {client.Nombre}");
                Text(sb, 38, 484, 9, false, $"Cedula: {client.Cedula}");
                Text(sb, 260, 499, 9, false, $"Telefono: {client.Telefono}");
                Text(sb, 260, 484, 9, false, $"Correo: {client.Email}");

                Text(sb, 480, 516, 9, true, "CONDICIONES");
                Text(sb, 480, 499, 9, false, $"Monto: {Money(loan.MontoOriginal)}");
                Text(sb, 480, 484, 9, false, $"Tasa mensual: {loan.TasaInteresAnual / 12:N2}%");
                Text(sb, 620, 499, 9, false, $"Plazo: {loan.PlazoMeses} meses");
                Text(sb, 620, 484, 9, false, $"Cuota: {Money(loan.CuotaMensual)}");
                tableTop = 458;
            }

            Fill(sb, 38, tableTop - 17, 716, 18, 0.93, 0.96, 0.99);
            var headers = new[] { "#", "Fecha", "Capital", "Interes", "Cuota", "Saldo" };
            var positions = new[] { 45d, 82d, 240d, 365d, 485d, 625d };
            for (var i = 0; i < headers.Length; i++) Text(sb, positions[i], tableTop - 12, 8, true, headers[i]);

            var y = tableTop - 34;
            var balance = rows.Count > 0
                ? loan.MontoOriginal - loan.Installments
                    .Where(i => i.Numero < rows[0].Numero)
                    .Sum(i => i.Capital)
                : loan.MontoOriginal;
            foreach (var row in rows)
            {
                balance = Math.Max(0, balance - row.Capital);
                Text(sb, 45, y, 8, false, row.Numero.ToString(CultureInfo.InvariantCulture));
                Text(sb, 82, y, 8, false, row.FechaPago.ToString("dd/MM/yyyy"));
                TextRight(sb, 335, y, 8, Money(row.Capital));
                TextRight(sb, 455, y, 8, Money(row.Interes));
                TextRight(sb, 585, y, 8, Money(row.Cuota), true);
                TextRight(sb, 744, y, 8, Money(balance));
                Line(sb, 38, y - 6, 754, y - 6, 0.86, 0.9, 0.94, 0.5);
                y -= 18;
            }

            Text(sb, 38, 22, 7, false, $"Generado el {DateTime.Now:dd/MM/yyyy hh:mm tt}. Valores expresados en pesos dominicanos.");
            return sb.ToString();
        }

        private static void Text(StringBuilder sb, double x, double y, int size, bool bold, string value) =>
            sb.AppendLine($"0.07 0.16 0.25 rg BT /{(bold ? "F2" : "F1")} {size} Tf {x:0.##} {y:0.##} Td ({Escape(value)}) Tj ET");

        private static void TextRight(StringBuilder sb, double right, double y, int size, string value, bool bold = false)
        {
            var estimatedWidth = value.Length * size * 0.52;
            Text(sb, right - estimatedWidth, y, size, bold, value);
        }

        private static void Line(StringBuilder sb, double x1, double y1, double x2, double y2, double r, double g, double b, double width) =>
            sb.AppendLine($"{r} {g} {b} RG {width} w {x1} {y1} m {x2} {y2} l S");

        private static void Fill(StringBuilder sb, double x, double y, double width, double height, double r, double g, double b) =>
            sb.AppendLine($"{r} {g} {b} rg {x} {y} {width} {height} re f");

        private static string Escape(string value) => value
            .Replace("\\", "\\\\")
            .Replace("(", "\\(")
            .Replace(")", "\\)")
            .Replace("\r", " ")
            .Replace("\n", " ");

        private static string Money(decimal amount) => $"RD$ {amount:N2}";
        private static byte[] Latin1(string value) => Encoding.Latin1.GetBytes(value);

        private static void AddObject(List<byte[]> objects, string content) => objects.Add(Latin1(content));

        private static void AddStream(List<byte[]> objects, string content)
        {
            var bytes = Latin1(content);
            objects.Add(Combine(Latin1($"<< /Length {bytes.Length} >>\nstream\n"), bytes, Latin1("\nendstream")));
        }

        private static byte[] WritePdf(IReadOnlyList<byte[]> objects)
        {
            using var stream = new MemoryStream();
            Write(stream, Latin1("%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n"));
            var offsets = new List<long> { 0 };
            for (var i = 0; i < objects.Count; i++)
            {
                offsets.Add(stream.Position);
                Write(stream, Latin1($"{i + 1} 0 obj\n"));
                Write(stream, objects[i]);
                Write(stream, Latin1("\nendobj\n"));
            }
            var xref = stream.Position;
            Write(stream, Latin1($"xref\n0 {objects.Count + 1}\n0000000000 65535 f \n"));
            foreach (var offset in offsets.Skip(1))
                Write(stream, Latin1($"{offset:0000000000} 00000 n \n"));
            Write(stream, Latin1($"trailer\n<< /Size {objects.Count + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF"));
            return stream.ToArray();
        }

        private static byte[] Combine(params byte[][] arrays)
        {
            var result = new byte[arrays.Sum(a => a.Length)];
            var offset = 0;
            foreach (var array in arrays)
            {
                Buffer.BlockCopy(array, 0, result, offset, array.Length);
                offset += array.Length;
            }
            return result;
        }

        private static void Write(Stream stream, byte[] bytes) => stream.Write(bytes, 0, bytes.Length);
    }
}
