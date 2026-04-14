# InsightDocs Backend Task Plan

## Purpose

เอกสารนี้ใช้สำหรับวางงาน `backend` ที่ต้องทำต่อให้ครบแบบ production-oriented

ขอบเขตของไฟล์นี้:

- API contracts
- domain rules
- persistence
- integration with Keycloak / MinIO / PostgreSQL
- security / validation / audit consistency

ไม่รวม:

- visual polish
- presentation-only demo behavior
- frontend mock interactions

---

## Current Goal

ทำให้ backend พร้อมรองรับ frontend จริงหลังจากหน้าเว็บนิ่งแล้ว โดยไม่รื้อ domain ซ้ำหลายรอบ

---

## Completion Criteria

backend ถือว่าพร้อมรอบถัดไปเมื่อ:

1. API รองรับหน้า flagship และ supporting screens ตาม contract ที่ล็อกแล้ว
2. validation และ error handling สม่ำเสมอ
3. authorization ไม่หลุด policy
4. persistence และ migrations ครบ
5. audit coverage ครบสำหรับ critical actions
6. local setup รันได้ end-to-end

---

## Phase 1: Contract Lock

### Goal

ล็อก request/response shape ของ endpoint ที่ frontend ต้องใช้จริง

### Tasks

1. สรุป endpoint ต่อหน้า
2. สรุป field ที่ต้องใช้จริง
3. แยก field ที่เป็น `demo-only` ออกจาก field ที่เป็น production contract
4. ตรวจ naming ให้สม่ำเสมอทั้ง backend และ frontend

### Done

- มี data contract ชัดเจนต่อหน้า
- frontend ไม่ต้องเดา field names เพิ่ม

---

## Phase 2: Workflow Completeness

### Goal

ทำ workflow หลักให้ครบด้วยข้อมูลจริง

### Scope

- documents
- versions
- approvals
- signatures
- audit
- dashboard summaries

### Tasks

1. ปิด document detail APIs ให้ครบสิ่งที่หน้าใช้งานจริงต้องการ
2. ตรวจ version restore / current version rules
3. ตรวจ approval transitions และ comments
4. ตรวจ signature assignment / signing order / sign result
5. ตรวจ audit writes ให้ครบทุก critical action

### Done

- flagship workflow ใช้ข้อมูลจริงได้ครบ
- state transitions ตรงกับ business rules

---

## Phase 3: Supporting Admin Flows

### Goal

ทำ supporting screens ให้ใช้ข้อมูลจริงได้ครบ แต่ไม่แย่ง priority จาก workflow หลัก

### Scope

- users
- create/edit user
- password reset requests
- profile / change password

### Tasks

1. user list / create / edit / disable / enable / soft delete
2. role mapping consistency
3. password reset request review
4. self-service change password endpoint consistency

### Done

- supporting admin flows ใช้จริงได้
- ไม่เหลือ raw or placeholder data dependency

---

## Phase 4: Hardening

### Goal

ยกระดับ backend จาก “มี feature” เป็น “พร้อมใช้งานจริง”

### Tasks

1. validation ครบทุก endpoint
2. exception handling ไม่ leak internal details
3. authorization policies ชัด
4. DTO cleanliness
5. seed data / sample data พร้อม
6. migration completeness
7. backend tests สำหรับ core services และ APIs

### Done

- backend รันได้เสถียร
- error contracts ชัด
- ไม่มี business logic หลุดไป controller

---

## Strict Priority Order

1. flagship workflow contracts
2. supporting admin contracts
3. hardening

อย่าทำ optimization ก่อน contract และ workflow จะนิ่ง
