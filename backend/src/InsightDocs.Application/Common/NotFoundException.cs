namespace InsightDocs.Application.Common;

public sealed class NotFoundException(string message) : AppException("not_found", message);
