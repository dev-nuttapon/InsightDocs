using System.ComponentModel.DataAnnotations;

namespace InsightDocs.Application.Documents;

public sealed record UploadedDocumentFile(
    string FileName,
    string? ContentType,
    byte[] Content);

public sealed record CreateDocumentCommand
{
    [Required]
    [MinLength(3)]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; init; }

    [MaxLength(100)]
    public string? Category { get; init; }

    public Guid? OwnerUserId { get; init; }

    public Guid? ControllerUserId { get; init; }
}

public sealed record UpdateDocumentCommand
{
    [Required]
    [MinLength(3)]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; init; }

    [MaxLength(100)]
    public string? Category { get; init; }

    public Guid? OwnerUserId { get; init; }

    public Guid? ControllerUserId { get; init; }
}

public sealed record CreateDocumentVersionCommand(
    string ChangeSummary,
    UploadedDocumentFile OriginalFile,
    UploadedDocumentFile? SignedFile);

public sealed record DocumentApprovalCommand
{
    [MaxLength(1000)]
    public string? Comment { get; init; }
}

public sealed record AssignDocumentSignatureCommand
{
    [Required]
    public Guid SignerUserId { get; init; }

    [Range(1, int.MaxValue)]
    public int SigningOrder { get; init; }

    [Range(1, int.MaxValue)]
    public int PageNumber { get; init; }

    [Range(typeof(decimal), "0", "100000")]
    public decimal PositionX { get; init; }

    [Range(typeof(decimal), "0", "100000")]
    public decimal PositionY { get; init; }

    [Range(typeof(decimal), "1", "100000")]
    public decimal Width { get; init; }

    [Range(typeof(decimal), "1", "100000")]
    public decimal Height { get; init; }

    [MaxLength(1000)]
    public string? Comment { get; init; }
}

public sealed record CompleteDocumentSignatureCommand
{
    [MaxLength(1000)]
    public string? Comment { get; init; }
}
