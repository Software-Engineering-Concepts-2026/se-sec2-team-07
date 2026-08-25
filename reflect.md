# Post-quiz 5: Architectural Decisions & Tech Stack Reflection

### 1. ADR Reflection (Architecture Decision Record)

การบันทึกการตัดสินใจตามมาตรฐานของ Michael Nygard ช่วยให้ทีมมีกรอบคิดที่เป็นรูปธรรมในการชั่งน้ำหนักข้อดีและข้อเสีย (Consequences) โดยเฉพาะการเลือก Modular Monolith ในระยะแรก ซึ่งช่วยลดภาระด้าน DevOps และการจัดการ Infrastructure ในช่วงเวลาจำกัด ทำให้ทีมโฟกัสกับการส่งมอบคุณค่าหลักของระบบได้ทันเวลา

### 2. C4 Diagrams Reflection

การเขียนไดอะแกรม C4 (System Context และ Container) ด้วย Mermaid ทำให้ทีมเห็นภาพตรงกันเกี่ยวกับขอบเขตของระบบ (System Boundary) ทราบหน้าที่ของแต่ละ Component ชัดเจน ทั้งส่วนของ Web App, API Server, Database และการเชื่อมต่อไปยังระบบภายนอกอย่าง External AI Service ก่อนที่จะเริ่มเขียนโค้ดจริง

### 3. Tech Stack Trade-offs Reflection

การเลือกเทคโนโลยีในแต่ละ Layer (เช่น Node.js + Express, PostgreSQL, React) ผ่านการพิจารณาบนพื้นฐานของความเข้ากันได้ ความยืดหยุ่นของข้อมูล (JSONB สำหรับ Flashcard metadata) และ Non-Functional Requirements มากกว่าความชอบส่วนบุคคล ทำให้ระบบมีความเสถียรและพร้อมสำหรับการพัฒนาต่อใน Sprint 2
