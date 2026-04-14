# InsightDocs Demo Mockup Task Plan

## Purpose

เอกสารนี้ใช้สำหรับวางงาน `demo mockup` โดยเฉพาะ

ขอบเขตของไฟล์นี้:

- demo mode
- mock dataset
- demo narrative
- flagship presentation flow
- presentation safety

ไฟล์นี้แยกออกจาก `frontend-task-plan.md` เพราะเดโมมีเป้าหมายต่างจาก product UI ปกติ

---

## Demo Goal

กรรมการต้องเข้าใจ 3 เรื่องภายในไม่กี่นาที:

1. Governed PDF lifecycle
2. Approval-to-signature workflow
3. End-to-end traceability

---

## Primary Demo Flow

ใช้ story เดียว:

1. Dashboard
2. Document Detail
3. Versions
4. Approvals
5. Signatures
6. Audit

ห้ามแตก flow ไป supporting screens เว้นแต่มีเหตุผลชัดเจน

---

## Completion Criteria

demo mockup ถือว่าจบเมื่อ:

1. flagship pages ทั้ง 5 ใช้ story เดียวกัน
2. ไม่มี empty state ใน flow หลัก
3. ไม่มี raw technical values ทำลาย presentation
4. demo mode reset ได้
5. action ใน demo mode ทำให้ story เปลี่ยนจริง
6. ผู้พรีเซนต์เดินเรื่องจบได้ภายใน 3-5 นาที

---

## Phase 1: Story Lock

### Goal

ล็อกว่ากำลังสาธิต “เรื่องอะไร” และไม่ปล่อยให้ scope ไหล

### Tasks

1. ระบุ primary document
2. ระบุ secondary document ถ้าจำเป็น
3. ระบุ current stage ของแต่ละเอกสาร
4. ระบุ action ที่ต้อง demo จริง

### Done

- demo ไม่แตกเรื่อง
- ทุกหน้าชี้กลับมาที่ story เดียวกัน

---

## Phase 2: Flagship Screen Polish

### Goal

ทำให้ 5 หน้าหลักดูเป็น product เด่นจริง

### Scope

- dashboard
- document detail
- approvals
- signatures
- audit

### Tasks

1. dashboard เป็น entry point
2. document detail เป็น centerpiece
3. approvals เป็น decision workspace
4. signatures เป็น signing workspace
5. audit เป็น closing scene

### Done

- เปิดจาก dashboard แล้วปิดที่ audit ได้อย่างลื่น

---

## Phase 3: Interaction Mockup

### Goal

ทำให้การกดใน demo mode มีผลกับ story จริง

### Tasks

1. approve / reject
2. assign signer
3. sign / reject
4. create / restore version
5. reset demo

### Done

- ผู้ชมเห็นผลของ action ทันที
- story ขยับจริง ไม่ใช่แค่ static mock

---

## Phase 4: Presentation Safety

### Goal

ทำให้การ present ไม่สะดุด

### Tasks

1. ตรวจทุก route ใน demo mode
2. ตรวจ state หลัง refresh
3. ตรวจ reset flow
4. ตรวจ fallback states
5. ตรวจ text ไทย/อังกฤษในหน้าหลัก

### Done

- เดโมไม่พังเวลา present
- หลุดหน้าหรือรีเฟรชแล้วยังกลับมาเล่าเรื่องต่อได้

---

## Out of Scope Until Demo Is Complete

- users redesign
- password reset redesign
- auth page redesign
- supporting admin mockups ใหม่

---

## Immediate Next Tasks

1. ปิด `Document Detail` ให้เป็นหน้าหลักของเรื่องจริง
2. เก็บ `Approvals` และ `Signatures` ให้ action/result ชัด
3. เก็บ `Audit` ให้เป็นหน้าปิดเรื่อง
4. ตรวจ responsive ของ 5 หน้าหลัก
5. ตรวจ demo safety ก่อนค่อยไป API
