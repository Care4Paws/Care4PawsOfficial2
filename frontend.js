// Register a new user
async function registerUser() {
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, email, password }),
  });

  const result = await response.json();
  if (response.ok) {
    alert('Registration successful!');
  } else {
    alert(`Error: ${result.error}`);
  }
}

// Login a user
async function loginUser() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const result = await response.json();
  if (response.ok) {
    alert('Login successful!');
    console.log(result.user); // Handle logged-in user data
  } else {
    alert(`Error: ${result.error}`);
  }
}