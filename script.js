// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    try {
        // Initialize all components
        const calendar = new Calendar();
        const todoList = new TodoList();
        const notes = new Notes();
        const assignments = new Assignments();
        const timer = new Timer();

        // Render all data from localStorage
        calendar.renderCalendar();
        calendar.renderEventsList();
        todoList.renderTodos();
        notes.renderNotes();
        assignments.renderAssignments();

        // Set up navigation
        setupNavigation();

        // Save instances to window for persistence
        window.appComponents = {
            calendar,
            todoList,
            notes,
            assignments,
            timer
        };
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all nav items and tabs
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            // Add active class to clicked nav item and corresponding tab
            item.classList.add('active');
            const tabId = item.getAttribute('data-tab');
            const tab = document.getElementById(tabId);
            if (tab) tab.classList.add('active');
        });
    });
}

class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        this.loadEvents();
        this.setupEventListeners();
    }

    loadEvents() {
        try {
            const storedEvents = localStorage.getItem('events');
            this.events = storedEvents ? JSON.parse(storedEvents) : [];
            if (!Array.isArray(this.events)) {
                this.events = [];
            }
        } catch (error) {
            console.error('Error loading events:', error);
            this.events = [];
        }
    }

    setupEventListeners() {
        const prevMonth = document.getElementById('prevMonth');
        const nextMonth = document.getElementById('nextMonth');
        const addEventBtn = document.getElementById('addEventBtn');
        const eventModal = document.getElementById('eventModal');
        const eventForm = document.getElementById('eventForm');
        const closeEventModal = document.querySelector('#eventModal .close');

        prevMonth?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        nextMonth?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        addEventBtn?.addEventListener('click', () => {
            if (eventModal) eventModal.style.display = 'block';
        });

        closeEventModal?.addEventListener('click', () => {
            if (eventModal) eventModal.style.display = 'none';
        });

        eventForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        window.addEventListener('click', (e) => {
            if (e.target === eventModal) {
                eventModal.style.display = 'none';
            }
        });

        // Initial render
        this.renderCalendar();
        this.renderEventsList();
    }

    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    saveEvent() {
        const titleInput = document.getElementById('eventTitle');
        const dateInput = document.getElementById('eventDate');
        const timeInput = document.getElementById('eventTime');
        const descInput = document.getElementById('eventDescription');

        if (!titleInput?.value || !dateInput?.value) return;

        const event = {
            id: Date.now().toString(),
            title: titleInput.value,
            date: dateInput.value,
            time: timeInput?.value || '',
            description: descInput?.value || '',
            createdAt: new Date().toISOString()
        };

        this.events.push(event);
        this.saveEvents();

        const modal = document.getElementById('eventModal');
        if (modal) modal.style.display = 'none';

        this.renderCalendar();
        this.renderEventsList();

        // Reset form
        titleInput.value = '';
        dateInput.value = '';
        if (timeInput) timeInput.value = '';
        if (descInput) descInput.value = '';
    }

    deleteEvent(id) {
        this.events = this.events.filter(event => event.id !== id);
        this.saveEvents();
        this.renderCalendar();
        this.renderEventsList();
    }

    saveEvents() {
        try {
            localStorage.setItem('events', JSON.stringify(this.events));
        } catch (error) {
            console.error('Error saving events:', error);
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = this.getDaysInMonth(year, month);
        const firstDayOfMonth = this.getFirstDayOfMonth(year, month);
        
        // Update month/year display
        const monthDisplay = document.getElementById('currentMonth');
        if (monthDisplay) {
            monthDisplay.textContent = `${this.currentDate.toLocaleString('default', { month: 'long' })} ${year}`;
        }

        // Render weekday headers
        const weekdaysDiv = document.querySelector('.weekdays');
        if (weekdaysDiv) {
            weekdaysDiv.innerHTML = this.weekDays.map(day => `<div>${day}</div>`).join('');
        }

        // Render calendar days
        const daysDiv = document.querySelector('.days');
        if (!daysDiv) return;

        let daysHtml = '';

        // Previous month's days
        const prevMonthDays = new Date(year, month, 0).getDate();
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const date = new Date(year, month - 1, day);
            daysHtml += this.createDayHtml(date, true);
        }

        // Current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            daysHtml += this.createDayHtml(date, false);
        }

        // Next month's days
        const totalDays = firstDayOfMonth + daysInMonth;
        const nextMonthDays = Math.ceil(totalDays / 7) * 7 - totalDays;
        for (let day = 1; day <= nextMonthDays; day++) {
            const date = new Date(year, month + 1, day);
            daysHtml += this.createDayHtml(date, true);
        }

        daysDiv.innerHTML = daysHtml;

        // Add event listeners to delete buttons
        const deleteButtons = daysDiv.querySelectorAll('.delete-event-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const eventId = btn.getAttribute('data-event-id');
                if (eventId) this.deleteEvent(eventId);
            });
        });
    }

    createDayHtml(date, isOtherMonth) {
        const dateStr = this.formatDate(date);
        const today = this.formatDate(new Date());
        const dayEvents = this.events.filter(event => event.date === dateStr);
        
        const isToday = dateStr === today;
        const className = `calendar-day${isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}`;

        let eventsHtml = dayEvents.map(event => `
            <div class="calendar-event">
                ${event.title}
                <button class="delete-event-btn" data-event-id="${event.id}">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        return `
            <div class="${className}">
                <span class="date">${date.getDate()}</span>
                <div class="events-container">
                    ${eventsHtml}
                </div>
            </div>
        `;
    }

    renderEventsList() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingEvents = this.events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        eventsList.innerHTML = upcomingEvents.map(event => `
            <div class="event-item">
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <p>
                        ${new Date(event.date).toLocaleDateString()}
                        ${event.time ? ' at ' + event.time : ''}
                    </p>
                    ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                </div>
                <button class="delete-btn" data-event-id="${event.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('') || '<p>No upcoming events</p>';

        // Add event listeners to delete buttons in the list
        const deleteButtons = eventsList.querySelectorAll('.delete-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const eventId = btn.getAttribute('data-event-id');
                if (eventId) this.deleteEvent(eventId);
            });
        });
    }
}

// Todo List Functionality
class TodoList {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.setupEventListeners();
        this.renderTodos();
    }

    setupEventListeners() {
        const addTodoForm = document.getElementById('addTodoForm');
        const todoInput = document.getElementById('todoInput');

        addTodoForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (todoInput?.value.trim()) {
                this.addTodo(todoInput.value.trim());
                todoInput.value = '';
            }
        });

        // Add todo on enter key
        todoInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (todoInput.value.trim()) {
                    this.addTodo(todoInput.value.trim());
                    todoInput.value = '';
                }
            }
        });
    }

    addTodo(text) {
        const todo = {
            id: Date.now().toString(),
            text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.saveTodos();
        this.renderTodos();
    }

    toggleTodo(id) {
        this.todos = this.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        this.saveTodos();
        this.renderTodos();
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.renderTodos();
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    renderTodos() {
        const todoList = document.getElementById('todoList');
        if (!todoList) return;

        todoList.innerHTML = '';
        
        this.todos
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .forEach(todo => {
                const todoItem = document.createElement('div');
                todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                todoItem.innerHTML = `
                    <div class="todo-content">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                        <span class="todo-text">${todo.text}</span>
                    </div>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                `;

                const checkbox = todoItem.querySelector('input[type="checkbox"]');
                checkbox?.addEventListener('change', () => this.toggleTodo(todo.id));

                const deleteBtn = todoItem.querySelector('.delete-btn');
                deleteBtn?.addEventListener('click', () => this.deleteTodo(todo.id));

                todoList.appendChild(todoItem);
            });
    }
}

// Notes Functionality
class Notes {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.setupEventListeners();
        this.renderNotes();
    }

    setupEventListeners() {
        const addNoteBtn = document.getElementById('addNoteBtn');
        const noteModal = document.getElementById('noteModal');
        const noteForm = document.getElementById('noteForm');
        const closeNoteModal = document.querySelector('#noteModal .close');

        addNoteBtn?.addEventListener('click', () => {
            if (noteModal) noteModal.style.display = 'block';
        });

        closeNoteModal?.addEventListener('click', () => {
            if (noteModal) noteModal.style.display = 'none';
        });

        noteForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNote();
        });

        window.addEventListener('click', (e) => {
            if (e.target === noteModal) {
                noteModal.style.display = 'none';
            }
        });
    }

    saveNote() {
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        
        if (!titleInput?.value || !contentInput?.value) return;

        const note = {
            id: Date.now().toString(),
            title: titleInput.value,
            content: contentInput.value,
            createdAt: new Date().toISOString()
        };

        this.notes.push(note);
        this.saveToLocalStorage();

        const noteModal = document.getElementById('noteModal');
        if (noteModal) noteModal.style.display = 'none';

        this.renderNotes();
        
        // Reset form
        titleInput.value = '';
        contentInput.value = '';
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveToLocalStorage();
        this.renderNotes();
    }

    saveToLocalStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }

    renderNotes() {
        const notesContainer = document.getElementById('notesContainer');
        if (!notesContainer) return;

        notesContainer.innerHTML = '';

        this.notes
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.className = 'note-card';
                noteElement.innerHTML = `
                    <div class="note-header">
                        <h3>${note.title}</h3>
                        <button class="delete-btn"><i class="fas fa-trash"></i></button>
                    </div>
                    <div class="note-content">${note.content}</div>
                    <div class="note-footer">
                        <span class="note-date">
                            ${new Date(note.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                `;

                const deleteBtn = noteElement.querySelector('.delete-btn');
                deleteBtn?.addEventListener('click', () => this.deleteNote(note.id));

                notesContainer.appendChild(noteElement);
            });
    }
}

// Assignments Functionality
class Assignments {
    constructor() {
        this.assignments = JSON.parse(localStorage.getItem('assignments')) || [];
        this.setupEventListeners();
        this.renderAssignments();
    }

    setupEventListeners() {
        const addAssignmentBtn = document.getElementById('addAssignmentBtn');
        const assignmentModal = document.getElementById('assignmentModal');
        const assignmentForm = document.getElementById('assignmentForm');
        const closeAssignmentModal = document.querySelector('#assignmentModal .close');

        addAssignmentBtn?.addEventListener('click', () => {
            if (assignmentModal) assignmentModal.style.display = 'block';
        });

        closeAssignmentModal?.addEventListener('click', () => {
            if (assignmentModal) assignmentModal.style.display = 'none';
        });

        assignmentForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAssignment();
        });

        window.addEventListener('click', (e) => {
            if (e.target === assignmentModal) {
                assignmentModal.style.display = 'none';
            }
        });
    }

    saveAssignment() {
        const titleInput = document.getElementById('assignmentTitle');
        const typeInput = document.getElementById('assignmentType');
        const dueDateInput = document.getElementById('assignmentDueDate');
        const descriptionInput = document.getElementById('assignmentDescription');

        if (!titleInput?.value || !dueDateInput?.value) return;

        const assignment = {
            id: Date.now().toString(),
            title: titleInput.value,
            type: typeInput?.value || 'Other',
            dueDate: dueDateInput.value,
            description: descriptionInput?.value || '',
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.assignments.push(assignment);
        this.saveAssignments();

        const modal = document.getElementById('assignmentModal');
        if (modal) modal.style.display = 'none';

        this.renderAssignments();
        
        // Reset form
        titleInput.value = '';
        if (typeInput) typeInput.value = 'Other';
        dueDateInput.value = '';
        if (descriptionInput) descriptionInput.value = '';
    }

    toggleAssignment(id) {
        this.assignments = this.assignments.map(assignment =>
            assignment.id === id ? { ...assignment, completed: !assignment.completed } : assignment
        );
        this.saveAssignments();
        this.renderAssignments();
    }

    deleteAssignment(id) {
        this.assignments = this.assignments.filter(assignment => assignment.id !== id);
        this.saveAssignments();
        this.renderAssignments();
    }

    saveAssignments() {
        localStorage.setItem('assignments', JSON.stringify(this.assignments));
    }

    renderAssignments() {
        const assignmentsList = document.getElementById('assignmentsList');
        if (!assignmentsList) return;

        assignmentsList.innerHTML = '';

        this.assignments
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .forEach(assignment => {
                const assignmentElement = document.createElement('div');
                assignmentElement.className = `assignment-item ${assignment.completed ? 'completed' : ''}`;
                
                const dueDate = new Date(assignment.dueDate);
                const isOverdue = !assignment.completed && dueDate < new Date();

                assignmentElement.innerHTML = `
                    <div class="assignment-content">
                        <div class="assignment-header">
                            <div class="assignment-title-group">
                                <input type="checkbox" ${assignment.completed ? 'checked' : ''}>
                                <h3>${assignment.title}</h3>
                                <span class="assignment-type">${assignment.type}</span>
                            </div>
                            <button class="delete-btn"><i class="fas fa-trash"></i></button>
                        </div>
                        ${assignment.description ? `
                            <div class="assignment-description">${assignment.description}</div>
                        ` : ''}
                        <div class="assignment-footer">
                            <span class="due-date ${isOverdue ? 'overdue' : ''}">
                                Due: ${dueDate.toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                `;

                const checkbox = assignmentElement.querySelector('input[type="checkbox"]');
                checkbox?.addEventListener('change', () => this.toggleAssignment(assignment.id));

                const deleteBtn = assignmentElement.querySelector('.delete-btn');
                deleteBtn?.addEventListener('click', () => this.deleteAssignment(assignment.id));

                assignmentsList.appendChild(assignmentElement);
            });
    }
}

// Timer Functionality
class Timer {
    constructor() {
        this.settings = JSON.parse(localStorage.getItem('timerSettings')) || {
            studyTime: 25,
            breakTime: 5
        };
        this.timeLeft = this.settings.studyTime * 60;
        this.isRunning = false;
        this.isBreak = false;
        this.interval = null;
        this.setupEventListeners();
        this.renderTimer();
    }

    setupEventListeners() {
        const startBtn = document.getElementById('startTimer');
        const resetBtn = document.getElementById('resetTimer');
        const studyTimeInput = document.getElementById('studyTime');
        const breakTimeInput = document.getElementById('breakTime');

        startBtn?.addEventListener('click', () => this.toggleTimer());
        resetBtn?.addEventListener('click', () => this.resetTimer());

        studyTimeInput?.addEventListener('change', () => {
            this.settings.studyTime = parseInt(studyTimeInput.value) || 25;
            this.saveSettings();
            if (!this.isRunning) {
                this.timeLeft = this.settings.studyTime * 60;
                this.renderTimer();
            }
        });

        breakTimeInput?.addEventListener('change', () => {
            this.settings.breakTime = parseInt(breakTimeInput.value) || 5;
            this.saveSettings();
        });

        // Load saved settings
        if (studyTimeInput) studyTimeInput.value = this.settings.studyTime;
        if (breakTimeInput) breakTimeInput.value = this.settings.breakTime;
    }

    toggleTimer() {
        const startBtn = document.getElementById('startTimer');
        if (!this.isRunning) {
            this.isRunning = true;
            if (startBtn) startBtn.innerHTML = '<i class="fas fa-pause"></i>';
            this.interval = setInterval(() => this.tick(), 1000);
        } else {
            this.isRunning = false;
            if (startBtn) startBtn.innerHTML = '<i class="fas fa-play"></i>';
            if (this.interval) clearInterval(this.interval);
        }
    }

    tick() {
        if (this.timeLeft > 0) {
            this.timeLeft--;
            this.renderTimer();
        } else {
            this.playAlarm();
            this.isBreak = !this.isBreak;
            this.timeLeft = (this.isBreak ? this.settings.breakTime : this.settings.studyTime) * 60;
            this.renderTimer();
        }
    }

    resetTimer() {
        this.isRunning = false;
        this.isBreak = false;
        this.timeLeft = this.settings.studyTime * 60;
        if (this.interval) clearInterval(this.interval);
        const startBtn = document.getElementById('startTimer');
        if (startBtn) startBtn.innerHTML = '<i class="fas fa-play"></i>';
        this.renderTimer();
    }

    playAlarm() {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play().catch(error => console.log('Error playing sound:', error));
    }

    saveSettings() {
        localStorage.setItem('timerSettings', JSON.stringify(this.settings));
    }

    renderTimer() {
        const timerDisplay = document.getElementById('timerDisplay');
        const modeDisplay = document.getElementById('timerMode');
        
        if (timerDisplay) {
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            timerDisplay.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        if (modeDisplay) {
            modeDisplay.textContent = this.isBreak ? 'Break Time' : 'Study Time';
            modeDisplay.className = this.isBreak ? 'break-mode' : 'study-mode';
        }
    }
}
