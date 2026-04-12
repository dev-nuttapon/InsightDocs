# InsightDocs Demo Script

## โหมดที่ใช้

- เปิด frontend ด้วย `VITE_DEMO_MODE=true`
- เริ่มต้นที่หน้า `/dashboard`
- ถ้าต้องการเริ่มใหม่ ให้กดปุ่ม `รีเซ็ตโหมดสาธิต` บน dashboard

## ลำดับการสาธิตที่แนะนำ

### 1. เปิด Dashboard

สิ่งที่ควรพูด:

- InsightDocs ไม่ได้เป็นแค่ระบบเก็บเอกสาร แต่ควบคุม workflow ตั้งแต่ version, approval, signature จนถึง audit
- หน้า dashboard แสดงภาพรวมที่ไปต่อได้ทันที ไม่ใช่เพียง metric แบบ admin tool ทั่วไป

สิ่งที่ควรกด:

- `เปิดเอกสารหลักของ demo`

### 2. เปิด Document Detail ของ `demo-contract-001`

สิ่งที่ควรพูด:

- หน้านี้เป็น flagship screen ของระบบ
- เห็น metadata, current version, สถานะ, ลำดับงานถัดไป และภาพจำลอง PDF พร้อมตำแหน่งลายเซ็นในหน้าเดียว

สิ่งที่ควรกด:

- ดู `Versions`
- ดู `Signatures`
- ดู `Approval & Audit`

### 3. แสดง Version Control

สิ่งที่ควรพูด:

- ทุกครั้งที่อัปเดตไฟล์ จะไม่ทับของเดิม แต่สร้าง version ใหม่
- ระบบเก็บ checksum, ผู้แก้, เวลาแก้, และรองรับ restore แบบปลอดภัย

สิ่งที่ควรกด:

- อัปโหลดเวอร์ชันตัวอย่างใหม่
- กู้คืน version เก่า 1 ครั้ง

### 4. แสดง Approval Flow

สิ่งที่ควรพูด:

- การอนุมัติแยกจากการลงนาม
- ผู้ควบคุมเอกสารส่ง review และผู้จัดการตัดสินใจ approve/reject ได้จาก workflow ที่ชัดเจน

สิ่งที่ควรกด:

- ไปหน้า `/approvals`
- เปิดเอกสารที่รออนุมัติ
- อนุมัติหรือปฏิเสธในคิวตัวอย่าง

### 5. แสดง Signature Flow

สิ่งที่ควรพูด:

- ลายเซ็นของ InsightDocs ไม่ได้เป็นแค่ log แต่ผูกกับตำแหน่งบนเอกสารและลำดับผู้ลงนาม
- ใน demo นี้แสดง hybrid signature คือมีทั้งข้อมูล digital signature และ visible signature appearance

สิ่งที่ควรกด:

- ไปหน้า `/signatures`
- เปิดเอกสารหลักของ demo
- ในแท็บ `Signatures` เพิ่มผู้ลงนามตัวอย่างหรือจำลองการลงนาม

### 6. แสดง Search

สิ่งที่ควรพูด:

- ผู้ใช้ไม่จำเป็นต้องจำว่าเอกสารอยู่ในขั้นไหน เพราะค้นหาจาก metadata และสถานะ workflow ได้
- ผลลัพธ์แสดง summary ของ signature และ version พร้อมเปิดดูรายละเอียดได้ทันที

สิ่งที่ควรกด:

- ไปหน้า `/search`
- ค้นหาคำว่า `สัญญา`
- เปิดเอกสารจากผลลัพธ์

### 7. แสดง Audit

สิ่งที่ควรพูด:

- ทุกเหตุการณ์สำคัญถูก trace ได้ว่าใครทำอะไร เมื่อไร กับเอกสารหรือเวอร์ชันใด
- ทำให้เห็น governance และ operational visibility ระดับองค์กร

สิ่งที่ควรกด:

- ไปหน้า `/audit-logs`
- เลือก event `อนุมัติเอกสาร` หรือ `ลงนามเอกสาร`
- เปิดกลับไปยังเอกสารตัวอย่าง

## ประโยคสรุปท้าย demo

- InsightDocs ควบคุมเอกสารได้ตั้งแต่ version ถึง audit
- approval และ signature เชื่อมกันเป็น workflow จริง
- ระบบให้ทั้ง governance และ visibility ในระดับ enterprise
