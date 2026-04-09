using InsightDocs.Application.Common;
using InsightDocs.Application.Documents;
using InsightDocs.Infrastructure.Configuration;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace InsightDocs.Infrastructure.Documents;

internal sealed class MinioDocumentObjectStorage(
    IMinioClient minioClient,
    IOptions<MinioOptions> minioOptions) : IDocumentObjectStorage
{
    private readonly MinioOptions _options = minioOptions.Value;

    public async Task<StoredDocumentObject> UploadPdfAsync(
        Guid documentId,
        int versionNumber,
        string slotName,
        UploadedDocumentFile file,
        CancellationToken cancellationToken)
    {
        ValidatePdf(file);
        await EnsureBucketExistsAsync(cancellationToken);

        var objectKey = $"documents/{documentId:D}/versions/v{versionNumber}/{slotName}/{Guid.NewGuid():N}.pdf";
        await using var stream = new MemoryStream(file.Content, writable: false);

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(_options.BucketName)
            .WithObject(objectKey)
            .WithStreamData(stream)
            .WithObjectSize(stream.Length)
            .WithContentType(string.IsNullOrWhiteSpace(file.ContentType) ? "application/pdf" : file.ContentType);

        await minioClient.PutObjectAsync(putObjectArgs, cancellationToken);

        return new StoredDocumentObject(objectKey, file.Content, string.IsNullOrWhiteSpace(file.ContentType) ? "application/pdf" : file.ContentType);
    }

    public async Task<byte[]> GetObjectAsync(string objectKey, CancellationToken cancellationToken)
    {
        await EnsureBucketExistsAsync(cancellationToken);
        using var output = new MemoryStream();

        var getArgs = new GetObjectArgs()
            .WithBucket(_options.BucketName)
            .WithObject(objectKey)
            .WithCallbackStream(stream => stream.CopyTo(output));

        await minioClient.GetObjectAsync(getArgs, cancellationToken);
        return output.ToArray();
    }

    public async Task<StoredDocumentObject> UploadGeneratedPdfAsync(
        Guid documentId,
        int versionNumber,
        string slotName,
        byte[] content,
        CancellationToken cancellationToken)
    {
        ValidatePdf(new UploadedDocumentFile($"{slotName}.pdf", "application/pdf", content));
        await EnsureBucketExistsAsync(cancellationToken);

        var objectKey = $"documents/{documentId:D}/versions/v{versionNumber}/{slotName}/{Guid.NewGuid():N}.pdf";
        await using var stream = new MemoryStream(content, writable: false);

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(_options.BucketName)
            .WithObject(objectKey)
            .WithStreamData(stream)
            .WithObjectSize(stream.Length)
            .WithContentType("application/pdf");

        await minioClient.PutObjectAsync(putObjectArgs, cancellationToken);

        return new StoredDocumentObject(objectKey, content, "application/pdf");
    }

    private async Task EnsureBucketExistsAsync(CancellationToken cancellationToken)
    {
        var bucketExists = await minioClient.BucketExistsAsync(new BucketExistsArgs()
            .WithBucket(_options.BucketName), cancellationToken);

        if (!bucketExists)
        {
            await minioClient.MakeBucketAsync(new MakeBucketArgs()
                .WithBucket(_options.BucketName), cancellationToken);
        }
    }

    private void ValidatePdf(UploadedDocumentFile file)
    {
        if (file.Content.Length == 0)
        {
            throw new ValidationException("Uploaded PDF is empty.");
        }

        if (file.Content.Length > _options.MaxFileSizeBytes)
        {
            throw new ValidationException($"Uploaded PDF exceeds the configured limit of {_options.MaxFileSizeBytes} bytes.");
        }

        if (!file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase))
        {
            throw new ValidationException("Only PDF files are supported.");
        }

        if (file.Content.Length < 4 ||
            file.Content[0] != '%' ||
            file.Content[1] != 'P' ||
            file.Content[2] != 'D' ||
            file.Content[3] != 'F')
        {
            throw new ValidationException("Uploaded file is not a valid PDF.");
        }
    }
}
