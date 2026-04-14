# InsightDocs Demo Closure Plan

## Purpose

เอกสารนี้ใช้ล็อก scope ของเดโมให้ “จบจริง” และหยุดการไหลของงานไปยังหน้าที่ไม่ช่วยให้ชนะการนำเสนอ

เอกสารที่ใช้คู่กัน:

- ภาพรวม/สถานะเอกสารเดโม: [demo-winning-roadmap.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-winning-roadmap.md)
- ลำดับการพรีเซนต์: [demo-script.md](/Users/nuttapon/Github-dev/InsightDocs/docs/demo-script.md)

จากจุดนี้เป็นต้นไป ทุกงาน frontend สำหรับเดโมต้องตอบคำถามนี้ก่อน:

- ช่วยให้กรรมการเข้าใจคุณค่าของระบบเร็วขึ้นหรือไม่
- ช่วยให้ flow หลักลื่นขึ้นหรือไม่
- ช่วยให้หน้า flagship ดูน่าเชื่อถือขึ้นหรือไม่

ถ้าไม่เข้าเงื่อนไขข้อใดข้อหนึ่ง ให้เลื่อนไปหลังงาน API

---

## Demo Concept

InsightDocs ต้องขายเพียง 3 เรื่อง:

1. Governed PDF lifecycle
2. Approval-to-signature workflow
3. End-to-end traceability

ดังนั้นเดโมต้องเล่าจากเอกสารชุดเดียว แล้วพาไปจนถึง approval, signature, และ audit โดยไม่แตกเรื่อง

---

## Primary Demo Story

ใช้เอกสารหลักเพียง 1 ชุดเป็นเส้นเรื่องหลัก:

1. เปิด `Dashboard`
2. เปิด `Document Detail`
3. แสดง `Version Control`
4. แสดง `Approval`
5. แสดง `Signature`
6. ปิดด้วย `Audit`

ทุกหน้าอื่นเป็นเพียง supporting context

---

## Flagship Pages

มีเพียง 5 หน้าที่ต้อง polish ระดับประกวด

1. `Dashboard`
2. `Document Detail`
3. `Approvals`
4. `Signatures`
5. `Audit`

### Supporting Pages

หน้าต่อไปนี้ให้ถือว่า “พอใช้ได้แล้ว” และห้ามขยาย scope เพิ่มก่อนจบ flagship flow:

- `Users`
- `Create User`
- `Edit User`
- `Password Reset Requests`
- `Profile`
- auth pages ทั้งหมด
- supporting admin screens อื่น ๆ

Allowed work on supporting pages:

- แก้ bug ที่กระทบเดโม
- แก้ text ที่หลุดภาษา
- แก้ layout พังบน desktop/mobile

Not allowed before flagship complete:

- redesign ใหม่
- เพิ่ม mock section ใหม่
- เพิ่ม CTA ใหม่ที่ไม่เกี่ยวกับ flow หลัก

---

## Completion Criteria

เดโมถือว่า “ครบจริง” เมื่อเงื่อนไขต่อไปนี้ครบพร้อมกัน:

1. เดโมหลัก 5 หน้าใช้ข้อมูล story เดียวกัน
2. ไม่มี empty state ใน flow หลัก
3. ไม่มี raw status / raw ids / raw enum ที่ทำลาย presentation
4. ไทยและอังกฤษไม่หลุดในหน้าหลัก
5. desktop และ mobile/tablet ไม่พังในหน้าหลัก
6. ผู้พรีเซนต์สามารถเดิน flow จบได้ใน 3-5 นาทีโดยไม่ต้องอธิบาย workaround

---

## Execution Phases

## Phase A: Freeze Scope

### Goal

หยุดงานที่ไม่ช่วยให้เดโมชนะ และล็อกว่าจากนี้จะ polish เฉพาะ flagship flow

### Tasks

1. ใช้เอกสารนี้เป็น source of truth สำหรับงานเดโม
2. หยุดเพิ่ม section ใหม่ใน supporting pages
3. หยุดเพิ่ม feature demo ใหม่ในหน้าที่ไม่ใช่ flagship
4. ถ้ามีงานใหม่เข้ามา ให้ถามก่อนว่าอยู่ใน 5 หน้าหลักหรือไม่

### Done

- ทีม/agent ใช้ scope เดียวกัน
- ไม่มีงานหลุดไปหน้า supporting โดยไม่มีเหตุผล

---

## Phase B: Flagship Narrative Pass

### Goal

ทำให้ 5 หน้าหลักเชื่อมเป็นเรื่องเดียวจริง

### In Scope

- Dashboard
- Document Detail
- Approvals
- Signatures
- Audit

### Tasks

1. `Dashboard`
   - เหลือเป็น entry point ของเรื่อง
   - CTA ต้องพาไปเอกสารหลักทันที
   - ตัดของที่แย่ง spotlight กับ document flow

2. `Document Detail`
   - เป็น centerpiece ของทั้งเดโม
   - ต้องเห็น current status, current version, next step, evidence, PDF preview ชัด
   - ทุกแท็บต้องกลับมารับใช้เรื่องเดียวกัน

3. `Approvals`
   - ทำให้เหมือน decision workspace ไม่ใช่แค่ queue list
   - ต้องชัดว่า approve/reject ส่งผลอะไรต่อ

4. `Signatures`
   - ทำให้เหมือน signing workspace จริง
   - ต้องเห็นลำดับการลงนาม, placement, และผลหลังลงนาม

5. `Audit`
   - ทำให้เป็น closing scene ของเรื่อง
   - ต้องเห็นว่า event ต่าง ๆ เชื่อมกลับไปเอกสารเดียวกันได้

### Done

- เปิดจาก dashboard แล้วเดินไป audit ได้โดยไม่หลุดเรื่อง
- แต่ละหน้ามีหน้าที่ชัดเจนใน narrative

---

## Phase C: Presentation Polish

### Goal

ทำให้หน้า flagship ดูระดับประกวด ไม่ใช่ internal tool ธรรมดา

### Tasks

1. เก็บ hierarchy ของทุกหน้า
   - headline
   - subcopy
   - CTA
   - evidence

2. เก็บ spacing
   - panel spacing
   - section rhythm
   - list density

3. เก็บ CTA hierarchy
   - primary action ต้องเด่นเพียงหนึ่ง
   - secondary action ต้องไม่แย่ง focus

4. เก็บ status language
   - ห้ามมี raw enum
   - label ต้องสั้น คม และ consistent

5. เก็บ empty/error states ในหน้าหลัก
   - ต้องดู intentional
   - ห้ามเป็น fallback ที่ดูเหมือนระบบพัง

### Done

- 5 หน้าหลักมี visual tone เดียวกัน
- การสแกนหน้าทำได้เร็ว
- ไม่มีส่วนที่ดูเหมือน CRUD ธรรมดามาแย่งความเด่น

---

## Phase D: Responsive Pass

### Goal

ให้เดโมไม่พังเมื่อใช้จอเล็กหรือจอ present ขนาดแปลก

### Tasks

1. ตรวจ 5 หน้าหลักบน desktop
2. ตรวจ 5 หน้าหลักบน tablet
3. ตรวจ 5 หน้าหลักบน mobile
4. เก็บปัญหาเฉพาะหน้า:
   - text overlap
   - action wrap
   - panel collapse
   - sidebar/header conflicts
   - table/list readability

### Done

- ไม่มีข้อความซ้อน
- CTA ไม่ล้น
- side rail/main content ยุบตัวได้ถูกต้อง

---

## Phase E: Demo Safety Pass

### Goal

ให้การ present ไม่สะดุดแม้คลิกพลาดหรือรีเฟรชหน้า

### Tasks

1. ตรวจ demo mode ทุกหน้าหลัก
2. ตรวจ reset demo
3. ตรวจ state transition ของ:
   - approval
   - signature
   - version actions
4. ตรวจว่ากลับมาหน้าเดิมแล้ว story ยังต่อได้
5. ตรวจว่าไม่มีหน้าหลักไหนตกไปใช้ empty state หรือ live-only dependency โดยไม่ตั้งใจ

### Done

- เดโมรันได้แม้ผู้พรีเซนต์คลิกข้ามหน้า
- reset แล้วกลับสู่ story เดิมได้

---

## Phase F: API Handoff Ready

### Goal

หลัง frontend เดโมนิ่งแล้ว จึงเริ่มใช้หน้าจอเป็นฐานสำหรับ API contracts

### Tasks

1. สรุป state และ actions ที่แต่ละหน้าต้องการ
2. แยก mock-only behavior ออกจาก future real API behavior
3. ระบุ data contract ต่อหน้า
4. ล็อก field names ที่จำเป็นจริง

### Done

- frontend หลักไม่ขยับ concept แล้ว
- พร้อมสรุป API ต่อหน้าได้โดยไม่รื้อ UX

---

## Strict Priorities

ลำดับงานจากนี้:

1. `Document Detail`
2. `Dashboard`
3. `Approvals`
4. `Signatures`
5. `Audit`
6. `Responsive`
7. `Demo Safety`
8. `API Handoff`

ห้ามสลับไปเก็บ supporting screens ก่อนข้อ 1-5 จบ

---

## Task Checklist For Next Session

## Immediate Tasks

1. ตรวจ `Dashboard` ว่ายังมี section ไหนเกินความจำเป็นสำหรับ entry point
2. ตรวจ `Document Detail` ว่ายังมีแท็บไหนที่ยังไม่ทำหน้าที่ serve narrative หลัก
3. เก็บ `Approvals` ให้ action result ชัดขึ้นหลัง approve/reject
4. เก็บ `Signatures` ให้ action result และ sequence state ชัดขึ้นหลัง sign/reject
5. เก็บ `Audit` ให้เป็นหน้าปิดเรื่องที่คมและอ่านง่าย

## After That

1. ไล่ responsive 5 หน้าหลักแบบรายหน้า
2. ไล่ micro-copy ไทย/อังกฤษใน 5 หน้าหลักอีกหนึ่งรอบ
3. ตรวจ demo safety และ reset flow

---

## Stop Conditions

หยุด polish และเริ่มฝั่ง API เมื่อครบทั้งหมด:

- flagship pages ทั้ง 5 ผ่าน
- responsive ผ่าน
- demo safety ผ่าน
- supporting screens ไม่พัง

ห้ามเริ่ม API ถ้า `Document Detail` และ `Signatures` ยังไม่ถือว่าจบ
