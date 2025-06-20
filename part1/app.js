// app.js
const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3000;

// ---- 1. Database connection ----
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',// Change to your MySQL password
  database: 'dogDogWalkServicewalks'
};

let pool;

// ---- 2. Insert test data on startup ----
async function insertTestData() {
  const conn = await pool.getConnection();
  try {
    // Users
    await conn.query(`
      INSERT IGNORE INTO users (username, email, password_hash, role) VALUES
      ('alice123', 'alice@example.com', 'hashed123', 'owner'),
      ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
      ('carol123', 'carol@example.com', 'hashed789', 'owner'),
      ('davewalker', 'dave@example.com', 'hashed321', 'walker'),
      ('eveowner', 'eve@example.com', 'hashed654', 'owner')
    `);

    // Dogs
    await conn.query(`
      INSERT IGNORE INTO dogs (owner_id, name, size) VALUES
      ((SELECT user_id FROM users WHERE username = 'alice123'), 'Max', 'medium'),
      ((SELECT user_id FROM users WHERE username = 'carol123'), 'Bella', 'small'),
      ((SELECT user_id FROM users WHERE username = 'alice123'), 'Charlie', 'large'),
      ((SELECT user_id FROM users WHERE username = 'eveowner'), 'Daisy', 'medium'),
      ((SELECT user_id FROM users WHERE username = 'carol123'), 'Rocky', 'small')
    `);

    // Walk requests
    await conn.query(`
      INSERT IGNORE INTO walkrequests (dog_id, requested_time, duration_minutes, location, status) VALUES
      ((SELECT dog_id FROM dogs WHERE name='Max' AND owner_id=(SELECT user_id FROM users WHERE username='alice123')), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
      ((SELECT dog_id FROM dogs WHERE name='Bella' AND owner_id=(SELECT user_id FROM users WHERE username='carol123')), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
      ((SELECT dog_id FROM dogs WHERE name='Charlie' AND owner_id=(SELECT user_id FROM users WHERE username='alice123')), '2025-06-11 15:00:00', 60, 'City Park', 'open'),
      ((SELECT dog_id FROM dogs WHERE name='Daisy' AND owner_id=(SELECT user_id FROM users WHERE username='eveowner')), '2025-06-12 10:15:00', 20, 'Riverwalk', 'open'),
      ((SELECT dog_id FROM dogs WHERE name='Rocky' AND owner_id=(SELECT user_id FROM users WHERE username='carol123')), '2025-06-12 17:30:00', 40, 'Downtown Plaza', 'open')
    `);

    // WalkRatings (for /api/walkers/summary testing)
    await conn.query(`
      INSERT IGNORE INTO walkratings (request_id, walker_id, owner_id, rating, comments, rated_at) VALUES
      (2, (SELECT user_id FROM users WHERE username='bobwalker'), (SELECT user_id FROM users WHERE username='carol123'), 5, 'Great job!', '2025-06-10 11:00:00'),
      (1, (SELECT user_id FROM users WHERE username='bobwalker'), (SELECT user_id FROM users WHERE username='alice123'), 4, 'Nice walk', '2025-06-10 09:00:00')
    `);
  } finally {
    conn.release();
  }
}

// ---- 3. API routes ----

// /api/dogs
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM dogs d
      JOIN users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// /api/walkrequests/open
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT wr.request_id, d.name AS dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username AS owner_username
      FROM walkrequests wr
      JOIN dogs d ON wr.dog_id = d.dog_id
      JOIN users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// /api/walkers/summary
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.username AS walker_username,
        COUNT(wr.rating_id) AS total_ratings,
        AVG(wr.rating) AS average_rating,
        (
          SELECT COUNT(*)
          FROM walkrequests wq
          WHERE wq.status = 'completed'
            AND wq.accepted_walker_id = u.user_id
        ) AS completed_walks
      FROM users u
      LEFT JOIN walkratings wr ON u.user_id = wr.walker_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// ---- 4. App startup ----
(async () => {
  pool = await mysql.createPool(dbConfig);
  await insertTestData();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
})();
