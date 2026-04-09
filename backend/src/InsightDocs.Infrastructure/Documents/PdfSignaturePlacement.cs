namespace InsightDocs.Infrastructure.Documents;

internal sealed record PdfSignaturePlacement(
    int PageNumber,
    decimal PositionX,
    decimal PositionY,
    decimal Width,
    decimal Height);
