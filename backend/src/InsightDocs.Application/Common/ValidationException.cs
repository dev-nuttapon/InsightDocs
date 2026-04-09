namespace InsightDocs.Application.Common;

public sealed class ValidationException(string message) : AppException("validation_error", message);
