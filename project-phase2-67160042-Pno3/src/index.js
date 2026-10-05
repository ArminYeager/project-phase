const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const pool = require('./db');
const { getExternalReviews } = require('./services/external-api');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Swagger UI Setup
const openapiDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

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

// GET /movies/:id -> รายละเอียดภาพยนตร์พร้อมแนวหนังและรีวิวจากภายนอก (Use Case #3 + Integration)
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
    
    // External API Integration with Retry/Timeout/Fallback
    const externalReviews = await getExternalReviews(id);

    const result = {
      ...rows[0],
      externalData: externalReviews
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /movies -> เพิ่มภาพยนตร์ใหม่ (Use Case #5)
app.post('/movies', async (req, res) => {
  try {
    const { title, director_id, studio_id, release_year, duration_minutes } = req.body;
    if (!title || !director_id || !studio_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const [result] = await pool.query(
      `INSERT INTO movies (title, director_id, studio_id, release_year, duration_minutes) VALUES (?, ?, ?, ?, ?)`,
      [title, director_id, studio_id, release_year, duration_minutes]
    );
    res.status(201).json({ message: 'Movie created', movie_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /directors -> เพิ่มผู้กำกับใหม่ (Use Case #4)
app.post('/directors', async (req, res) => {
  try {
    const { name, nationality, birth_year } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const [result] = await pool.query(
      `INSERT INTO directors (name, nationality, birth_year) VALUES (?, ?, ?)`,
      [name, nationality, birth_year]
    );
    res.status(201).json({ message: 'Director created', director_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /movies/:id -> ลบภาพยนตร์
app.delete('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(`DELETE FROM movies WHERE movie_id = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Movie not found' });
    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Movie Catalog API running on http://localhost:${PORT}`);
});
