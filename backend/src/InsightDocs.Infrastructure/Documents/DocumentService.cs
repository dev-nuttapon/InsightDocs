using System.Security.Cryptography;
using System.Linq.Expressions;
using InsightDocs.Application.Audit;
using InsightDocs.Application.Common;
using InsightDocs.Application.Documents;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Users;
using InsightDocs.Domain.Documents;
using InsightDocs.Domain.Users;
using InsightDocs.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace InsightDocs.Infrastructure.Documents;

internal sealed class DocumentService(
    InsightDocsDbContext dbContext,
    IDocumentObjectStorage objectStorage,
    IPdfDigitalSignatureService pdfDigitalSignatureService,
    IAuditLogService auditLogService,
    IKeycloakAdminService keycloakAdminService) : IDocumentService
{
    public async Task<IReadOnlyCollection<DocumentSummaryDto>> GetDocumentsAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Documents
            .AsNoTracking()
            .Select(document => new DocumentSummaryDto(
                document.Id,
                document.Title,
                document.Description,
                document.Category,
                document.OwnerUserId,
                document.OwnerUser != null ? document.OwnerUser.KeycloakUserId : null,
                document.ControllerUserId,
                document.ControllerUser != null ? document.ControllerUser.KeycloakUserId : null,
                document.Status,
                document.Versions.Count,
                document.Versions.Where(version => version.IsCurrent).Select(version => (int?)version.VersionNumber).FirstOrDefault(),
                document.CreatedAt,
                document.CreatedBy))
            .OrderBy(document => document.Title)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<DocumentDetailDto> GetDocumentAsync(Guid documentId, CancellationToken cancellationToken)
    {
        var document = await dbContext.Documents
            .AsNoTracking()
            .Where(entity => entity.Id == documentId)
            .Select(entity => new DocumentDetailDto(
                entity.Id,
                entity.Title,
                entity.Description,
                entity.Category,
                entity.OwnerUserId,
                entity.OwnerUser != null ? entity.OwnerUser.KeycloakUserId : null,
                entity.ControllerUserId,
                entity.ControllerUser != null ? entity.ControllerUser.KeycloakUserId : null,
                entity.Status,
                entity.Versions.Count,
                entity.Versions.Where(version => version.IsCurrent).Select(version => (int?)version.VersionNumber).FirstOrDefault(),
                entity.CreatedAt,
                entity.CreatedBy,
                entity.UpdatedAt,
                entity.UpdatedBy))
            .FirstOrDefaultAsync(cancellationToken);

        return document ?? throw new NotFoundException($"Document '{documentId}' was not found.");
    }

    public async Task<DocumentDetailDto> CreateDocumentAsync(CreateDocumentCommand command, string createdBy, CancellationToken cancellationToken)
    {
        var title = command.Title.Trim();
        await EnsureUniqueTitleAsync(title, null, cancellationToken);

        var document = Document.Create(title, command.Description, command.Category, command.OwnerUserId, command.ControllerUserId, createdBy);
        dbContext.Documents.Add(document);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.created",
                "Document",
                document.Id,
                RelatedDocumentId: document.Id,
                ActorIdentifier: createdBy,
                Metadata: new
                {
                    document.Title,
                    document.Description,
                    document.Category,
                    document.OwnerUserId,
                    document.ControllerUserId,
                    Status = document.Status.ToString()
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetDocumentAsync(document.Id, cancellationToken);
    }

    public async Task<DocumentDetailDto> UpdateDocumentAsync(Guid documentId, UpdateDocumentCommand command, string updatedBy, CancellationToken cancellationToken)
    {
        var document = await dbContext.Documents.FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");
        EnsureCanModifyDocumentContent(document);

        var title = command.Title.Trim();
        await EnsureUniqueTitleAsync(title, documentId, cancellationToken);

        TryDocumentMutation(() => document.UpdateDetails(title, command.Description, command.Category, command.OwnerUserId, command.ControllerUserId, updatedBy));
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.metadata.updated",
                "Document",
                document.Id,
                RelatedDocumentId: document.Id,
                ActorIdentifier: updatedBy,
                Metadata: new
                {
                    document.Title,
                    document.Description,
                    document.Category,
                    document.OwnerUserId,
                    document.ControllerUserId,
                    Status = document.Status.ToString()
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetDocumentAsync(documentId, cancellationToken);
    }

    public async Task<IReadOnlyCollection<DocumentVersionDto>> GetVersionsAsync(Guid documentId, CancellationToken cancellationToken)
    {
        await EnsureDocumentExistsAsync(documentId, cancellationToken);

        return await dbContext.DocumentVersions
            .AsNoTracking()
            .Where(version => version.DocumentId == documentId)
            .OrderByDescending(version => version.VersionNumber)
            .Select(MapVersion())
            .ToArrayAsync(cancellationToken);
    }

    public async Task<DocumentVersionDto> GetVersionAsync(Guid documentId, Guid versionId, CancellationToken cancellationToken)
    {
        var version = await dbContext.DocumentVersions
            .AsNoTracking()
            .Where(entity => entity.DocumentId == documentId && entity.Id == versionId)
            .Select(MapVersion())
            .FirstOrDefaultAsync(cancellationToken);

        return version ?? throw new NotFoundException($"Version '{versionId}' was not found for document '{documentId}'.");
    }

    public async Task<DocumentVersionDto> CreateVersionAsync(Guid documentId, CreateDocumentVersionCommand command, string createdBy, CancellationToken cancellationToken)
    {
        ValidateChangeSummary(command.ChangeSummary);
        var document = await dbContext.Documents.FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");
        EnsureCanModifyDocumentContent(document);

        if (command.SignedFile is not null && document.Status != DocumentStatus.Approved)
        {
            throw new ConflictException("Signed PDFs cannot be uploaded until the document has completed approval.");
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var nextVersionNumber = await GetNextVersionNumberAsync(documentId, cancellationToken);
        var currentVersions = await dbContext.DocumentVersions
            .Where(version => version.DocumentId == documentId && version.IsCurrent)
            .ToListAsync(cancellationToken);

        var currentVersionIds = currentVersions.Select(version => version.Id).ToArray();
        var pendingSignatureRequests = await dbContext.DocumentSignatureRequests
            .Where(request =>
                currentVersionIds.Contains(request.DocumentVersionId) &&
                request.Status == DocumentSignatureStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var version in currentVersions)
        {
            version.MarkAsHistorical();
        }

        foreach (var request in pendingSignatureRequests)
        {
            request.Cancel(createdBy, "Cancelled because a newer document version was uploaded.");
        }

        var originalObject = await objectStorage.UploadPdfAsync(documentId, nextVersionNumber, "original", command.OriginalFile, cancellationToken);
        StoredDocumentObject? signedObject = null;

        if (command.SignedFile is not null)
        {
            signedObject = await objectStorage.UploadPdfAsync(documentId, nextVersionNumber, "signed", command.SignedFile, cancellationToken);
        }

        var versionEntity = DocumentVersion.Create(
            documentId,
            nextVersionNumber,
            originalObject.ObjectKey,
            signedObject?.ObjectKey,
            ComputeChecksum(command.OriginalFile.Content),
            command.ChangeSummary,
            createdBy,
            isCurrent: true);

        document.MarkContentUpdated(createdBy);
        dbContext.DocumentVersions.Add(versionEntity);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.uploaded",
                "Document",
                document.Id,
                RelatedDocumentId: document.Id,
                RelatedVersionId: versionEntity.Id,
                ActorIdentifier: createdBy,
                Metadata: new
                {
                    versionEntity.VersionNumber,
                    versionEntity.ChangeSummary,
                    versionEntity.OriginalObjectKey,
                    versionEntity.SignedObjectKey
                }),
            cancellationToken);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.version.created",
                "DocumentVersion",
                versionEntity.Id,
                RelatedDocumentId: document.Id,
                RelatedVersionId: versionEntity.Id,
                ActorIdentifier: createdBy,
                Metadata: new
                {
                    versionEntity.VersionNumber,
                    versionEntity.ChangeSummary,
                    versionEntity.Checksum
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return await GetVersionAsync(documentId, versionEntity.Id, cancellationToken);
    }

    public async Task<DocumentVersionDto> RestoreVersionAsync(Guid documentId, Guid versionId, string restoredBy, CancellationToken cancellationToken)
    {
        var document = await dbContext.Documents.FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");
        EnsureCanModifyDocumentContent(document);

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);

        var sourceVersion = await dbContext.DocumentVersions
            .FirstOrDefaultAsync(version => version.DocumentId == documentId && version.Id == versionId, cancellationToken)
            ?? throw new NotFoundException($"Version '{versionId}' was not found for document '{documentId}'.");

        if (sourceVersion.IsCurrent)
        {
            throw new ConflictException("The selected version is already the current version.");
        }

        var currentVersions = await dbContext.DocumentVersions
            .Where(version => version.DocumentId == documentId && version.IsCurrent)
            .ToListAsync(cancellationToken);

        var currentVersionIds = currentVersions.Select(version => version.Id).ToArray();
        var pendingSignatureRequests = await dbContext.DocumentSignatureRequests
            .Where(request =>
                currentVersionIds.Contains(request.DocumentVersionId) &&
                request.Status == DocumentSignatureStatus.Pending)
            .ToListAsync(cancellationToken);

        foreach (var version in currentVersions)
        {
            version.MarkAsHistorical();
        }

        foreach (var request in pendingSignatureRequests)
        {
            request.Cancel(restoredBy, "Cancelled because the current version was replaced by a restored version.");
        }

        var nextVersionNumber = await GetNextVersionNumberAsync(documentId, cancellationToken);
        var restoredVersion = DocumentVersion.Create(
            documentId,
            nextVersionNumber,
            sourceVersion.OriginalObjectKey,
            sourceVersion.SignedObjectKey,
            sourceVersion.Checksum,
            $"Restored from version {sourceVersion.VersionNumber}.",
            restoredBy,
            isCurrent: true);

        document.MarkContentUpdated(restoredBy);
        dbContext.DocumentVersions.Add(restoredVersion);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.version.restored",
                "DocumentVersion",
                restoredVersion.Id,
                RelatedDocumentId: document.Id,
                RelatedVersionId: restoredVersion.Id,
                ActorIdentifier: restoredBy,
                Metadata: new
                {
                    restoredVersion.VersionNumber,
                    SourceVersionId = sourceVersion.Id,
                    SourceVersionNumber = sourceVersion.VersionNumber
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return await GetVersionAsync(documentId, restoredVersion.Id, cancellationToken);
    }

    public async Task<DocumentDetailDto> SubmitForReviewAsync(Guid documentId, string submittedBy, string? comment, CancellationToken cancellationToken)
    {
        var document = await dbContext.Documents
            .Include(entity => entity.Versions)
            .Include(entity => entity.Approvals)
            .FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");

        if (!document.Versions.Any(version => version.IsCurrent))
        {
            throw new ConflictException("A document must have a current version before review can be submitted.");
        }

        TryDocumentMutation(() => document.SubmitForReview(submittedBy, comment));
        var latestApproval = document.Approvals.OrderByDescending(entity => entity.PerformedAt).First();
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.approval.submitted",
                "DocumentApproval",
                latestApproval.Id,
                RelatedDocumentId: document.Id,
                ActorIdentifier: submittedBy,
                Metadata: new
                {
                    FromStatus = latestApproval.FromStatus.ToString(),
                    ToStatus = latestApproval.ToStatus.ToString(),
                    Comment = comment
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetDocumentAsync(documentId, cancellationToken);
    }

    public async Task<DocumentDetailDto> ApproveAsync(Guid documentId, string approvedBy, string? comment, CancellationToken cancellationToken)
    {
        var document = await dbContext.Documents
            .Include(entity => entity.Approvals)
            .FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");

        TryDocumentMutation(() => document.Approve(approvedBy, comment));
        var latestApproval = document.Approvals.OrderByDescending(entity => entity.PerformedAt).First();
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.approval.approved",
                "DocumentApproval",
                latestApproval.Id,
                RelatedDocumentId: document.Id,
                ActorIdentifier: approvedBy,
                Metadata: new
                {
                    FromStatus = latestApproval.FromStatus.ToString(),
                    ToStatus = latestApproval.ToStatus.ToString(),
                    Comment = comment
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetDocumentAsync(documentId, cancellationToken);
    }

    public async Task<DocumentDetailDto> RejectAsync(Guid documentId, string rejectedBy, string? comment, CancellationToken cancellationToken)
    {
        var document = await dbContext.Documents
            .Include(entity => entity.Approvals)
            .FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");

        TryDocumentMutation(() => document.Reject(rejectedBy, comment));
        var latestApproval = document.Approvals.OrderByDescending(entity => entity.PerformedAt).First();
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.approval.rejected",
                "DocumentApproval",
                latestApproval.Id,
                RelatedDocumentId: document.Id,
                ActorIdentifier: rejectedBy,
                Metadata: new
                {
                    FromStatus = latestApproval.FromStatus.ToString(),
                    ToStatus = latestApproval.ToStatus.ToString(),
                    Comment = comment
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetDocumentAsync(documentId, cancellationToken);
    }

    public async Task<DocumentDetailDto> ArchiveAsync(Guid documentId, string archivedBy, CancellationToken cancellationToken)
    {
        var document = await dbContext.Documents
            .FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");

        TryDocumentMutation(() => document.Archive(archivedBy));
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.archived",
                "Document",
                document.Id,
                RelatedDocumentId: document.Id,
                ActorIdentifier: archivedBy,
                Metadata: new
                {
                    document.Title,
                    Status = document.Status.ToString()
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetDocumentAsync(documentId, cancellationToken);
    }

    public async Task<IReadOnlyCollection<PendingApprovalDto>> GetPendingApprovalsAsync(CancellationToken cancellationToken)
    {
        return await dbContext.Documents
            .AsNoTracking()
            .Where(document => document.Status == DocumentStatus.InReview)
            .Select(document => new PendingApprovalDto(
                document.Id,
                document.Title,
                document.Status,
                document.Versions.Where(version => version.IsCurrent).Select(version => (int?)version.VersionNumber).FirstOrDefault(),
                document.Approvals
                    .Where(approval => approval.Action == DocumentApprovalAction.Submitted)
                    .OrderByDescending(approval => approval.PerformedAt)
                    .Select(approval => approval.PerformedBy)
                    .FirstOrDefault() ?? document.CreatedBy,
                document.Approvals
                    .Where(approval => approval.Action == DocumentApprovalAction.Submitted)
                    .OrderByDescending(approval => approval.PerformedAt)
                    .Select(approval => (DateTimeOffset?)approval.PerformedAt)
                    .FirstOrDefault() ?? document.CreatedAt,
                document.Approvals
                    .SelectMany(approval => approval.Comments)
                    .OrderByDescending(comment => comment.CreatedAt)
                    .Select(comment => comment.CommentText)
                    .FirstOrDefault()))
            .OrderBy(item => item.SubmittedAt)
            .ToArrayAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<DocumentApprovalHistoryDto>> GetApprovalHistoryAsync(Guid documentId, CancellationToken cancellationToken)
    {
        await EnsureDocumentExistsAsync(documentId, cancellationToken);

        return await dbContext.DocumentApprovals
            .AsNoTracking()
            .Where(approval => approval.DocumentId == documentId)
            .OrderByDescending(approval => approval.PerformedAt)
            .Select(approval => new DocumentApprovalHistoryDto(
                approval.Id,
                approval.DocumentId,
                approval.Action,
                approval.FromStatus,
                approval.ToStatus,
                approval.PerformedBy,
                approval.PerformedAt,
                approval.Comments
                    .OrderBy(comment => comment.CreatedAt)
                    .Select(comment => new ApprovalCommentDto(
                        comment.Id,
                        comment.CommentText,
                        comment.CreatedBy,
                        comment.CreatedAt))
                    .ToArray()))
            .ToArrayAsync(cancellationToken);
    }

    public async Task<DocumentSignatureRequestDto> AssignSignatureAsync(Guid documentId, AssignDocumentSignatureCommand command, string assignedBy, CancellationToken cancellationToken)
    {
        var document = await dbContext.Documents
            .Include(entity => entity.Versions)
            .FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");

        if (document.Status != DocumentStatus.Approved)
        {
            throw new ConflictException("Signers can only be assigned after the document has been approved.");
        }

        var currentVersion = document.Versions.FirstOrDefault(version => version.IsCurrent)
            ?? throw new ConflictException("The document must have a current version before signatures can be assigned.");

        var signer = await dbContext.Users
            .FirstOrDefaultAsync(user => user.Id == command.SignerUserId, cancellationToken)
            ?? throw new NotFoundException($"Signer '{command.SignerUserId}' was not found.");

        if (signer.Status != UserStatus.Active)
        {
            throw new ConflictException("Only active users can be assigned as signers.");
        }

        var signerIdentity = await keycloakAdminService.GetUserIdentityAsync(signer.KeycloakUserId, cancellationToken);
        var hasSignerRole = HasRole(signerIdentity?.Roles, BusinessRoles.Signer);

        if (!hasSignerRole)
        {
            throw new ConflictException("The selected user does not have the Signer role.");
        }

        var duplicateOrder = await dbContext.DocumentSignatureRequests.AnyAsync(
            request => request.DocumentVersionId == currentVersion.Id && request.SigningOrder == command.SigningOrder,
            cancellationToken);

        if (duplicateOrder)
        {
            throw new ConflictException($"Signing order {command.SigningOrder} is already assigned on the current version.");
        }

        var request = DocumentSignatureRequest.Create(
            documentId,
            currentVersion.Id,
            signer.Id,
            command.SigningOrder,
            command.PageNumber,
            command.PositionX,
            command.PositionY,
            command.Width,
            command.Height,
            assignedBy,
            command.Comment);

        dbContext.DocumentSignatureRequests.Add(request);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.signer.assigned",
                "DocumentSignatureRequest",
                request.Id,
                RelatedDocumentId: request.DocumentId,
                RelatedVersionId: request.DocumentVersionId,
                ActorIdentifier: assignedBy,
                Metadata: new
                {
                    request.SignerUserId,
                    request.SigningOrder,
                    request.PageNumber,
                    request.PositionX,
                    request.PositionY,
                    request.Width,
                    request.Height,
                    request.Comment
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetSignatureAsync(documentId, request.Id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<DocumentSignatureRequestDto>> GetSignaturesAsync(Guid documentId, CancellationToken cancellationToken)
    {
        await EnsureDocumentExistsAsync(documentId, cancellationToken);

        return await dbContext.DocumentSignatureRequests
            .AsNoTracking()
            .Where(request => request.DocumentId == documentId)
            .OrderBy(request => request.SigningOrder)
            .ThenBy(request => request.Id)
            .Select(MapSignatureRequest())
            .ToArrayAsync(cancellationToken);
    }

    public async Task<DocumentSignatureRequestDto> SignAsync(
        Guid documentId,
        Guid signatureRequestId,
        string actorIdentifier,
        CompleteDocumentSignatureCommand command,
        CancellationToken cancellationToken)
    {
        var request = await dbContext.DocumentSignatureRequests
            .Include(entity => entity.DocumentVersion)
            .Include(entity => entity.Actions)
            .Include(entity => entity.SignerUser)
            .FirstOrDefaultAsync(entity => entity.DocumentId == documentId && entity.Id == signatureRequestId, cancellationToken)
            ?? throw new NotFoundException($"Signature request '{signatureRequestId}' was not found for document '{documentId}'.");

        var document = await dbContext.Documents
            .FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");

        var actor = await ResolveUserAsync(actorIdentifier, cancellationToken);
        var actorIdentity = await keycloakAdminService.GetUserIdentityAsync(actor.KeycloakUserId, cancellationToken);

        if (actor.Id != request.SignerUserId && !await HasAdministrativeRoleAsync(actor, cancellationToken))
        {
            throw new ConflictException("Only the assigned signer can sign this document.");
        }

        EnsureSignatureWorkflow(document, request);
        await EnsureSigningOrderSatisfiedAsync(request, cancellationToken);

        var sourceObjectKey = await ResolveSignatureSourceObjectKeyAsync(request, cancellationToken);
        var sourcePdf = await objectStorage.GetObjectAsync(sourceObjectKey, cancellationToken);
        var signedAt = DateTimeOffset.UtcNow;

        var signedPdf = await pdfDigitalSignatureService.ApplySignatureAsync(
            sourcePdf,
            new PdfSignaturePlacement(request.PageNumber, request.PositionX, request.PositionY, request.Width, request.Height),
            new PdfSignatureAppearance(
                ResolveDisplayName(actorIdentity, actor.KeycloakUserId),
                actorIdentity?.Username ?? actor.KeycloakUserId,
                signedAt,
                command.Comment),
            cancellationToken);

        var storedSignedObject = await objectStorage.UploadGeneratedPdfAsync(
            request.DocumentId,
            request.DocumentVersion.VersionNumber,
            $"signed/order-{request.SigningOrder}",
            signedPdf,
            cancellationToken);

        request.DocumentVersion.SetSignedObjectKey(storedSignedObject.ObjectKey);
        request.MarkSigned(actorIdentity?.Username ?? actor.KeycloakUserId, storedSignedObject.ObjectKey, command.Comment);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.signature.signed",
                "DocumentSignatureRequest",
                request.Id,
                RelatedDocumentId: request.DocumentId,
                RelatedVersionId: request.DocumentVersionId,
                ActorUserId: actor.Id,
                Metadata: new
                {
                    request.SigningOrder,
                    request.PageNumber,
                    request.SignedAt,
                    OutputObjectKey = storedSignedObject.ObjectKey,
                    command.Comment
                }),
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetSignatureAsync(documentId, signatureRequestId, cancellationToken);
    }

    public async Task<DocumentSignatureRequestDto> RejectSignatureAsync(
        Guid documentId,
        Guid signatureRequestId,
        string actorIdentifier,
        CompleteDocumentSignatureCommand command,
        CancellationToken cancellationToken)
    {
        var request = await dbContext.DocumentSignatureRequests
            .Include(entity => entity.DocumentVersion)
            .Include(entity => entity.SignerUser)
            .FirstOrDefaultAsync(entity => entity.DocumentId == documentId && entity.Id == signatureRequestId, cancellationToken)
            ?? throw new NotFoundException($"Signature request '{signatureRequestId}' was not found for document '{documentId}'.");

        var document = await dbContext.Documents
            .FirstOrDefaultAsync(entity => entity.Id == documentId, cancellationToken)
            ?? throw new NotFoundException($"Document '{documentId}' was not found.");

        var actor = await ResolveUserAsync(actorIdentifier, cancellationToken);

        if (actor.Id != request.SignerUserId && !await HasAdministrativeRoleAsync(actor, cancellationToken))
        {
            throw new ConflictException("Only the assigned signer can reject this signature request.");
        }

        EnsureSignatureWorkflow(document, request);
        await EnsureSigningOrderSatisfiedAsync(request, cancellationToken);
        var actorIdentity = await keycloakAdminService.GetUserIdentityAsync(actor.KeycloakUserId, cancellationToken);
        request.MarkRejected(actorIdentity?.Username ?? actor.KeycloakUserId, command.Comment);
        await auditLogService.WriteAsync(
            new WriteAuditLogEntry(
                "document.signature.rejected",
                "DocumentSignatureRequest",
                request.Id,
                RelatedDocumentId: request.DocumentId,
                RelatedVersionId: request.DocumentVersionId,
                ActorUserId: actor.Id,
                Metadata: new
                {
                    request.SigningOrder,
                    command.Comment
                }),
            cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetSignatureAsync(documentId, signatureRequestId, cancellationToken);
    }

    public async Task<IReadOnlyCollection<PendingSignatureDto>> GetPendingSignaturesAsync(string actorIdentifier, CancellationToken cancellationToken)
    {
        var actor = await ResolveUserAsync(actorIdentifier, cancellationToken);

        return await dbContext.DocumentSignatureRequests
            .AsNoTracking()
            .Where(request =>
                request.SignerUserId == actor.Id &&
                request.Status == DocumentSignatureStatus.Pending &&
                request.DocumentVersion.IsCurrent)
            .OrderBy(request => request.SigningOrder)
            .Select(request => new PendingSignatureDto(
                request.Id,
                request.DocumentId,
                request.Document.Title,
                request.DocumentVersionId,
                request.DocumentVersion.VersionNumber,
                request.SigningOrder,
                request.PageNumber,
                request.PositionX,
                request.PositionY,
                request.Width,
                request.Height,
                request.Comment))
            .ToArrayAsync(cancellationToken);
    }

    private async Task EnsureUniqueTitleAsync(string title, Guid? documentId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.Documents.AnyAsync(
            entity => entity.Title == title && (!documentId.HasValue || entity.Id != documentId.Value),
            cancellationToken);

        if (exists)
        {
            throw new ConflictException($"A document with title '{title}' already exists.");
        }
    }

    private async Task EnsureDocumentExistsAsync(Guid documentId, CancellationToken cancellationToken)
    {
        var exists = await dbContext.Documents.AnyAsync(document => document.Id == documentId, cancellationToken);

        if (!exists)
        {
            throw new NotFoundException($"Document '{documentId}' was not found.");
        }
    }

    private static void EnsureCanModifyDocumentContent(Document document)
    {
        if (document.Status == DocumentStatus.InReview)
        {
            throw new ConflictException("Documents in review cannot be modified until they are approved or rejected.");
        }

        if (document.Status == DocumentStatus.Archived)
        {
            throw new ConflictException("Archived documents cannot be modified.");
        }
    }

    private static void TryDocumentMutation(Action action)
    {
        try
        {
            action();
        }
        catch (InvalidOperationException exception)
        {
            throw new ConflictException(exception.Message);
        }
    }

    private async Task<int> GetNextVersionNumberAsync(Guid documentId, CancellationToken cancellationToken)
    {
        var lastVersionNumber = await dbContext.DocumentVersions
            .Where(version => version.DocumentId == documentId)
            .Select(version => (int?)version.VersionNumber)
            .MaxAsync(cancellationToken);

        return (lastVersionNumber ?? 0) + 1;
    }

    private async Task<string> ResolveSignatureSourceObjectKeyAsync(DocumentSignatureRequest request, CancellationToken cancellationToken)
    {
        var latestPreviousSignedObjectKey = await dbContext.DocumentSignatureRequests
            .Where(entity =>
                entity.DocumentVersionId == request.DocumentVersionId &&
                entity.SigningOrder < request.SigningOrder &&
                entity.Status == DocumentSignatureStatus.Signed)
            .OrderByDescending(entity => entity.SigningOrder)
            .Select(entity => entity.LatestSignedObjectKey)
            .FirstOrDefaultAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(latestPreviousSignedObjectKey))
        {
            return latestPreviousSignedObjectKey;
        }

        return !string.IsNullOrWhiteSpace(request.DocumentVersion.SignedObjectKey)
            ? request.DocumentVersion.SignedObjectKey
            : request.DocumentVersion.OriginalObjectKey;
    }

    private async Task EnsureSigningOrderSatisfiedAsync(DocumentSignatureRequest request, CancellationToken cancellationToken)
    {
        var blockingRequest = await dbContext.DocumentSignatureRequests
            .Where(entity =>
                entity.DocumentVersionId == request.DocumentVersionId &&
                entity.SigningOrder < request.SigningOrder &&
                entity.Status != DocumentSignatureStatus.Signed)
            .AnyAsync(cancellationToken);

        if (blockingRequest)
        {
            throw new ConflictException("This signature request is blocked until earlier signing steps are completed.");
        }
    }

    private static void EnsureSignatureWorkflow(Document document, DocumentSignatureRequest request)
    {
        if (document.Status != DocumentStatus.Approved)
        {
            throw new ConflictException("Only approved documents can be signed.");
        }

        if (request.Status != DocumentSignatureStatus.Pending)
        {
            throw new ConflictException("This signature request is no longer pending.");
        }

        if (!request.DocumentVersion.IsCurrent)
        {
            throw new ConflictException("Only the current document version can be signed.");
        }
    }

    private async Task<User> ResolveUserAsync(string actorIdentifier, CancellationToken cancellationToken)
    {
        var actor = await dbContext.Users
            .FirstOrDefaultAsync(user => user.KeycloakUserId == actorIdentifier, cancellationToken);

        if (actor is null)
        {
            throw new NotFoundException("The current authenticated user is not mapped to an active application user.");
        }

        if (actor.Status != UserStatus.Active)
        {
            throw new ConflictException("The current application user is not active.");
        }

        return actor;
    }

    private async Task<bool> HasAdministrativeRoleAsync(User user, CancellationToken cancellationToken)
    {
        var identity = await keycloakAdminService.GetUserIdentityAsync(user.KeycloakUserId, cancellationToken);
        return HasRole(identity?.Roles, BusinessRoles.Admin);
    }

    private static string ResolveDisplayName(KeycloakUserIdentity? identity, string fallback)
    {
        var fullName = string.Join(" ", new[] { identity?.FirstName, identity?.LastName }
            .Where(value => !string.IsNullOrWhiteSpace(value)))
            .Trim();

        return !string.IsNullOrWhiteSpace(fullName)
            ? fullName
            : identity?.Username ?? identity?.Email ?? fallback;
    }

    private static bool HasRole(IReadOnlyCollection<string>? roles, string roleName) =>
        roles?.Any(role => string.Equals(role, roleName, StringComparison.OrdinalIgnoreCase)) == true;

    private async Task<DocumentSignatureRequestDto> GetSignatureAsync(Guid documentId, Guid signatureRequestId, CancellationToken cancellationToken)
    {
        var signature = await dbContext.DocumentSignatureRequests
            .AsNoTracking()
            .Where(request => request.DocumentId == documentId && request.Id == signatureRequestId)
            .Select(MapSignatureRequest())
            .FirstOrDefaultAsync(cancellationToken);

        return signature ?? throw new NotFoundException($"Signature request '{signatureRequestId}' was not found for document '{documentId}'.");
    }

    private static string ComputeChecksum(byte[] content)
    {
        return Convert.ToHexString(SHA256.HashData(content));
    }

    private static void ValidateChangeSummary(string changeSummary)
    {
        if (string.IsNullOrWhiteSpace(changeSummary))
        {
            throw new ValidationException("Change summary is required.");
        }

        if (changeSummary.Length > 1000)
        {
            throw new ValidationException("Change summary cannot exceed 1000 characters.");
        }
    }

    private static Expression<Func<DocumentVersion, DocumentVersionDto>> MapVersion()
    {
        return version => new DocumentVersionDto(
            version.Id,
            version.DocumentId,
            version.VersionNumber,
            version.IsCurrent,
            !string.IsNullOrWhiteSpace(version.OriginalObjectKey),
            !string.IsNullOrWhiteSpace(version.SignedObjectKey),
            version.Checksum,
            version.ChangeSummary,
            version.CreatedBy,
            version.CreatedAt);
    }

    private static Expression<Func<DocumentSignatureRequest, DocumentSignatureRequestDto>> MapSignatureRequest()
    {
        return request => new DocumentSignatureRequestDto(
            request.Id,
            request.DocumentId,
            request.DocumentVersionId,
            request.SignerUserId,
            request.SignerUser.KeycloakUserId,
            request.SignerUser.KeycloakUserId,
            request.SigningOrder,
            request.Status,
            request.PageNumber,
            request.PositionX,
            request.PositionY,
            request.Width,
            request.Height,
            request.SignedAt,
            request.Comment,
            request.DocumentVersion.IsCurrent,
            request.Actions
                .OrderBy(action => action.PerformedAt)
                .Select(action => new DocumentSignatureActionDto(
                    action.Id,
                    action.ActionType,
                    action.PerformedBy,
                    action.PerformedAt,
                    action.Comment,
                    action.OutputObjectKey))
                .ToArray());
    }
}
