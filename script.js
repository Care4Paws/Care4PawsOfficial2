
// Fix the viewport height on mobile
function adjustViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Call the function on first load
adjustViewportHeight();

// Call the function on resize
window.addEventListener('resize', adjustViewportHeight);



// Function to generate a random password
function generatePassword(length = 8) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

// Function to handle adoption button click
function setupAdoptionButton() {
  const adoptionButton = document.getElementById('adoption-button');
  if (adoptionButton) {
    adoptionButton.onclick = function(e) {
      e.preventDefault();
      
      // Create the dropdown
      const menu = document.createElement('div');
      menu.className = 'adoption-dropdown';
      menu.innerHTML = `
        <div class="adoption-option" id="pawrent-option">Ready to be a Pawrent?</div>
        <div class="adoption-option" id="prep-option">Προετοιμασία πριν την υιοθεσία</div>
      `;
      
      // Position the dropdown
      const buttonRect = adoptionButton.getBoundingClientRect();
      menu.style.position = 'absolute';
      menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
      menu.style.left = `${buttonRect.left + window.scrollX}px`;
      
      // Remove any existing dropdown
      const existingDropdown = document.querySelector('.adoption-dropdown');
      if (existingDropdown) {
        existingDropdown.remove();
      }
      
      // Add the dropdown to the page
      document.body.appendChild(menu);
      
      // Handle option clicks
      document.getElementById('pawrent-option').addEventListener('click', function() {
        window.location.href = 'https://docs.google.com/forms/d/e/1FAIpQLSe_mNbEEC2ecPZz60FB2bl6jJHhvVGVkFWyfAxeiwk1BoMOlw/viewform?usp=sharing';
      });
      
      document.getElementById('prep-option').addEventListener('click', async function() {
        // Check if user is logged in
        const currentUser = await getUserData();
        if (!currentUser) {
          // Redirect to login with preparation redirect
          window.location.href = 'login.html?redirect=preparation.html';
          return;
        }
        
        // Check if user has a preparation password
        let userData = await getUserFullData(currentUser.email);
        
        if (!userData.prepPassword) {
          // Generate a password for the user if they don't have one
          userData.prepPassword = generatePassword();
          await updateUserData(userData);
        }
        
        // Show password input dialog
        showPasswordDialog();
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', function closeDropdown(e) {
        if (!menu.contains(e.target) && e.target !== adoptionButton) {
          menu.remove();
          document.removeEventListener('click', closeDropdown);
        }
      });
    };
  }
}

// Show password dialog for preparation access
function showPasswordDialog() {
  const dialog = document.createElement('div');
  dialog.className = 'password-dialog';
  dialog.innerHTML = `
    <div class="password-dialog-content">
      <h3>Προετοιμασία πριν την υιοθεσία</h3>
      <p>Η σελίδα αυτή απαιτεί έναν κωδικό πρόσβασης. Παρακαλώ επικοινωνήστε με τη διαχείριση του Care4Paws για τον κωδικό σας.</p>
      <div class="form-group password-field">
        <label for="prep-password">Κωδικός:</label>
        <input type="password" id="prep-password">
      </div>
      <div class="dialog-buttons">
        <button id="cancel-prep">Ακύρωση</button>
        <button id="submit-prep">Επιβεβαίωση</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Handle cancel
  document.getElementById('cancel-prep').addEventListener('click', function() {
    dialog.remove();
  });
  
  // Handle submit
  document.getElementById('submit-prep').addEventListener('click', async function() {
    const passwordInput = document.getElementById('prep-password').value;
    const currentUser = await getUserData();
    
    if (!currentUser) {
      dialog.remove();
      return;
    }
    
    const userData = await getUserFullData(currentUser.email);
    
    if (passwordInput === userData.prepPassword) {
      // Password is correct, redirect to preparation page
      dialog.remove();
      window.location.href = 'preparation.html';
    } else {
      // Show error
      const errorElem = document.createElement('p');
      errorElem.className = 'error-message';
      errorElem.textContent = 'Λάθος κωδικός πρόσβασης';
      
      const content = dialog.querySelector('.password-dialog-content');
      const existingError = content.querySelector('.error-message');
      if (existingError) existingError.remove();
      
      content.appendChild(errorElem);
    }
  });
}

// Helper function to get full user data including password
async function getUserFullData(email) {
  try {
    const deviceId = getDeviceIdentifier();
    let usersData = localStorage.getItem('users');
    let users = [];
    
    if (usersData) {
      try {
        users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
      } catch (e) {
        users = JSON.parse(usersData);
      }
    }
    
    return users.find(user => user.email === email) || null;
  } catch (e) {
    console.error('Error getting user data:', e);
    return null;
  }
}

// Helper function to update user data
async function updateUserData(userData) {
  try {
    const deviceId = getDeviceIdentifier();
    let usersData = localStorage.getItem('users');
    let users = [];
    
    if (usersData) {
      try {
        users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
      } catch (e) {
        users = JSON.parse(usersData);
      }
    }
    
    const userIndex = users.findIndex(user => user.email === userData.email);
    if (userIndex !== -1) {
      users[userIndex] = userData;
      
      const encryptedUsers = await encryptData(users, 'app_secret_key_' + deviceId.substring(0, 8));
      localStorage.setItem('users', encryptedUsers);
    }
  } catch (e) {
    console.error('Error updating user data:', e);
  }
}

// Function to display all user passwords (prints to console)
function showAllUserPasswords() {
  // Log to console instead of checking for admin
  (async () => {
    try {
      const deviceId = getDeviceIdentifier();
      let usersData = localStorage.getItem('users');
      let users = [];
      
      if (usersData) {
        try {
          users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
        } catch (e) {
          users = JSON.parse(usersData);
        }
      }
      
      if (users.length === 0) {
        console.log('No users found in the system.');
        return;
      }
      
      console.log('===== USER PREPARATION PASSWORDS =====');
      console.table(users.map(user => ({
        Username: user.username || 'No username',
        Email: user.email,
        'Preparation Password': user.prepPassword || 'Not generated'
      })));
      console.log('=======================================');
      
      // Also show in UI for easy access
      alert('User passwords printed to console. Press F12 to view.');
      
    } catch (e) {
      console.error('Error displaying passwords:', e);
      alert('Error retrieving user data. Check console for details.');
    }
  })();
}

// Initialize adoption button when DOM is loaded
document.addEventListener('DOMContentLoaded', setupAdoptionButton);



// Toggle password visibility
function togglePasswordVisibility(inputId) {
  const passwordInput = document.getElementById(inputId);
  const toggleButton = passwordInput.nextElementSibling;
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleButton.textContent = '●';
  } else {
    passwordInput.type = 'password';
    toggleButton.textContent = '○';
  }
}

// Immediately check authorization before rendering the page
(function() {
  const isPetLessonsPage = window.location.pathname.includes('pet-lessons.html');
  const isProfilePage = window.location.pathname.includes('profile.html');
  
  // Try to get user from localStorage
  const userData = localStorage.getItem('currentUser');
  const isLoggedIn = userData ? true : false;
  
  if ((isPetLessonsPage || isProfilePage) && !isLoggedIn) {
    const currentPage = isPetLessonsPage ? 'pet-lessons.html' : 'profile.html';
    window.location.href = 'login.html?redirect=' + currentPage;
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // Dark mode functionality
  const themeToggle = document.getElementById('theme-toggle');
  
  // Check for saved theme preference or use the system preference
  const savedTheme = localStorage.getItem('theme') || 
                     (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  
  // Apply the initial theme
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Update the toggle button initial state
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  // Smooth animation for page elements
  const images = document.querySelectorAll('.main-image');
  const textBlocks = document.querySelectorAll('.info-text');
  
  images.forEach(img => {
    img.classList.remove('fade');
  });
  
  textBlocks.forEach(block => {
    block.classList.remove('fade');
  });

  // Add card hover effects
  const cards = document.querySelectorAll('.faq-item, .trainer-card, .contact-card, .support-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px)';
      card.style.boxShadow = '0 15px 30px var(--shadow-color)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '0 5px 15px var(--shadow-color)';
    });
  });
  
  // Authentication functionality
  setupAuthUI();
  setupLoginSignupForms();
  
  // Re-enable page display if we're on pet lessons page and authorized
  const isPetLessonsPage = window.location.pathname.includes('pet-lessons.html');
  if (isPetLessonsPage) {
    document.documentElement.style.display = '';
  }
});

// List of banned words for profanity filtering (English and Greek)
const bannedWords = [
  'nigga', 'bitch', 'fuck', 'shit', 'asshole', 'cunt', 'dick', 'pussy', 'whore',
  'μαλάκας', 'πούστης', 'καριόλης', 'γαμιέσαι', 'μουνί', 'αρχίδι', 'πουτάνα', 'γαμώτο'
];

// Check for profanity in a string
function containsProfanity(text) {
  if (!text) return false;
  
  const lowerText = text.toLowerCase();
  return bannedWords.some(word => lowerText.includes(word));
}

// Security utilities
// Simple hash function for passwords (SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Generate a unique device identifier to enhance cross-device login security
function getDeviceIdentifier() {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    try {
      deviceId = crypto.randomUUID();
    } catch (e) {
      // Fallback for browsers without crypto.randomUUID
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    }
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

// Encrypt data for storage
async function encryptData(data, userKey) {
  try {
    // Convert the data to a string and then to bytes
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));
    
    // Create a simple XOR cipher with the user key
    const keyBytes = encoder.encode(userKey);
    const encryptedBytes = new Uint8Array(dataBytes.length);
    
    for (let i = 0; i < dataBytes.length; i++) {
      encryptedBytes[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert encrypted bytes to base64 string for storage
    return btoa(String.fromCharCode.apply(null, encryptedBytes));
  } catch (e) {
    console.error('Encryption error:', e);
    return JSON.stringify(data); // Fallback to plain JSON if encryption fails
  }
}

// Decrypt data from storage
async function decryptData(encryptedData, userKey) {
  try {
    // Convert base64 encoded string back to bytes
    const encryptedBytes = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
    
    // Create the same XOR cipher with the user key
    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(userKey);
    const decryptedBytes = new Uint8Array(encryptedBytes.length);
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert decrypted bytes back to string and parse as JSON
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedBytes));
  } catch (e) {
    console.error('Decryption error:', e);
    try {
      // Fallback to regular JSON parsing if decryption fails
      return JSON.parse(encryptedData);
    } catch (e2) {
      console.error('JSON parsing error:', e2);
      return null;
    }
  }
}

// Handle user authentication state
function setupAuthUI() {
  const topNav = document.querySelector('.top-nav');
  if (!topNav) return;
  
  // Create user menu element
  const userMenu = document.createElement('div');
  userMenu.className = 'user-menu';
  
  // Insert at the beginning of top nav
  topNav.insertBefore(userMenu, topNav.firstChild);
  
  // Update the user menu based on auth state
  updateUserMenu();
}

async function getUserData() {
  try {
    const encryptedUser = localStorage.getItem('currentUser');
    if (!encryptedUser) return null;
    
    // Get device identifier for additional security
    const deviceId = getDeviceIdentifier();
    
    // Try to decrypt user data
    return await decryptData(encryptedUser, deviceId);
  } catch (e) {
    console.error('Error getting user data:', e);
    
    // If there's an error with the encrypted data, try to fall back to old format
    try {
      const legacyUser = JSON.parse(localStorage.getItem('currentUser'));
      if (legacyUser) {
        // Migrate old format to new format
        const deviceId = getDeviceIdentifier();
        localStorage.setItem('currentUser', await encryptData(legacyUser, deviceId));
        return legacyUser;
      }
    } catch (e2) {
      console.error('Legacy data error:', e2);
    }
    
    return null;
  }
}

async function updateUserMenu() {
  const userMenu = document.querySelector('.user-menu');
  if (!userMenu) return;
  
  // Get current user from localStorage (decrypted)
  const currentUser = await getUserData();
  
  // Clear existing content
  userMenu.innerHTML = '';
  
  if (currentUser) {
    // User is logged in - show user info and logout button
    const displayName = currentUser.username || currentUser.email;
    const initial = displayName.charAt(0).toUpperCase();
    
    userMenu.innerHTML = `
      <div class="user-info">
        <div class="user-icon">${initial}</div>
        <span>${displayName}</span>
      </div>
      <button id="profile-button" class="profile-button">Προφίλ</button>
      <button id="logout-button" class="logout-button">Αποσύνδεση</button>
    `;
    
    // Add profile event listener
    document.getElementById('profile-button')?.addEventListener('click', () => {
      // If on profile page already, do nothing
      if (window.location.pathname.includes('profile.html')) {
        return;
      }
      window.location.href = 'profile.html';
    });
    
    // Add logout event listener
    document.getElementById('logout-button').addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      updateUserMenu();
      // Redirect to home if on a protected page
      if (window.location.pathname.includes('login.html') || 
          window.location.pathname.includes('profile.html') ||
          window.location.pathname.includes('pet-lessons.html')) {
        window.location.href = 'index.html';
      }
    });
  } else {
    // User is not logged in - show login/signup button
    userMenu.innerHTML = `
      <button onclick="window.location.href='login.html'" class="login-signup-button">Σύνδεση / Εγγραφή</button>
    `;
  }
}

// Setup login and signup forms
function setupLoginSignupForms() {
  // Only run on login page
  if (!document.getElementById('login-form')) return;
  
  // Show signup form
  document.getElementById('show-signup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('signup-section').style.display = 'block';
  });
  
  // Show login form
  document.getElementById('show-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
  });
  
  // Handle signup form submission
  document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const username = document.getElementById('signup-username').value;
    const phoneNumber = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('signup-error');
    
    // Check for profanity in username
    if (containsProfanity(username)) {
      errorElement.textContent = 'Το όνομα χρήστη περιέχει απαγορευμένες λέξεις';
      return;
    }
    
    // Validate passwords match
    if (password !== confirmPassword) {
      errorElement.textContent = 'Οι κωδικοί πρόσβασης δεν ταιριάζουν';
      return;
    }
    
    // Get device ID for additional security
    const deviceId = getDeviceIdentifier();
    
    try {
      // Get existing users from localStorage
      let usersData = localStorage.getItem('users');
      let users = [];
      
      if (usersData) {
        // Try to decrypt if it's encrypted
        try {
          users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
        } catch (e) {
          // Fallback to JSON parse if decryption fails (for backward compatibility)
          users = JSON.parse(usersData);
        }
      }
      
      // Check if email already exists
      if (users.some(user => user.email === email)) {
        errorElement.textContent = 'Το email είναι ήδη εγγεγραμμένο';
        return;
      }
      
      // Check if username already exists
      if (username && users.some(user => user.username === username)) {
        errorElement.textContent = 'Το όνομα χρήστη υπάρχει ήδη';
        return;
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password + email + deviceId.substring(0, 8));
      
      // Add new user with username, phone, and hashed password
      const newUser = { 
        email, 
        password: hashedPassword,
        username: username || null,
        phoneNumber: phoneNumber || null,
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      
      // Encrypt and save users
      const encryptedUsers = await encryptData(users, 'app_secret_key_' + deviceId.substring(0, 8));
      localStorage.setItem('users', encryptedUsers);
      
      // Create session data for current user (without password)
      const currentUser = {
        email,
        username: username || null,
        phoneNumber: phoneNumber || null,
        sessionCreated: new Date().toISOString()
      };
      
      // Encrypt and save current user session
      const encryptedCurrentUser = await encryptData(currentUser, deviceId);
      localStorage.setItem('currentUser', encryptedCurrentUser);
      
      // Update UI and redirect
      updateUserMenu();
      
      // Check if there's a redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || 'index.html';
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Signup error:', error);
      errorElement.textContent = 'Σφάλμα κατά την εγγραφή. Παρακαλώ δοκιμάστε ξανά.';
    }
  });
  
  // Handle login form submission
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    // Get device ID for additional security
    const deviceId = getDeviceIdentifier();
    
    try {
      // Get users from storage
      let usersData = localStorage.getItem('users');
      let users = [];
      
      if (usersData) {
        // Try to decrypt if it's encrypted
        try {
          users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
        } catch (e) {
          // Fallback to JSON parse if decryption fails (for backward compatibility)
          users = JSON.parse(usersData);
        }
      }
      
      // Hash the provided password for comparison
      const hashedPassword = await hashPassword(password + email + deviceId.substring(0, 8));
      
      // Find user with matching email
      const user = users.find(user => user.email === email);
      
      // For legacy users without hashed passwords, check the old way
      const legacyAuthenticated = user && !user.password.startsWith('') && user.password === password;
      
      // For users with hashed passwords, check the hash
      const modernAuthenticated = user && user.password === hashedPassword;
      
      if (user && (legacyAuthenticated || modernAuthenticated)) {
        // If using legacy auth, update to modern hash
        if (legacyAuthenticated) {
          user.password = hashedPassword;
          // Update users in storage
          const encryptedUsers = await encryptData(users, 'app_secret_key_' + deviceId.substring(0, 8));
          localStorage.setItem('users', encryptedUsers);
        }
        
        // Login successful - create session data (without password)
        const currentUser = {
          email: user.email,
          username: user.username || null,
          phoneNumber: user.phoneNumber || null,
          sessionCreated: new Date().toISOString()
        };
        
        // Encrypt and save current user
        const encryptedCurrentUser = await encryptData(currentUser, deviceId);
        localStorage.setItem('currentUser', encryptedCurrentUser);
        
        await updateUserMenu();
        
        // Check if there's a redirect parameter
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect') || 'index.html';
        window.location.href = redirectUrl;
      } else {
        // Login failed
        errorElement.textContent = 'Λάθος email ή κωδικός πρόσβασης';
      }
    } catch (error) {
      console.error('Login error:', error);
      errorElement.textContent = 'Σφάλμα κατά τη σύνδεση. Παρακαλώ δοκιμάστε ξανά.';
    }
  });
  
  // Check if user is already logged in
  getUserData().then(currentUser => {
    if (currentUser) {
      // Check if there's a redirect parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || 'index.html';
      
      // Redirect to appropriate page if already logged in
      window.location.href = redirectUrl;
    }
  });
}



// Function to clear all users and sign out current user
function clearAllUserData() {
  // Clear current user (sign out)
  localStorage.removeItem('currentUser');
  
  // Clear all users
  localStorage.removeItem('users');
  
  // Clear device ID to reset security keys
  localStorage.removeItem('device_id');
  
  // Reset to default with properly formatted empty array
  localStorage.setItem('users', JSON.stringify([]));
  
  console.log("All user data has been cleared");
  
  // Force refresh the page
  window.location.href = 'index.html';
}

// Remove automatic execution to prevent continuous clearing
// clearAllUserData();
