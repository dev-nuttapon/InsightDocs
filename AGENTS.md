# InsightDocs — AGENTS.md

## 🧠 Purpose

This document defines the rules, architecture, and expectations for all AI agents (e.g., Codex) contributing to the InsightDocs project.

Agents must follow these guidelines strictly to ensure consistency, scalability, and production readiness.

---

# 🏗️ Project Overview

InsightDocs is an enterprise-grade internal system for:

- PDF document management
- Version control
- Approval workflow
- Real PDF digital signature
- Search and audit logging

---

# 🧰 Tech Stack

## Backend

- .NET 10 Web API
- Clean Architecture
- Entity Framework Core
- PostgreSQL

## Frontend

- Vite
- React
- TypeScript
- CSS variables (for theming)

## Infrastructure

- Keycloak (authentication)
- MinIO (file storage for PDFs)
- Docker Compose (local development)

---

# 📁 Repository Structure

---

# 🧱 Architecture Rules

## Backend (Clean Architecture)

Layer responsibilities:

- Domain:
  - Entities
  - Value objects
  - Business rules
  - No dependencies on other layers

- Application:
  - Use cases
  - DTOs
  - Interfaces (repositories/services)
  - Validation

- Infrastructure:
  - EF Core
  - MinIO integration
  - External services
  - Implements interfaces

- API:
  - Controllers
  - Request/response handling
  - Middleware
  - Authentication/authorization

### Rules:

- No direct DB access from API layer
- No business logic in controllers
- Use dependency injection everywhere
- All logic must be testable

---

## Frontend (Feature-Based)

Structure:

### Rules:

- Each module owns its pages, hooks, and API calls
- Shared logic goes to `services`, `hooks`, or `components`
- Avoid tight coupling between modules

---

# 🔐 Authentication & Authorization

- Use Keycloak for authentication
- Do NOT implement custom auth
- Backend validates JWT tokens
- Use role-based authorization

### Business Roles:

- Admin
- DocumentController
- Manager
- Signer
- Viewer

- A user can have multiple roles

---

# 👥 User Lifecycle

- Registration requires admin approval
- No automatic email system
- Password reset:
  - user submits request
  - admin approves
  - system generates reset link
  - admin manually sends link

---

# 📄 Document Rules

- Only PDF files are supported
- Files stored in MinIO
- Metadata stored in PostgreSQL
- Document must support:
  - versioning
  - approval
  - signature

---

# 🔁 Version Control Rules

- Each update creates a new version
- Track:
  - original PDF
  - signed PDF
- Must support rollback
- Must track:
  - created by
  - created at

---

# ✍️ Digital Signature Rules

- Signature must be applied to the actual PDF file
- Must support:
  - multiple signers
  - signing order
  - configurable position (page, x, y)
- Must record:
  - signer
  - timestamp
  - version

---

# 🔍 Search Rules

- Use PostgreSQL search first
- Support:
  - keyword
  - filters (status, category, signer, owner)
- Must be extensible for AI search later

---

# 📜 Audit Log Rules

- All important actions must be logged
- Logs must be append-only
- Must include:
  - actor
  - action
  - timestamp
  - related entity

---

# 🎨 Theme System Rules

- Must support light/dark theme
- Use CSS variables
- No hardcoded colors
- Theme must persist in localStorage
- Use ThemeProvider and useTheme hook

---

# ⚙️ Coding Rules

## General

- Use clear, consistent naming
- Avoid magic values
- Use environment variables
- Write modular, reusable code

## Backend

- Use DTOs (never expose entities directly)
- Validate all inputs
- Use async/await
- Handle exceptions globally

## Frontend

- Use TypeScript strictly
- Avoid inline styles
- Use reusable components
- Handle loading and error states

---

# 🚫 Forbidden Practices

- ❌ Hardcoded credentials
- ❌ Business logic in controllers
- ❌ Direct DB access outside repositories
- ❌ Ignoring role-based authorization
- ❌ Fake signature (must modify PDF)
- ❌ Skipping audit logs for critical actions

---

# ✅ Definition of Done

A feature is considered complete when:

- End-to-end flow works
- Role-based access is enforced
- Errors are handled
- Data consistency is ensured
- UI is usable (not broken)
- Code is clean and maintainable

---

# 🧪 Testing Expectations

- Backend:
  - Unit tests for core logic
  - Integration tests for APIs

- Frontend:
  - Basic component testing (optional but recommended)

---

# 📦 Deployment Expectations

- Must run via Docker Compose locally
- Must support environment-based configs
- Must document setup clearly

---

# 📚 Documentation

Every feature must include:

- API documentation
- Usage explanation
- Any assumptions made

---

# 🧠 Agent Behavior Rules

Agents must:

- Think in modules, not files
- Respect architecture boundaries
- Avoid over-engineering
- Prefer clarity over cleverness
- Ensure code is production-ready

When uncertain:

- Choose scalable approach
- Document assumptions
- Keep extension points open

---

# 🏁 Final Note

InsightDocs is not a demo project.

It must behave like a real enterprise system:

- reliable
- secure
- maintainable
- extensible

All agents must align with this goal.
