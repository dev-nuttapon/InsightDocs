using System.Security.Claims;
using InsightDocs.Application.Audit;
using InsightDocs.Application.Dashboard;
using InsightDocs.Application.Identity;
using InsightDocs.Application.Search;
using InsightDocs.Application.Users;
using InsightDocs.Application.Auth;
using InsightDocs.Application.Documents;
using InsightDocs.Infrastructure.Authentication;
using InsightDocs.Infrastructure.Audit;
using InsightDocs.Infrastructure.Auth;
using InsightDocs.Infrastructure.Configuration;
using InsightDocs.Infrastructure.Dashboard;
using InsightDocs.Infrastructure.Documents;
using InsightDocs.Infrastructure.Identity;
using InsightDocs.Infrastructure.Persistence;
using InsightDocs.Infrastructure.Search;
using InsightDocs.Infrastructure.Users;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Minio;

namespace InsightDocs.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services
            .AddOptions<ApplicationOptions>()
            .Bind(configuration.GetSection(ApplicationOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<MinioOptions>()
            .Bind(configuration.GetSection(MinioOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<KeycloakOptions>()
            .Bind(configuration.GetSection(KeycloakOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<RedisOptions>()
            .Bind(configuration.GetSection(RedisOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<SecurityAccessOptions>()
            .Bind(configuration.GetSection(SecurityAccessOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services
            .AddOptions<PasswordResetOptions>()
            .Bind(configuration.GetSection(PasswordResetOptions.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is required.");

        services.AddDbContext<InsightDocsDbContext>(options =>
            options.UseNpgsql(connectionString));

        var keycloakOptions = configuration
            .GetSection(KeycloakOptions.SectionName)
            .Get<KeycloakOptions>() ?? throw new InvalidOperationException("Keycloak configuration is required.");
        var minioOptions = configuration
            .GetSection(MinioOptions.SectionName)
            .Get<MinioOptions>() ?? throw new InvalidOperationException("Minio configuration is required.");

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = keycloakOptions.Authority;
                options.RequireHttpsMetadata = IsHttps(keycloakOptions.BaseUrl);
                options.MapInboundClaims = false;
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Cookies["insightdocs_access_token"];

                        if (!string.IsNullOrWhiteSpace(accessToken))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    NameClaimType = "preferred_username",
                    RoleClaimType = ClaimTypes.Role,
                    ValidateAudience = !string.IsNullOrWhiteSpace(keycloakOptions.ApiAudience)
                };

                if (!string.IsNullOrWhiteSpace(keycloakOptions.ApiAudience))
                {
                    options.TokenValidationParameters.ValidAudience = keycloakOptions.ApiAudience;
                }
            });

        services.AddTransient<IClaimsTransformation, KeycloakClaimsTransformation>();
        services.AddHttpClient<IKeycloakAdminService, KeycloakAdminService>();
        services.AddHttpClient<IKeycloakBrowserAuthService, KeycloakBrowserAuthService>();
        services.AddSingleton<IMinioClient>(_ =>
            new MinioClient()
                .WithEndpoint(minioOptions.Endpoint)
                .WithCredentials(minioOptions.AccessKey, minioOptions.SecretKey)
                .WithSSL(minioOptions.UseSsl)
                .Build());
        services.AddScoped<IRegistrationService, RegistrationService>();
        services.AddScoped<IPasswordResetService, PasswordResetService>();
        services.AddScoped<IAuditLogService, AuditLogService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IBusinessRoleLookup, BusinessRoleLookup>();
        services.AddScoped<IUserManagementService, UserManagementService>();
        services.AddScoped<IDocumentObjectStorage, MinioDocumentObjectStorage>();
        services.AddScoped<IPdfDigitalSignatureService, PdfSharpDigitalSignatureService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<ISearchService, SearchService>();
        services.AddSingleton<ISystemClock, SystemClock>();

        return services;
    }

    private static bool IsHttps(string url) =>
        Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
        string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);
}
