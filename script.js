// Time Management App JavaScript

class TimeManagementApp {
    constructor() {
        this.currentDate = new Date();
        this.tasks = this.loadTasks();
        this.draggedTask = null;
        this.selectedTask = null;
        this.isDragging = false;
        
        // Calendar grid properties
        this.timeSlots = [];
        this.zoomLevel = 2; // 1 = 24hrs, 2 = 12hrs, 3 = 6hrs
        this.hoverTime = 12; // Default center time (noon)
        this.hoveredTimeSlot = null;
        this.autoZoomTimer = null; // Timer for automatic zoom progression
        
        // Zoom level configuration
        this.ZOOM_RANGES = {
            1: 24, // ±12 hrs (24hrs visible)
            2: 12, // ±6 hrs (12hrs visible)  
            3: 6   // ±3 hrs (6hrs visible)
        };
        
        this.initializeElements();
        this.bindEvents();
        this.updateDateDisplay();
        this.renderTasks();
    }

    initializeElements() {
        // Header elements
        this.quickTaskInput = document.getElementById('quick-task-input');
        
        // Sidebar elements
        this.newTaskInput = document.getElementById('new-task-input');
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
        this.quickTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addQuickTask();
        });

        // Todo list functionality
        this.newTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addToTodoList();
        });

        // Date navigation
        this.prevDayBtn.addEventListener('click', () => this.changeDate(-1));
        this.nextDayBtn.addEventListener('click', () => this.changeDate(1));

        // Drop zones
        this.setupDropZones();
        
        // Mouse tracking for drag behavior
        document.addEventListener('mousemove', (e) => {
            if (this.selectedTask && this.isDragging) {
                this.updateDragPreview(e);
            }
        });
        
        // Global click to deselect
        document.addEventListener('click', (e) => {
            if (this.selectedTask && !e.target.closest('.task-item')) {
                this.deselectTask();
            }
        });
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
        
        // Clear the grid
        this.scheduledEvents.innerHTML = '';
        this.timeSlots = [];
        
        // Create time grid based on zoom level
        this.createTimeGrid();
        
        // Place tasks in appropriate time slots
        scheduledTasks.forEach(task => {
            this.placeTaskInGrid(task);
        });
    }

    createTimeGrid() {
        const intervals = this.getTimeIntervals();
        
        intervals.forEach(interval => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.dataset.time = interval.time;
            
            // Time label
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-label';
            timeLabel.textContent = interval.display;
            timeSlot.appendChild(timeLabel);
            
            // Task container
            const taskContainer = document.createElement('div');
            taskContainer.className = 'task-container';
            timeSlot.appendChild(taskContainer);
            
            // Add hover events for drag and drop
            timeSlot.addEventListener('mouseenter', (e) => {
                if (this.selectedTask && this.isDragging) {
                    this.handleTimeSlotHover(timeSlot, interval);
                }
            });
            
            timeSlot.addEventListener('mouseleave', () => {
                if (this.selectedTask && this.isDragging) {
                    this.handleTimeSlotLeave(timeSlot);
                }
            });
            
            // Click to place task
            timeSlot.addEventListener('click', (e) => {
                if (this.selectedTask && this.isDragging) {
                    this.dropTaskInTimeSlot(timeSlot, interval);
                }
            });
            
            this.scheduledEvents.appendChild(timeSlot);
            this.timeSlots.push({ element: timeSlot, interval });
        });
        
        // Add zoom functionality to the entire grid
        this.setupZoomHandlers();
    }

    // Utility to clamp times between 0 and 24
    clampHour(hour) {
        return Math.max(0, Math.min(24, hour));
    }

    getTimeIntervals() {
        const intervals = [];
        const visibleRange = this.ZOOM_RANGES[this.zoomLevel];
        
        // Calculate desired start and end times
        let startTime = this.hoverTime - visibleRange / 2;
        let endTime = this.hoverTime + visibleRange / 2;
        
        // Adjust if we go out of bounds to maintain full visible range
        if (startTime < 0) {
            const adjustment = -startTime;
            startTime = 0;
            endTime = Math.min(24, endTime + adjustment);
        } else if (endTime > 24) {
            const adjustment = endTime - 24;
            endTime = 24;
            startTime = Math.max(0, startTime - adjustment);
        }
        
        // Clamp to ensure we stay within 0-24 bounds
        startTime = this.clampHour(startTime);
        endTime = this.clampHour(endTime);
        
        // Generate hourly intervals for the visible range
        for (let hour = startTime; hour < endTime; hour++) {
            const time = `${hour.toString().padStart(2, '0')}:00`;
            intervals.push({
                time,
                display: this.formatTimeDisplay(time),
                duration: 60
            });
        }
        
        return intervals;
    }

    formatTimeDisplay(time) {
        const [hours, minutes] = time.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) < 12 ? 'AM' : 'PM';
        
        if (minutes === '00') {
            return `${hour12} ${ampm}`;
        } else {
            return `${hour12}:${minutes} ${ampm}`;
        }
    }

    placeTaskInGrid(task) {
        if (!task.time) return;
        
        // Find the appropriate time slot
        const taskTime = task.time;
        const timeSlot = this.findTimeSlotForTask(taskTime);
        
        if (timeSlot) {
            const taskElement = this.createTaskElement(task);
            taskElement.classList.add('grid-task');
            const taskContainer = timeSlot.element.querySelector('.task-container');
            taskContainer.appendChild(taskElement);
        }
    }

    findTimeSlotForTask(taskTime) {
        // Find the closest time slot that can contain this task
        for (let slot of this.timeSlots) {
            if (this.timeIsInSlot(taskTime, slot.interval)) {
                return slot;
            }
        }
        
        // If no exact match, find closest earlier slot
        let closestSlot = null;
        let smallestDiff = Infinity;
        
        for (let slot of this.timeSlots) {
            const slotMinutes = this.timeToMinutes(slot.interval.time);
            const taskMinutes = this.timeToMinutes(taskTime);
            const diff = taskMinutes - slotMinutes;
            
            if (diff >= 0 && diff < smallestDiff) {
                smallestDiff = diff;
                closestSlot = slot;
            }
        }
        
        return closestSlot;
    }

    timeIsInSlot(taskTime, interval) {
        const taskMinutes = this.timeToMinutes(taskTime);
        const slotMinutes = this.timeToMinutes(interval.time);
        
        return taskMinutes >= slotMinutes && taskMinutes < slotMinutes + interval.duration;
    }

    timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // New zoom system based on hover position
    setupZoomHandlers() {
        // Handle mouse movement for automatic zoom and hover time tracking
        this.scheduledEvents.addEventListener('mousemove', (e) => {
            this.handleGridMouseMove(e);
        });
        
        // Handle mouse enter to start auto zoom progression
        this.scheduledEvents.addEventListener('mouseenter', () => {
            this.startAutoZoom();
        });
        
        // Handle mouse leave to reset zoom
        this.scheduledEvents.addEventListener('mouseleave', () => {
            this.handleGridMouseLeave();
        });
    }
    
    startAutoZoom() {
        // Clear any existing auto zoom timer
        if (this.autoZoomTimer) {
            clearTimeout(this.autoZoomTimer);
        }
        
        // Start progressive auto zoom
        this.autoZoomTimer = setTimeout(() => {
            if (this.zoomLevel < 2) {
                this.zoomLevel = 2;
                this.renderScheduledEvents();
            }
            
            // Continue to next zoom level after additional delay
            this.autoZoomTimer = setTimeout(() => {
                if (this.zoomLevel < 3) {
                    this.zoomLevel = 3;
                    this.renderScheduledEvents();
                }
            }, 800); // Wait 800ms before going to level 3
        }, 500); // Wait 500ms before going to level 2
    }
    
    handleGridMouseMove(e) {
        const rect = this.scheduledEvents.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const gridHeight = rect.height;
        
        // Calculate which time we're hovering over based on current visible range
        const visibleRange = this.ZOOM_RANGES[this.zoomLevel];
        const startTime = this.clampHour(this.hoverTime - visibleRange / 2);
        const timeProgress = y / gridHeight;
        const hoverHour = startTime + (timeProgress * visibleRange);
        
        // Update hover time and re-render if it changed significantly
        const newHoverTime = this.clampHour(Math.round(hoverHour));
        if (Math.abs(newHoverTime - this.hoverTime) >= 1) {
            this.hoverTime = newHoverTime;
            this.renderScheduledEvents();
        }
    }
    
    handleGridMouseLeave() {
        // Clear auto zoom timer
        if (this.autoZoomTimer) {
            clearTimeout(this.autoZoomTimer);
            this.autoZoomTimer = null;
        }
        
        // Reset to default zoom level and center time
        if (this.zoomLevel !== 2 || this.hoverTime !== 12) {
            this.zoomLevel = 2;
            this.hoverTime = 12;
            this.renderScheduledEvents();
        }
    }

    handleTimeSlotHover(timeSlot, interval) {
        this.hoveredTimeSlot = timeSlot;
        
        // Add hover class
        timeSlot.classList.add('time-slot-hover');
    }

    handleTimeSlotLeave(timeSlot) {
        timeSlot.classList.remove('time-slot-hover');
        this.hoveredTimeSlot = null;
    }

    startZoomTransition(timeSlot, interval) {
        // This method is no longer needed with the new zoom system
        // Keeping for compatibility but it does nothing
    }

    resetZoom() {
        // Reset to default state
        this.zoomLevel = 2;
        this.hoverTime = 12;
        this.renderScheduledEvents();
    }

    dropTaskInTimeSlot(timeSlot, interval) {
        if (!this.selectedTask) return;
        
        // Snap to the time slot
        this.selectedTask.time = interval.time;
        this.selectedTask.type = 'scheduled';
        this.selectedTask.date = this.formatDate(this.currentDate);
        
        this.saveTasks();
        this.deselectTask();
        this.renderTasks();
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.dataset.taskId = task.id;

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        taskContent.textContent = task.text;

        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';

        // Add time button for tasks that can have time
        if (task.type === 'todo' || task.type === 'daily' || task.type === 'scheduled') {
            const timeContainer = document.createElement('div');
            timeContainer.className = 'time-container';
            
            const timeInput = document.createElement('input');
            timeInput.type = 'time';
            timeInput.className = 'time-input';
            timeInput.value = task.time || '09:00';
            timeInput.style.display = task.time ? 'inline-block' : 'none';
            
            const timeBtn = document.createElement('button');
            timeBtn.className = 'time-btn';
            timeBtn.textContent = '⏰';
            timeBtn.title = 'Set time';
            
            timeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (timeInput.style.display === 'none') {
                    timeInput.style.display = 'inline-block';
                    timeInput.focus();
                } else {
                    timeInput.style.display = 'none';
                }
            });
            
            timeInput.addEventListener('change', (e) => {
                const time = e.target.value;
                if (time) {
                    task.time = time;
                    if (task.type === 'daily') {
                        task.type = 'scheduled';
                    } else if (task.type === 'todo') {
                        // Todo with time becomes scheduled and gets current date
                        task.type = 'scheduled';
                        task.date = this.formatDate(this.currentDate);
                    }
                } else {
                    task.time = null;
                    if (task.type === 'scheduled') {
                        // If scheduled task loses time, check if it has a date
                        if (task.date) {
                            task.type = 'daily';
                        } else {
                            task.type = 'todo';
                        }
                    }
                }
                this.saveTasks();
                this.renderTasks();
            });
            
            timeInput.addEventListener('blur', () => {
                if (!task.time) {
                    timeInput.style.display = 'none';
                }
            });
            
            timeContainer.appendChild(timeInput);
            timeContainer.appendChild(timeBtn);
            taskActions.appendChild(timeContainer);

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

        // Click-to-select behavior instead of traditional drag
        taskElement.addEventListener('click', (e) => {
            // Don't select if clicking on buttons or inputs
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') {
                return;
            }
            
            e.stopPropagation();
            
            if (this.selectedTask === task) {
                // Clicking selected task again deselects it
                this.deselectTask();
            } else {
                // Select this task
                this.selectTask(task, taskElement);
            }
        });

        return taskElement;
    }

    isValidTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
    }

    setupDropZones() {
        // Daily tasks drop zone
        this.dailyTasks.addEventListener('mouseover', (e) => {
            if (this.selectedTask && this.isDragging) {
                this.dailyTasks.classList.add('drag-over');
            }
        });

        this.dailyTasks.addEventListener('mouseleave', () => {
            this.dailyTasks.classList.remove('drag-over');
        });

        this.dailyTasks.addEventListener('click', (e) => {
            if (this.selectedTask && this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                this.dailyTasks.classList.remove('drag-over');
                
                this.moveTaskToDate(this.selectedTask, this.dailyTasks);
                this.deselectTask();
            }
        });

        // Scheduled events grid drop zone (handled by individual time slots)
        this.scheduledEvents.addEventListener('mouseover', (e) => {
            if (this.selectedTask && this.isDragging) {
                this.scheduledEvents.classList.add('drag-over');
            }
        });

        this.scheduledEvents.addEventListener('mouseleave', () => {
            this.scheduledEvents.classList.remove('drag-over');
        });
    }

    moveTaskToDate(task, zone) {
        const currentDateStr = this.formatDate(this.currentDate);
        
        // Update task properties
        task.date = currentDateStr;
        
        if (zone === this.dailyTasks) {
            task.type = 'daily';
            if (task.time) {
                // Keep the time and make it scheduled
                task.type = 'scheduled';
            }
        } else if (zone === this.scheduledEvents || zone.classList?.contains('scheduled-events-grid')) {
            if (!task.time) {
                // Set default time if moving to scheduled events
                task.time = '09:00';
            }
            task.type = 'scheduled';
        }

        this.saveTasks();
        this.renderTasks();
    }

    selectTask(task, taskElement) {
        // Deselect previous task
        this.deselectTask();
        
        this.selectedTask = task;
        this.selectedTaskElement = taskElement;
        this.isDragging = true;
        
        taskElement.classList.add('selected');
        
        // Create drag preview
        this.createDragPreview(task);
    }
    
    deselectTask() {
        if (this.selectedTaskElement) {
            this.selectedTaskElement.classList.remove('selected');
        }
        if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
        }
        
        this.selectedTask = null;
        this.selectedTaskElement = null;
        this.isDragging = false;
    }
    
    createDragPreview(task) {
        this.dragPreview = document.createElement('div');
        this.dragPreview.className = 'drag-preview';
        this.dragPreview.textContent = task.text;
        this.dragPreview.style.position = 'fixed';
        this.dragPreview.style.pointerEvents = 'none';
        this.dragPreview.style.backgroundColor = '#3498db';
        this.dragPreview.style.color = 'white';
        this.dragPreview.style.padding = '0.5rem';
        this.dragPreview.style.borderRadius = '4px';
        this.dragPreview.style.zIndex = '1000';
        this.dragPreview.style.fontSize = '0.9rem';
        this.dragPreview.style.opacity = '0.8';
        document.body.appendChild(this.dragPreview);
    }
    
    updateDragPreview(e) {
        if (this.dragPreview) {
            this.dragPreview.style.left = (e.clientX + 10) + 'px';
            this.dragPreview.style.top = (e.clientY - 10) + 'px';
        }
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
    window.app = new TimeManagementApp();
});