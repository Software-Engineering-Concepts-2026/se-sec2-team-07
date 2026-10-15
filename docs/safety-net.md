# Safety Net ของทีม <ชื่อทีม>

## 1. ฟังก์ชันที่เลือกทดสอบ

- **ฟังก์ชัน:** `calculate_next_review(score)` — อยู่ไฟล์ `src/review.py`
- **เหตุผลที่เลือก:** เป็น business logic สำหรับกำหนดระยะเวลาทบทวน Flashcard ครั้งถัดไป ซึ่งมีผลต่อการทำงานของระบบ Spaced Repetition และสามารถทดสอบได้โดยไม่พึ่ง Database หรือ API

## 2. เทสต์ที่เขียน (≥ 5 ตัว)

| #   | ชื่อเทสต์                                | ประเภท   | ยืนยันอะไร                              |
| --- | ---------------------------------------- | -------- | --------------------------------------- |
| 1   | `test_score_two_returns_three_days`      | happy    | score = 2 ทบทวนอีกครั้งใน 3 วัน         |
| 2   | `test_score_four_returns_fourteen_days`  | happy    | score = 4 ทบทวนอีกครั้งใน 14 วัน        |
| 3   | `test_minimum_score_returns_one_day`     | boundary | score ต่ำสุด = 0 ทบทวนอีกครั้งใน 1 วัน  |
| 4   | `test_maximum_score_returns_thirty_days` | boundary | score สูงสุด = 5 ทบทวนอีกครั้งใน 30 วัน |
| 5   | `test_negative_score_raises_error`       | error    | score ติดลบ `ValueError`                |
| 6   | `test_score_above_five_raises_error`     | error    | score มากกว่า 5 `ValueError`            |

## 3. Coverage

```text
============================= test session starts ==============================
platform win32 -- Python 3.11.0, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\Jaoo\AppData\Local\Programs\Python\Python311\python.exe
cachedir: .pytest_cache
hypothesis profile 'default'
rootdir: C:\Users\Jaoo\Desktop\se-sec2-team-07
plugins: hypothesis-6.168.0, cov-7.1.0
collected 6 items

src/tests/test_review_safety_net.py::test_score_two_returns_three_days PASSED [ 16%]
src/tests/test_review_safety_net.py::test_score_four_returns_fourteen_days PASSED [ 33%]
src/tests/test_review_safety_net.py::test_minimum_score_returns_one_day PASSED [ 50%]
src/tests/test_review_safety_net.py::test_maximum_score_returns_thirty_days PASSED [ 66%]
src/tests/test_review_safety_net.py::test_negative_score_raises_error PASSED [ 83%]
src/tests/test_review_safety_net.py::test_score_above_five_raises_error PASSED [100%]

================================ tests coverage ================================
_______________ coverage: platform win32, python 3.11.0-final-0 ________________

Name            Stmts   Miss  Cover   Missing
---------------------------------------------
src\review.py      12      1    92%   10
---------------------------------------------
TOTAL              12      1    92%
============================== 6 passed in 0.74s ===============================
```

- **ตีความ:** เทสต์ทั้ง 6 ตัวผ่านทั้งหมด และครอบคลุมเส้นทางหลักของฟังก์ชัน ทั้งกรณีปกติ ค่าขอบเขต และกรณีข้อมูลไม่ถูกต้อง โดยมี Coverage 92%
- **ส่วนที่ยังไม่ครอบคลุม + เหตุผลที่ยอมรับความเสี่ยง:** บรรทัดที่ 10 ของ `src/review.py` ยังไม่ถูกทดสอบโดยชุด Safety Net นี้ เนื่องจากเป็นเส้นทางที่ไม่ได้อยู่ในกรณีหลักที่เลือกทดสอบ แต่การทำงานสำคัญของฟังก์ชัน เช่น ค่าปกติ ค่าขอบเขต และ error cases ถูกครอบคลุมแล้ว

## 4. CI block อะไรบ้าง

- หลักฐาน Python ด้านบนเป็น Safety Net ของ Lab เดิม ส่วนเว็บปัจจุบันใช้ Node.js/React/PostgreSQL และ workflow `Application checks`
- `lint`: ESLint ตรวจ JavaScript/JSX
- `Unit tests (Node.js)`: unit tests ของแอป รวมโมดูลสถิติและ SRS
- `Integration tests (PostgreSQL)`: PostgreSQL จริง, Prisma migrations และ API
- `Build & smoke-test stack`: production build พร้อมตรวจหน้าเว็บ, assets และ API กับฐานข้อมูลทดสอบในเครื่อง
- `E2E tests (browser)`: Playwright desktop/mobile
- `Coverage`: line coverage ต้องไม่น้อยกว่า 60% ทั้งรวม, frontend และ backend
- **Branch Protection:** เลือกชื่อ checks จริงทั้งหกด้านบนใน GitHub หลัง workflow ใหม่รัน พร้อมบังคับ PR/review; นำชื่อ `test` เก่าหรือ `Deploy and verify Vercel` ออกหากเคยบังคับไว้ เพราะ Actions ปัจจุบันทำเฉพาะ CI ส่วน Vercel deploy จาก main โดยตรง
- **รายละเอียด:** [coverage และ CI/CD](testing/coverage-ci-cd.md)
- **หลักฐาน:**ภาพหน้า PR ตอนขึ้น "Merging is blocked" (แนบในคอมเมนต์ PR)

## 5. บทเรียนที่ได้

จากการทำ Lab นี้ทำให้ได้รู้ว่าการเขียน Test ไม่ควรทดสอบแค่กรณีที่โปรแกรมทำงานปกติ แต่ควรมีการทดสอบค่าขอบเขตและค่าที่ผิดด้วย เพราะอาจทำให้เจอข้อผิดพลาดที่เราไม่ได้คิดไว้ตอนเขียนโค้ด และ Coverage ก็ช่วยให้เห็นว่ายังมีส่วนไหนของโค้ดที่เรายังไม่ได้ทดสอบ
