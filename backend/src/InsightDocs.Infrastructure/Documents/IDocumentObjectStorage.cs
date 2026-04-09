using InsightDocs.Application.Documents;

namespace InsightDocs.Infrastructure.Documents;

internal interface IDocumentObjectStorage
{
    Task<StoredDocumentObject> UploadPdfAsync(
        Guid documentId,
        int versionNumber,
        string slotName,
        UploadedDocumentFile file,
        CancellationToken cancellationToken);

    Task<byte[]> GetObjectAsync(string objectKey, CancellationToken cancellationToken);

    Task<StoredDocumentObject> UploadGeneratedPdfAsync(
        Guid documentId,
        int versionNumber,
        string slotName,
        byte[] content,
        CancellationToken cancellationToken);
}
