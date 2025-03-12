
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

// Function to generate a verification code
function generateVerificationCode(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
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
      document.getElementById('pawrent-option').addEventListener('click', async function() {
        // Check if user is logged in
        const currentUser = await getUserData();
        if (!currentUser) {
          alert('Παρακαλώ συνδεθείτε πρώτα για να υποβάλετε φόρμα υιοθεσίας.');
          window.location.href = 'login.html?redirect=index.html';
          return;
        }
        
        // Open Google Form with email prefilled and add custom message
        const email = encodeURIComponent(currentUser.email);
        const formUrl = `https://docs.google.com/forms/d/e/1FAIpQLSe_mNbEEC2ecPZz60FB2bl6jJHhvVGVkFWyfAxeiwk1BoMOlw/viewform?usp=pp_url&entry.1234567890=${email}`;
        
        // Create a modal with instructions
        const modal = document.createElement('div');
        modal.className = 'email-verification-modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h3>Σημαντική Σημείωση</h3>
            <p>Συνδεθήκατε με το email: <strong>${currentUser.email}</strong></p>
            <p>Βεβαιωθείτε ότι θα χρησιμοποιήσετε το ΙΔΙΟ email στη φόρμα υιοθεσίας, καθώς πρέπει να ταιριάζει με τον λογαριασμό σας στο Care4Paws!</p>
            <div class="modal-buttons">
              <button id="cancel-form">Ακύρωση</button>
              <button id="continue-form">Συνέχεια στη φόρμα</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle cancel
        document.getElementById('cancel-form').addEventListener('click', function() {
          modal.remove();
        });
        
        // Handle continue to form
        document.getElementById('continue-form').addEventListener('click', function() {
          modal.remove();
          window.open(formUrl, '_blank');
        });
      });
      
      document.getElementById('prep-option').addEventListener('click', async function() {
        // Check if user is logged in
        const currentUser = await getUserData();
        if (!currentUser) {
          // Redirect to login with preparation redirect
          window.location.href = 'login.html?redirect=preparation.html';
          return;
        }
        
        // Get user data with preparation password
        let userData = await getUserFullData(currentUser.email);
        
        // Preparation password should be generated at signup, but check anyway
        if (!userData.prepPassword) {
          console.log("No preparation password found - using existing logic to generate one");
          userData.prepPassword = generatePassword(10);
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
async function showPasswordDialog() {
  // Check if user has already verified for preparation access
  const currentUser = await getUserData();
  if (!currentUser) return;
  
  const userData = await getUserFullData(currentUser.email);
  
  // If the user has already verified, redirect directly
  if (userData.prepVerified) {
    window.location.href = 'preparation.html';
    return;
  }
  
  // Otherwise show password dialog
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
    
    if (passwordInput === userData.prepPassword) {
      // Password is correct, mark as verified and save
      userData.prepVerified = true;
      await updateUserData(userData);
      
      // Redirect to preparation page
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
  (async () => {
    try {
      // Check if current user is admin
      const currentUser = await getUserData();
      if (!currentUser || currentUser.email !== 'care4pawsneaionia@gmail.com') {
        console.error('Access denied: Admin privileges required');
        return;
      }
      
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

// Add lazy loading to images
function lazyLoadImages() {
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply lazy loading
  lazyLoadImages();
  
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

  // Defer non-critical animations
  setTimeout(() => {
    // Smooth animation for page elements
    const images = document.querySelectorAll('.main-image');
    const textBlocks = document.querySelectorAll('.info-text');
    
    images.forEach(img => {
      img.classList.remove('fade');
    });
    
    textBlocks.forEach(block => {
      block.classList.remove('fade');
    });

    // Add card hover effects using CSS classes instead of inline styles
    const cards = document.querySelectorAll('.faq-item, .trainer-card, .contact-card, .support-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.classList.add('card-hover');
      });
      
      card.addEventListener('mouseleave', () => {
        card.classList.remove('card-hover');
      });
    });
  }, 100); // Short delay to prioritize critical content
  
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

// Cache for encoder to avoid recreating it
const textEncoder = new TextEncoder();

// Encrypt data for storage
async function encryptData(data, userKey) {
  try {
    // Convert the data to a string and then to bytes
    const dataBytes = textEncoder.encode(JSON.stringify(data));
    
    // Create a simple XOR cipher with the user key
    const keyBytes = textEncoder.encode(userKey);
    const encryptedBytes = new Uint8Array(dataBytes.length);
    
    // Use keyLength for optimization (avoid recalculating in loop)
    const keyLength = keyBytes.length;
    
    for (let i = 0; i < dataBytes.length; i++) {
      encryptedBytes[i] = dataBytes[i] ^ keyBytes[i % keyLength];
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

// Email utilities
// Function to send a verification email
async function sendVerificationEmail(email, verificationCode) {
  try {
    // Store verification code in localStorage for verification later
    const deviceId = getDeviceIdentifier();
    let verificationData = localStorage.getItem('verification_codes') || '{}';
    let verificationCodes = {};
    
    try {
      verificationCodes = await decryptData(verificationData, 'verification_key_' + deviceId.substring(0, 8));
    } catch (e) {
      verificationCodes = JSON.parse(verificationData);
    }
    
    // Store the verification code with expiration time (30 minutes)
    verificationCodes[email] = {
      code: verificationCode,
      expires: Date.now() + (30 * 60 * 1000) // 30 minutes
    };
    
    // Encrypt and save verification codes
    const encryptedCodes = await encryptData(verificationCodes, 'verification_key_' + deviceId.substring(0, 8));
    localStorage.setItem('verification_codes', encryptedCodes);
    
    // Actually send the email using our server API
    const response = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        verificationCode: verificationCode
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to send verification email');
    }
    
    // For development, also log the code to console
    console.log(`Verification code for ${email}: ${verificationCode}`);
    
    return true;
  } catch (e) {
    console.error('Error sending verification email:', e);
    return false;
  }
}

// Function to verify email verification code
async function verifyEmailCode(email, code) {
  try {
    const deviceId = getDeviceIdentifier();
    let verificationData = localStorage.getItem('verification_codes') || '{}';
    let verificationCodes = {};
    
    try {
      verificationCodes = await decryptData(verificationData, 'verification_key_' + deviceId.substring(0, 8));
    } catch (e) {
      verificationCodes = JSON.parse(verificationData);
    }
    
    // Check if a verification code exists for the email
    if (!verificationCodes[email]) {
      return false;
    }
    
    // Check if code has expired
    if (verificationCodes[email].expires < Date.now()) {
      // Remove expired code
      delete verificationCodes[email];
      
      // Encrypt and save updated codes
      const encryptedCodes = await encryptData(verificationCodes, 'verification_key_' + deviceId.substring(0, 8));
      localStorage.setItem('verification_codes', encryptedCodes);
      
      return false;
    }
    
    // Check if code matches
    if (verificationCodes[email].code !== code) {
      return false;
    }
    
    // If code is valid, remove it from storage (single use)
    delete verificationCodes[email];
    
    // Encrypt and save updated codes
    const encryptedCodes = await encryptData(verificationCodes, 'verification_key_' + deviceId.substring(0, 8));
    localStorage.setItem('verification_codes', encryptedCodes);
    
    return true;
  } catch (e) {
    console.error('Error verifying email code:', e);
    return false;
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

// Konami code implementation
document.addEventListener('DOMContentLoaded', function() {
  // Konami code sequence
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;
  
  // Listen for keydown events
  document.addEventListener('keydown', function(e) {
    // Get the key that was pressed
    const key = e.key.toLowerCase();
    const requiredKey = konamiCode[konamiIndex].toLowerCase();
    
    // Check if the key matches the current position in the konami sequence
    if (key === requiredKey) {
      // Move to the next key in the sequence
      konamiIndex++;
      
      // If the entire sequence was entered correctly
      if (konamiIndex === konamiCode.length) {
        // Reset the index
        konamiIndex = 0;
        
        // Redirect to Rick Roll
        window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      }
    } else {
      // Reset if wrong key pressed
      konamiIndex = 0;
    }
  });
});

// Setup login and signup forms with email verification
function setupLoginSignupForms() {
  // Only run on login page
  if (!document.getElementById('login-form')) return;
  
  // Show signup form
  document.getElementById('show-signup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('signup-section').style.display = 'block';
    document.getElementById('verify-section').style.display = 'none';
  });
  
  // Show login form
  document.getElementById('show-login')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signup-section').style.display = 'none';
    document.getElementById('verify-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
  });
  
  // Handle signup form submission - now with email verification
  document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const username = document.getElementById('signup-username').value;
    const phoneNumber = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const errorElement = document.getElementById('signup-error');
    
    // Basic validation
    if (!email || !password) {
      errorElement.textContent = 'Παρακαλώ συμπληρώστε όλα τα υποχρεωτικά πεδία';
      return;
    }
    
    // Check for valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorElement.textContent = 'Παρακαλώ εισάγετε έγκυρη διεύθυνση email';
      return;
    }
    
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
    
    // Password strength requirements
    if (password.length < 8) {
      errorElement.textContent = 'Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες';
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
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        if (existingUser.emailVerified) {
          errorElement.textContent = 'Το email είναι ήδη εγγεγραμμένο';
          return;
        } else {
          // If email exists but not verified, let them re-verify
          errorElement.textContent = 'Υπάρχει λογαριασμός με αυτό το email που δεν έχει επιβεβαιωθεί.';
          // Continue with verification process
        }
      }
      
      // Check if username already exists
      if (username && users.some(user => user.username === username && user.email !== email)) {
        errorElement.textContent = 'Το όνομα χρήστη υπάρχει ήδη';
        return;
      }
      
      // Generate verification code
      const verificationCode = generateVerificationCode();
      
      // Hash the password
      const hashedPassword = await hashPassword(password + email + deviceId.substring(0, 8));
      
      // Create or update user object
      const newUser = { 
        email, 
        password: hashedPassword,
        username: username || null,
        phoneNumber: phoneNumber || null,
        prepPassword: generatePassword(10),
        prepVerified: false,
        emailVerified: false, // Email not verified yet
        verificationCode: verificationCode, // Store code temporarily
        verificationExpires: Date.now() + (30 * 60 * 1000), // 30 minutes
        createdAt: new Date().toISOString()
      };
      
      // Add or update user in the array
      const userIndex = users.findIndex(user => user.email === email);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...newUser };
      } else {
        users.push(newUser);
      }
      
      // Encrypt and save users
      const encryptedUsers = await encryptData(users, 'app_secret_key_' + deviceId.substring(0, 8));
      localStorage.setItem('users', encryptedUsers);
      
      // Send verification email (simulated)
      const emailSent = await sendVerificationEmail(email, verificationCode);
      
      if (emailSent) {
        // Store temp data for verification form
        sessionStorage.setItem('verifying_email', email);
        
        // Show verification section
        document.getElementById('signup-section').style.display = 'none';
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('verify-section').style.display = 'block';
        
        // Update verification info
        document.getElementById('verification-email').textContent = email;
      } else {
        errorElement.textContent = 'Σφάλμα αποστολής email επιβεβαίωσης. Παρακαλώ δοκιμάστε ξανά.';
      }
    } catch (error) {
      console.error('Signup error:', error);
      errorElement.textContent = 'Σφάλμα κατά την εγγραφή. Παρακαλώ δοκιμάστε ξανά.';
    }
  });
  
  // Handle verification form submission
  document.getElementById('verify-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = sessionStorage.getItem('verifying_email');
    const verificationCode = document.getElementById('verification-code').value;
    const errorElement = document.getElementById('verify-error');
    
    if (!email) {
      errorElement.textContent = 'Δεν βρέθηκε email προς επιβεβαίωση';
      return;
    }
    
    if (!verificationCode) {
      errorElement.textContent = 'Παρακαλώ εισάγετε τον κωδικό επιβεβαίωσης';
      return;
    }
    
    try {
      // Get device ID
      const deviceId = getDeviceIdentifier();
      
      // Get users from localStorage
      let usersData = localStorage.getItem('users');
      let users = [];
      
      if (usersData) {
        try {
          users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
        } catch (e) {
          users = JSON.parse(usersData);
        }
      }
      
      // Find user with email
      const userIndex = users.findIndex(user => user.email === email);
      if (userIndex === -1) {
        errorElement.textContent = 'Δεν βρέθηκε χρήστης με αυτό το email';
        return;
      }
      
      const user = users[userIndex];
      
      // Check if verification has expired
      if (user.verificationExpires < Date.now()) {
        errorElement.textContent = 'Ο κωδικός επιβεβαίωσης έχει λήξει. Παρακαλώ εγγραφείτε ξανά.';
        return;
      }
      
      // Check verification code
      if (user.verificationCode !== verificationCode) {
        errorElement.textContent = 'Λάθος κωδικός επιβεβαίωσης';
        return;
      }
      
      // Update user as verified
      user.emailVerified = true;
      
      // Remove verification data
      delete user.verificationCode;
      delete user.verificationExpires;
      
      // Update users array
      users[userIndex] = user;
      
      // Save updated users
      const encryptedUsers = await encryptData(users, 'app_secret_key_' + deviceId.substring(0, 8));
      localStorage.setItem('users', encryptedUsers);
      
      // Create session for current user
      const currentUser = {
        email: user.email,
        username: user.username || null,
        phoneNumber: user.phoneNumber || null,
        emailVerified: true,
        sessionCreated: new Date().toISOString()
      };
      
      // Encrypt and save current user
      const encryptedCurrentUser = await encryptData(currentUser, deviceId);
      localStorage.setItem('currentUser', encryptedCurrentUser);
      
      // Update UI
      await updateUserMenu();
      
      // Clear verification session
      sessionStorage.removeItem('verifying_email');
      
      // Get redirect URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const redirectUrl = urlParams.get('redirect') || 'index.html';
      
      // Redirect to appropriate page
      window.location.href = redirectUrl;
      
    } catch (error) {
      console.error('Verification error:', error);
      errorElement.textContent = 'Σφάλμα επιβεβαίωσης. Παρακαλώ δοκιμάστε ξανά.';
    }
  });
  
  // Handle resend verification code
  document.getElementById('resend-code')?.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = sessionStorage.getItem('verifying_email');
    const errorElement = document.getElementById('verify-error');
    
    if (!email) {
      errorElement.textContent = 'Δεν βρέθηκε email προς επιβεβαίωση';
      return;
    }
    
    try {
      // Get device ID
      const deviceId = getDeviceIdentifier();
      
      // Get users from localStorage
      let usersData = localStorage.getItem('users');
      let users = [];
      
      if (usersData) {
        try {
          users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
        } catch (e) {
          users = JSON.parse(usersData);
        }
      }
      
      // Find user with email
      const userIndex = users.findIndex(user => user.email === email);
      if (userIndex === -1) {
        errorElement.textContent = 'Δεν βρέθηκε χρήστης με αυτό το email';
        return;
      }
      
      // Generate new verification code
      const verificationCode = generateVerificationCode();
      
      // Update user with new code
      users[userIndex].verificationCode = verificationCode;
      users[userIndex].verificationExpires = Date.now() + (30 * 60 * 1000); // 30 minutes
      
      // Save updated users
      const encryptedUsers = await encryptData(users, 'app_secret_key_' + deviceId.substring(0, 8));
      localStorage.setItem('users', encryptedUsers);
      
      // Send new verification email
      const emailSent = await sendVerificationEmail(email, verificationCode);
      
      if (emailSent) {
        // Show success message
        errorElement.textContent = '';
        const successElement = document.createElement('p');
        successElement.className = 'success-message';
        successElement.textContent = 'Ο νέος κωδικός επιβεβαίωσης στάλθηκε στο email σας';
        
        const form = document.getElementById('verify-form');
        form.appendChild(successElement);
        
        // Remove success message after 5 seconds
        setTimeout(() => {
          successElement.remove();
        }, 5000);
      } else {
        errorElement.textContent = 'Σφάλμα αποστολής email επιβεβαίωσης. Παρακαλώ δοκιμάστε ξανά.';
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      errorElement.textContent = 'Σφάλμα αποστολής. Παρακαλώ δοκιμάστε ξανά.';
    }
  });
  
  // Handle login form submission
  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    // Simple validation
    if (!email || !password) {
      errorElement.textContent = 'Παρακαλώ συμπληρώστε όλα τα πεδία';
      return;
    }
    
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
      
      if (!user) {
        errorElement.textContent = 'Λάθος email ή κωδικός πρόσβασης';
        return;
      }
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Store email for verification form
        sessionStorage.setItem('verifying_email', email);
        
        // Generate new verification code
        const verificationCode = generateVerificationCode();
        
        // Update user with new code
        user.verificationCode = verificationCode;
        user.verificationExpires = Date.now() + (30 * 60 * 1000); // 30 minutes
        
        // Update user in storage
        const userIndex = users.findIndex(u => u.email === email);
        users[userIndex] = user;
        
        // Save updated users
        const encryptedUsers = await encryptData(users, 'app_secret_key_' + deviceId.substring(0, 8));
        localStorage.setItem('users', encryptedUsers);
        
        // Send verification email
        await sendVerificationEmail(email, verificationCode);
        
        // Show verification section
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('signup-section').style.display = 'none';
        document.getElementById('verify-section').style.display = 'block';
        
        // Update verification info
        document.getElementById('verification-email').textContent = email;
        return;
      }
      
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
          emailVerified: true,
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
async function clearAllUserData() {
  try {
    // Get device ID for additional security
    const deviceId = getDeviceIdentifier();
    
    // Remove all users (including admin)
    localStorage.setItem('users', await encryptData([], 'app_secret_key_' + deviceId.substring(0, 8)));
    
    // Sign out current user
    localStorage.removeItem('currentUser');
    
    // Clear verification codes
    localStorage.removeItem('verification_codes');
    
    console.log("All user data has been cleared (including admin account)");
    
    // Force refresh the page
    window.location.href = 'index.html';
  } catch (e) {
    console.error('Error clearing user data:', e);
  }
}
