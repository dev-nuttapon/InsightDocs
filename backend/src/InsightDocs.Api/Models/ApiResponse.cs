namespace InsightDocs.Api.Models;

public record ApiResponse<T>(bool Success, T Data, string? TraceId = null)
{
    public static ApiResponse<T> Ok(T data, string? traceId = null) => new(true, data, traceId);
}
