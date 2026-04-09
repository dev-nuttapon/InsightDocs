using System.ComponentModel.DataAnnotations;
using InsightDocs.Api.Models;
using InsightDocs.Application.Documents;
using InsightDocs.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Controllers;

[ApiController]
[Route("api/documents")]
public sealed class DocumentsController(
    IDocumentService documentService,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<DocumentSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<DocumentSummaryDto>>>> GetDocuments(CancellationToken cancellationToken)
    {
        var documents = await documentService.GetDocumentsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<DocumentSummaryDto>>.Ok(documents, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [ProducesResponseType(typeof(ApiResponse<DocumentDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<DocumentDetailDto>>> GetDocument(Guid id, CancellationToken cancellationToken)
    {
        var document = await documentService.GetDocumentAsync(id, cancellationToken);
        return Ok(ApiResponse<DocumentDetailDto>.Ok(document, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.DocumentManagement)]
    [ProducesResponseType(typeof(ApiResponse<DocumentDetailDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<DocumentDetailDto>>> CreateDocument([FromBody] CreateDocumentCommand command, CancellationToken cancellationToken)
    {
        var createdBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var document = await documentService.CreateDocumentAsync(command, createdBy, cancellationToken);
        return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, ApiResponse<DocumentDetailDto>.Ok(document, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthorizationPolicies.DocumentManagement)]
    [ProducesResponseType(typeof(ApiResponse<DocumentDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DocumentDetailDto>>> UpdateDocument(Guid id, [FromBody] UpdateDocumentCommand command, CancellationToken cancellationToken)
    {
        var updatedBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var document = await documentService.UpdateDocumentAsync(id, command, updatedBy, cancellationToken);
        return Ok(ApiResponse<DocumentDetailDto>.Ok(document, HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/submit-review")]
    [Authorize(Policy = AuthorizationPolicies.DocumentReviewSubmission)]
    [ProducesResponseType(typeof(ApiResponse<DocumentDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DocumentDetailDto>>> SubmitReview(
        Guid id,
        [FromBody] DocumentApprovalCommand command,
        CancellationToken cancellationToken)
    {
        var submittedBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var document = await documentService.SubmitForReviewAsync(id, submittedBy, command.Comment, cancellationToken);
        return Ok(ApiResponse<DocumentDetailDto>.Ok(document, HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Policy = AuthorizationPolicies.DocumentReviewDecision)]
    [ProducesResponseType(typeof(ApiResponse<DocumentDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DocumentDetailDto>>> Approve(
        Guid id,
        [FromBody] DocumentApprovalCommand command,
        CancellationToken cancellationToken)
    {
        var approvedBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var document = await documentService.ApproveAsync(id, approvedBy, command.Comment, cancellationToken);
        return Ok(ApiResponse<DocumentDetailDto>.Ok(document, HttpContext.TraceIdentifier));
    }

    [HttpPost("{id:guid}/reject")]
    [Authorize(Policy = AuthorizationPolicies.DocumentReviewDecision)]
    [ProducesResponseType(typeof(ApiResponse<DocumentDetailDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DocumentDetailDto>>> Reject(
        Guid id,
        [FromBody] DocumentApprovalCommand command,
        CancellationToken cancellationToken)
    {
        var rejectedBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var document = await documentService.RejectAsync(id, rejectedBy, command.Comment, cancellationToken);
        return Ok(ApiResponse<DocumentDetailDto>.Ok(document, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}/approval-history")]
    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<DocumentApprovalHistoryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<DocumentApprovalHistoryDto>>>> GetApprovalHistory(Guid id, CancellationToken cancellationToken)
    {
        var history = await documentService.GetApprovalHistoryAsync(id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<DocumentApprovalHistoryDto>>.Ok(history, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/documents/{id:guid}/versions")]
public sealed class DocumentVersionsController(
    IDocumentService documentService,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<DocumentVersionDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<DocumentVersionDto>>>> GetVersions(Guid id, CancellationToken cancellationToken)
    {
        var versions = await documentService.GetVersionsAsync(id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<DocumentVersionDto>>.Ok(versions, HttpContext.TraceIdentifier));
    }

    [HttpGet("{versionId:guid}")]
    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [ProducesResponseType(typeof(ApiResponse<DocumentVersionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<DocumentVersionDto>>> GetVersion(Guid id, Guid versionId, CancellationToken cancellationToken)
    {
        var version = await documentService.GetVersionAsync(id, versionId, cancellationToken);
        return Ok(ApiResponse<DocumentVersionDto>.Ok(version, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    [Authorize(Policy = AuthorizationPolicies.DocumentManagement)]
    [RequestSizeLimit(26_214_400)]
    [ProducesResponseType(typeof(ApiResponse<DocumentVersionDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<DocumentVersionDto>>> CreateVersion(
        Guid id,
        [FromForm] CreateDocumentVersionRequest request,
        CancellationToken cancellationToken)
    {
        var createdBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var command = new CreateDocumentVersionCommand(
            request.ChangeSummary,
            await ReadFileAsync(request.OriginalPdf, cancellationToken),
            request.SignedPdf is null ? null : await ReadFileAsync(request.SignedPdf, cancellationToken));

        var version = await documentService.CreateVersionAsync(id, command, createdBy, cancellationToken);
        return CreatedAtAction(nameof(GetVersion), new { id, versionId = version.Id }, ApiResponse<DocumentVersionDto>.Ok(version, HttpContext.TraceIdentifier));
    }

    [HttpPost("{versionId:guid}/restore")]
    [Authorize(Policy = AuthorizationPolicies.DocumentManagement)]
    [ProducesResponseType(typeof(ApiResponse<DocumentVersionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DocumentVersionDto>>> RestoreVersion(Guid id, Guid versionId, CancellationToken cancellationToken)
    {
        var restoredBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var version = await documentService.RestoreVersionAsync(id, versionId, restoredBy, cancellationToken);
        return Ok(ApiResponse<DocumentVersionDto>.Ok(version, HttpContext.TraceIdentifier));
    }

    private static async Task<UploadedDocumentFile> ReadFileAsync(IFormFile file, CancellationToken cancellationToken)
    {
        await using var stream = file.OpenReadStream();
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, cancellationToken);

        return new UploadedDocumentFile(
            file.FileName,
            file.ContentType,
            memoryStream.ToArray());
    }

    public sealed record CreateDocumentVersionRequest
    {
        [Required]
        [MaxLength(1000)]
        public string ChangeSummary { get; init; } = string.Empty;

        [Required]
        public IFormFile OriginalPdf { get; init; } = null!;

        public IFormFile? SignedPdf { get; init; }
    }
}

[ApiController]
[Route("api/documents/{id:guid}/signatures")]
public sealed class DocumentSignaturesController(
    IDocumentService documentService,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpPost("assign")]
    [Authorize(Policy = AuthorizationPolicies.DocumentSignatureManagement)]
    [ProducesResponseType(typeof(ApiResponse<DocumentSignatureRequestDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<ApiResponse<DocumentSignatureRequestDto>>> Assign(
        Guid id,
        [FromBody] AssignDocumentSignatureCommand command,
        CancellationToken cancellationToken)
    {
        var assignedBy = currentUser.Username ?? currentUser.Subject ?? "system";
        var signature = await documentService.AssignSignatureAsync(id, command, assignedBy, cancellationToken);
        return CreatedAtAction(nameof(GetSignatures), new { id }, ApiResponse<DocumentSignatureRequestDto>.Ok(signature, HttpContext.TraceIdentifier));
    }

    [HttpGet]
    [Authorize(Policy = AuthorizationPolicies.AuthenticatedUser)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<DocumentSignatureRequestDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<DocumentSignatureRequestDto>>>> GetSignatures(Guid id, CancellationToken cancellationToken)
    {
        var signatures = await documentService.GetSignaturesAsync(id, cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<DocumentSignatureRequestDto>>.Ok(signatures, HttpContext.TraceIdentifier));
    }

    [HttpPost("{signatureRequestId:guid}/sign")]
    [Authorize(Policy = AuthorizationPolicies.DocumentSignatureExecution)]
    [ProducesResponseType(typeof(ApiResponse<DocumentSignatureRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DocumentSignatureRequestDto>>> Sign(
        Guid id,
        Guid signatureRequestId,
        [FromBody] CompleteDocumentSignatureCommand command,
        CancellationToken cancellationToken)
    {
        var actor = currentUser.Subject ?? currentUser.Username ?? "system";
        var signature = await documentService.SignAsync(id, signatureRequestId, actor, command, cancellationToken);
        return Ok(ApiResponse<DocumentSignatureRequestDto>.Ok(signature, HttpContext.TraceIdentifier));
    }

    [HttpPost("{signatureRequestId:guid}/reject")]
    [Authorize(Policy = AuthorizationPolicies.DocumentSignatureExecution)]
    [ProducesResponseType(typeof(ApiResponse<DocumentSignatureRequestDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<DocumentSignatureRequestDto>>> Reject(
        Guid id,
        Guid signatureRequestId,
        [FromBody] CompleteDocumentSignatureCommand command,
        CancellationToken cancellationToken)
    {
        var actor = currentUser.Subject ?? currentUser.Username ?? "system";
        var signature = await documentService.RejectSignatureAsync(id, signatureRequestId, actor, command, cancellationToken);
        return Ok(ApiResponse<DocumentSignatureRequestDto>.Ok(signature, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/approvals")]
public sealed class ApprovalsController(IDocumentService documentService) : ControllerBase
{
    [HttpGet("pending")]
    [Authorize(Policy = AuthorizationPolicies.DocumentReviewDecision)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<PendingApprovalDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<PendingApprovalDto>>>> GetPendingApprovals(CancellationToken cancellationToken)
    {
        var approvals = await documentService.GetPendingApprovalsAsync(cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<PendingApprovalDto>>.Ok(approvals, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/signatures")]
public sealed class SignaturesController(
    IDocumentService documentService,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("pending")]
    [Authorize(Policy = AuthorizationPolicies.DocumentSignatureExecution)]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyCollection<PendingSignatureDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<IReadOnlyCollection<PendingSignatureDto>>>> GetPending(CancellationToken cancellationToken)
    {
        var actor = currentUser.Subject ?? currentUser.Username ?? "system";
        var signatures = await documentService.GetPendingSignaturesAsync(actor, cancellationToken);
        return Ok(ApiResponse<IReadOnlyCollection<PendingSignatureDto>>.Ok(signatures, HttpContext.TraceIdentifier));
    }
}
