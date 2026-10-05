# Failure Scenario Results

## การจำลองสถานการณ์: External API ล้มเหลว

ในโครงงานนี้มีการเชื่อมต่อกับ External API (JSONPlaceholder) เพื่อจำลองการดึงข้อมูลรีวิวจากภายนอกมาประกอบข้อมูลภาพยนตร์ (`GET /movies/:id`)

### สถานการณ์ที่ 1: การจำลอง Timeout
- **วิธีการทดสอบ:** ใน `src/services/external-api.js` มีการกำหนด `timeoutMs` ให้กับ Axios หาก API ปลายทางตอบกลับช้ากว่า 3000ms หรือเกิดปัญหาทางเครือข่าย จะส่งผลให้เกิด timeout
- **ผลลัพธ์ที่คาดหวัง:** ระบบจะทำการ Retry ตามจำนวนรอบที่กำหนด (maxRetries = 2) โดยใช้เวลาหน่วงแบบ Exponential Backoff + Jitter หากหลังจากพยายามครบแล้วยังคงล้มเหลว ระบบจะเข้าสู่กระบวนการ Fallback 
- **ผลการทดสอบจริง:** Console จะขึ้นข้อความแจ้งเตือน `Request to ... failed (attempt 1/2). Retrying in ...ms` และเมื่อล้มเหลวทั้งหมด API ของเรายังคงตอบกลับด้วย status 200 แต่ในฟิลด์ `externalData` จะระบุ `source: "fallback"` และแสดง `message` แจ้งข้อผิดพลาดที่เตรียมไว้ ไม่เกิดอาการค้างหรือแอพพลิเคชันแครช

### สถานการณ์ที่ 2: การเรียก URL ที่ไม่มีอยู่จริง (404 Not Found)
- **วิธีการทดสอบ:** เปลี่ยน URL ของ External API เป็น path ที่ไม่ถูกต้อง (เช่น `/invalid-endpoint`) ซึ่งปลายทางจะตอบกลับ 404
- **ผลลัพธ์ที่คาดหวัง:** ระบบจะไม่ทำการ Retry ซ้ำเนื่องจาก 404 เป็น Permanent Failure (เราไม่ควร Retry กับ Client Error ที่ไม่ใช่ 429) ระบบจะเข้าสู่ Fallback โดยทันที
- **ผลการทดสอบจริง:** โค้ดในส่วน `isRetryable(error)` จะคืนค่า `false` สำหรับ status 404 ทำให้ไม่มีการ Retry และตอบกลับด้วยข้อมูลส่วนที่เป็น Fallback ให้แก่ผู้ใช้ทันที

### บทสรุปของการออกแบบ Resilience
- **Retry Logic:** มีการใช้งาน Exponential Backoff และ Equal Jitter เพื่อกระจายการส่ง request ใหม่ ไม่ให้เกิดปัญหา Thundering Herd
- **Timeout:** ป้องกันไม่ให้ request ของผู้ใช้รอนานจนเกินไป ช่วยป้องกันปัญหา resource (thread/memory) ของ Node.js ถูก block
- **Fallback:** ทำให้ระบบมีคุณสมบัติ Graceful Degradation คือแม้ฟีเจอร์บางส่วนจะใช้งานไม่ได้ (ดึงรีวิวไม่สำเร็จ) แต่ระบบหลักยังสามารถให้บริการข้อมูลภาพยนตร์ตามปกติได้
