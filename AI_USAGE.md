# AI Usage

## LAB 2: AI Usage Summary

| หัวข้อหลัก                      | ข้อมูล / ขอบเขตการทำงาน            | รายละเอียดการดำเนินการ                                                             |
| :------------------------------ | :--------------------------------- | :--------------------------------------------------------------------------------- |
| **1. ข้อมูลเครื่องมือ AI**      | **Tool / Model**                   | ChatGPT-4o, Gemini 1.5 Pro, GitHub Copilot                                         |
|                                 | **วัตถุประสงค์หลัก**               | ระดมความคิดฟีเจอร์, ร่าง Acceptance Criteria และแนะนำการกำหนด Effort (S/M/L)       |
| **2. รายละเอียดการนำ AI ไปใช้** | **Brainstorming Features**         | ขยายไอเดียจาก Persona และ Theme เพื่อสร้าง User Stories เริ่มต้น                   |
|                                 | **Acceptance Criteria Generation** | ร่างเกณฑ์การยอมรับ (Acceptance Criteria) เบื้องต้นสำหรับแต่ละ Issue                |
|                                 | **Effort Estimation**              | วิเคราะห์ความซับซ้อนของฟีเจอร์เพื่อประกอบการประเมิน Size (S/M/L)                   |
| **3. การตรวจสอบโดยมนุษย์**      | **การตรวจทานเกณฑ์ (Verification)** | สมาชิกอ่าน ตรวจสอบความถูกต้อง และปรับแก้เกณฑ์ให้ตรงกับขอบเขตจริง                   |
| _(Human-in-the-Loop)_           | **การตัดสินใจขั้นสุดท้าย**         | - Theme & Persona ตัดสินใจโดยทีม 100%<br>- โหวตตกลง Size และ Priority ร่วมกันในทีม |
|                                 | **Code & Backlog Alignment**       | ทุก Issue และ Pull Request ผ่านการ Review โดยสมาชิกก่อนนำเข้า Board                |

# AI Usage Disclosure (Lab 4)

### 1. Tools Used

- **Tool:** ChatGPT / Gemini (Web Interface)
- **Role:** Co-pilot ช่วยขึ้นโครงร่าง Semantic HTML Structure และออกแบบ CSS Grid Layout สำหรับ Dashboard

---

### 2. Prompts Used (Five S's Framework)

#### Prompt 1 (HTML/CSS Structure)

> **Prompt:** "สร้าง semantic HTML และ pure CSS สำหรับหน้า Learning Statistics Dashboard โทนสีเข้ม มีการ์ดสรุปตัวเลข 4 ใบ, กราฟแท่งจำลองรายสัปดาห์, และแถบแสดงการกระจายความยาก Easy/Medium/Hard ไม่ใช้ framework ภายนอก"

#### Prompt 2 (Interactive Behavior)

> **Prompt:** "เขียน Vanilla JavaScript จัดการ event click สำหรับปุ่ม filter ช่วงเวลา (This Week/Month/All Time) ให้สลับ active class และปุ่ม refresh ข้อมูลที่แสดงข้อความยืนยันเมื่อกด"

---

### 3. AI Generated vs Human Edited Parts

- **ส่วนที่รับจาก AI ตรงๆ (~40%):** โครงร่าง CSS Grid, Reset Styles, และ Layout Skeleton ของกราฟ
- **ส่วนที่เขียน/ปรับแต่งเองโดยนิสิต (≥ 60%):** ปรับแก้ Class names, จัดการ Event Listeners บนปุ่มและ Navigation, เขียนข้อความ Domain-specific ให้ตรงกับ User Story US-04
