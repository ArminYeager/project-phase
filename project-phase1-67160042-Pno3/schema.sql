-- schema.sql
-- ระบบข้อมูลภาพยนตร์ (Movie Catalog System)

DROP DATABASE IF EXISTS movie_catalog_db;
CREATE DATABASE movie_catalog_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE movie_catalog_db;

-- ตารางผู้กำกับ
CREATE TABLE directors (
  director_id     INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  nationality      VARCHAR(100),
  birth_year       INT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT uq_directors_name UNIQUE (name)
);

-- ตารางค่ายผู้สร้าง
CREATE TABLE studios (
  studio_id     INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  country        VARCHAR(100),

  CONSTRAINT uq_studios_name UNIQUE (name)
);

-- ตารางภาพยนตร์ (many-to-one กับ directors และ studios)
CREATE TABLE movies (
  movie_id           INT AUTO_INCREMENT PRIMARY KEY,
  title               VARCHAR(255) NOT NULL,
  director_id         INT NOT NULL,
  studio_id           INT NOT NULL,
  release_year        INT,
  duration_minutes    INT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_movies_director
    FOREIGN KEY (director_id) REFERENCES directors(director_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_movies_studio
    FOREIGN KEY (studio_id) REFERENCES studios(studio_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT chk_movies_duration CHECK (duration_minutes > 0)
);

-- ตารางแนวหนัง
CREATE TABLE genres (
  genre_id    INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,

  CONSTRAINT uq_genres_name UNIQUE (name)
);

-- ตารางเชื่อม many-to-many ระหว่าง movies และ genres
CREATE TABLE movie_genres (
  movie_id     INT NOT NULL,
  genre_id     INT NOT NULL,

  PRIMARY KEY (movie_id, genre_id),

  CONSTRAINT fk_movie_genres_movie
    FOREIGN KEY (movie_id) REFERENCES movies(movie_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_movie_genres_genre
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Index เร่งความเร็วการค้นหา
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_movies_director_id ON movies(director_id);
CREATE INDEX idx_movies_studio_id ON movies(studio_id);
