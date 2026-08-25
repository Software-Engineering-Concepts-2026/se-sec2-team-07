# Exit Ticket (Lab 3)

### B1. Apply — Magic Shipping

ถ้าลูกค้าบอกว่าอยากได้ระบบแจ้งเตือนโปรโมชัน คำถามสำคัญที่ผมจะถามต่อเพื่อให้ requirement ชัดเจนคือ อยากให้ส่งแจ้งเตือนช่วงเวลาไหนและมีเงื่อนไขอะไรบ้างเพื่อไม่ให้รบกวนผู้ใช้, ต้องการส่งหาทุกคนแบบหว่านแหหรืออยากให้คัดกรองตามความสนใจของแต่ละคน, และผู้ใช้มีสิทธิ์ตั้งค่าเปิด-ปิดหรือจำกัดจำนวนแจ้งเตือนต่อวันเองได้ไหม

### B2. Connect — NFR

ผมเลือกแอป Grab ครับ โดย NFR สำคัญคือเรื่อง Performance ที่หน้าค้นหาและโหลดรายการต้องแสดงผลให้เสร็จภายใน 1.5 วินาที โดยวัดผลจากค่า Response Time บนระบบ APM เพราะถ้าแอปโหลดช้าเกินไป ผู้ใช้จะหงุดหงิด รู้สึกว่าระบบไม่เสถียร และอาจปิดแอปหนีไปสั่งของกับเจ้าอื่นแทนทันที

### B3. Reflect — User Story

สำหรับ Sprint 1 ผมเลือกเรื่องนี้ครับ:
"As a นักศึกษาวิทยาการคอมพิวเตอร์ชั้นปีที่ 2, I want ระบบสร้างแฟลชการ์ดจากไฟล์สรุปหรือสไลด์ PDF อัตโนมัติ, So that ฉันสามารถเตรียมเนื้อหาทบทวนสอบได้ทันโดยไม่ต้องเสียเวลาพิมพ์เองทีละใบ"

# Exit Ticket (Lab 4)

### B1. Apply — Prompt Critique (Five S's)

**Prompt ใหม่:**
"ในโปรเจกต์ Python ช่วยเขียนฟังก์ชัน `calculate_discount(price, discount_percent, is_vip=False)` ให้หน่อยครับ โดยถ้า is_vip เป็น True ให้ลดเพิ่มอีก 5%, ถ้ารวมแล้วลดเกิน 50% ให้คิดแค่ 50%, และถ้าใส่ price ติดลบให้แจ้ง error ด้วย ขอโค้ดสั้นๆ พร้อมตัวอย่างวิธีเรียกใช้ 2 บรรทัดครับ"

**คำอธิบายตามหลัก 5 S's:**

- **Structured:** เรียงลำดับจากโจทย์ เงื่อนไข และรูปแบบคำตอบที่ต้องการ
- **Surrounding:** บอกว่าเป็นโค้ด Python
- **Single task:** สั่งแค่เขียนฟังก์ชันคำนวณส่วนลดอย่างเดียว
- **Specific:** บอกชื่อฟังก์ชัน ตัวแปร และเงื่อนไข VIP ชัดเจน
- **Short:** เขียนกระชับ ไม่เยิ่นเย้อ ได้ใจความครบ

---

### B2. Connect — AI ในงานที่ใช้

**Task ที่ AI ช่วยได้จริง:** ให้ช่วยคิดโจทย์หรือเคสทดสอบ (Test cases) แปลกๆ และช่วยเขียนฟังก์ชันคำนวณง่ายๆ ที่มีสูตรชัดเจน เพราะช่วยประหยัดเวลาพิมพ์โค้ดไปได้เยอะ
**Task ที่ AI ไม่ควรใช้:** การออกแบบโครงสร้างระบบหรือโฟลว์ความปลอดภัยตอนล็อกอิน เพราะ AI อาจไม่เข้าใจเงื่อนไขจริงของระบบเราทั้งหมด และถ้าโค้ดมีช่องโหว่จะตามแก้ลำบาก

---

### B3. Reflect — AI Strategy (Lab 4 Starter Prototype)

ใน Lab 4 จะใช้ AI ช่วย **ขึ้นโครงหน้าตาเว็บ (UI) คร่าวๆ กับทำข้อมูลจำลอง (Mock Data)** เพื่อให้ทีมมีหน้าจอต้นแบบมาลองเล่นและเห็นภาพตรงกันก่อน แล้วค่อยช่วยกันเขียนโค้ดส่วน Logic จริงต่อครับ

# Post-quiz 5: Architectural Decisions & Tech Stack Reflection

### 1. ADR Reflection (Architecture Decision Record)

การบันทึกการตัดสินใจตามมาตรฐานของ Michael Nygard ช่วยให้ทีมมีกรอบคิดที่เป็นรูปธรรมในการชั่งน้ำหนักข้อดีและข้อเสีย (Consequences) โดยเฉพาะการเลือก Modular Monolith ในระยะแรก ซึ่งช่วยลดภาระด้าน DevOps และการจัดการ Infrastructure ในช่วงเวลาจำกัด ทำให้ทีมโฟกัสกับการส่งมอบคุณค่าหลักของระบบได้ทันเวลา

### 2. C4 Diagrams Reflection

การเขียนไดอะแกรม C4 (System Context และ Container) ด้วย Mermaid ทำให้ทีมเห็นภาพตรงกันเกี่ยวกับขอบเขตของระบบ (System Boundary) ทราบหน้าที่ของแต่ละ Component ชัดเจน ทั้งส่วนของ Web App, API Server, Database และการเชื่อมต่อไปยังระบบภายนอกอย่าง External AI Service ก่อนที่จะเริ่มเขียนโค้ดจริง

### 3. Tech Stack Trade-offs Reflection

การเลือกเทคโนโลยีในแต่ละ Layer (เช่น Node.js + Express, PostgreSQL, React) ผ่านการพิจารณาบนพื้นฐานของความเข้ากันได้ ความยืดหยุ่นของข้อมูล (JSONB สำหรับ Flashcard metadata) และ Non-Functional Requirements มากกว่าความชอบส่วนบุคคล ทำให้ระบบมีความเสถียรและพร้อมสำหรับการพัฒนาต่อใน Sprint 2

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