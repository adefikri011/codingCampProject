const STORAGE = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

const DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function initTheme() {
  const saved = STORAGE.get('theme') || 'dark';
  document.body.className = saved;
  document.getElementById('themeIcon').textContent = saved === 'dark' ? '☀' : '☾';
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  document.body.className = next;
  document.getElementById('themeIcon').textContent = next === 'dark' ? '☀' : '☾';
  STORAGE.set('theme', next);
}

function updateClock() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  document.getElementById('clock').textContent = `${hh}:${mm}:${ss}`;

  const day = DAYS[now.getDay()];
  const date = now.getDate();
  const month = MONTHS[now.getMonth()];
  const year = now.getFullYear();
  document.getElementById('dateDisplay').textContent = `${day}, ${date} ${month} ${year}`;

  const hour = now.getHours();
  const name = STORAGE.get('userName') || '';
  let salam = 'Selamat Pagi';
  if (hour >= 12 && hour < 15) salam = 'Selamat Siang';
  else if (hour >= 15 && hour < 18) salam = 'Selamat Sore';
  else if (hour >= 18 || hour < 4) salam = 'Selamat Malam';
  document.getElementById('greeting').textContent = name ? `${salam}, ${name}!` : `${salam}!`;
}

function initNameModal() {
  const name = STORAGE.get('userName');
  const modal = document.getElementById('nameModal');
  if (!name) {
    modal.classList.remove('hidden');
  } else {
    modal.classList.add('hidden');
  }

  document.getElementById('saveName').addEventListener('click', saveName);
  document.getElementById('nameInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveName();
  });
  document.getElementById('changeName').addEventListener('click', () => {
    document.getElementById('nameInput').value = STORAGE.get('userName') || '';
    modal.classList.remove('hidden');
    document.getElementById('nameInput').focus();
  });
}

function saveName() {
  const val = document.getElementById('nameInput').value.trim();
  if (!val) return;
  STORAGE.set('userName', val);
  document.getElementById('nameModal').classList.add('hidden');
  updateClock();
}

let timerInterval = null;
let timerRunning = false;
let timerTotal = 25 * 60;
let timerRemaining = timerTotal;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2,'0');
  const s = String(seconds % 60).padStart(2,'0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  document.getElementById('timerDisplay').textContent = formatTime(timerRemaining);
  const pct = (timerRemaining / timerTotal) * 100;
  document.getElementById('timerBar').style.width = `${pct}%`;
}

function initTimer() {
  const saved = STORAGE.get('timerDuration');
  if (saved) {
    timerTotal = saved * 60;
    timerRemaining = timerTotal;
    const sel = document.getElementById('durationSelect');
    sel.value = saved;
  }
  updateTimerDisplay();

  document.getElementById('timerStart').addEventListener('click', startTimer);
  document.getElementById('timerStop').addEventListener('click', stopTimer);
  document.getElementById('timerReset').addEventListener('click', resetTimer);
  document.getElementById('durationSelect').addEventListener('change', (e) => {
    const mins = parseInt(e.target.value);
    STORAGE.set('timerDuration', mins);
    timerTotal = mins * 60;
    timerRemaining = timerTotal;
    stopTimer();
    updateTimerDisplay();
  });
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  document.getElementById('timerDisplay').classList.add('running');
  timerInterval = setInterval(() => {
    timerRemaining--;
    updateTimerDisplay();
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      document.getElementById('timerDisplay').classList.remove('running');
      notifyTimerDone();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  document.getElementById('timerDisplay').classList.remove('running');
}

function resetTimer() {
  stopTimer();
  timerRemaining = timerTotal;
  updateTimerDisplay();
}

function notifyTimerDone() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Fokus selesai!', { body: 'Waktunya istirahat sejenak.' });
  }
  if (Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

let todos = [];
let currentFilter = 'all';

function initTodo() {
  todos = STORAGE.get('todos') || [];
  renderTodos();

  document.getElementById('todoAdd').addEventListener('click', addTodo);
  document.getElementById('todoInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTodo();
  });

  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderTodos();
    });
  });
}

function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  if (!text) return;

  const duplicate = todos.find((t) => t.text.toLowerCase() === text.toLowerCase());
  if (duplicate) {
    input.style.borderColor = 'var(--danger)';
    setTimeout(() => { input.style.borderColor = ''; }, 1500);
    return;
  }

  todos.unshift({ id: Date.now(), text, done: false });
  input.value = '';
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  renderTodos();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) todo.done = !todo.done;
  saveTodos();
  renderTodos();
}

function startEdit(id) {
  const item = document.querySelector(`[data-id="${id}"] .todo-text`);
  const todo = todos.find((t) => t.id === id);
  if (!item || !todo) return;

  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'todo-edit-input';
  inp.value = todo.text;
  inp.maxLength = 100;
  item.replaceWith(inp);
  inp.focus();

  const finish = () => {
    const val = inp.value.trim();
    if (val && val !== todo.text) {
      const dup = todos.find((t) => t.id !== id && t.text.toLowerCase() === val.toLowerCase());
      if (!dup) todo.text = val;
    }
    saveTodos();
    renderTodos();
  };

  inp.addEventListener('blur', finish);
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') inp.blur();
    if (e.key === 'Escape') { inp.value = todo.text; inp.blur(); }
  });
}

function renderTodos() {
  const list = document.getElementById('todoList');
  let filtered = todos;
  if (currentFilter === 'active') filtered = todos.filter((t) => !t.done);
  if (currentFilter === 'done') filtered = todos.filter((t) => t.done);

  list.innerHTML = '';
  filtered.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;
    li.setAttribute('role', 'listitem');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'todo-checkbox';
    cb.checked = todo.done;
    cb.setAttribute('aria-label', `Tandai selesai: ${todo.text}`);
    cb.addEventListener('change', () => toggleTodo(todo.id));

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.textContent = '✎';
    editBtn.setAttribute('aria-label', `Edit: ${todo.text}`);
    editBtn.addEventListener('click', () => startEdit(todo.id));

    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn delete';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Hapus: ${todo.text}`);
    delBtn.addEventListener('click', () => deleteTodo(todo.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    list.appendChild(li);
  });

  const done = todos.filter((t) => t.done).length;
  const total = todos.length;
  const footer = document.getElementById('todoFooter');
  footer.innerHTML = '';

  if (total > 0) {
    const info = document.createElement('span');
    info.textContent = `${total - done} tugas tersisa`;
    footer.appendChild(info);

    if (done > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear-done-btn';
      clearBtn.textContent = 'Hapus selesai';
      clearBtn.addEventListener('click', () => {
        todos = todos.filter((t) => !t.done);
        saveTodos();
        renderTodos();
      });
      footer.appendChild(clearBtn);
    }
  }
}

function saveTodos() {
  STORAGE.set('todos', todos);
}

let links = [];

function initLinks() {
  links = STORAGE.get('quickLinks') || [
    { id: 1, name: 'Google', url: 'https://google.com' },
    { id: 2, name: 'Gmail', url: 'https://gmail.com' },
    { id: 3, name: 'YouTube', url: 'https://youtube.com' },
  ];
  renderLinks();

  document.getElementById('linkAdd').addEventListener('click', addLink);
  document.getElementById('linkUrl').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addLink();
  });
}

function addLink() {
  const nameEl = document.getElementById('linkName');
  const urlEl = document.getElementById('linkUrl');
  const name = nameEl.value.trim();
  let url = urlEl.value.trim();

  if (!name || !url) return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  links.push({ id: Date.now(), name, url });
  nameEl.value = '';
  urlEl.value = '';
  saveLinks();
  renderLinks();
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks();
  renderLinks();
}

function renderLinks() {
  const grid = document.getElementById('linkGrid');
  grid.innerHTML = '';
  links.forEach((link) => {
    const div = document.createElement('div');
    div.className = 'link-item';
    div.setAttribute('role', 'listitem');

    const a = document.createElement('a');
    a.className = 'link-anchor';
    a.href = link.url;
    a.textContent = link.name;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const delBtn = document.createElement('button');
    delBtn.className = 'link-delete';
    delBtn.textContent = '✕';
    delBtn.setAttribute('aria-label', `Hapus link ${link.name}`);
    delBtn.addEventListener('click', () => deleteLink(link.id));

    div.append(a, delBtn);
    grid.appendChild(div);
  });
}

function saveLinks() {
  STORAGE.set('quickLinks', links);
}

function init() {
  initTheme();
  initNameModal();
  updateClock();
  setInterval(updateClock, 1000);
  initTimer();
  initTodo();
  initLinks();

  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

document.addEventListener('DOMContentLoaded', init);