document.addEventListener('DOMContentLoaded', () => {
  Auth.initStorage();

  const loginScreen = document.getElementById('loginScreen');
  const plannerScreen = document.getElementById('plannerScreen');
  const authMessage = document.getElementById('authMessage');

  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  const taskInput = document.getElementById('taskInput');
  const prioritySelect = document.getElementById('prioritySelect');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskList = document.getElementById('taskList');

  const foldersBar = document.getElementById('foldersBar');
  const addFolderBtn = document.getElementById('addFolderBtn');

  let currentFolderId = 'all';

  function checkAuth() {
    const user = Auth.getCurrentUser();
    if (user) {
      loginScreen.classList.add('hidden');
      plannerScreen.classList.remove('hidden');
      loadUserData(user);
    } else {
      loginScreen.classList.remove('hidden');
      plannerScreen.classList.add('hidden');
    }
  }

  function loadUserData(username) {
    const data = JSON.parse(localStorage.getItem(`user_${username}`)) || {};

    let folders = data.folders || [
      { id: 'home', name: 'Дом', builtIn: true },
      { id: 'work', name: 'Работа', builtIn: true },
      { id: 'study', name: 'Учёба', builtIn: true }
    ];

    let tasks = data.tasks || [];
    tasks = tasks.map(task => {
      if (!task.folderId) {
        task.folderId = 'all';
      }
      return task;
    });

    const savedFolder = data.currentFolderId;
    if (savedFolder === 'all') {
      currentFolderId = 'all';
    } else if (folders.some(f => f.id === savedFolder)) {
      currentFolderId = savedFolder;
    } else {
      currentFolderId = 'all';
    }

    saveUserData(username, folders, tasks, currentFolderId);
    renderFolders(folders);
    renderTasks(tasks, currentFolderId);
  }

  function saveUserData(username, folders, tasks, folderId) {
    localStorage.setItem(`user_${username}`, JSON.stringify({ folders, tasks, currentFolderId: folderId }));
  }

  function renderFolders(folders) {
    if (!foldersBar) return;
    foldersBar.innerHTML = '';

    const allTab = document.createElement('div');
    allTab.className = `folder-tab ${currentFolderId === 'all' ? 'active' : ''}`;
    allTab.textContent = 'Все задачи';
    allTab.onclick = () => {
      currentFolderId = 'all';
      const user = Auth.getCurrentUser();
      const data = JSON.parse(localStorage.getItem(`user_${user}`)) || {};
      saveUserData(user, data.folders, data.tasks, currentFolderId);
      renderFolders(data.folders);
      renderTasks(data.tasks, currentFolderId);
    };
    foldersBar.appendChild(allTab);

    folders.forEach(folder => {
      const tab = document.createElement('div');
      tab.className = `folder-tab ${folder.id === currentFolderId ? 'active' : ''}`;
      tab.textContent = folder.name;

      if (folders.length > 1) {
        const del = document.createElement('span');
        del.className = 'delete-folder';
        del.textContent = '✕';
        del.onclick = e => {
          e.stopPropagation();
          deleteFolder(folder.id);
        };
        tab.appendChild(del);
      }

      tab.onclick = () => {
        currentFolderId = folder.id;
        const user = Auth.getCurrentUser();
        const data = JSON.parse(localStorage.getItem(`user_${user}`)) || {};
        saveUserData(user, data.folders, data.tasks, currentFolderId);
        renderFolders(data.folders);
        renderTasks(data.tasks, currentFolderId);
      };

      foldersBar.appendChild(tab);
    });
  }

  function renderTasks(tasks, folderId) {
    if (!taskList) return;
    taskList.innerHTML = '';

    let filtered = [];
    if (folderId === 'all') {
      filtered = [...tasks];
    } else {
      filtered = tasks.filter(task => task.folderId === folderId);
    }

    const prio = { high: 0, medium: 1, low: 2 };
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return prio[a.priority] - prio[b.priority];
    });

    filtered.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';

      const colors = { high: 'var(--poppy)', medium: 'var(--peach)', low: 'var(--pale)' };
      li.style.borderLeftColor = colors[task.priority] || 'var(--pale)';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.onchange = () => {
        const user = Auth.getCurrentUser();
        const data = JSON.parse(localStorage.getItem(`user_${user}`)) || {};
        const t = data.tasks.find(x => x.id === task.id);
        if (t) {
          t.completed = checkbox.checked;
          saveUserData(user, data.folders, data.tasks, currentFolderId);
        }
      };

      const icon = document.createElement('span');
      icon.className = 'priority-icon';
      icon.textContent = 
        task.priority === 'high' ? '🔴' :
        task.priority === 'medium' ? '🟡' : '🟢';

      const text = document.createElement('span');
      text.className = 'task-text';
      if (task.completed) text.classList.add('completed');
      text.textContent = task.text;

      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.textContent = '×';
      delBtn.onclick = () => {
        const user = Auth.getCurrentUser();
        const data = JSON.parse(localStorage.getItem(`user_${user}`)) || {};
        data.tasks = data.tasks.filter(t => t.id !== task.id);
        saveUserData(user, data.folders, data.tasks, currentFolderId);
        renderTasks(data.tasks, currentFolderId);
      };

      li.append(checkbox, icon, text, delBtn);
      taskList.appendChild(li);
    });
  }

  function addTask() {
    const text = taskInput?.value.trim();
    if (!text) return;

    const user = Auth.getCurrentUser();
    const data = JSON.parse(localStorage.getItem(`user_${user}`)) || {};
    const priority = prioritySelect?.value || 'low';

    const newTask = {
      id: 'task_' + Date.now() + Math.random().toString(36).slice(2, 8),
      text,
      completed: false,
      priority,
      folderId: currentFolderId
    };

    data.tasks = data.tasks || [];
    data.tasks.push(newTask);
    saveUserData(user, data.folders, data.tasks, currentFolderId);

    renderTasks(data.tasks, currentFolderId);
    if (taskInput) taskInput.value = '';
    taskInput?.focus();
  }

  function setupAddFolder() {
    addFolderBtn?.addEventListener('click', () => {
      if (document.getElementById('folder-input-inline')) return;

      const inputContainer = document.createElement('div');
      inputContainer.style.display = 'flex';
      inputContainer.style.gap = '8px';
      inputContainer.style.margin = '0 auto 16px';
      inputContainer.style.maxWidth = '300px';
      inputContainer.id = 'folder-input-container';

      const input = document.createElement('input');
      input.id = 'folder-input-inline';
      input.placeholder = 'Название папки';
      input.className = 'folder-input-inline';
      input.focus();

      const addButton = document.createElement('button');
      addButton.textContent = '+';
      addButton.style.width = '36px';
      addButton.style.height = '36px';
      addButton.style.borderRadius = '50%';
      addButton.style.background = 'var(--tan)';
      addButton.style.color = 'white';
      addButton.style.border = 'none';
      addButton.style.cursor = 'pointer';
      addButton.style.boxShadow = '0 2px 6px rgba(156, 102, 68, 0.3)';
      addButton.style.display = 'flex';
      addButton.style.alignItems = 'center';
      addButton.style.justifyContent = 'center';
      addButton.style.fontSize = '18px';

      const createFolder = () => {
        const name = input.value.trim();
        if (name) {
          const user = Auth.getCurrentUser();
          const data = JSON.parse(localStorage.getItem(`user_${user}`)) || {};
          const newFolder = {
            id: 'folder_' + Date.now(),
            name: name,
            builtIn: false
          };
          data.folders = data.folders || [];
          data.folders.push(newFolder);
          currentFolderId = newFolder.id;
          saveUserData(user, data.folders, data.tasks, currentFolderId);
          renderFolders(data.folders);
          renderTasks(data.tasks, currentFolderId);
        }
        inputContainer.remove();
      };

      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createFolder();
      });

      addButton.addEventListener('click', createFolder);

      input.addEventListener('blur', () => {
        setTimeout(() => {
          if (document.body.contains(inputContainer)) {
            inputContainer.remove();
          }
        }, 150);
      });

      inputContainer.appendChild(input);
      inputContainer.appendChild(addButton);
      addFolderBtn.parentNode.insertBefore(inputContainer, addFolderBtn.nextSibling);
    });
  }

  function deleteFolder(folderId) {
    const user = Auth.getCurrentUser();
    const data = JSON.parse(localStorage.getItem(`user_${user}`)) || {};
    if ((data.folders || []).length <= 1) return;

    data.folders = (data.folders || []).filter(f => f.id !== folderId);
    data.tasks = (data.tasks || []).filter(t => t.folderId !== folderId);

    if (currentFolderId === folderId) {
      currentFolderId = data.folders[0]?.id || 'all';
    }

    saveUserData(user, data.folders, data.tasks, currentFolderId);
    renderFolders(data.folders);
    renderTasks(data.tasks, currentFolderId);
  }

  loginBtn?.addEventListener('click', () => {
    const u = loginUsername?.value.trim();
    const p = loginPassword?.value;
    if (Auth.login(u, p)) {
      authMessage.textContent = '';
      checkAuth();
    } else {
      authMessage.textContent = '❌ Неверный логин или пароль';
    }
  });

  registerBtn?.addEventListener('click', () => {
    const u = loginUsername?.value.trim();
    const p = loginPassword?.value;
    if (u && p) {
      if (Auth.register(u, p)) {
        Auth.login(u, p);
        authMessage.textContent = '✅ Регистрация успешна!';
        setTimeout(checkAuth, 500);
      } else {
        authMessage.textContent = '❌ Пользователь уже существует';
      }
    } else {
      authMessage.textContent = '❌ Заполните все поля';
    }
  });

  logoutBtn?.addEventListener('click', () => {
    Auth.logout();
    checkAuth();
  });

  addTaskBtn?.addEventListener('click', addTask);
  taskInput?.addEventListener('keypress', e => {
    if (e.key === 'Enter') addTask();
  });

  setupAddFolder();
  checkAuth();
});