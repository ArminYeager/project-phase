// index.js
const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// GET /movies?search=xxx -> ค้นหาภาพยนตร์ (Use Case #1)
app.get('/movies', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT m.movie_id, m.title, m.release_year, m.duration_minutes,
             d.name AS director_name, s.name AS studio_name,
             GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres
      FROM movies m
      JOIN directors d ON m.director_id = d.director_id
      JOIN studios s ON m.studio_id = s.studio_id
      LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
      LEFT JOIN genres g ON mg.genre_id = g.genre_id
    `;
    const params = [];
    if (search) {
      sql += ' WHERE m.title LIKE ? OR d.name LIKE ? ';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' GROUP BY m.movie_id ORDER BY d.name, m.release_year';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /directors/:id/movies -> ภาพยนตร์ทั้งหมดของผู้กำกับคนหนึ่ง (Use Case #2)
app.get('/directors/:id/movies', async (req, res) => {
  try {
    const { id } = req.params;
    const [dirRows] = await pool.query(
      `SELECT director_id, name, nationality, birth_year FROM directors WHERE director_id = ?`, [id]
    );
    if (dirRows.length === 0) return res.status(404).json({ error: 'Director not found' });

    const [movieRows] = await pool.query(
      `SELECT m.movie_id, m.title, m.release_year, s.name AS studio_name
       FROM movies m JOIN studios s ON m.studio_id = s.studio_id
       WHERE m.director_id = ? ORDER BY m.release_year`, [id]
    );
    res.json({ ...dirRows[0], movies: movieRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /movies/:id -> รายละเอียดภาพยนตร์พร้อมแนวหนัง (Use Case #3)
app.get('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT m.movie_id, m.title, m.release_year, m.duration_minutes,
              d.name AS director_name, s.name AS studio_name,
              GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres
       FROM movies m
       JOIN directors d ON m.director_id = d.director_id
       JOIN studios s ON m.studio_id = s.studio_id
       LEFT JOIN movie_genres mg ON m.movie_id = mg.movie_id
       LEFT JOIN genres g ON mg.genre_id = g.genre_id
       WHERE m.movie_id = ?
       GROUP BY m.movie_id`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Movie not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Movie Catalog API running on http://localhost:${PORT}`);
});
