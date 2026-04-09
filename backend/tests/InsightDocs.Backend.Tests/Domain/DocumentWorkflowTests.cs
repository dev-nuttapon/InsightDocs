using InsightDocs.Domain.Documents;

namespace InsightDocs.Backend.Tests.Domain;

public sealed class DocumentWorkflowTests
{
    [Fact]
    public void Approve_AfterSubmitForReview_TransitionsDocumentToApproved()
    {
        var document = Document.Create("Policy", "desc", "Policy", null, null, "alice");

        document.SubmitForReview("alice", "ready");
        var approval = document.Approve("manager", "approved");

        Assert.Equal(DocumentStatus.Approved, document.Status);
        Assert.Equal(DocumentApprovalAction.Approved, approval.Action);
        Assert.Equal(DocumentStatus.InReview, approval.FromStatus);
        Assert.Equal(DocumentStatus.Approved, approval.ToStatus);
    }

    [Fact]
    public void Archive_FromApproved_TransitionsDocumentToArchived()
    {
        var document = Document.Create("Procedure", null, "Procedure", null, null, "alice");

        document.SubmitForReview("alice", null);
        document.Approve("manager", null);
        document.Archive("records-admin");

        Assert.Equal(DocumentStatus.Archived, document.Status);
        Assert.Equal("records-admin", document.UpdatedBy);
        Assert.NotNull(document.UpdatedAt);
    }

    [Fact]
    public void Archive_FromInReview_ThrowsInvalidOperation()
    {
        var document = Document.Create("Procedure", null, "Procedure", null, null, "alice");
        document.SubmitForReview("alice", null);

        var exception = Assert.Throws<InvalidOperationException>(() => document.Archive("records-admin"));

        Assert.Equal("Only draft, approved, or rejected documents can be archived.", exception.Message);
    }
}
