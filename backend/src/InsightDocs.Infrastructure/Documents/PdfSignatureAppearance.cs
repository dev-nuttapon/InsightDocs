namespace InsightDocs.Infrastructure.Documents;

internal sealed record PdfSignatureAppearance(
    string SignerDisplayName,
    string SignerUsername,
    DateTimeOffset SignedAt,
    string? Comment);
