# Exit Ticket (Lab 6)

### B1. Apply — DRY Hunt

Duplication ที่พบ: Data Validation Logic ซ้ำซ้อน (พบการตรวจสอบความยาวข้อความและการดักจับค่าว่างซ้ำกันทั้งใน Controller และ Service)

ประเภท: Logic Duplication

วิธีแก้: แยก Validation Logic ออกมาเป็น Middleware / Helper Function กลาง เพื่อให้ทุก Endpoint เรียกใช้งานร่วมกันจากจุดเดียว

### B2. Connect — Orthogonality Check

โมดูลที่ตรวจ: การคำนวณคะแนน Spaced Repetition ผูกติดกับ Database Model โดยตรง

ผลการตรวจ: ถ้าเปลี่ยน Schema ฐานข้อมูล (A) โค้ดส่วนคำนวณอัลกอริทึม (B) จะพังและต้องแก้ตามไปด้วย

วิธี Decoupling: ใช้หลักการ Dependency Inversion โดยส่งเฉพาะ Data Object บริสุทธิ์ (DTO) เข้าไปในฟังก์ชันคำนวณ เพื่อตัดการพึ่งพา Database ออกจาก Business Logic

### B3. Reflect — Refactoring Plan

Code Smell: Long Function (ฟังก์ชันสร้างแฟลชการ์ดมีความยาวเกิน 80 บรรทัด รวมทั้งการอ่านไฟล์, คุยกับ AI, และบันทึกลง DB)

Before / After:

Before: รวมทุกกระบวนการไว้ในฟังก์ชันเดียว

After: แตกเป็น 3 ฟังก์ชันย่อยตาม Single Responsibility Principle (parseDocument, generateWithAI, saveFlashcards)

Tests: เขียน Unit Test ครอบคลุมฟังก์ชันย่อยแต่ละตัวก่อนเริ่ม Refactor เพื่อป้องกัน Regression

AI Workflow: ใช้ AI ช่วยระบุ Code Smell และแนะนำโครงสร้าง Clean Code โดยทีมเป็นผู้ตรวจทานผลลัพธ์และรัน Unit Test ยืนยัน 100%

# Exit Ticket (Lab 7)

### B1. Apply — DRY Hunt

**Duplication ที่พบ:** ตรวจสอบความยาวข้อความและดักจับค่าว่างซ้ำกันทั้งใน Controller และ Service

**ประเภท:** Logic Duplication

**วิธีแก้:** รวม Validation Logic ไว้ที่ Middleware หรือ Helper function กลาง เพื่อให้ทุก Endpoint เรียกใช้ร่วมกันจากที่เดียว

---

### B2. Connect — Orthogonality Check

**โมดูลที่ตรวจ:** ฟังก์ชันคำนวณคะแนน Spaced Repetition ผูกติดกับ Database Model โดยตรง

**ผลกระทบ:** ถ้าแก้ไข Schema ในฐานข้อมูล (A) โค้ดคำนวณอัลกอริทึม (B) จะพังและต้องแก้ตาม

**วิธี Decoupling:** ส่งเฉพาะ Data Transfer Object (DTO) เข้าไปในฟังก์ชันคำนวณ เพื่อแยก Business Logic ออกจาก Database Schema

---

### B3. Reflect — Refactoring Plan

**Code Smell:** Long Function (ฟังก์ชันสร้างแฟลชการ์ดยาวกว่า 80 บรรทัด รวมทั้งอ่านไฟล์, คุยกับ AI และบันทึก DB)

**Before:** ทุกกระบวนการกองรวมกันในฟังก์ชันเดียว

**After:** แตกเป็น 3 ฟังก์ชันย่อยตาม SRP (`parseDocument`, `generateWithAI`, `saveFlashcards`)

**Tests:** เขียน Unit Test ครอบคลุมฟังก์ชันเดิมก่อนเริ่มปรับโค้ด เพื่อป้องกัน Regression

**AI Workflow:** ใช้ AI ช่วยชี้จุด Code Smell และแนะนำโครงสร้าง ส่วนทีมเป็นผู้ตรวจทาน logic และรัน Unit Test ยืนยันผลลัพธ์
