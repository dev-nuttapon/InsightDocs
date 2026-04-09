namespace InsightDocs.Infrastructure.Documents;

internal sealed record StoredDocumentObject(string ObjectKey, byte[] Content, string ContentType);
