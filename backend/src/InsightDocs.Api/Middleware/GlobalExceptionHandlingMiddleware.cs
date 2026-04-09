using InsightDocs.Application.Common;
using InsightDocs.Api.Models;

namespace InsightDocs.Api.Middleware;

public sealed class GlobalExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionHandlingMiddleware> logger,
    IHostEnvironment environment)
{
    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception for request {Method} {Path}", context.Request.Method, context.Request.Path);

            context.Response.StatusCode = exception switch
            {
                NotFoundException => StatusCodes.Status404NotFound,
                ConflictException => StatusCodes.Status409Conflict,
                ValidationException => StatusCodes.Status400BadRequest,
                _ => StatusCodes.Status500InternalServerError
            };
            context.Response.ContentType = "application/json";

            var response = ErrorResponse.Failure(
                code: exception is AppException appException ? appException.Code : "internal_server_error",
                message: exception is AppException ? exception.Message : "An unexpected error occurred.",
                traceId: context.TraceIdentifier,
                details: environment.IsDevelopment() ? [exception.Message] : null);

            await context.Response.WriteAsJsonAsync(response);
        }
    }
}
