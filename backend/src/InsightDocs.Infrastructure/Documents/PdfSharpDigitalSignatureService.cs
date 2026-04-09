using System.Globalization;
using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;
using PdfSharpCore.Pdf.IO;

namespace InsightDocs.Infrastructure.Documents;

internal sealed class PdfSharpDigitalSignatureService : IPdfDigitalSignatureService
{
    public Task<byte[]> ApplySignatureAsync(
        byte[] pdfBytes,
        PdfSignaturePlacement placement,
        PdfSignatureAppearance appearance,
        CancellationToken cancellationToken)
    {
        using var input = new MemoryStream(pdfBytes, writable: false);
        using var document = PdfReader.Open(input, PdfDocumentOpenMode.Modify);

        if (placement.PageNumber < 1 || placement.PageNumber > document.PageCount)
        {
            throw new InvalidOperationException($"Signature page {placement.PageNumber} is outside the PDF page range.");
        }

        var page = document.Pages[placement.PageNumber - 1];
        using var graphics = XGraphics.FromPdfPage(page, XGraphicsPdfPageOptions.Append);

        var rectangle = new XRect(
            Convert.ToDouble(placement.PositionX, CultureInfo.InvariantCulture),
            Convert.ToDouble(placement.PositionY, CultureInfo.InvariantCulture),
            Convert.ToDouble(placement.Width, CultureInfo.InvariantCulture),
            Convert.ToDouble(placement.Height, CultureInfo.InvariantCulture));

        var backgroundBrush = new XSolidBrush(XColor.FromArgb(235, 244, 255));
        var borderPen = new XPen(XColor.FromArgb(44, 87, 166), 1.4);
        var titleFont = new XFont("Helvetica", 10, XFontStyle.Bold);
        var bodyFont = new XFont("Helvetica", 8, XFontStyle.Regular);
        var bodyBrush = new XSolidBrush(XColor.FromArgb(28, 39, 59));

        graphics.DrawRoundedRectangle(borderPen, backgroundBrush, rectangle, new XSize(8, 8));

        var lines = new List<string>
        {
            "Digitally signed",
            appearance.SignerDisplayName,
            appearance.SignedAt.ToString("yyyy-MM-dd HH:mm:ss 'UTC'", CultureInfo.InvariantCulture)
        };

        if (!string.IsNullOrWhiteSpace(appearance.Comment))
        {
            lines.Add(appearance.Comment.Trim());
        }

        var titleRect = new XRect(rectangle.X + 8, rectangle.Y + 8, rectangle.Width - 16, 16);
        graphics.DrawString(lines[0], titleFont, bodyBrush, titleRect, XStringFormats.TopLeft);

        var offsetY = rectangle.Y + 26;

        foreach (var line in lines.Skip(1))
        {
            var lineRect = new XRect(rectangle.X + 8, offsetY, rectangle.Width - 16, 12);
            graphics.DrawString(line, bodyFont, bodyBrush, lineRect, XStringFormats.TopLeft);
            offsetY += 11;
        }

        using var output = new MemoryStream();
        document.Save(output, false);
        return Task.FromResult(output.ToArray());
    }
}
