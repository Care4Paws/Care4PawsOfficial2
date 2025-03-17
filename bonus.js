
// Daily Paws System
document.addEventListener('DOMContentLoaded', async () => {
  // Only run on bonus page
  if (!document.querySelector('.bonus-section')) return;
  
  const currentUser = await getUserData();
  if (!currentUser) {
    window.location.href = 'login.html?redirect=bonus.html';
    return;
  }
  
  setupDailyPaws();
  updateLeaderboard();
});

// Setup daily paws functionality
async function setupDailyPaws() {
  const collectButton = document.getElementById('collect-paws');
  const pawsCountElement = document.getElementById('paws-count');
  const streakCountElement = document.getElementById('streak-count');
  const nextRewardElement = document.getElementById('next-reward');
  const timeRemainingElement = document.getElementById('time-remaining');
  const collectMessageElement = document.getElementById('collect-message');
  
  const currentUser = await getUserData();
  if (!currentUser) return;
  
  // Get user's paws data
  let userData = await getUserFullData(currentUser.email);
  
  // Initialize paws data if not exists
  if (!userData.paws) {
    userData.paws = {
      count: 0,
      streak: 0,
      lastCollected: null
    };
    await updateUserData(userData);
  }
  
  // Update UI with current paws data
  updatePawsUI(userData.paws);
  
  // Update time remaining countdown
  updateTimeRemaining(userData.paws.lastCollected);
  const timerId = setInterval(() => {
    updateTimeRemaining(userData.paws.lastCollected);
  }, 1000);
  
  // Handle collect button click
  collectButton.addEventListener('click', async () => {
    try {
      // Get latest user data
      userData = await getUserFullData(currentUser.email);
      
      // Check if collection is available
      const canCollect = checkCanCollect(userData.paws.lastCollected);
      
      if (canCollect) {
        // Calculate reward based on streak
        const baseReward = 10;
        const streakBonus = userData.paws.streak * 5;
        const totalReward = baseReward + streakBonus;
        
        // Update paws data
        userData.paws.count += totalReward;
        userData.paws.streak += 1;
        userData.paws.lastCollected = new Date().toISOString();
        
        // Save updated data
        await updateUserData(userData);
        
        // Update UI
        updatePawsUI(userData.paws);
        updateTimeRemaining(userData.paws.lastCollected);
        
        // Show success message
        collectMessageElement.textContent = `Συλλέξατε ${totalReward} πατουσάκια!`;
        collectMessageElement.classList.add('success-message');
        collectMessageElement.classList.remove('error-message');
        
        // Update leaderboard
        updateLeaderboard();
      } else {
        const nextCollectionTime = getNextCollectionTime(userData.paws.lastCollected);
        const timeUntilNextCollection = formatTimeRemaining(nextCollectionTime - new Date());
        
        // Show error message
        collectMessageElement.textContent = `Μπορείτε να συλλέξετε ξανά σε ${timeUntilNextCollection}`;
        collectMessageElement.classList.add('error-message');
        collectMessageElement.classList.remove('success-message');
      }
    } catch (error) {
      console.error('Error collecting paws:', error);
      collectMessageElement.textContent = 'Σφάλμα κατά τη συλλογή πατουσιών';
      collectMessageElement.classList.add('error-message');
      collectMessageElement.classList.remove('success-message');
    }
  });
}

// Update paws UI elements
function updatePawsUI(pawsData) {
  const pawsCountElement = document.getElementById('paws-count');
  const streakCountElement = document.getElementById('streak-count');
  const nextRewardElement = document.getElementById('next-reward');
  const collectButton = document.getElementById('collect-paws');
  
  if (!pawsData) return;
  
  // Update display values
  pawsCountElement.textContent = pawsData.count;
  streakCountElement.textContent = pawsData.streak;
  
  // Calculate next reward
  const baseReward = 10;
  const streakBonus = pawsData.streak * 5;
  const nextReward = baseReward + streakBonus;
  nextRewardElement.textContent = nextReward;
  
  // Check if collection is available
  const canCollect = checkCanCollect(pawsData.lastCollected);
  collectButton.disabled = !canCollect;
  collectButton.classList.toggle('disabled', !canCollect);
}

// Check if user can collect paws
function checkCanCollect(lastCollected) {
  if (!lastCollected) return true;
  
  const now = new Date();
  const lastCollectionDate = new Date(lastCollected);
  
  // Check if it's a new month
  if (now.getMonth() !== lastCollectionDate.getMonth() || now.getFullYear() !== lastCollectionDate.getFullYear()) {
    return true;
  }
  
  const nextCollectionTime = new Date(lastCollectionDate);
  nextCollectionTime.setHours(24, 0, 0, 0); // Next day at midnight
  
  return now >= nextCollectionTime;
}

// Monthly paw reset check
async function checkMonthlyReset() {
  const now = new Date();
  const deviceId = getDeviceIdentifier();
  
  try {
    let usersData = localStorage.getItem('users');
    let users = [];
    
    if (usersData) {
      users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
    }
    
    let needsUpdate = false;
    users.forEach(user => {
      if (user.paws && user.paws.lastCollected) {
        const lastCollection = new Date(user.paws.lastCollected);
        if (now.getMonth() !== lastCollection.getMonth() || now.getFullYear() !== lastCollection.getFullYear()) {
          user.paws = { count: 0, streak: 0, lastCollected: null };
          needsUpdate = true;
        }
      }
    });
    
    if (needsUpdate) {
      const encryptedUsers = await encryptData(users, 'app_secret_key_' + deviceId.substring(0, 8));
      localStorage.setItem('users', encryptedUsers);
      updatePawsUI(userData.paws);
      updateLeaderboard();
    }
  } catch (error) {
    console.error('Error checking monthly reset:', error);
  }
}

// Call monthly reset check when page loads
document.addEventListener('DOMContentLoaded', checkMonthlyReset);

// Get next collection time (reset at midnight Athens/Greece time)
function getNextCollectionTime(lastCollected) {
  if (!lastCollected) return new Date();
  
  const lastDate = new Date(lastCollected);
  const now = new Date();
  
  // Convert to EET/EEST time (UTC+2 or UTC+3 depending on DST)
  const eetOffset = isDST(now) ? 3 : 2;
  
  // Get today's midnight in Athens time
  const todayMidnight = new Date();
  todayMidnight.setUTCHours(-eetOffset, 0, 0, 0); // Set to midnight Athens time
  
  // Get tomorrow's midnight in Athens time
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  
  // If the last collection was before today's midnight, next collection is today
  if (lastDate < todayMidnight && now >= todayMidnight) {
    return now;
  }
  
  // Otherwise, next collection is tomorrow at midnight
  return tomorrowMidnight;
}

// Check if date is in Daylight Saving Time (simplified for Greece/EET)
function isDST(date) {
  const year = date.getFullYear();
  // Last Sunday of March
  const dstStart = new Date(year, 2, 31);
  dstStart.setDate(dstStart.getDate() - dstStart.getDay());
  // Last Sunday of October
  const dstEnd = new Date(year, 9, 31);
  dstEnd.setDate(dstEnd.getDate() - dstEnd.getDay());
  
  return date >= dstStart && date < dstEnd;
}

// Update the time remaining display
function updateTimeRemaining(lastCollected) {
  const timeRemainingElement = document.getElementById('time-remaining');
  const collectButton = document.getElementById('collect-paws');
  
  if (!lastCollected) {
    timeRemainingElement.textContent = 'Διαθέσιμο τώρα';
    collectButton.disabled = false;
    collectButton.classList.remove('disabled');
    return;
  }
  
  const now = new Date();
  const nextCollection = getNextCollectionTime(lastCollected);
  
  if (now >= nextCollection) {
    timeRemainingElement.textContent = 'Διαθέσιμο τώρα';
    collectButton.disabled = false;
    collectButton.classList.remove('disabled');
  } else {
    const timeRemaining = formatTimeRemaining(nextCollection - now);
    timeRemainingElement.textContent = timeRemaining;
    collectButton.disabled = true;
    collectButton.classList.add('disabled');
  }
}

// Format time remaining in hours, minutes, seconds
function formatTimeRemaining(timeInMs) {
  const seconds = Math.floor((timeInMs / 1000) % 60);
  const minutes = Math.floor((timeInMs / (1000 * 60)) % 60);
  const hours = Math.floor(timeInMs / (1000 * 60 * 60));
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update the leaderboard
async function updateLeaderboard() {
  const leaderboardBody = document.getElementById('leaderboard-body');
  if (!leaderboardBody) return;
  
  try {
    // Get device ID for security
    const deviceId = getDeviceIdentifier();
    
    // Get all users
    let usersData = localStorage.getItem('users');
    let users = [];
    
    if (usersData) {
      try {
        users = await decryptData(usersData, 'app_secret_key_' + deviceId.substring(0, 8));
      } catch (e) {
        users = JSON.parse(usersData);
      }
    }
    
    // Filter users with paws and sort by paws count
    const leaderboardUsers = users
      .filter(user => user.paws && user.paws.count > 0)
      .sort((a, b) => (b.paws?.count || 0) - (a.paws?.count || 0))
      .slice(0, 10); // Top 10
    
    // Clear leaderboard
    leaderboardBody.innerHTML = '';
    
    // Add users to leaderboard
    if (leaderboardUsers.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="3" class="empty-message">Δεν υπάρχουν ακόμα εγγραφές</td>';
      leaderboardBody.appendChild(emptyRow);
    } else {
      leaderboardUsers.forEach((user, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${user.username || 'Ανώνυμος'}</td>
          <td>${user.paws.count}</td>
        `;
        leaderboardBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    leaderboardBody.innerHTML = '<tr><td colspan="3" class="error-message">Σφάλμα φόρτωσης</td></tr>';
  }
}
