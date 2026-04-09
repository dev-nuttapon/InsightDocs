# User Management And Role Management

## Database Schema

### `users`

- `Id` uuid primary key
- `KeycloakUserId` unique external identity id from Keycloak
- `Username` unique application username reference
- `Email` unique email
- `DisplayName` business display name
- `Status` enum-like string: `Pending`, `Active`, `Disabled`
- `CreatedAt` timestamp with time zone
- `ApprovedAt` timestamp with time zone nullable
- `ApprovedBy` string nullable

### `roles`

- `Id` uuid primary key
- `Name` unique role name
- `NormalizedName` unique upper-case role name

Seeded default roles:

- `Admin`
- `DocumentController`
- `Manager`
- `Signer`
- `Viewer`

### `user_roles`

- composite key: `UserId`, `RoleId`
- many-to-many between users and roles

## Authorization Model

- Keycloak remains the source of authentication truth
- PostgreSQL stores application-specific user profiles and business roles
- request authentication still starts from Keycloak JWT validation
- claims transformation augments the principal with business roles from PostgreSQL for matching active users
- Admin-only APIs and screens check for `Admin` role in the application DB or compatible admin roles already present in token claims

## Local Development

Apply migrations:

```bash
cd backend
dotnet ef database update --project src/InsightDocs.Infrastructure
```

The Phase 2 migration seeds the default business roles automatically.
