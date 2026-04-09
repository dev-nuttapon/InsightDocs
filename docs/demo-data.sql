INSERT INTO users ("Id", "KeycloakUserId", "Username", "Email", "DisplayName", "Status", "CreatedAt", "ApprovedAt", "ApprovedBy")
VALUES
  ('0f8642bc-1495-4a58-8e39-17806fd83001', 'demo-admin', 'demo.admin', 'demo.admin@insightdocs.local', 'Demo Admin', 'Active', NOW(), NOW(), 'seed'),
  ('0f8642bc-1495-4a58-8e39-17806fd83002', 'demo-controller', 'demo.controller', 'demo.controller@insightdocs.local', 'Demo Controller', 'Active', NOW(), NOW(), 'seed'),
  ('0f8642bc-1495-4a58-8e39-17806fd83003', 'demo-manager', 'demo.manager', 'demo.manager@insightdocs.local', 'Demo Manager', 'Active', NOW(), NOW(), 'seed'),
  ('0f8642bc-1495-4a58-8e39-17806fd83004', 'demo-signer', 'demo.signer', 'demo.signer@insightdocs.local', 'Demo Signer', 'Active', NOW(), NOW(), 'seed')
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO user_roles ("UserId", "RoleId")
SELECT '0f8642bc-1495-4a58-8e39-17806fd83001', "Id" FROM roles WHERE "NormalizedName" = 'ADMIN'
ON CONFLICT ("UserId", "RoleId") DO NOTHING;

INSERT INTO user_roles ("UserId", "RoleId")
SELECT '0f8642bc-1495-4a58-8e39-17806fd83002', "Id" FROM roles WHERE "NormalizedName" = 'DOCUMENTCONTROLLER'
ON CONFLICT ("UserId", "RoleId") DO NOTHING;

INSERT INTO user_roles ("UserId", "RoleId")
SELECT '0f8642bc-1495-4a58-8e39-17806fd83003', "Id" FROM roles WHERE "NormalizedName" = 'MANAGER'
ON CONFLICT ("UserId", "RoleId") DO NOTHING;

INSERT INTO user_roles ("UserId", "RoleId")
SELECT '0f8642bc-1495-4a58-8e39-17806fd83004', "Id" FROM roles WHERE "NormalizedName" = 'SIGNER'
ON CONFLICT ("UserId", "RoleId") DO NOTHING;

INSERT INTO documents ("Id", "Title", "Description", "CreatedBy", "CreatedAt", "UpdatedBy", "UpdatedAt", "Status", "Category", "OwnerUserId", "ControllerUserId")
VALUES
  ('6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd91', 'Corporate Policy Handbook', 'Seeded sample document for local version control development.', 'seed', NOW(), 'seed', NOW(), 'Draft', 'Policy', '0f8642bc-1495-4a58-8e39-17806fd83001', '0f8642bc-1495-4a58-8e39-17806fd83002'),
  ('6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd92', 'Vendor Risk Procedure', 'Demo document currently in review.', 'demo.controller', NOW(), 'demo.controller', NOW(), 'InReview', 'Procedure', '0f8642bc-1495-4a58-8e39-17806fd83001', '0f8642bc-1495-4a58-8e39-17806fd83002'),
  ('6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd93', 'Contract Signing Guide', 'Demo approved document ready for signature assignment.', 'demo.controller', NOW(), 'demo.manager', NOW(), 'Approved', 'Guide', '0f8642bc-1495-4a58-8e39-17806fd83001', '0f8642bc-1495-4a58-8e39-17806fd83002'),
  ('6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd94', 'Archived Records Policy', 'Demo archived document.', 'demo.controller', NOW(), 'demo.admin', NOW(), 'Archived', 'Policy', '0f8642bc-1495-4a58-8e39-17806fd83001', '0f8642bc-1495-4a58-8e39-17806fd83002')
ON CONFLICT ("Id") DO NOTHING;

INSERT INTO document_versions ("Id", "DocumentId", "VersionNumber", "OriginalObjectKey", "SignedObjectKey", "Checksum", "ChangeSummary", "CreatedBy", "CreatedAt", "IsCurrent")
VALUES
  ('7fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd91', '6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd91', 1, 'demo/corporate-policy-v1-original.pdf', NULL, 'DEMO-CHECKSUM-001', 'Initial seeded version', 'seed', NOW(), true),
  ('7fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd92', '6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd92', 2, 'demo/vendor-risk-v2-original.pdf', NULL, 'DEMO-CHECKSUM-002', 'Updated for manager review', 'demo.controller', NOW(), true),
  ('7fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd93', '6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd93', 3, 'demo/contract-guide-v3-original.pdf', NULL, 'DEMO-CHECKSUM-003', 'Approved version ready for signature workflow', 'demo.controller', NOW(), true),
  ('7fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd94', '6fd3e96b-5d4d-4fb7-9e0f-6749b7b0fd94', 1, 'demo/archived-records-v1-original.pdf', NULL, 'DEMO-CHECKSUM-004', 'Archived demo version', 'demo.controller', NOW(), true)
ON CONFLICT ("Id") DO NOTHING;
