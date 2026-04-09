namespace InsightDocs.Infrastructure.Documents;

internal interface IPdfDigitalSignatureService
{
    Task<byte[]> ApplySignatureAsync(
        byte[] pdfBytes,
        PdfSignaturePlacement placement,
        PdfSignatureAppearance appearance,
        CancellationToken cancellationToken);
}
