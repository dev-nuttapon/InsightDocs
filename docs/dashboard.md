# Dashboard

## Purpose

The dashboard is designed to give enterprise users a practical operational overview without relying on charts or presentation-only visuals.

It focuses on:

- current workload
- recent document movement
- recent operational activity
- quick entry points into common workflows

## Endpoints

- `GET /api/dashboard/summary`
- `GET /api/dashboard/recent-documents`
- `GET /api/dashboard/recent-activities`

## Widgets

### Summary cards

- total documents
- pending approvals
- pending signatures
- approved documents
- archived documents

### Recent documents

Shows the latest touched document records with:

- title
- category
- status
- current version
- owner/controller label
- last activity timestamp

### Recent activities

Uses recent audit events to show:

- action name
- actor
- timestamp
- related document link when available

### Quick actions

Role-aware links into:

- document registry
- search
- approvals
- signatures
- users
- audit logs

## Role Awareness

- approval counts and review-oriented quick actions are surfaced when the user has manager/admin capabilities
- signature counts and signer quick actions are surfaced when the user has signer/admin capabilities
- admin-only operational links remain hidden for non-admin users
