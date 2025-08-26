// Time Management App JavaScript

class TimeManagementApp {
    constructor() {
        this.currentDate = new Date();
        this.tasks = this.loadTasks();
        this.draggedTask = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateDateDisplay();
        this.renderTasks();
    }

    initializeElements() {
        // Header elements
        this.quickTaskInput = document.getElementById('quick-task-input');
        this.addTaskBtn = document.getElementById('add-task-btn');
        
        // Sidebar elements
        this.newTaskInput = document.getElementById('new-task-input');
        this.addToTodoBtn = document.getElementById('add-to-todo-btn');
        this.todoList = document.getElementById('todo-list');
        
        // Daily view elements
        this.prevDayBtn = document.getElementById('prev-day');
        this.nextDayBtn = document.getElementById('next-day');
        this.currentDateElement = document.getElementById('current-date');
        this.dailyTasks = document.getElementById('daily-tasks');
        this.scheduledEvents = document.getElementById('scheduled-events');
    }

    bindEvents() {
        // Quick add functionality
        this.addTaskBtn.addEventListener('click', () => this.addQuickTask());
        this.quickTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addQuickTask();
        });

        // Todo list functionality
        this.addToTodoBtn.addEventListener('click', () => this.addToTodoList());
        this.newTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addToTodoList();
        });

        // Date navigation
        this.prevDayBtn.addEventListener('click', () => this.changeDate(-1));
        this.nextDayBtn.addEventListener('click', () => this.changeDate(1));

        // Drop zones
        this.setupDropZones();
    }

    addQuickTask() {
        const text = this.quickTaskInput.value.trim();
        if (!text) return;

        const task = {
            id: this.generateId(),
            text: text,
            date: this.formatDate(this.currentDate),
            time: null,
            type: 'daily'
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.quickTaskInput.value = '';
    }

    addToTodoList() {
        const text = this.newTaskInput.value.trim();
        if (!text) return;

        const task = {
            id: this.generateId(),
            text: text,
            date: null,
            time: null,
            type: 'todo'
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.newTaskInput.value = '';
    }

    changeDate(direction) {
        this.currentDate.setDate(this.currentDate.getDate() + direction);
        this.updateDateDisplay();
        this.renderTasks();
    }

    updateDateDisplay() {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        this.currentDateElement.textContent = this.currentDate.toLocaleDateString('en-US', options);
    }

    renderTasks() {
        this.renderTodoList();
        this.renderDailyTasks();
        this.renderScheduledEvents();
    }

    renderTodoList() {
        const todoTasks = this.tasks.filter(task => task.type === 'todo');
        this.todoList.innerHTML = '';
        
        todoTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.todoList.appendChild(taskElement);
        });
    }

    renderDailyTasks() {
        const currentDateStr = this.formatDate(this.currentDate);
        const dailyTasks = this.tasks.filter(task => 
            task.date === currentDateStr && task.type === 'daily'
        );
        
        this.dailyTasks.innerHTML = '';
        dailyTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.dailyTasks.appendChild(taskElement);
        });
    }

    renderScheduledEvents() {
        const currentDateStr = this.formatDate(this.currentDate);
        const scheduledTasks = this.tasks.filter(task => 
            task.date === currentDateStr && task.type === 'scheduled'
        );
        
        // Sort by time
        scheduledTasks.sort((a, b) => {
            if (!a.time) return 1;
            if (!b.time) return -1;
            return a.time.localeCompare(b.time);
        });
        
        this.scheduledEvents.innerHTML = '';
        scheduledTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.scheduledEvents.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        taskContent.textContent = task.text;

        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';

        // Add time button for daily tasks
        if (task.type === 'daily' || task.type === 'scheduled') {
            const timeBtn = document.createElement('button');
            timeBtn.className = 'time-btn';
            timeBtn.textContent = task.time ? task.time : '⏰';
            timeBtn.title = 'Set time';
            timeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setTaskTime(task);
            });
            taskActions.appendChild(timeBtn);

            if (task.time) {
                const timeDisplay = document.createElement('span');
                timeDisplay.className = 'task-time';
                timeDisplay.textContent = task.time;
                taskContent.appendChild(timeDisplay);
            }
        }

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = 'Delete task';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteTask(task.id);
        });
        taskActions.appendChild(deleteBtn);

        taskElement.appendChild(taskContent);
        taskElement.appendChild(taskActions);

        // Drag events
        taskElement.addEventListener('dragstart', (e) => {
            this.draggedTask = task;
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
            this.draggedTask = null;
        });

        return taskElement;
    }

    setTaskTime(task) {
        const time = prompt('Enter time (HH:MM format):', task.time || '09:00');
        if (time && this.isValidTime(time)) {
            task.time = time;
            if (task.type === 'daily') {
                task.type = 'scheduled';
            }
            this.saveTasks();
            this.renderTasks();
        } else if (time === '') {
            // Remove time
            task.time = null;
            if (task.type === 'scheduled') {
                task.type = 'daily';
            }
            this.saveTasks();
            this.renderTasks();
        }
    }

    isValidTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
        }
    }

    setupDropZones() {
        [this.dailyTasks, this.scheduledEvents].forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', () => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                if (this.draggedTask) {
                    this.moveTaskToDate(this.draggedTask, zone);
                }
            });
        });
    }

    moveTaskToDate(task, zone) {
        const currentDateStr = this.formatDate(this.currentDate);
        
        // Update task properties
        task.date = currentDateStr;
        
        if (zone === this.dailyTasks) {
            task.type = 'daily';
            if (task.time) {
                // Ask if user wants to keep the time
                const keepTime = confirm('Keep the scheduled time for this task?');
                if (keepTime) {
                    task.type = 'scheduled';
                } else {
                    task.time = null;
                }
            }
        } else if (zone === this.scheduledEvents) {
            if (!task.time) {
                // Prompt for time if moving to scheduled events
                this.setTaskTime(task);
            } else {
                task.type = 'scheduled';
            }
        }

        this.saveTasks();
        this.renderTasks();
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    loadTasks() {
        const saved = localStorage.getItem('timeManagementTasks');
        return saved ? JSON.parse(saved) : [];
    }

    saveTasks() {
        localStorage.setItem('timeManagementTasks', JSON.stringify(this.tasks));
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimeManagementApp();
});