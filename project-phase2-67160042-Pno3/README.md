# Movie Catalog System - Phase 1

รหัสนิสิต: 67160042 | Pno = 3 (ระบบข้อมูลภาพยนตร์)

## วิธีติดตั้งและรัน

1. สร้างฐานข้อมูล:
   ```
   mysql -u root -p < schema.sql
   mysql -u root -p --default-character-set=utf8mb4 < seed.sql
   ```
2. สร้าง user สำหรับแอป:
   ```sql
   CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'app_password';
   GRANT ALL PRIVILEGES ON movie_catalog_db.* TO 'app_user'@'localhost';
   ```
3. ติดตั้ง dependency แล้วรัน server:
   ```
   npm install
   npm start
   ```
4. ทดสอบ endpoint (ผ่านการทดสอบจริงแล้ว):
   - `GET /movies?search=Nolan`
   - `GET /directors/2/movies`
   - `GET /movies/1`

## Environment Variables
| ตัวแปร | ค่า default |
|---|---|
| DB_HOST | localhost |
| DB_USER | app_user |
| DB_PASSWORD | app_password |
| DB_NAME | movie_catalog_db |
| PORT | 3000 |
