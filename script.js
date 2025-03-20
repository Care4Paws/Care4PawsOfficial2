async function showAllUserPasswords() {
  try {
    const response = await fetch('/api/users');
    const users = await response.json();

    console.table(users.map(user => ({
      Username: user.username || 'No username',
      Email: user.email,
      'Paw Points': user.paw_points || 0
    })));

    alert('User passwords printed to console. Press F12 to view.');
  } catch (error) {
    console.error('Error displaying passwords:', error);
    alert('Error retrieving user data. Check console for details.');
  }
}

async function clearAllUserData() {
  try {
    const response = await fetch('/api/users/clear-all', { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Failed to clear user data');
    }

    console.log("All non-admin user data has been cleared");
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}