import { Router } from 'itty-router';

// Create a router for handling API requests
const router = Router();

// Simulate a database using Workers KV
const USERS_KV = 'UsersKV'; // Replace with your Workers KV namespace

// API: Register a new user
router.post('/api/register', async (request) => {
  const body = await request.json();
  const { email, password, name, phone } = body;

  // Check if the user already exists
  const existingUser = await USERS_KV.get(email);
  if (existingUser) {
    return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 });
  }

  // Save user data in KV
  const userData = { name, phone, email, password };
  await USERS_KV.put(email, JSON.stringify(userData));
  return new Response(JSON.stringify({ message: 'User registered successfully' }), { status: 201 });
});

// API: Login a user
router.post('/api/login', async (request) => {
  const body = await request.json();
  const { email, password } = body;

  // Retrieve user data from KV
  const userData = await USERS_KV.get(email);
  if (!userData) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  const user = JSON.parse(userData);
  if (user.password !== password) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
  }

  // Login successful
  return new Response(JSON.stringify({ message: 'Login successful', user }), { status: 200 });
});

// Handle requests
addEventListener('fetch', (event) => {
  event.respondWith(router.handle(event.request));
});