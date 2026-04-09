namespace InsightDocs.Application.Common;

public sealed class ConflictException(string message) : AppException("conflict", message);
