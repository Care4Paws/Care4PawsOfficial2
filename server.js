const express = require('express');
const app = express();
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create users table
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, username TEXT, password TEXT, phoneNumber TEXT, createdAt TEXT, paw_points INTEGER DEFAULT 0)");
});

// Helper to hash passwords
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, username, password, phoneNumber } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const hashedPassword = await hashPassword(password);
    const createdAt = new Date().toISOString();

    db.run('INSERT INTO users (email, username, password, phoneNumber, createdAt) VALUES (?, ?, ?, ?, ?)', [email, username, hashedPassword, phoneNumber, createdAt], function (err) {
      if (err) {
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(201).json({ email, username, phoneNumber, createdAt });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { password, ...userData } = user;
    res.json(userData);
  });
});

// Update user profile
app.put('/api/users/profile', (req, res) => {
  const { email, username, phoneNumber } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.run('UPDATE users SET username = ?, phoneNumber = ? WHERE email = ?', [username, phoneNumber, email], function (err) {
    if (err || this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      const { password, ...userData } = user;
      res.json(userData);
    });
  });
});

// Collect Paw Points
app.post('/api/users/collect-paw-points', (req, res) => {
  const { email, points } = req.body;

  if (!email || !points) {
    return res.status(400).json({ error: 'Email and points are required' });
  }

  db.run('UPDATE users SET paw_points = paw_points + ? WHERE email = ?', [points, email], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json({ message: `${points} paw points collected` });
  });
});

// Get User Data including Paw Points
app.get('/api/users/:email', (req, res) => {
  const email = req.params.email;

  db.get('SELECT email, username, phoneNumber, createdAt, paw_points FROM users WHERE email = ?', [email], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });
});

// Get Leaderboard
app.get('/api/leaderboard', (req, res) => {
  db.all('SELECT email, username, paw_points FROM users ORDER BY paw_points DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows);
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});