# AI Usage

## UI design refinement — 2026-09-20

- **Assistance:** Frontend/design agents reviewed and refined typography, spacing, navigation, page actions, and schedule presentation; the coordinating session integrated changes and handled verification.
- **Scope:** Presentation and navigation clarity only. Existing API contracts, database migrations, and Issue #4/#6/#11 behavior remain the regression targets. No agent guide files were added.
- **Verification:** Production build passed. All 10 existing browser cases passed on desktop/mobile, including Issues #4/#6/#11; after final CSS corrections the two main-flow browser cases passed again. Inspected dashboard, schedule, and course screenshots. Backend tests were not rerun for presentation-only changes.
- **Review status:** Local implementation; human review, merge, deployment, and live AI-provider verification are not claimed.

## Issue #11 — shared course content — 2026-09-19

- **Assistance:** AI-assisted implementation and review of course/note storage, reusable card/note links, deletion guards, shared review filtering, and React screens. Separate backend and frontend reviewers inspected assigned files; the coordinating session integrated and tested the changes.
- **Verification:** 9 unit tests, 16 integration tests, 10 browser cases on desktop/mobile, production build, screenshot review, and diff formatting checks passed. Browser coverage includes Issues #4 and #6.
- **Limits:** No live AI-provider call, deployment, push, human approval, or merge is claimed. Agent workflow guides were not added to the repository.

## Application implementation and Tech Stack migration — 2026-09-11

- **Tool:** Codex.
- **User request:** พัฒนาแอปให้ใช้งานได้ และปรับตาม `docs/architecture/tech_stack.md`.
- **Work produced:** React/Vite UI, Express modules, PostgreSQL migrations/repositories, JWT cookies, document extraction workers, optional OpenAI integration, SQLite import, Docker/CI configuration and development documentation.
- **Verification performed:** 6 service/unit tests, 7 PostgreSQL integration tests (including migration), 2 Chrome end-to-end workflows at desktop/mobile sizes, Vite production build, Compose configuration validation.
- **Limits:** No live AI request or cloud deployment; Docker image execution remains unverified because the local Engine was unavailable. Functional tests do not certify NFR load, uptime or encryption-at-rest targets.
- **Human review:** Implementation was produced by Codex at the user's request. Team code review/PR approval is still required before merging under the project's workflow; no claim of human-authored percentages is made for this change.

---

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
* **Tool:** Gemini / ChatGPT (Web Interface)
* **Role:** Co-pilot ช่วยร่างโครงสร้าง Persona, Scenario, User Stories (INVEST) และ Non-Functional Requirements (NFR)

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
* **ส่วนที่รับจาก AI ตรงๆ (~40%):** โครงสร้างหัวข้อมาตรฐาน, เทมเพลต As a / I want / So that และแนวทางการตั้งตัวชี้วัด NFR
* **ส่วนที่เขียน/ปรับแต่งเองโดยนิสิต (≥ 60%):** ปรับแก้ Pain Points และ Goals ให้ตรงกับบริบทนักศึกษาไทย, ปรับแต่ง Story Points และจัดลำดับความสำคัญ (MoSCoW / Sprint Backlog), กำหนด Acceptance Criteria ให้ตรงกับฟีเจอร์จริงของทีม

---

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

# AI Usage Disclosure (Lab 6)

## Tools Used

- Gemini / ChatGPT

## Prompts Used

1. "ช่วยเช็คไฟล์ .dockerignore ว่าทำไมถึง error response 404 พร้อมบอกวิธีการแก้ให้ครอบคลุม"
2. "ช่วยเขียน Dockerfile แบบ Multi-stage build สำหรับโปรเจกต์ Python/Web ให้มี Non-root user และ Base image ขนาดเล็ก"

## Direct Outputs Received

1. ไฟล์ .dockerignore ที่ Root Directory มีอยู่แล้ว แต่เพื่อให้ครอบคลุมตามเกณฑ์ Lab 6

### Git

.git
.gitignore

### Environment & Secrets

.env
.env.\*

### Python Virtual Environment & Cache

.venv/
venv/
env/
.supercharged/
**pycache**/
_.pyc
_.pyo
\*.pyd

### Dependencies & Logs

\*.log
tests/
coverage/

### IDE / OS specific

.vscode/
.idea/
\*.DS_Store

### Documentation

docs/
\*.md

2.  Dockerfile
    FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt\* ./

RUN if [ -f requirements.txt ];

then pip install --no-cache-dir -r requirements.txt; fi

COPY . .

RUN chown -R nobody:nogroup /app

EXPOSE 8000

USER nobody

CMD ["python", "-m", "http.server", "8000", "--directory", "prototypes/sprint1"]

# AI Usage Disclosure (Lab 7)

## 1. เครื่องมือที่ใช้ (Tools Used)

- GitHub Copilot และ ChatGPT (GPT-4o)

---

## 2. Prompts ที่ใช้งานจริง (Prompts Used)

### Prompt 1:

"ช่วยดูโค้ดในโฟลเดอร์ prototype/ ของโปรเจกต์นี้ให้หน่อย มีตรงไหนที่เป็น code smell บ้าง "

### Prompt 2

"อ่าน src/ ของโปรเจกต์นี้ แล้ว list 5 code smells ที่เจอบ่อยที่สุด พร้อม file/line และเหตุผล

- **Smell ที่เจอ**: อะไร, ที่ไหน (file/line), ทำไมถือว่า smell

- **AI usage**: prompt ที่ใช้ + output (ถ้ามี) + ส่วนที่ทีมเขียนเอง

- **Before/After**: ความยาว function, coupling, testability

- **Lesson**: อะไรที่เรียนรู้ + AI workflow ที่ใช้"

### Prompt 3:

"smell name คืออะไร"

---

## 3. ส่วนที่รับมาจาก AI

## 1

เนื่องจากโปรเจกต์ในสพรินต์นี้ยังเป็นโครงสร้างในส่วนของ Frontend Prototypes และ Documentation เป็นหลัก และยังไม่ได้มีระบบ Backend ที่ซับซ้อน ปัญหา Code Smell ที่เหมาะสมที่สุดสำหรับการหยิบมาทำ Lab 7 ในเวลา 30-45 นาที ตามเงื่อนไขของโจทย์ Lab07-W7_Refactoring_Milestone1 คือ:

แนะนำเลือกใช้ 1 ใน 2 ปัญหาชาเลนจ์นี้:

1. Duplicated Code / Repeated HTML Structure (ในหน้า Prototypes)ลักษณะปัญหา: ไฟล์ HTML ของสมาชิกแต่ละคน (เช่น Nattapon_upload_prototype.html, Waritsara_Dashboard_prototype.html) อาจมีการเขียนโครงสร้าง CSS, Navbar, หรือ Footer ซ้ำ ๆ กันหลายหน้าวิธีแก้เบื้องต้น: ทำการแยกส่วนที่ซ้ำกันออกเป็นส่วนกลาง หรือจัดระเบียบ CSS ให้เป็นระเบียบ (ตามหลัก DRY - Don't Repeat Yourself) เหมาะสำหรับตั้งชื่อ Branch: feature/lab7-refactor-duplicated-code

2. Poor Naming / Semantic Drift (ชื่อตัวแปร คลาส หรือไฟล์ไม่สื่อความหมาย)ลักษณะปัญหา: ชื่อไฟล์ HTML, Class CSS หรือ ID ในหน้า Prototype บางจุดอาจตั้งชื่อตามใจชอบในช่วงแรก ทำให้ไม่สื่อถึงบทบาทหน้าที่ (Role-focused naming) ตามหลัก Pragmatic Programmer วิธีแก้เบื้องต้น: ทำการ Rename ชื่อคลาสหรือไฟล์ให้สื่อความหมายและเป็นมาตรฐานเดียวกันทั้งทีม เหมาะสำหรับตั้งชื่อ Branch: feature/lab7-refactor-poor-naming

## 2

### Refactoring Journal

#### 1. Smell ที่เจอ (Code Smells Identification)

- **Smell ที่เจอ:** Duplicated Code (หรือ Long Method / Poor Naming)
- **ที่ไหน (File/Line):** ระบุชื่อไฟล์และบรรทัดที่พบ เช่น `prototypes/sprint1/Nattapon_upload_prototype.html` (บริเวณโครงสร้างโค้ดซ้ำ ๆ หรือฟังก์ชันที่มีขนาดยาวเกินไป)
- **ทำไมจึงถือว่าเป็น smell:** ละเมิดหลักการ **DRY (Don't Repeat Yourself)** ทำให้เมื่อต้องการแก้ไขดีไซน์หรือโค้ดส่วนกลาง ต้องตามไปแก้หลายจุด เสี่ยงต่อการเกิด Bug ตกหล่น และดูแลรักษายาก (Maintainability ต่ำ)

---

#### 2. AI Usage

- **Prompt ที่ใช้:**
  > `"ช่วยอ่าน source code โครงสร้างหน้า Prototype นี้ แล้วแนะนำวิธี Refactor โค้ดส่วนที่ซ้ำซ้อนให้เป็นระเบียบตามหลัก DRY"`
- **Output ที่ได้ (จาก AI):** AI เสนอแนวทางการแยกส่วนโครงสร้างที่ซ้ำซ้อนหรือยุบรวมฟังก์ชัน
- **ส่วนที่ทีมเขียนเอง:** ทีมทำการคัดเลือกโครงสร้างที่เหมาะสมที่สุด ลงมือแก้ไขโค้ดจริงด้วยตนเอง $\ge$ 70% และตรวจสอบความถูกต้องผ่านการรันเทสจริง

---

#### 3. Before / After

- **ความยาว Function / บรรทัดโค้ด:** ลดจำนวนบรรทัดที่ซ้ำซ้อนลง (เช่น จากเดิมมีโค้ดชุดเดียวกันกระจายอยู่หลายหน้า เหลือเพียงชุดเดียวหรือจัดระเบียบให้สะอาดขึ้น)
- **Coupling:** ลดความผูกพันแน่นหนาของโค้ดแต่ละส่วน ทำให้แต่ละไฟล์มีความเป็นอิสระมากขึ้น
- **Testability:** โค้ดมีความเป็นระเบียบและตรวจสอบพฤติกรรมได้ง่ายขึ้น

---

#### 4. Lesson Learned

- **สิ่งที่เรียนรู้:** การทำ Refactor ทีละนิดอย่างมีวินัย (_Refactor Early, Refactor Often_ ตามปรัชญา Pragmatic Programmer) และการยึดหลัก _Tests pass ก่อนลงมือแก้_
- **AI Workflow ที่ใช้:** ใช้ GenAI เป็น Co-pilot ตามแนวทาง **Explain → Propose → Apply → Test** โดยทีมต้องเป็นผู้ทำความเข้าใจและเขียนโค้ดเอง ไม่ปล่อยให้ AI ทำทั้งหมด (_PP Tip 62 - Deliberate Programming_)

## 3

คำว่า smell name ในชื่อ Branch (feature/lab7-refactor-smell-name) คือ ชื่อของ Code Smell (กลิ่นของโค้ดที่ไม่ดี) ที่คุณเลือกนำมาทำการ Refactor ใน Lab 7 ครับ

เวลาลงมือสร้าง Branch จริง คุณจะต้องเปลี่ยนคำว่า smell name ให้เป็นชื่อย่อหรือชื่อของปัญหานั้น ๆ เป็นภาษาอังกฤษแบบกระชับ เช่น:ถ้าคุณเลือกแก้ปัญหาฟังก์ชันยาวเกินไป (Long Method)

อาจตั้งชื่อว่า:feature/lab7-refactor-long-methodถ้าคุณเลือกแก้ปัญหาการตั้งชื่อตัว/ฟังก์ชันไม่สื่อความหมาย (Poor Naming / Semantic Drift)

อาจตั้งชื่อว่า:feature/lab7-refactor-poor-namingถ้าคุณเลือกแก้ปัญหาโค้ดซ้ำซ้อน (Duplicated Code)

อาจตั้งชื่อว่า:feature/lab7-refactor-duplicated-codeสรุปคือ:

แทนที่จะพิมพ์คำว่าsmell name ตรง ๆ ให้เลือก 1 ปัญหาที่คุณเจอในโค้ดของทีม แล้วเอามาใส่ต่อท้ายแทนครับ


## Issue #3 — 2026-09-20

ใช้ AI ช่วยตรวจเกณฑ์ GitHub, แก้ตัวอ่าน PDF/PPTX และสถานะอัปโหลด, เขียนและทดสอบกรณีผิดพลาด แบ่งงานตัวอ่านเอกสารและ browser tests โดยกำหนดเจ้าของไฟล์ ตรวจพบ native PDF reader หยุดโปรเซสเป็นบางครั้ง จึงเปลี่ยนเป็น child process ที่จำกัด heap/เวลาและทดสอบอ่าน PDF พร้อมกัน

ผลตรวจ: unit 16/16, integration 16/16, browser 12/12 รวม regression #4 #6 #11, production build ผ่าน AI generation ใช้ผลจำลองในการทดสอบ ยังไม่ได้ตรวจบริการ AI จริงหรือรับรองความถูกต้องของเนื้อหาที่โมเดลสร้าง ทีมต้องรีวิวก่อนรวมงาน


## Issue #5 — 2026-09-20

ใช้ AI ช่วยพัฒนาคลังเอกสารต้นฉบับในหน้าคลังโน้ต แบ่งเจ้าของไฟล์ backend/migration, frontend และ browser tests เก็บไฟล์และข้อความใน PostgreSQL ตรวจสิทธิ์เจ้าของ ดาวน์โหลดต้นฉบับ ค้นหาร่วมกับโน้ต เปลี่ยนชื่อและลบ

ตรวจสอบ unit 16/16, integration 19/19, browser 14/14 รวม #3 #4 #6 #11 และ production build ผ่าน รายการข้อจำกัดและสิ่งที่ยังไม่ทดสอบบันทึกใน docs/testing/issue-5.md; ทีมต้องรีวิวก่อนรวมงาน


## Issue #7 — 2026-09-21

ใช้ AI ช่วยพัฒนาสถิติการ์ดไม่ซ้ำ สถิติรายชุด คำแนะนำตามเกณฑ์ 3 ครั้ง/ต่ำกว่า70% และประวัติ30วัน แบ่งเจ้าของไฟล์ backend/frontend/tests โดยไม่เปลี่ยนตารางทบทวน ตรวจภาพ desktop/mobile แล้ว

Unit19/19 เมื่อรันแยก, integration20/20, browser14/16 ในรอบแรก แก้ selector ที่กำกวมใน workflow เดิมแล้วรันซ้ำอีก2/2ผ่าน, production build ผ่าน บันทึก PDF timeout เมื่อรันทดสอบหลายชุดพร้อมกันใน docs/testing/issue-3.md และผลละเอียดใน issue-7.md ทีมต้องรีวิวก่อนรวมงาน


## Issue #8 — 2026-09-23

ใช้ AI ช่วยเพิ่มระดับ beginner/intermediate/advanced พร้อม rubric และคำสั่งตรวจความยากโดยยึดเอกสาร ผู้ใช้เลือกระดับใน Editor และรักษาร่างเดิมเมื่อล้มเหลว แบ่งเจ้าของ backend กับ browser tests ตรวจแนวทาง OpenAI Structured Outputs โดยไม่เปลี่ยนโมเดลหรือเรียกบริการจริง

Unit26ผ่าน (generationตรวจซ้ำ9ผ่านหลังแก้ข้อความผลว่าง), integration21ผ่าน, browser16ผ่านและอีก2ผ่านหลังแก้ชื่อช่องเพื่อการเข้าถึง, buildผ่าน รายละเอียดและ ACด้านคุณภาพที่ยังต้องทดสอบจริงอยู่ใน docs/testing/issue-8.md

## 2026-09-24 — Issue #9 Pomodoro verification

AI reviewed the existing Pomodoro implementation at 10266e0, added responsive timer/banner styling and browser coverage, and recorded actual validation and remaining limitations in docs/testing/issue-9.md. Work was isolated on feat/pomodoro-review in .local/issue9 to preserve unrelated Lab 9 edits. Build passed; 8/8 Chrome desktop/mobile viewport tests passed for #9 and regressions #4/#6 using the real test API/database. No live AI calls, new API, migration, push, or merge. Real-device sleep/background notifications remain unverified; timer state resets on reload/logout. Human team review remains required.

## Issue #10 — 2026-09-26 continuation

AI implemented centralized refresh, optimistic revision checks, owner-scoped durable retry receipts, draft-preserving sync failure handling, and cross-session browser tests. Backend commit f31c39e contains the schema/API work. Independent frontend audit found two route-change stale-draft risks; both were fixed and regression cases added. Previous full browser run reached the auth rate limit; only the isolated test-server allowance was increased, with production forced to retain 20 attempts per five minutes. Remaining deployment, real-device, offline, and retention limitations are recorded in docs/testing/issue-10.md. No push or merge.
