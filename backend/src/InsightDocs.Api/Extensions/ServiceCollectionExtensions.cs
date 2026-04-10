using InsightDocs.Api.Models;
using InsightDocs.Api.Services;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightDocs.Api.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddControllers();
        services.AddEndpointsApiExplorer();
        services.AddHealthChecks();
        services.AddScoped<ICurrentUser, HttpContextCurrentUser>();

        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var errors = context.ModelState
                    .Where(entry => entry.Value?.Errors.Count > 0)
                    .Select(entry => new ValidationError(
                        entry.Key,
                        entry.Value!.Errors.Select(error => error.ErrorMessage).ToArray()))
                    .ToArray();

                return new BadRequestObjectResult(ErrorResponse.Validation("Validation failed.", errors));
            };
        });

        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                var configuredOrigins = configuration
                    .GetSection("Application:AllowedOrigins")
                    .Get<string[]>()
                    ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
                    .Select(origin => origin.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToArray();

                if (configuredOrigins is { Length: > 0 })
                {
                    policy.WithOrigins(configuredOrigins)
                        .AllowCredentials()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                    return;
                }

                var frontendUrl = configuration["Application:FrontendUrl"];

                if (!string.IsNullOrWhiteSpace(frontendUrl))
                {
                    policy.WithOrigins(frontendUrl.Trim())
                        .AllowCredentials()
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                }
            });
        });

        services.AddAuthorizationBuilder()
            .SetFallbackPolicy(new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build())
            .AddPolicy(AuthorizationPolicies.AuthenticatedUser, policy =>
                policy.RequireAuthenticatedUser())
            .AddPolicy(AuthorizationPolicies.AdminAccess, policy =>
                policy.RequireRole(BusinessRoles.Admin, "admin", "realm-admin", "insightdocs-admin"))
            .AddPolicy(AuthorizationPolicies.DocumentManagement, policy =>
                policy.RequireRole(
                    BusinessRoles.Admin,
                    "admin",
                    "realm-admin",
                    "insightdocs-admin",
                    BusinessRoles.DocumentController,
                    BusinessRoles.Manager))
            .AddPolicy(AuthorizationPolicies.DocumentReviewSubmission, policy =>
                policy.RequireRole(
                    BusinessRoles.Admin,
                    "admin",
                    "realm-admin",
                    "insightdocs-admin",
                    BusinessRoles.DocumentController))
            .AddPolicy(AuthorizationPolicies.DocumentReviewDecision, policy =>
                policy.RequireRole(
                    BusinessRoles.Admin,
                    "admin",
                    "realm-admin",
                    "insightdocs-admin",
                    BusinessRoles.Manager))
            .AddPolicy(AuthorizationPolicies.DocumentSignatureManagement, policy =>
                policy.RequireRole(
                    BusinessRoles.Admin,
                    "admin",
                    "realm-admin",
                    "insightdocs-admin",
                    BusinessRoles.DocumentController,
                    BusinessRoles.Manager))
            .AddPolicy(AuthorizationPolicies.DocumentSignatureExecution, policy =>
                policy.RequireRole(
                    BusinessRoles.Admin,
                    "admin",
                    "realm-admin",
                    "insightdocs-admin",
                    BusinessRoles.Signer));

        return services;
    }
}
