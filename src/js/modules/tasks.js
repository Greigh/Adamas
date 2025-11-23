// Task Management Module
export function initializeTasks() {
  const addTaskBtn = document.getElementById('add-task');
  const taskTitleInput = document.getElementById('task-title');
  const taskPrioritySelect = document.getElementById('task-priority');
  const taskList = document.getElementById('task-list');
  const filters = document.querySelectorAll('.task-filter');

  let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  let currentFilter = 'all';

  function addTask() {
    const title = taskTitleInput.value.trim();
    const priority = taskPrioritySelect.value;

    if (!title) {
      alert('Please enter a task title');
      return;
    }

    const task = {
      id: Date.now(),
      title,
      priority,
      status: 'pending',
      createdAt: new Date()
    };

    tasks.push(task);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateTaskList();

    // Clear form
    taskTitleInput.value = '';
    taskPrioritySelect.value = 'low';
  }

  function updateTaskList() {
    taskList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
      if (currentFilter === 'all') return true;
      return task.status === currentFilter;
    });

    filteredTasks.forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.status} priority-${task.priority}`;
      li.innerHTML = `
        <div class="task-content">
          <input type="checkbox" ${task.status === 'completed' ? 'checked' : ''} onchange="toggleTask(${task.id})">
          <span class="task-title ${task.status === 'completed' ? 'completed' : ''}">${task.title}</span>
          <span class="task-priority ${task.priority}">${task.priority}</span>
        </div>
        <div class="task-actions">
          <button class="button btn-sm" onclick="editTask(${task.id})">Edit</button>
          <button class="button btn-sm btn-danger" onclick="deleteTask(${task.id})">Delete</button>
        </div>
      `;
      taskList.appendChild(li);
    });
  }

  function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.status = task.status === 'completed' ? 'pending' : 'completed';
      localStorage.setItem('tasks', JSON.stringify(tasks));
      updateTaskList();
    }
  }

  function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const newTitle = prompt('Edit task title:', task.title);
      if (newTitle && newTitle.trim()) {
        task.title = newTitle.trim();
        localStorage.setItem('tasks', JSON.stringify(tasks));
        updateTaskList();
      }
    }
  }

  function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      tasks = tasks.filter(t => t.id !== taskId);
      localStorage.setItem('tasks', JSON.stringify(tasks));
      updateTaskList();
    }
  }

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('active'));
      filter.classList.add('active');
      currentFilter = filter.dataset.filter;
      updateTaskList();
    });
  });

  addTaskBtn.addEventListener('click', addTask);

  // Expose functions globally for inline handlers
  window.toggleTask = toggleTask;
  window.editTask = editTask;
  window.deleteTask = deleteTask;

  updateTaskList();
}