namespace InsightDocs.Api.Models;

public record ErrorResponse(
    bool Success,
    string Code,
    string Message,
    string? TraceId = null,
    string[]? Details = null,
    ValidationError[]? ValidationErrors = null)
{
    public static ErrorResponse Failure(string code, string message, string? traceId = null, string[]? details = null) =>
        new(false, code, message, traceId, details);

    public static ErrorResponse Validation(string message, ValidationError[] validationErrors, string? traceId = null) =>
        new(false, "validation_error", message, traceId, ValidationErrors: validationErrors);
}

public record ValidationError(string Field, string[] Errors);
