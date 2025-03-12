
const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const PORT = process.env.PORT || 3000;
const nodemailer = require('nodemailer');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Data file path for persistent storage
const USERS_FILE = path.join(__dirname, 'users.json');
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');
const VERIFICATION_CODES_FILE = path.join(__dirname, 'verification_codes.json');

// Helper to read data from file
async function readDataFile(filePath) {
  try {
    await fs.access(filePath);
    const data = await fs.readFile(filePath, 'utf8');
    
    // Handle empty files case
    if (!data || data.trim() === '') {
      console.log(`File ${filePath} is empty, initializing with empty array`);
      await writeDataFile(filePath, []);
      return [];
    }
    
    try {
      return JSON.parse(data);
    } catch (parseError) {
      console.error(`Error parsing JSON from ${filePath}:`, parseError);
      // If JSON parsing fails, reset the file with empty array
      await writeDataFile(filePath, []);
      return [];
    }
  } catch (error) {
    // If file doesn't exist or is invalid, return empty default value
    console.log(`File ${filePath} doesn't exist or is inaccessible, initializing`);
    await writeDataFile(filePath, []);
    return [];
  }
}

// Helper to write data to file
async function writeDataFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize files if they don't exist
async function initializeDataFiles() {
  try {
    // Check and create users file
    try {
      await fs.access(USERS_FILE);
    } catch (e) {
      await writeDataFile(USERS_FILE, []);
    }

    // Check and create sessions file
    try {
      await fs.access(SESSIONS_FILE);
    } catch (e) {
      await writeDataFile(SESSIONS_FILE, []);
    }

    // Check and create verification codes file
    try {
      await fs.access(VERIFICATION_CODES_FILE);
    } catch (e) {
      await writeDataFile(VERIFICATION_CODES_FILE, {});
    }
  } catch (error) {
    console.error('Error initializing data files:', error);
  }
}

// Check if a session is valid
async function isValidSession(email, deviceId) {
  const sessions = await readDataFile(SESSIONS_FILE);
  return sessions.some(session => session.email === email && session.deviceId === deviceId);
}

// Create a new session
async function createSession(email, deviceId) {
  const sessions = await readDataFile(SESSIONS_FILE);
  
  // Remove any existing sessions for this email/device
  const filteredSessions = sessions.filter(session => 
    !(session.email === email && session.deviceId === deviceId)
  );
  
  // Add new session
  filteredSessions.push({
    email,
    deviceId,
    createdAt: new Date().toISOString()
  });
  
  await writeDataFile(SESSIONS_FILE, filteredSessions);
}

// Check user credentials
async function authenticateUser(email, password, deviceId) {
  const users = await readDataFile(USERS_FILE);
  const user = users.find(u => u.email === email && u.password === password);
  return user;
}

// API Endpoints

// Check if email exists
app.get('/api/users/check-email', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const users = await readDataFile(USERS_FILE);
    const exists = users.some(user => user.email === email);
    
    res.json({ exists });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if username exists
app.get('/api/users/check-username', async (req, res) => {
  try {
    const username = req.query.username;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const users = await readDataFile(USERS_FILE);
    const exists = users.some(user => user.username === username);
    
    res.json({ exists });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password, username, phoneNumber, prepPassword, prepVerified, deviceId } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Read existing users with better error handling
    let users = [];
    try {
      users = await readDataFile(USERS_FILE);
      // Ensure users is always an array
      if (!Array.isArray(users)) {
        console.error('Invalid users data format, initializing to empty array');
        users = [];
        // Reset the users file
        await writeDataFile(USERS_FILE, []);
      }
    } catch (readError) {
      console.error('Error reading users file:', readError);
      users = [];
      // Reset the users file
      await writeDataFile(USERS_FILE, []);
    }
    
    // Check if email already exists
    if (users.some(user => user.email === email)) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Check if username exists (if provided)
    if (username && users.some(user => user.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    // Add new user
    const newUser = {
      email,
      password,
      username: username || null,
      phoneNumber: phoneNumber || null,
      prepPassword: prepPassword || null,
      prepVerified: prepVerified || false,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeDataFile(USERS_FILE, users);
    
    // Create session
    await createSession(email, deviceId);
    
    // Return success (without password)
    const { password: _, ...userData } = newUser;
    res.status(201).json(userData);
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Login
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Read users
    const users = await readDataFile(USERS_FILE);
    
    // Find user with matching credentials
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    await createSession(email, deviceId);
    
    // Return user data without password
    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// Verify session
app.post('/api/users/verify-session', async (req, res) => {
  try {
    const { email, deviceId } = req.body;
    
    if (!email || !deviceId) {
      return res.status(400).json({ error: 'Email and deviceId are required' });
    }
    
    const isValid = await isValidSession(email, deviceId);
    
    if (isValid) {
      res.json({ valid: true });
    } else {
      res.status(401).json({ valid: false, error: 'Invalid session' });
    }
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get full user data (including sensitive info)
app.post('/api/users/full-data', async (req, res) => {
  try {
    const { email, deviceId } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Verify session
    const isValid = await isValidSession(email, deviceId);
    if (!isValid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Read users
    const users = await readDataFile(USERS_FILE);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user data
app.post('/api/users/update', async (req, res) => {
  try {
    const { userData, deviceId } = req.body;
    
    if (!userData || !userData.email) {
      return res.status(400).json({ error: 'User data with email is required' });
    }
    
    // Verify session
    const isValid = await isValidSession(userData.email, deviceId);
    if (!isValid) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Read users
    const users = await readDataFile(USERS_FILE);
    const userIndex = users.findIndex(u => u.email === userData.email);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user
    users[userIndex] = { ...users[userIndex], ...userData };
    await writeDataFile(USERS_FILE, users);
    
    // Return updated user (without password)
    const { password: _, ...updatedUser } = users[userIndex];
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin clear users
app.post('/api/admin/clear-users', async (req, res) => {
  try {
    const { adminEmail, deviceId } = req.body;
    
    // Verify admin status (simple check - could be more robust)
    if (adminEmail !== 'care4pawsneaionia@gmail.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Get current users
    const users = await readDataFile(USERS_FILE);
    
    // Keep only admin user
    const adminUser = users.find(user => user.email === 'care4pawsneaionia@gmail.com');
    const newUsers = adminUser ? [adminUser] : [];
    
    // Write back to file
    await writeDataFile(USERS_FILE, newUsers);
    
    // Clear all sessions except admin's
    const sessions = await readDataFile(SESSIONS_FILE);
    const adminSessions = sessions.filter(session => session.email === 'care4pawsneaionia@gmail.com');
    await writeDataFile(SESSIONS_FILE, adminSessions);
    
    res.json({ success: true, message: 'All non-admin users cleared' });
  } catch (error) {
    console.error('Error clearing users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Email verification endpoint
app.post('/api/send-verification', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    
    // Configure nodemailer with Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - Care4Paws',
      html: `
        <h2>Welcome to Care4Paws!</h2>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 30 minutes.</p>
        <p>Thank you for joining our community!</p>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      details: 'Failed to send verification email'
    });
  }
});

// Initialize data files and start server
initializeDataFiles().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
});
