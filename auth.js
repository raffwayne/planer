function initStorage() {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify({}));
  }
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify({}));
  }
}

function getCurrentUser() {
  return localStorage.getItem('currentUser') || null;
}

function register(username, password) {
  if (!username || !password) return false;
  const users = JSON.parse(localStorage.getItem('users'));
  if (users[username]) return false;
  users[username] = { password };
  localStorage.setItem('users', JSON.stringify(users));
  const tasks = JSON.parse(localStorage.getItem('tasks'));
  tasks[username] = [];
  localStorage.setItem('tasks', JSON.stringify(tasks));
  return true;
}

function login(username, password) {
  const users = JSON.parse(localStorage.getItem('users'));
  if (users[username] && users[username].password === password) {
    localStorage.setItem('currentUser', username);
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('currentUser');
}

window.Auth = { initStorage, getCurrentUser, register, login, logout };
