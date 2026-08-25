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

# AI Usage Disclosure (Lab 3: Requirements Engineering)

### 1. Tools Used

- **Tool:** Gemini / ChatGPT (Web Interface)
- **Role:** Co-pilot ช่วยร่างโครงสร้าง Persona, Scenario, User Stories (INVEST) และ Non-Functional Requirements (NFR)
# AI Usage Disclosure (Lab 4)

### 1. Tools Used

- **Tool:** ChatGPT / Gemini (Web Interface)
- **Role:** Co-pilot ช่วยขึ้นโครงร่าง Semantic HTML Structure และออกแบบ CSS Grid Layout สำหรับ Dashboard

---

### 2. Prompts Used (Five S's Framework)

#### Prompt 1 (Persona & Scenarios)

> **Prompt:** "ช่วยสร้าง User Persona และ Scenario สำหรับนักศึกษาและ Lifelong Learner ที่ต้องการใช้แอป Smart Flashcards เพื่อเตรียมสอบและทบทวนความรู้ด้วยระบบ Spaced Repetition โดยระบุ Goals, Frustrations และ Scenario การใช้งานจริง"

#### Prompt 2 (User Stories & Acceptance Criteria)

> **Prompt:** "ร่าง User Stories สำหรับระบบ Flashcard พร้อม Acceptance Criteria ตามเกณฑ์ INVEST โดยครอบคลุมฟีเจอร์: การสกัดเนื้อหาจาก PDF, โหมดทบทวน SRS, แดชบอร์ดสถิติ และ Pomodoro Timer"

#### Prompt 3 (NFR Documentation)

> **Prompt:** "ช่วยระบุ Non-Functional Requirements (NFR) 4 ด้าน (Performance, Usability, Reliability, Security) สำหรับเว็บแอปพลิเคชันเพื่อการศึกษา พร้อมทั้ง Metric และ Target Value ที่วัดผลได้จริง"

---

### 3. AI Generated vs Human Edited Parts

- **ส่วนที่รับจาก AI ตรงๆ (~40%):** โครงสร้างหัวข้อมาตรฐาน, เทมเพลต As a / I want / So that และแนวทางการตั้งตัวชี้วัด NFR
- **ส่วนที่เขียน/ปรับแต่งเองโดยนิสิต (≥ 60%):** ปรับแก้ Pain Points และ Goals ให้ตรงกับบริบทนักศึกษาไทย, ปรับแต่ง Story Points และจัดลำดับความสำคัญ (MoSCoW / Sprint Backlog), กำหนด Acceptance Criteria ให้ตรงกับฟีเจอร์จริงของทีม

---

# AI Usage Disclosure (Lab 5)

### 1. Tools Used

- **Tool:** Gemini (Web Interface)
- **Role:** Co-pilot ช่วยขึ้นโครงสร้าง Mermaid C4 Syntax และตรวจสอบความครบถ้วนของ ADR ตามมาตรฐาน Michael Nygard

---

### 2. Prompts Used (Five S's Framework)

#### Prompt 1 (Mermaid C4 Syntax)

> **Prompt:** "สร้าง Mermaid diagram สำหรับ C4 Model Level 1 (Context) และ Level 2 (Container) ของระบบ Smart Flashcards ที่มี React SPA, Node.js API, PostgreSQL DB และ External LLM API โดยระบุ Technology Label และ Protocol ครบถ้วน"

#### Prompt 2 (ADR Trade-off Challenge)

> **Prompt:** "ช่วยวิเคราะห์ผลกระทบ (Consequences) ทั้งข้อดีและข้อเสียของการเลือก Modular Monolith เทียบกับ Microservices สำหรับโปรเจกต์นักศึกษา 4 คน เวลา 8 สัปดาห์ ในรูปแบบ ADR Michael Nygard"
#### Prompt 1 (HTML/CSS Structure)

> **Prompt:** "สร้าง semantic HTML และ pure CSS สำหรับหน้า Learning Statistics Dashboard โทนสีเข้ม มีการ์ดสรุปตัวเลข 4 ใบ, กราฟแท่งจำลองรายสัปดาห์, และแถบแสดงการกระจายความยาก Easy/Medium/Hard ไม่ใช้ framework ภายนอก"

#### Prompt 2 (Interactive Behavior)

> **Prompt:** "เขียน Vanilla JavaScript จัดการ event click สำหรับปุ่ม filter ช่วงเวลา (This Week/Month/All Time) ให้สลับ active class และปุ่ม refresh ข้อมูลที่แสดงข้อความยืนยันเมื่อกด"

---

### 3. AI Generated vs Human Edited Parts

- **ส่วนที่รับจาก AI ตรงๆ (~40%):** โครงสร้าง Mermaid Syntax boilerplate และหัวข้อเทมเพลต ADR
- **ส่วนที่เขียน/ปรับแต่งเองโดยนิสิต (≥ 60%):** ปรับแก้ความสัมพันธ์ของ Component ให้ตรงกับ User Stories ของทีม (SRS Review, Learning Statistics) และกำหนด Rationale ใน Tech Stack ให้สะท้อนข้อจำกัดจริงของโปรเจกต์
- 
- **ส่วนที่รับจาก AI ตรงๆ (~40%):** โครงร่าง CSS Grid, Reset Styles, และ Layout Skeleton ของกราฟ
- **ส่วนที่เขียน/ปรับแต่งเองโดยนิสิต (≥ 60%):** ปรับแก้ Class names, จัดการ Event Listeners บนปุ่มและ Navigation, เขียนข้อความ Domain-specific ให้ตรงกับ User Story US-04
