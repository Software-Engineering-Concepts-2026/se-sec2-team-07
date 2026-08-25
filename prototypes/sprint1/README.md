# Sprint 1 Prototype: Learning Statistics & Dashboard

## 1. Feature & User Story Reference

- **Feature:** แดชบอร์ดสรุปสถิติความก้าวหน้าและการวิเคราะห์ผลการเรียนรู้ (Learning Statistics Dashboard)
- **User Story:** อ้างอิง **US-04** (แดชบอร์ดสรุปสถิติและความก้าวหน้าในการเรียนรู้) จาก `docs/requirements/user-stories.md`

---

## 2. Tracer Bullet vs Prototype Decision

- **แนวทางที่เลือก:** **Tracer Bullet**
- **เหตุผล:** ทีมต้องการวางโครงสร้างหน้าจอ Dashboard, Grid Layout, ตัวกรองช่วงเวลา (Filter Controls) และ Card Component ต่างๆ ไว้เป็นแกนหลักเพื่อต่อยอดเชื่อมต่อกับ Backend API, User Session และฐานข้อมูลสถิติจริงใน Sprint 2 โดยไม่ต้องรื้อโครงสร้าง UI นี้ทิ้ง

---

## 3. สิ่งที่ระบบทำได้ (Implemented Capabilities)

1. **Interactive Filter Controls:** มีปุ่มสลับช่วงเวลาการดูสถิติ (This Week, This Month, All Time) พร้อม Active State
2. **Stats Summary & Visual Layout:** แสดงการ์ดสถิติสำคัญ (Today's Cards, Weekly Count, Accuracy %, Study Time), Streak Tracker และ Distribution Bar
3. **Interactive Mock Actions:** มีปุ่ม Refresh ข้อมูลสถิติจำลอง และการตอบสนองเมื่อกดเมนู Navigation Bar

---

## 4. สิ่งที่ไม่ได้ทำใน Prototype นี้ (Deliberately Out of Scope)

- **Real Backend Analytics:** ยังไม่มีการคำนวณสถิติจากฐานข้อมูลจริง (ใช้ Mock Data แสดงผล)
- **Dynamic Chart Rendering:** โครงสร้างกราฟใช้ CSS Placeholder แทนการใช้ไลบรารีภายนอก (Chart.js/D3.js) ตามข้อกำหนดที่ไม่ให้ใช้ external framework ในแล็บนี้
- **User Authentication:** ยังไม่มีการผูกสถิติแยกตาม Account ผู้ใช้งานจริง

---

## 5. Next Steps for Sprint 2

- พัฒนา REST API เพื่อดึงข้อมูลประวัติการทบทวนรายวันและรายสัปดาห์จากฐานข้อมูลจริง
- เชื่อมโยงข้อมูลความแม่นยำ (Accuracy Trend) เข้ากับผลการประเมิน Easy/Medium/Hard จากโหมดทบทวนการ์ด (SRS)
