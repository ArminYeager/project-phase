-- seed.sql
-- ข้อมูลตัวอย่าง (อย่างน้อยตารางละ 3 ระเบียน)

USE movie_catalog_db;

-- 1) ผู้กำกับ (ต้องใส่ก่อน movies อ้างอิงถึง)
INSERT INTO directors (name, nationality, birth_year) VALUES
  ('Christopher Nolan', 'United Kingdom', 1970),
  ('Bong Joon-ho', 'South Korea', 1969),
  ('Greta Gerwig', 'United States', 1983);

-- 2) ค่ายผู้สร้าง (ต้องใส่ก่อน movies อ้างอิงถึง)
INSERT INTO studios (name, country) VALUES
  ('Warner Bros. Pictures', 'United States'),
  ('CJ Entertainment', 'South Korea'),
  ('Universal Pictures', 'United States');

-- 3) แนวหนัง (ไม่มี FK เรียงก่อนหลังตอนไหนก็ได้)
INSERT INTO genres (name) VALUES
  ('Sci-Fi'), ('Thriller'), ('Drama'), ('Comedy'), ('Action');

-- 4) ภาพยนตร์ (อ้างอิง director_id และ studio_id ที่มีอยู่จริงแล้ว)
INSERT INTO movies (title, director_id, studio_id, release_year, duration_minutes) VALUES
  ('Inception', 1, 1, 2010, 148),
  ('Interstellar', 1, 1, 2014, 169),
  ('Parasite', 2, 2, 2019, 132),
  ('Barbie', 3, 3, 2023, 114);

-- 5) ความสัมพันธ์ภาพยนตร์-แนวหนัง (ต้องมี movie_id และ genre_id อยู่จริงแล้วทั้งคู่)
INSERT INTO movie_genres (movie_id, genre_id) VALUES
  (1, 1), (1, 2),
  (2, 1), (2, 3),
  (3, 2), (3, 3),
  (4, 3), (4, 4);
