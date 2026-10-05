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

- **Tool:** Gemini / ChatGPT (Web Interface)
- **Role:** Co-pilot ช่วยร่างโครงสร้าง Persona, Scenario, User Stories (INVEST) และ Non-Functional Requirements (NFR)

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
