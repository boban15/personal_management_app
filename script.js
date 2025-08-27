// Time Management App JavaScript

class TimeManagementApp {
    constructor() {
        this.currentDate = new Date();
        this.tasks = this.loadTasks();
        this.draggedTask = null;
        this.selectedTask = null;
        this.isDragging = false;
        
        // View state management
        this.currentView = 'daily'; // daily, weekly, monthly, thirty-day
        this.weekStartDate = new Date();
        this.monthDate = new Date();
        this.thirtyDayStartDate = new Date();
        
        // Calendar grid properties
        this.timeSlots = [];
        this.hoveredTimeSlot = null;
        
        // Double-enter feature tracking
        this.lastAddedTaskId = null;
        this.justAddedTask = false;
        
        // Task popup
        this.taskPopup = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateViewClasses(); // Set initial view class
        this.updateDateDisplay();
        this.renderCurrentView();
    }

    initializeElements() {
        // Sidebar elements
        this.newTaskInput = document.getElementById('new-task-input');
        this.todoList = document.getElementById('todo-list');
        
        // View control elements
        this.viewToggle = document.getElementById('view-toggle');
        this.dailyViewSection = document.querySelector('.daily-view');
        
        // Daily view elements
        this.prevDayBtn = document.getElementById('prev-day');
        this.nextDayBtn = document.getElementById('next-day');
        this.currentDateElement = document.getElementById('current-date');
        this.dailyTasks = document.getElementById('daily-tasks');
        this.scheduledEvents = document.getElementById('scheduled-events');
        
        // Multi-view elements
        this.weeklyView = document.getElementById('weekly-view');
        this.monthlyView = document.getElementById('monthly-view');
        this.thirtyDayView = document.getElementById('thirty-day-view');
    }

    bindEvents() {
        // Todo list functionality
        this.newTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addToTodoList();
        });
        
        // Reset double-enter tracking when user starts typing
        this.newTaskInput.addEventListener('input', () => {
            if (this.newTaskInput.value.trim()) {
                this.resetDoubleEnterTracking();
            }
        });

        // Date navigation
        this.prevDayBtn.addEventListener('click', () => this.changeDate(-1));
        this.nextDayBtn.addEventListener('click', () => this.changeDate(1));
        
        // View toggle
        this.viewToggle.addEventListener('click', () => this.toggleView());

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

    addToTodoList() {
        const text = this.newTaskInput.value.trim();
        
        // Check if this is a double-enter (empty input after just adding a task)
        if (!text && this.justAddedTask && this.lastAddedTaskId) {
            this.moveLastTaskToDaily();
            return;
        }
        
        // Reset double-enter tracking if there's no text
        if (!text) {
            this.resetDoubleEnterTracking();
            return;
        }

        const task = {
            id: this.generateId(),
            text: text,
            date: null,
            time: null,
            type: 'todo'
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderCurrentView();
        this.newTaskInput.value = '';
        
        // Track this task for potential double-enter
        this.lastAddedTaskId = task.id;
        this.justAddedTask = true;
    }

    moveLastTaskToDaily() {
        // Find the last added task
        const taskIndex = this.tasks.findIndex(task => task.id === this.lastAddedTaskId);
        if (taskIndex === -1) {
            this.resetDoubleEnterTracking();
            return;
        }

        // Move the task to daily type with current date
        this.tasks[taskIndex].type = 'daily';
        this.tasks[taskIndex].date = this.formatDate(this.currentDate);
        
        this.saveTasks();
        this.renderCurrentView();
        this.resetDoubleEnterTracking();
    }

    resetDoubleEnterTracking() {
        this.lastAddedTaskId = null;
        this.justAddedTask = false;
    }

    changeDate(direction) {
        switch(this.currentView) {
            case 'daily':
                this.currentDate.setDate(this.currentDate.getDate() + direction);
                break;
            case 'weekly':
                this.weekStartDate.setDate(this.weekStartDate.getDate() + (direction * 7));
                break;
            case 'monthly':
                this.monthDate.setMonth(this.monthDate.getMonth() + direction);
                break;
            case 'thirty-day':
                this.thirtyDayStartDate.setDate(this.thirtyDayStartDate.getDate() + (direction * 30));
                break;
        }
        this.updateDateDisplay();
        this.renderCurrentView();
        // Reset double-enter tracking when changing dates
        this.resetDoubleEnterTracking();
    }

    updateDateDisplay() {
        let displayText = '';
        
        switch(this.currentView) {
            case 'daily':
                const options = { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                };
                displayText = this.currentDate.toLocaleDateString('en-US', options);
                break;
            case 'weekly':
                const weekStart = new Date(this.weekStartDate);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                displayText = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                break;
            case 'monthly':
                displayText = this.monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                break;
            case 'thirty-day':
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 29);
                displayText = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                break;
        }
        
        this.currentDateElement.textContent = displayText;
    }

    renderTasks() {
        this.renderTodoList();
        this.renderDailyTasks();
        this.renderScheduledEvents();
    }

    renderCurrentView() {
        this.renderTodoList(); // Always render todo list
        this.updateViewClasses();
        
        switch(this.currentView) {
            case 'daily':
                this.renderDailyTasks();
                this.renderScheduledEvents();
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

    toggleView() {
        const views = ['daily', 'weekly', 'monthly', 'thirty-day'];
        const currentIndex = views.indexOf(this.currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        this.currentView = views[nextIndex];
        
        // Update button text
        const viewNames = {
            'daily': 'Daily View',
            'weekly': 'Weekly View', 
            'monthly': 'Monthly View',
            'thirty-day': '30-Day View'
        };
        this.viewToggle.textContent = viewNames[this.currentView];
        
        this.updateDateDisplay();
        this.renderCurrentView();
    }

    updateViewClasses() {
        // Remove all view classes
        this.dailyViewSection.classList.remove('view-daily', 'view-weekly', 'view-monthly', 'view-thirty-day');
        // Add current view class
        this.dailyViewSection.classList.add(`view-${this.currentView}`);
    }

    renderWeeklyView() {
        this.weeklyView.innerHTML = '';
        
        // Calculate week start (Sunday)
        const weekStart = new Date(this.weekStartDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(weekStart);
            currentDay.setDate(weekStart.getDate() + i);
            
            const dayContainer = document.createElement('div');
            dayContainer.className = 'week-day drop-zone';
            dayContainer.dataset.date = this.formatDate(currentDay);
            
            if (this.isSameDay(currentDay, new Date())) {
                dayContainer.classList.add('today');
            }
            
            // Day header
            const dayHeader = document.createElement('div');
            dayHeader.className = 'week-day-header';
            dayHeader.textContent = `${dayNames[i]} ${currentDay.getDate()}`;
            dayContainer.appendChild(dayHeader);
            
            // Day tasks container
            const dayTasks = document.createElement('div');
            dayTasks.className = 'week-day-tasks';
            dayContainer.appendChild(dayTasks);
            
            // Add tasks for this day
            this.addTasksToWeekDay(dayTasks, currentDay);
            
            // Make it a drop zone for tasks
            this.setupWeekDayDropZone(dayContainer, currentDay);
            
            this.weeklyView.appendChild(dayContainer);
        }
    }

    renderMonthlyView() {
        this.monthlyView.innerHTML = '';
        
        // Add day-of-week headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(dayName => {
            const headerElement = document.createElement('div');
            headerElement.className = 'calendar-day-header';
            headerElement.textContent = dayName;
            this.monthlyView.appendChild(headerElement);
        });
        
        const year = this.monthDate.getFullYear();
        const month = this.monthDate.getMonth();
        
        // Get first day of month and calculate starting date (include previous month days)
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        // Create 42 days (6 weeks × 7 days)
        for (let i = 0; i < 42; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const dayContainer = document.createElement('div');
            dayContainer.className = 'calendar-day drop-zone';
            dayContainer.dataset.date = this.formatDate(currentDay);
            
            if (currentDay.getMonth() !== month) {
                dayContainer.classList.add('other-month');
            }
            
            if (this.isSameDay(currentDay, new Date())) {
                dayContainer.classList.add('today');
            }
            
            // Day number
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = currentDay.getDate();
            dayContainer.appendChild(dayNumber);
            
            // Day tasks container
            const dayTasks = document.createElement('div');
            dayTasks.className = 'calendar-day-tasks';
            dayContainer.appendChild(dayTasks);
            
            // Add tasks for this day
            this.addTasksToCalendarDay(dayTasks, currentDay);
            
            // Setup click to switch to daily view
            this.setupCalendarDayClick(dayContainer, currentDay);
            
            this.monthlyView.appendChild(dayContainer);
        }
    }

    renderThirtyDayView() {
        this.thirtyDayView.innerHTML = '';
        
        // Calculate 30 days starting from current day
        const startDate = new Date();
        
        // Add dynamic day-of-week headers based on starting day
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const startDayOfWeek = startDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Create headers starting from the current day
        for (let i = 0; i < 7; i++) {
            const dayIndex = (startDayOfWeek + i) % 7;
            const headerElement = document.createElement('div');
            headerElement.className = 'calendar-day-header';
            headerElement.textContent = dayHeaders[dayIndex];
            this.thirtyDayView.appendChild(headerElement);
        }
        
        // Create grid layout similar to monthly view
        for (let i = 0; i < 30; i++) {
            const currentDay = new Date(startDate);
            currentDay.setDate(startDate.getDate() + i);
            
            const dayContainer = document.createElement('div');
            dayContainer.className = 'calendar-day drop-zone';
            dayContainer.dataset.date = this.formatDate(currentDay);
            
            if (this.isSameDay(currentDay, new Date())) {
                dayContainer.classList.add('today');
            }
            
            // Day number and short month
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            dayNumber.textContent = `${monthNames[currentDay.getMonth()]} ${currentDay.getDate()}`;
            dayContainer.appendChild(dayNumber);
            
            // Day tasks container
            const dayTasks = document.createElement('div');
            dayTasks.className = 'calendar-day-tasks';
            dayContainer.appendChild(dayTasks);
            
            // Add tasks for this day
            this.addTasksToCalendarDay(dayTasks, currentDay);
            
            // Setup click to switch to daily view
            this.setupCalendarDayClick(dayContainer, currentDay);
            
            this.thirtyDayView.appendChild(dayContainer);
        }
    }

    // Helper methods for view rendering
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    addTasksToWeekDay(container, date) {
        const dateStr = this.formatDate(date);
        const dayTasks = this.tasks.filter(task => 
            task.date === dateStr && (task.type === 'daily' || task.type === 'scheduled')
        );
        
        dayTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskElement.classList.add('calendar-task');
            container.appendChild(taskElement);
            
            // Re-establish reference if this is the currently selected task
            if (this.selectedTask && this.selectedTask.id === task.id) {
                this.selectedTaskElement = taskElement;
                taskElement.classList.add('selected');
            }
        });
    }

    addTasksToCalendarDay(container, date) {
        const dateStr = this.formatDate(date);
        const dayTasks = this.tasks.filter(task => 
            task.date === dateStr && (task.type === 'daily' || task.type === 'scheduled')
        );
        
        dayTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskElement.classList.add('calendar-task');
            container.appendChild(taskElement);
            
            // Re-establish reference if this is the currently selected task
            if (this.selectedTask && this.selectedTask.id === task.id) {
                this.selectedTaskElement = taskElement;
                taskElement.classList.add('selected');
            }
        });
    }

    setupWeekDayDropZone(dayContainer, date) {
        dayContainer.addEventListener('click', () => {
            if (this.selectedTask && this.isDragging) {
                // Move task to this day and switch to daily view
                this.moveTaskToSpecificDate(this.selectedTask, date);
                this.switchToDailyView(date);
            } else {
                // Just switch to daily view for this date
                this.switchToDailyView(date);
            }
        });
    }

    setupCalendarDayClick(dayContainer, date) {
        dayContainer.addEventListener('click', (e) => {
            if (this.selectedTask && this.isDragging) {
                // Move task to this day and switch to daily view
                e.preventDefault();
                e.stopPropagation();
                this.moveTaskToSpecificDate(this.selectedTask, date);
                this.switchToDailyView(date);
            } else {
                // Just switch to daily view for this date
                this.switchToDailyView(date);
            }
        });
    }

    moveTaskToSpecificDate(task, date) {
        task.date = this.formatDate(date);
        if (task.type === 'todo') {
            task.type = 'daily';
        }
        this.saveTasks();
        // Don't automatically deselect task - keep it attached to cursor
    }

    switchToDailyView(date) {
        this.currentDate = new Date(date);
        this.currentView = 'daily';
        this.viewToggle.textContent = 'Daily View';
        this.updateDateDisplay();
        this.renderCurrentView();
    }

    renderTodoList() {
        const todoTasks = this.tasks.filter(task => task.type === 'todo');
        this.todoList.innerHTML = '';
        
        todoTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.todoList.appendChild(taskElement);
            
            // Re-establish reference if this is the currently selected task
            if (this.selectedTask && this.selectedTask.id === task.id) {
                this.selectedTaskElement = taskElement;
                taskElement.classList.add('selected');
            }
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
            
            // Re-establish reference if this is the currently selected task
            if (this.selectedTask && this.selectedTask.id === task.id) {
                this.selectedTaskElement = taskElement;
                taskElement.classList.add('selected');
            }
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
        
        // Create time grid
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
        
        // Generate hourly intervals for the full 24-hour day
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
            
            // Re-establish reference if this is the currently selected task
            if (this.selectedTask && this.selectedTask.id === task.id) {
                this.selectedTaskElement = taskElement;
                taskElement.classList.add('selected');
            }
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
        this.renderCurrentView();
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
                this.renderCurrentView();
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

        // Add hover popup functionality for all view modes
        taskElement.addEventListener('mouseenter', (e) => {
            this.showTaskPopup(task, taskElement, e);
        });

        taskElement.addEventListener('mouseleave', () => {
            this.hideTaskPopup();
        });

        return taskElement;
    }

    showTaskPopup(task, taskElement, event) {
        // Remove existing popup if any
        this.hideTaskPopup();
        
        // Create popup element
        this.taskPopup = document.createElement('div');
        this.taskPopup.className = 'task-popup';
        
        // Popup content
        const title = document.createElement('div');
        title.className = 'task-popup-title';
        title.textContent = task.text;
        this.taskPopup.appendChild(title);
        
        const details = document.createElement('div');
        details.className = 'task-popup-details';
        
        if (task.time) {
            const timeInfo = document.createElement('div');
            timeInfo.className = 'task-popup-time';
            timeInfo.textContent = `⏰ ${task.time}`;
            details.appendChild(timeInfo);
        }
        
        if (task.date) {
            const dateInfo = document.createElement('div');
            dateInfo.textContent = `📅 ${task.date}`;
            details.appendChild(dateInfo);
        }
        
        const typeInfo = document.createElement('div');
        typeInfo.className = 'task-popup-type';
        typeInfo.textContent = task.type.charAt(0).toUpperCase() + task.type.slice(1);
        details.appendChild(typeInfo);
        
        this.taskPopup.appendChild(details);
        
        // Add to document
        document.body.appendChild(this.taskPopup);
        
        // Position popup adjacent to the task (to the right)
        this.positionTaskPopup(taskElement);
    }
    
    hideTaskPopup() {
        if (this.taskPopup) {
            this.taskPopup.remove();
            this.taskPopup = null;
        }
    }
    
    positionTaskPopup(taskElement) {
        if (!this.taskPopup) return;
        
        const rect = taskElement.getBoundingClientRect();
        const popupRect = this.taskPopup.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Default position: to the right of the task
        let left = rect.right + 10;
        let top = rect.top;
        
        // Adjust if popup would go off screen to the right
        if (left + popupRect.width > viewportWidth) {
            left = rect.left - popupRect.width - 10; // Position to the left instead
        }
        
        // Adjust if popup would go off screen at the bottom
        if (top + popupRect.height > viewportHeight) {
            top = viewportHeight - popupRect.height - 10;
        }
        
        // Ensure popup is not above the top of the viewport
        if (top < 10) {
            top = 10;
        }
        
        this.taskPopup.style.left = `${left}px`;
        this.taskPopup.style.top = `${top}px`;
    }

    isValidTime(time) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderCurrentView();
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
        this.renderCurrentView();
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