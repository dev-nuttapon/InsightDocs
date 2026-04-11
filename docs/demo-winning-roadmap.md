# InsightDocs Demo Winning Roadmap

## Objective

เป้าหมายของ roadmap นี้คือยกระดับ InsightDocs จากระบบที่ "ฟีเจอร์ครบ" ไปเป็น demo ที่:

- เข้าใจคุณค่าได้ภายใน 30-60 วินาที
- มี flow การสาธิตที่ลื่นและต่อเนื่อง
- แสดงความเป็น enterprise product ที่น่าเชื่อถือ
- มี visual presentation ที่โดดเด่นพอสำหรับการประกวด

แนวคิดหลัก:

- ใช้ `demo mode` ที่ควบคุมข้อมูลได้ทั้งระบบ
- เน้น `document workflow` เป็นจุดขายหลัก
- ทำ `dashboard` และ `document detail` ให้เป็น flagship screens
- ลดโอกาสเกิด empty state, broken state, หรือ flow ที่ผู้ชมต้องเดาเอง

---

## Phase 1: Demo Foundation

### Goal

ทำให้ทุกหน้าหลักเปิดมาแล้วเห็นข้อมูลตัวอย่างที่เชื่อมกันจริงทั้งระบบ โดยไม่ขึ้น empty state และไม่ปะปนกับข้อมูลจริงแบบครึ่ง ๆ กลาง ๆ

### Scope

- เพิ่ม `demo mode` ระดับแอป
- ใช้ mock dataset กลางร่วมกันในทุกโมดูลหลัก
- แยกข้อมูลตัวอย่างสำหรับ:
  - documents
  - versions
  - approvals
  - signatures
  - audit events
  - dashboard recent activities
- ทำ route และ view ที่ fallback ไปใช้ demo data ได้เสมอ

### Tasks

1. สร้าง `demo mode flag`
   - ตัวอย่าง: query string, env flag, หรือ config กลาง
   - ต้องเปิด/ปิดได้ชัดเจน

2. สร้าง `demo dataset` กลาง
   - ใช้ชุด document เดียวกันทั้งระบบ
   - แต่ละเอกสารต้องมีสถานะต่างกัน เช่น:
     - Draft
     - InReview
     - Approved
     - Signed

3. ทำ `mock document detail dataset`
   - metadata
   - current version
   - version history
   - approval history
   - signature requests
   - audit timeline

4. ปรับทุกหน้าหลักให้ไม่ตก empty state ใน demo mode
   - dashboard
   - documents
   - search
   - approvals
   - signatures
   - audit logs

### Definition of Done

- ทุกหน้าหลักมีข้อมูลตัวอย่างแสดงทันที
- ไม่มีข้อความ `No documents`, `No activity`, `No results` ถ้าอยู่ใน demo mode
- ข้อมูลแต่ละหน้าสัมพันธ์กันเป็นเรื่องเดียวกัน

---

## Phase 2: Demo Narrative

### Goal

ทำให้ผู้ชมเข้าใจระบบจาก story เดียว ไม่ใช่เห็นเป็นเมนูแยก ๆ

### Scope

- วาง demo storyline หลัก
- ทำ CTA และ quick path สำหรับ demo
- ทำให้แต่ละหน้าส่งต่อกันเหมือน narrative

### Demo Story ที่แนะนำ

1. สร้างเอกสารใหม่
2. อัปโหลด version ล่าสุด
3. ส่งเข้า review
4. manager อนุมัติ
5. assign signer
6. signer ลงนาม
7. audit trace แสดงย้อนหลังครบ

### Tasks

1. เพิ่ม `Demo Scenario` panel บน dashboard
   - ระบุว่า demo นี้กำลังอยู่ขั้นไหน
   - มีปุ่ม `เริ่มดู workflow`

2. ทำ CTA ต่อเนื่องระหว่างหน้า
   - dashboard -> documents
   - documents -> document detail
   - detail -> approvals/signatures

3. ทำ `next step guidance`
   - ในแต่ละหน้าควรมีบอกว่า "ขั้นต่อไปคืออะไร"

4. ทำ `scenario badges`
   - เช่น `Ready for Review`
   - `Waiting for Approval`
   - `Ready for Signature`
   - `Audit Trail Available`

### Definition of Done

- ผู้ชมสามารถดู demo ตาม flow เดียวได้ตั้งแต่ต้นจนจบ
- ไม่ต้องอธิบายด้วยปากมากว่าหน้าไหนต้องกดอะไรต่อ

---

## Phase 3: Flagship Dashboard

### Goal

ทำ dashboard ให้เป็นหน้าแรกที่ "ชนะ" ตั้งแต่เปิด

### Scope

- เปลี่ยน dashboard จาก operational page ธรรมดา ให้เป็น presentation-grade page
- คง utility แต่เพิ่ม visual hierarchy และ story

### Tasks

1. ออกแบบ dashboard hero ใหม่
   - headline ที่ชัด
   - subtitle ที่ขาย value
   - CTA สำหรับ demo flow

2. ทำ section หลักของ dashboard ใหม่
   - Operational summary
   - Demo scenario
   - Recent documents
   - Recent activities
   - Quick actions

3. ทำ metric cards ให้ distinct มากขึ้น
   - ใช้ visual emphasis
   - ให้ metric สำคัญกับ role ต่างกัน

4. ทำ role-aware dashboard views
   - controller view
   - manager view
   - signer view
   - admin view

### Definition of Done

- หน้า dashboard เปิดมาแล้วรู้ทันทีว่า InsightDocs เด่นเรื่องอะไร
- มี CTA และ flow ที่ไปต่อได้ทันที
- หน้าแรกไม่ดูเหมือน internal CRUD admin tool ทั่วไป

---

## Phase 4: Flagship Document Detail

### Goal

ทำหน้า document detail ให้เป็นหน้าที่แสดง "ความครบของระบบ" ชัดที่สุด

### Scope

- รวม metadata, versioning, approval, signature, audit, PDF preview
- ทำให้หน้านี้เป็น centerpiece ของ demo

### Tasks

1. ออกแบบ `document hero` ใหม่
   - title
   - status
   - current version
   - owner/controller
   - next step

2. ทำ `PDF preview panel`
   - preview หน้าแรก
   - visible signature boxes
   - highlight current signers

3. ทำ `workflow timeline`
   - created
   - version updated
   - submitted
   - approved
   - signatures assigned
   - signed

4. ทำ tabs/sections ให้ชัดขึ้น
   - details
   - versions
   - approvals
   - signatures
   - audit

5. ทำ CTA ต่อเนื่องใน detail page
   - submit for review
   - approve
   - assign signer
   - sign

### Definition of Done

- หน้า document detail สามารถใช้สาธิตระบบได้แทบทั้งระบบในหน้าเดียว
- ผู้ชมเห็นความแตกต่างระหว่าง version, approval, signature, audit ชัดเจน

---

## Phase 5: Signature Experience

### Goal

ทำให้เรื่องลายเซ็นเป็นจุดขายที่จำได้ ไม่ใช่แค่ฟอร์มกรอก X/Y

### Scope

- ใช้ mockup และ flow ให้ดูน่าเชื่อถือก่อน backend จริง
- ทำให้เห็นทั้ง digital signature และ visible signature appearance

### Tasks

1. ทำ `full signature demo mode`
   - assign signer
   - sign
   - reject
   - next signer unlocked

2. ทำ `page preview with signature placements`
   - แสดงหลายลายเซ็นบนหน้าเดียว
   - เห็นตำแหน่งชัด

3. เปลี่ยนจาก input-driven UI เป็น visual-driven UI
   - ลากตำแหน่งลายเซ็น
   - resize กล่องลายเซ็น

4. ทำ `signature evidence panel`
   - signed by
   - signed at
   - version
   - sequence number

### Definition of Done

- การลงนามดูเป็น feature เด่นของระบบ
- ไม่ต้องอธิบายด้วยปากมากว่าระบบลงนามอย่างไร

---

## Phase 6: Approval Experience

### Goal

ทำให้คิวอนุมัติดูเป็น workflow ระดับองค์กร ไม่ใช่แค่รายการ + ปุ่ม approve/reject

### Tasks

1. ทำ `approval decision card`
   - document summary
   - version context
   - latest change summary
   - latest reviewer note

2. ทำ `decision guidance`
   - what changed
   - what is pending
   - what happens next after approval

3. ทำ CTA ให้ลื่น
   - open document
   - compare latest version
   - approve/reject

### Definition of Done

- หน้า approvals ไม่ใช่แค่ queue แต่เป็น decision workspace

---

## Phase 7: Search and Audit Polish

### Goal

ทำให้ search กับ audit ดูเป็น enterprise-strength support modules

### Tasks

1. ปรับ search ให้มี:
   - stronger result cards
   - quick metadata scan
   - signature/approval summary

2. ปรับ audit ให้มี:
   - human-readable event labels
   - clear traceability
   - stronger detail panel

3. ผูก search และ audit กลับไปเอกสารตัวอย่างให้ครบ

### Definition of Done

- search และ audit ไม่แย่ง spotlight แต่ช่วยเสริมความน่าเชื่อถือของระบบ

---

## Phase 8: Visual System Polish

### Goal

ยกระดับ visual quality ให้โดดเด่นพอสำหรับงานประกวด

### Tasks

1. ทำ visual hierarchy ใหม่ในหน้าหลัก
2. ปรับ typography ให้ชัดและมี character มากขึ้น
3. ทำ spacing และ panel treatment ให้ consistent
4. ใช้ status color system ให้คมและจำง่าย
5. ลดความรู้สึกว่าเป็น generic admin template

### Definition of Done

- ทุกหน้ารู้สึกเป็น product เดียวกัน
- มี character มากพอให้จดจำ

---

## Phase 9: Demo Safety

### Goal

ลดความเสี่ยงเวลา demo จริง

### Tasks

1. ไม่มี empty state ใน demo mode
2. ไม่มี dependency กับข้อมูลจริงที่คาดเดาไม่ได้
3. เตรียม browser path สำหรับ demo
4. ทำปุ่ม reset demo state
5. ทำ script การ demo แบบ step-by-step

### Definition of Done

- เปิด demo แล้ว flow ไปได้ต่อเนื่องทุกครั้ง
- ไม่ต้องพึ่งข้อมูลจริงหรือ network state ที่ไม่แน่นอน

---

## Recommended Implementation Order

1. Phase 1: Demo Foundation
2. Phase 2: Demo Narrative
3. Phase 4: Flagship Document Detail
4. Phase 5: Signature Experience
5. Phase 3: Flagship Dashboard
6. Phase 6: Approval Experience
7. Phase 7: Search and Audit Polish
8. Phase 8: Visual System Polish
9. Phase 9: Demo Safety

---

## Judging Criteria Target

InsightDocs ควรทำคะแนนเด่นใน 5 ด้านนี้:

1. Product clarity
   - คนดูรู้ทันทีว่าระบบนี้แก้ปัญหาอะไร

2. Workflow completeness
   - เห็นตั้งแต่ document creation ไปจนถึง approval, signature, audit

3. Enterprise credibility
   - รู้สึกว่าใช้งานในองค์กรจริงได้

4. Signature differentiation
   - เห็นชัดว่าระบบนี้เหนือกว่าระบบเอกสารทั่วไปตรง signature workflow

5. Demo polish
   - flow ลื่น
   - ไม่มีหน้าว่าง
   - ไม่มีจุดให้สะดุด

---

## Final Standard

ถ้าจะให้ "ชนะ" ต้องทำให้ผู้ชมจำ 3 อย่างนี้ได้หลังดูจบ:

- เอกสารทุกฉบับถูกควบคุมได้ตั้งแต่ version ถึง audit
- approval และ signature เชื่อมกันเป็น workflow จริง
- ระบบนี้ให้ทั้ง governance และ visibility ในระดับ enterprise
