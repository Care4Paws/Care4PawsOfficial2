
const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Data file path
const USERS_FILE = path.join(__dirname, 'users.json');

// Helper to read users from file
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty array
    return [];
  }
}

// Helper to write users to file
async function writeUsers(users) {
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

// Get all users (admin endpoint)
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await readUsers();
    
    // Remove sensitive data
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    res.json(safeUsers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by email (admin endpoint)
app.get('/api/users/profile/:email', async (req, res) => {
  try {
    const users = await readUsers();
    const user = users.find(u => u.email === req.params.email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove sensitive data
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, username, password, phoneNumber } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Read existing users
    const users = await readUsers();
    
    // Check if email already exists
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Add new user
    users.push({
      email,
      username: username || null,
      phoneNumber: phoneNumber || null,
      password, // In production, this should be hashed
      createdAt: new Date().toISOString()
    });
    
    await writeUsers(users);
    
    // Return success without the password
    res.status(201).json({
      email,
      username: username || null,
      phoneNumber: phoneNumber || null,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Read users
    const users = await readUsers();
    
    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user data without password
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/users/profile', async (req, res) => {
  try {
    const { email, username, phoneNumber } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Read users
    const users = await readUsers();
    
    // Find user index
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user
    if (username !== undefined) {
      users[userIndex].username = username;
    }
    
    if (phoneNumber !== undefined) {
      users[userIndex].phoneNumber = phoneNumber;
    }
    
    await writeUsers(users);
    
    // Return updated user without password
    const { password: _, ...userData } = users[userIndex];
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
// Create necessary users.json file if it doesn't exist
async function ensureUsersFileExists() {
  try {
    await fs.access(USERS_FILE);
  } catch (error) {
    // File doesn't exist, create it
    await writeUsers([]);
    console.log('Created users.json file');
  }
}

// Initialize data
ensureUsersFileExists();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
