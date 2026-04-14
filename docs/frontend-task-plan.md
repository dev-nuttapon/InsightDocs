# InsightDocs Frontend Task Plan

## Purpose

เอกสารนี้ใช้สำหรับวางงาน `frontend` ที่ต้องทำต่อให้ครบในมุม product UI จริง

ขอบเขตของไฟล์นี้:

- routing
- screen structure
- production UI behavior
- shared components
- i18n
- theming
- responsive behavior

ไม่รวม:

- backend contracts
- presentation-only mock narrative
- demo script

---

## Current Goal

ทำให้ frontend ใช้เป็น source of truth สำหรับ API และพร้อมต่อข้อมูลจริงโดยไม่ต้องรื้อ UX ใหญ่

---

## Completion Criteria

frontend ถือว่าพร้อมเมื่อ:

1. flagship pages นิ่งในเชิง structure
2. supporting screens ไม่พังและสม่ำเสมอ
3. loading / error / empty states ใช้งานได้จริง
4. theme และ language ไม่หลุด
5. responsive ผ่านหน้าหลัก
6. ไม่มี raw status/enum ที่ทำลาย UX

---

## Phase 1: Screen Contract Freeze

### Goal

หยุดการขยับโครงหน้าใหญ่ ๆ และล็อกสิ่งที่แต่ละหน้าต้องแสดง

### Tasks

1. ตรวจ flagship pages ว่า section ไหนจำเป็นจริง
2. ตรวจ supporting pages ว่าหน้าไหนพอแล้ว
3. ล็อก CTA หลักของแต่ละหน้า
4. ล็อก state ที่แต่ละหน้าต้องรองรับ

### Done

- หน้าไม่ขยับ concept ไปมา
- ใช้เป็นฐานต่อ API ได้

---

## Phase 2: UX Completeness

### Goal

ทำให้ flow ใช้งานจริงครบทั้งหน้าหลักและ supporting screens

### Tasks

1. loading state ต่อหน้า
2. error state ต่อหน้า
3. empty state ต่อหน้า
4. status language consistency
5. action hierarchy consistency

### Done

- ผู้ใช้เข้าใจแต่ละหน้าได้โดยไม่ต้องเดา
- ไม่มี state แปลกที่ดูเหมือนระบบพัง

---

## Phase 3: Responsive and Polish

### Goal

ทำให้ทุกหน้าหลักใช้ได้บน desktop, tablet, mobile

### Tasks

1. responsive pass รายหน้า
2. spacing pass
3. typography / hierarchy pass
4. side rail / action wrap / table readability pass

### Done

- ไม่มี text overlap
- CTA ไม่ล้น
- หน้าหลักยังอ่านง่ายบนจอเล็ก

---

## Phase 4: Readiness Before API

### Goal

ทำให้ frontend นิ่งพอสำหรับเริ่มผูก API จริง

### Tasks

1. ตรวจ mock fields vs real required fields
2. แยก mock-only logic จาก reusable screen logic
3. ตรวจ shared components ที่ควรใช้ต่อได้หลังต่อ API
4. ปิด visual regressions สำคัญ

### Done

- frontend พร้อมให้ backend ยึดตาม
- ไม่ต้องรื้อ layout ใหญ่หลังต่อ API

---

## Strict Priority Order

1. flagship screens
2. supporting screens
3. responsive/polish
4. API readiness cleanup
