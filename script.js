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
        this.currentView = 'daily'; // daily, weekly, monthly, thirty-day
        this.previousView = 'daily'; // for temporary view switching
        this.hoveredTimeSlot = null;
        
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
        
        // View toggle elements (will be created)
        this.viewToggleBtn = document.getElementById('view-toggle');
        this.viewDropdown = document.getElementById('view-dropdown');
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

        // View toggle functionality
        this.setupViewToggle();

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
        this.renderCurrentView();
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
    }

    getTimeIntervals() {
        const intervals = [];
        
        // Generate all 24 hourly intervals for daily view
        for (let hour = 0; hour < 24; hour++) {
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
    handleTimeSlotHover(timeSlot, interval) {
        this.hoveredTimeSlot = timeSlot;
        
        // Add hover class
        timeSlot.classList.add('time-slot-hover');
    }

    handleTimeSlotLeave(timeSlot) {
        timeSlot.classList.remove('time-slot-hover');
        this.hoveredTimeSlot = null;
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

    setupViewToggle() {
        let clickCount = 0;
        let clickTimer = null;
        
        // Single click cycles through views, double click shows dropdown
        this.viewToggleBtn.addEventListener('click', () => {
            clickCount++;
            
            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    // Single click - cycle through views
                    this.cycleView();
                    clickCount = 0;
                }, 300);
            } else if (clickCount === 2) {
                // Double click - show dropdown
                clearTimeout(clickTimer);
                this.showViewDropdown();
                clickCount = 0;
            }
        });
        
        // Dropdown selection
        this.viewDropdown.addEventListener('change', (e) => {
            this.changeView(e.target.value);
            this.hideViewDropdown();
        });
        
        // Hide dropdown when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!this.viewToggleBtn.contains(e.target) && !this.viewDropdown.contains(e.target)) {
                this.hideViewDropdown();
            }
        });
    }

    cycleView() {
        const views = ['daily', 'weekly', 'monthly', 'thirty-day'];
        const currentIndex = views.indexOf(this.currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        this.changeView(views[nextIndex]);
    }

    changeView(newView) {
        this.currentView = newView;
        this.updateViewToggleButton();
        this.renderCurrentView();
    }

    updateViewToggleButton() {
        const viewNames = {
            'daily': 'Daily View',
            'weekly': 'Weekly View', 
            'monthly': 'Monthly View',
            'thirty-day': '30-Day View'
        };
        this.viewToggleBtn.textContent = viewNames[this.currentView];
        this.viewDropdown.value = this.currentView;
    }

    showViewDropdown() {
        this.viewDropdown.style.display = 'inline-block';
        this.viewToggleBtn.style.display = 'none';
    }

    hideViewDropdown() {
        this.viewDropdown.style.display = 'none';
        this.viewToggleBtn.style.display = 'inline-block';
    }

    renderCurrentView() {
        // Clear the scheduled events area
        this.scheduledEvents.innerHTML = '';
        
        switch(this.currentView) {
            case 'daily':
                this.renderDailyView();
                break;
            case 'weekly':
                this.renderWeeklyView();
                break;
            case 'monthly':
                this.renderMonthlyView();
                break;
            case 'thirty-day':
                this.renderThirtyDayView();
                break;
        }
    }

    renderDailyView() {
        // This is the existing daily view logic
        this.renderScheduledEvents();
    }

    renderWeeklyView() {
        // Create a weekly calendar grid
        const weekStart = this.getWeekStart(this.currentDate);
        const weekDays = [];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            weekDays.push(day);
        }
        
        // Create week header
        const weekHeader = document.createElement('div');
        weekHeader.className = 'week-header';
        weekDays.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            weekHeader.appendChild(dayHeader);
        });
        this.scheduledEvents.appendChild(weekHeader);
        
        // Create week grid
        const weekGrid = document.createElement('div');
        weekGrid.className = 'week-grid';
        
        weekDays.forEach(day => {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.dataset.date = this.formatDate(day);
            
            // Add tasks for this day
            const dayTasks = this.tasks.filter(task => 
                task.date === this.formatDate(day) && 
                (task.type === 'daily' || task.type === 'scheduled')
            );
            
            dayTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                taskElement.classList.add('week-task');
                dayColumn.appendChild(taskElement);
            });
            
            // Make it a drop zone
            this.setupDayColumnDropZone(dayColumn, day);
            
            weekGrid.appendChild(dayColumn);
        });
        
        this.scheduledEvents.appendChild(weekGrid);
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

    renderMonthlyView() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Create month header
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        monthHeader.textContent = this.currentDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
        this.scheduledEvents.appendChild(monthHeader);
        
        // Create days of week header
        const daysHeader = document.createElement('div');
        daysHeader.className = 'days-header';
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(dayName => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-name';
            dayHeader.textContent = dayName;
            daysHeader.appendChild(dayHeader);
        });
        this.scheduledEvents.appendChild(daysHeader);
        
        // Create calendar grid
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        
        // Get first day of month and how many days in month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);
            
            const dayDate = new Date(year, month, day);
            dayElement.dataset.date = this.formatDate(dayDate);
            
            // Add task indicators
            const dayTasks = this.tasks.filter(task => 
                task.date === this.formatDate(dayDate) && 
                (task.type === 'daily' || task.type === 'scheduled')
            );
            
            if (dayTasks.length > 0) {
                const taskIndicator = document.createElement('div');
                taskIndicator.className = 'task-indicator';
                taskIndicator.textContent = `${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}`;
                dayElement.appendChild(taskIndicator);
            }
            
            // Highlight current day
            if (this.formatDate(dayDate) === this.formatDate(this.currentDate)) {
                dayElement.classList.add('current-day');
            }
            
            // Make it clickable to switch to day view
            dayElement.addEventListener('click', () => {
                this.temporarySwitchToDay(dayDate);
            });
            
            // Make it a drop zone
            this.setupDayDropZone(dayElement, dayDate);
            
            calendarGrid.appendChild(dayElement);
        }
        
        this.scheduledEvents.appendChild(calendarGrid);
    }

    renderThirtyDayView() {
        const startDate = new Date(this.currentDate);
        startDate.setDate(startDate.getDate() - 1); // Start from yesterday
        
        // Create header
        const header = document.createElement('div');
        header.className = 'thirty-day-header';
        header.textContent = '30-Day View (from yesterday)';
        this.scheduledEvents.appendChild(header);
        
        // Create scrollable container
        const container = document.createElement('div');
        container.className = 'thirty-day-container';
        
        for (let i = 0; i < 30; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'thirty-day-item';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'thirty-day-header-item';
            dayHeader.textContent = day.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            dayElement.appendChild(dayHeader);
            
            const dayTasks = this.tasks.filter(task => 
                task.date === this.formatDate(day) && 
                (task.type === 'daily' || task.type === 'scheduled')
            );
            
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'thirty-day-tasks';
            
            dayTasks.forEach(task => {
                const taskElement = this.createTaskElement(task);
                taskElement.classList.add('thirty-day-task');
                tasksContainer.appendChild(taskElement);
            });
            
            dayElement.appendChild(tasksContainer);
            dayElement.dataset.date = this.formatDate(day);
            
            // Highlight current day
            if (this.formatDate(day) === this.formatDate(this.currentDate)) {
                dayElement.classList.add('current-day');
            }
            
            // Make it clickable to switch to day view
            dayElement.addEventListener('click', () => {
                this.temporarySwitchToDay(day);
            });
            
            // Make it a drop zone
            this.setupDayDropZone(dayElement, day);
            
            container.appendChild(dayElement);
        }
        
        this.scheduledEvents.appendChild(container);
    }

    getWeekStart(date) {
        const result = new Date(date);
        result.setDate(date.getDate() - date.getDay());
        return result;
    }

    setupDayColumnDropZone(dayColumn, date) {
        dayColumn.addEventListener('mouseover', (e) => {
            if (this.selectedTask && this.isDragging) {
                dayColumn.classList.add('drag-over');
            }
        });

        dayColumn.addEventListener('mouseleave', () => {
            dayColumn.classList.remove('drag-over');
        });

        dayColumn.addEventListener('click', (e) => {
            if (this.selectedTask && this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                dayColumn.classList.remove('drag-over');
                
                this.moveTaskToSpecificDate(this.selectedTask, date);
                this.deselectTask();
            }
        });
    }

    setupDayDropZone(dayElement, date) {
        dayElement.addEventListener('mouseover', (e) => {
            if (this.selectedTask && this.isDragging) {
                dayElement.classList.add('drag-over');
            }
        });

        dayElement.addEventListener('mouseleave', () => {
            dayElement.classList.remove('drag-over');
        });

        dayElement.addEventListener('click', (e) => {
            if (this.selectedTask && this.isDragging) {
                e.preventDefault();
                e.stopPropagation();
                dayElement.classList.remove('drag-over');
                
                this.moveTaskToSpecificDate(this.selectedTask, date);
                this.deselectTask();
            }
        });
    }

    moveTaskToSpecificDate(task, date) {
        const dateStr = this.formatDate(date);
        task.date = dateStr;
        
        if (!task.time) {
            task.type = 'daily';
        } else {
            task.type = 'scheduled';
        }
        
        this.saveTasks();
        this.renderTasks();
    }

    temporarySwitchToDay(date) {
        if (!this.selectedTask || !this.isDragging) {
            // Only switch if not dragging
            this.previousView = this.currentView;
            this.currentDate = new Date(date);
            this.currentView = 'daily';
            this.updateViewToggleButton();
            this.updateDateDisplay();
            this.renderCurrentView();
        }
    }

    returnToPreviousView() {
        if (this.previousView && this.previousView !== this.currentView) {
            this.currentView = this.previousView;
            this.updateViewToggleButton();
            this.renderCurrentView();
        }
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