# InsightDocs Docs Map

เอกสารของโปรเจคถูกจัดใหม่ให้เริ่มอ่านตามมุมมอง `Backend`, `Frontend`, และ `Demo Mockup`

เป้าหมายคือ:

- หาเอกสารที่เกี่ยวกับ implementation ได้เร็วขึ้น
- แยกงานฝั่ง API/Domain ออกจากงานฝั่ง UI และเดโมให้ชัด
- ลดการสลับบริบทตอนเตรียมงานรอบถัดไป

---

## Backend

เอกสารในกลุ่มนี้ใช้สำหรับระบบหลังบ้าน, workflow rules, persistence, และ API behavior

- [architecture.md](/Users/nuttapon/Github-dev/InsightDocs/docs/architecture.md)
  - ภาพรวมสถาปัตยกรรมและขอบเขตระดับระบบ

- [authentication.md](/Users/nuttapon/Github-dev/InsightDocs/docs/authentication.md)
  - Keycloak, auth lifecycle, registration, password reset

- [user-management.md](/Users/nuttapon/Github-dev/InsightDocs/docs/user-management.md)
  - user lifecycle, roles, admin user management

- [version-lifecycle.md](/Users/nuttapon/Github-dev/InsightDocs/docs/version-lifecycle.md)
  - document versioning, restore behavior, lifecycle rules

- [signature-workflow.md](/Users/nuttapon/Github-dev/InsightDocs/docs/signature-workflow.md)
  - signer assignment, signing order, signature storage model

- [search-strategy.md](/Users/nuttapon/Github-dev/InsightDocs/docs/search-strategy.md)
  - PostgreSQL search strategy และ future extension point

- [audit-coverage.md](/Users/nuttapon/Github-dev/InsightDocs/docs/audit-coverage.md)
  - audit logging scope, append-only policy, traceability

- [dashboard.md](/Users/nuttapon/Github-dev/InsightDocs/docs/dashboard.md)
  - dashboard endpoints และ summary query intent

- [demo-data.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-data.md)
  - demo/sample dataset สำหรับ local development

- [demo-data.sql](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-data.sql)
  - SQL seed data สำหรับ environment ท้องถิ่น

### Task Plan

- [backend-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/backend-task-plan.md)
  - phase สำหรับทำ backend ต่อให้ครบแบบ production-oriented

---

## Frontend

เอกสารในกลุ่มนี้ใช้สำหรับ UX flow, UI structure, และหน้าจอที่ใช้เป็น source of truth ฝั่ง product UI

- [frontend-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/frontend-task-plan.md)
  - phase สำหรับทำ frontend product UI ต่อให้ครบก่อนผูก API จริง

---

## Demo Mockup

เอกสารในกลุ่มนี้ใช้สำหรับงาน demo โดยเฉพาะ และแยกออกจาก product UI ปกติ

- [demo-mockup-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-mockup-task-plan.md)
  - phase สำหรับปิด demo mockup ให้จบจริง

- [demo-closure-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-closure-plan.md)
  - execution plan หลักสำหรับปิดเดโมให้จบจริง

- [demo-script.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-script.md)
  - ลำดับการพรีเซนต์และสิ่งที่ควรพูดในแต่ละหน้า

- [demo-winning-roadmap.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-winning-roadmap.md)
  - overview ของแนวทางเดโมและ pointer ไปยังเอกสารหลัก

---

## Suggested Reading Order

### ถ้าจะทำ Backend ต่อ

1. [architecture.md](/Users/nuttapon/Github-dev/InsightDocs/docs/architecture.md)
2. [authentication.md](/Users/nuttapon/Github-dev/InsightDocs/docs/authentication.md)
3. [user-management.md](/Users/nuttapon/Github-dev/InsightDocs/docs/user-management.md)
4. [version-lifecycle.md](/Users/nuttapon/Github-dev/InsightDocs/docs/version-lifecycle.md)
5. [signature-workflow.md](/Users/nuttapon/Github-dev/InsightDocs/docs/signature-workflow.md)
6. [search-strategy.md](/Users/nuttapon/Github-dev/InsightDocs/docs/search-strategy.md)
7. [audit-coverage.md](/Users/nuttapon/Github-dev/InsightDocs/docs/audit-coverage.md)
8. [backend-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/backend-task-plan.md)

### ถ้าจะทำ Frontend Product UI ต่อ

1. [frontend-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/frontend-task-plan.md)

### ถ้าจะทำ Demo Mockup ต่อ

1. [demo-winning-roadmap.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-winning-roadmap.md)
2. [demo-mockup-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-mockup-task-plan.md)
3. [demo-closure-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-closure-plan.md)
4. [demo-script.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-script.md)

---

## Current Source of Truth

- ถ้าจะทำ backend ต่อ: [backend-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/backend-task-plan.md)
- ถ้าจะทำ frontend product UI ต่อ: [frontend-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/frontend-task-plan.md)
- ถ้าจะปิดเดโมให้จบ: [demo-mockup-task-plan.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-mockup-task-plan.md)
