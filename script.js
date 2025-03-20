// Navigation
document.querySelectorAll('.nav-links li').forEach(link => {
    link.addEventListener('click', () => {
        // Update active nav link
        document.querySelector('.nav-links li.active').classList.remove('active');
        link.classList.add('active');

        // Show corresponding section
        const sectionId = link.getAttribute('data-section');
        document.querySelector('.section.active').classList.remove('active');
        document.getElementById(sectionId).classList.add('active');
    });
});

// Task Management
class Task {
    constructor(id, title, priority, category, estimate, deadline) {
        this.id = id;
        this.title = title;
        this.priority = priority;
        this.category = category;
        this.estimate = estimate;
        this.deadline = deadline;
        this.completed = false;
        this.createdAt = new Date();
    }
}

class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentMethod = 'pomodoro';
        this.initializeElements();
        this.initializeEventListeners();
    }

    initializeElements() {
        // Task input elements
        this.taskInput = document.querySelector('.task-input input[type="text"]');
        this.prioritySelect = document.querySelector('.task-input select[name="priority"]');
        this.workTypeSelect = document.querySelector('.task-input select[name="work-type"]');
        this.estimatedTimeInput = document.querySelector('.task-input input[type="number"]');
        this.dueDateInput = document.querySelector('.task-input input[type="date"]');
        this.addTaskButton = document.querySelector('.task-input button');
        
        // Method buttons
        this.methodButtons = document.querySelectorAll('.method-buttons button');
        this.priorityFilterButtons = document.querySelectorAll('.priority-filters button');
        
        // Task list container
        this.taskListContainer = document.querySelector('.task-list');
    }

    initializeEventListeners() {
        // Add task event
        this.addTaskButton.addEventListener('click', () => this.addTask());

        // Method buttons events
        this.methodButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setActiveMethod(button.dataset.method);
            });
        });

        // Priority filter events
        this.priorityFilterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setActiveFilter(button.dataset.priority);
            });
        });

        // Enter key to add task
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        if (!taskText) return;

        const task = {
            id: Date.now(),
            text: taskText,
            priority: this.prioritySelect.value,
            workType: this.workTypeSelect.value,
            estimatedTime: this.estimatedTimeInput.value,
            dueDate: this.dueDateInput.value,
            completed: false,
            createdAt: new Date()
        };

        this.tasks.push(task);
        this.renderTasks();
        this.clearInputs();
        this.saveTasks();
    }

    clearInputs() {
        this.taskInput.value = '';
        this.prioritySelect.value = 'low';
        this.workTypeSelect.value = 'work';
        this.estimatedTimeInput.value = '';
        this.dueDateInput.value = '';
    }

    setActiveMethod(method) {
        this.currentMethod = method;
        this.methodButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.method === method);
        });
        this.renderTasks();
    }

    setActiveFilter(priority) {
        this.currentFilter = priority;
        this.priorityFilterButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.priority === priority);
        });
        this.renderTasks();
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.renderTasks();
            this.saveTasks();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.renderTasks();
        this.saveTasks();
    }

    renderTasks() {
        if (!this.taskListContainer) return;

        // Filter tasks based on current filter and method
        let filteredTasks = this.tasks;
        
        if (this.currentFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.priority === this.currentFilter);
        }

        if (filteredTasks.length === 0) {
            this.taskListContainer.innerHTML = `
                <div class="no-tasks">
                    <p>No tasks found</p>
                </div>
            `;
            return;
        }

        this.taskListContainer.innerHTML = filteredTasks
            .map(task => this.createTaskElement(task))
            .join('');

        // Add event listeners to new task elements
        this.addTaskEventListeners();
    }

    createTaskElement(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <div class="task-text">${task.text}</div>
                    <div class="task-details">
                        <span class="priority-badge ${task.priority}">${task.priority}</span>
                        <span class="work-type-badge">${task.workType}</span>
                        ${task.estimatedTime ? `<span class="time-badge">${task.estimatedTime}min</span>` : ''}
                        <span class="date-badge">${dueDate}</span>
                    </div>
                </div>
                <button class="delete-task" aria-label="Delete task">×</button>
            </div>
        `;
    }

    addTaskEventListeners() {
        const taskItems = document.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            const taskId = parseInt(item.dataset.id);
            const checkbox = item.querySelector('input[type="checkbox"]');
            const deleteButton = item.querySelector('.delete-task');

            checkbox.addEventListener('change', () => this.toggleTaskComplete(taskId));
            deleteButton.addEventListener('click', () => this.deleteTask(taskId));
        });
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
            this.renderTasks();
        }
    }
}

// Initialize Task Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    taskManager.loadTasks();
});

// Pomodoro Timer
class PomodoroTimer {
    constructor() {
        // Initialize timer state
        this.isRunning = false;
        this.timeLeft = 25 * 60; // Default 25 minutes
        this.currentMode = 'work';
        this.sessionsCompleted = 0;

        // Initialize DOM elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startButton = document.getElementById('startTimer');
        this.pauseButton = document.getElementById('pauseTimer');
        this.resetButton = document.getElementById('resetTimer');
        
        // Bind event listeners
        this.startButton.addEventListener('click', () => this.start());
        this.pauseButton.addEventListener('click', () => this.pause());
        this.resetButton.addEventListener('click', () => this.reset());

        this.updateDisplay();
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startButton.disabled = true;
            this.pauseButton.disabled = false;
            
            this.timer = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();

                if (this.timeLeft <= 0) {
                    this.handleTimerComplete();
                }
            }, 1000);
        }
    }

    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startButton.disabled = false;
            this.pauseButton.disabled = true;
            clearInterval(this.timer);
        }
    }

    reset() {
        this.isRunning = false;
        clearInterval(this.timer);
        this.timeLeft = 25 * 60; // Reset to 25 minutes
        this.currentMode = 'work';
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.updateDisplay();
    }

    handleTimerComplete() {
        clearInterval(this.timer);
        this.isRunning = false;

        if (this.currentMode === 'work') {
            this.sessionsCompleted++;
            this.timeLeft = 5 * 60; // 5 minute break
            this.currentMode = 'break';
        } else {
            this.timeLeft = 25 * 60; // 25 minute work session
            this.currentMode = 'work';
        }

        this.updateDisplay();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Analytics
class Analytics {
    constructor() {
        try {
            this.taskCompletionChart = this.initializeTaskCompletionChart();
            this.productivityChart = this.initializeProductivityChart();
            this.chartData = {
                taskCompletion: { completed: 0, pending: 0 },
                productivity: new Array(7).fill(0)
            };
            this.loadChartData();
        } catch (error) {
            console.error('Error initializing Analytics:', error);
            this.showNotification('Error initializing analytics. Please refresh the page.', 'error');
        }
    }

    initializeTaskCompletionChart() {
        try {
            const ctx = document.getElementById('taskCompletionChart');
            if (!ctx) throw new Error('Task completion chart canvas not found');

            return new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Completed', 'Pending'],
                    datasets: [{
                        data: [0, 0],
                        backgroundColor: ['#4a90e2', '#e74c3c']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Task Completion Rate'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing task completion chart:', error);
            throw error;
        }
    }

    initializeProductivityChart() {
        try {
            const ctx = document.getElementById('productivityChart');
            if (!ctx) throw new Error('Productivity chart canvas not found');

            return new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Pomodoro Sessions',
                        data: new Array(7).fill(0),
                        backgroundColor: '#4a90e2'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Weekly Productivity'
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing productivity chart:', error);
            throw error;
        }
    }

    loadChartData() {
        try {
            const savedData = localStorage.getItem('chartData');
            if (savedData) {
                this.chartData = JSON.parse(savedData);
                this.updateCharts();
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    }

    saveChartData() {
        try {
            localStorage.setItem('chartData', JSON.stringify(this.chartData));
        } catch (error) {
            console.error('Error saving chart data:', error);
        }
    }

    updateTaskCompletion(completed, total) {
        try {
            this.chartData.taskCompletion = {
                completed,
                pending: total - completed
            };
            this.updateCharts();
            this.saveChartData();
        } catch (error) {
            console.error('Error updating task completion:', error);
            this.showNotification('Error updating task completion data.', 'error');
        }
    }

    updateProductivity(dayIndex) {
        try {
            if (dayIndex >= 0 && dayIndex < 7) {
                this.chartData.productivity[dayIndex]++;
                this.updateCharts();
                this.saveChartData();
            }
        } catch (error) {
            console.error('Error updating productivity:', error);
            this.showNotification('Error updating productivity data.', 'error');
        }
    }

    updateCharts() {
        try {
            // Update task completion chart
            this.taskCompletionChart.data.datasets[0].data = [
                this.chartData.taskCompletion.completed,
                this.chartData.taskCompletion.pending
            ];
            this.taskCompletionChart.update();

            // Update productivity chart
            this.productivityChart.data.datasets[0].data = this.chartData.productivity;
            this.productivityChart.update();
        } catch (error) {
            console.error('Error updating charts:', error);
            this.showNotification('Error updating charts.', 'error');
        }
    }

    showNotification(message, type = 'info') {
        try {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Remove existing notifications
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notif => {
                if (notif !== notification) {
                    notif.remove();
                }
            });
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }
}

// Diary
class Diary {
    constructor() {
        this.entries = JSON.parse(localStorage.getItem('diaryEntries')) || [];
        this.diaryEntry = document.getElementById('diaryEntry');
        this.saveDiaryBtn = document.getElementById('saveDiary');
        this.diaryEntries = document.getElementById('diaryEntries');

        this.saveDiaryBtn.addEventListener('click', () => this.saveEntry());
        this.renderEntries();
    }

    saveEntry() {
        const entry = {
            id: Date.now(),
            text: this.diaryEntry.value.trim(),
            date: new Date().toISOString()
        };

        if (entry.text) {
            this.entries.push(entry);
            this.saveEntries();
            this.renderEntries();
            this.diaryEntry.value = '';
        }
    }

    renderEntries() {
        this.diaryEntries.innerHTML = '';
        this.entries.sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(entry => {
                const entryElement = document.createElement('div');
                entryElement.className = 'diary-entry';
                entryElement.innerHTML = `
                    <div class="entry-date">${new Date(entry.date).toLocaleDateString()}</div>
                    <div class="entry-text">${entry.text}</div>
                `;
                this.diaryEntries.appendChild(entryElement);
            });
    }

    saveEntries() {
        localStorage.setItem('diaryEntries', JSON.stringify(this.entries));
    }
}

// Badges
class BadgeSystem {
    constructor() {
        this.badges = [
            // Streak & Consistency Badges
            { id: 'first_step', name: 'First Step', icon: 'fa-flag-checkered', description: 'Completed the first task', category: 'streak' },
            { id: 'three_day_streak', name: '3-Day Streak', icon: 'fa-fire', description: 'Completed tasks for three consecutive days', category: 'streak' },
            { id: 'week_warrior', name: 'One-Week Warrior', icon: 'fa-fire', description: 'Maintained a 7-day streak', category: 'streak' },
            { id: 'momentum_master', name: 'Momentum Master', icon: 'fa-fire', description: 'Maintained a 14-day streak', category: 'streak' },
            { id: 'habit_hero', name: 'Habit Hero', icon: 'fa-crown', description: 'Maintained a 30-day streak', category: 'streak' },
            { id: 'unstoppable', name: 'Unstoppable', icon: 'fa-bolt', description: 'Maintained a 90-day streak', category: 'streak' },

            // Task Completion Badges
            { id: 'task_starter', name: 'Task Starter', icon: 'fa-play', description: 'Completed 5 tasks', category: 'completion' },
            { id: 'task_finisher', name: 'Task Finisher', icon: 'fa-check-double', description: 'Completed 10 tasks', category: 'completion' },
            { id: 'productivity_champ', name: 'Productivity Champ', icon: 'fa-trophy', description: 'Completed 25 tasks', category: 'completion' },
            { id: 'task_slayer', name: 'Task Slayer', icon: 'fa-dragon', description: 'Completed 50 tasks', category: 'completion' },
            { id: 'master_executor', name: 'Master Executor', icon: 'fa-star', description: 'Completed 100 tasks', category: 'completion' },

            // Achievement & Milestone Badges
            { id: 'no_excuses', name: 'No More Excuses', icon: 'fa-check-circle', description: 'Completed a high-priority task on time', category: 'achievement' },
            { id: 'last_minute', name: 'Last-Minute Saver', icon: 'fa-clock', description: 'Completed a task within 5 minutes of the deadline', category: 'achievement' },
            { id: 'early_bird', name: 'Early Bird', icon: 'fa-dove', description: 'Completed a task at least a day before the deadline', category: 'achievement' },
            { id: 'night_owl', name: 'Night Owl', icon: 'fa-moon', description: 'Completed a task after midnight', category: 'achievement' },
            { id: 'marathon_worker', name: 'Marathon Worker', icon: 'fa-running', description: 'Completed 3+ tasks in a single day', category: 'achievement' },
            { id: 'deadline_dominator', name: 'Deadline Dominator', icon: 'fa-calendar-check', description: 'Completed all tasks in a week without missing any', category: 'achievement' },
            { id: 'power_hour', name: 'Power Hour', icon: 'fa-bolt', description: 'Completed a task within 30 minutes using focus mode', category: 'achievement' },
            { id: 'procrastination_buster', name: 'Procrastination Buster', icon: 'fa-hourglass-end', description: 'Rescheduled a task but still completed it on time', category: 'achievement' },

            // Long-Term Dedication Badges
            { id: 'consistency_royalty', name: 'Consistency King/Queen', icon: 'fa-crown', description: 'Maintained an active streak for over 3 months', category: 'dedication' },
            { id: 'year_growth', name: 'Year of Growth', icon: 'fa-tree', description: 'Used the app consistently for 1 year', category: 'dedication' },
            { id: 'comeback_kid', name: 'Comeback Kid', icon: 'fa-undo', description: 'Broke a streak but bounced back stronger', category: 'dedication' },

            // Self-Reflection & Diary Badges
            { id: 'dear_diary', name: 'Dear Diary', icon: 'fa-book', description: 'Made the first diary entry', category: 'reflection' },
            { id: 'mindful_writer', name: 'Mindful Writer', icon: 'fa-feather', description: 'Logged 10 diary entries', category: 'reflection' },
            { id: 'deep_thinker', name: 'Deep Thinker', icon: 'fa-brain', description: 'Logged 50 diary entries', category: 'reflection' },
            { id: 'emotion_explorer', name: 'Emotion Explorer', icon: 'fa-smile', description: 'Consistently tracked mood with the diary', category: 'reflection' },
            { id: 'improvement_guru', name: 'Self-Improvement Guru', icon: 'fa-chart-line', description: 'Used AI insights to adjust habits', category: 'reflection' },

            // Special & Fun Badges
            { id: 'weekend_warrior', name: 'Weekend Warrior', icon: 'fa-umbrella-beach', description: 'Completed a task on a weekend', category: 'special' },
            { id: 'monday_motivation', name: 'Monday Motivation', icon: 'fa-coffee', description: 'Completed a task early on a Monday', category: 'special' },
            { id: 'focus_beast', name: 'Focus Beast', icon: 'fa-bullseye', description: 'Used the app for 1 hour without distractions', category: 'special' },
            { id: 'distraction_free', name: 'Distraction-Free Master', icon: 'fa-ban', description: 'Avoided social media distractions while working', category: 'special' },
            { id: 'all_rounder', name: 'All-Rounder', icon: 'fa-certificate', description: 'Earned at least one badge in every category', category: 'special' },
            { id: 'beta_tester', name: 'Beta Tester', icon: 'fa-flask', description: 'Provided feedback or used early features', category: 'special' },
            { id: 'hidden_gem', name: 'Hidden Gem', icon: 'fa-gem', description: 'Special surprise badge for an unexpected milestone', category: 'special' },

            // Social & Community Badges
            { id: 'motivation_mentor', name: 'Motivation Mentor', icon: 'fa-users', description: 'Helped a friend join the app', category: 'social' },
            { id: 'team_player', name: 'Team Player', icon: 'fa-hands-helping', description: 'Completed a collaborative goal', category: 'social' },
            { id: 'challenge_accepted', name: 'Challenge Accepted', icon: 'fa-flag', description: 'Participated in a productivity challenge', category: 'social' }
        ];
        this.earnedBadges = JSON.parse(localStorage.getItem('earnedBadges')) || [];
        this.badgesContainer = document.getElementById('badgesContainer');
        this.renderBadges();
    }

    renderBadges() {
        this.badgesContainer.innerHTML = '';
        
        // Group badges by category
        const categories = {
            streak: { name: '🔥 Streak & Consistency', badges: [] },
            completion: { name: '🚀 Task Completion', badges: [] },
            achievement: { name: '🏆 Achievement & Milestone', badges: [] },
            dedication: { name: '📅 Long-Term Dedication', badges: [] },
            reflection: { name: '🧠 Self-Reflection & Diary', badges: [] },
            special: { name: '💡 Special & Fun', badges: [] },
            social: { name: '🔗 Social & Community', badges: [] }
        };

        // Sort badges into categories
        this.badges.forEach(badge => {
            if (categories[badge.category]) {
                categories[badge.category].badges.push(badge);
            }
        });

        // Create category sections
        Object.values(categories).forEach(category => {
            const categorySection = document.createElement('div');
            categorySection.className = 'badge-category';
            categorySection.innerHTML = `<h3>${category.name}</h3>`;
            
            const badgeGrid = document.createElement('div');
            badgeGrid.className = 'badge-grid';
            
            category.badges.forEach(badge => {
                const badgeElement = document.createElement('div');
                badgeElement.className = `badge ${this.earnedBadges.includes(badge.id) ? 'earned' : 'locked'}`;
                badgeElement.innerHTML = `
                    <i class="fas ${badge.icon}"></i>
                    <h4>${badge.name}</h4>
                    <p>${badge.description}</p>
                `;
                badgeGrid.appendChild(badgeElement);
            });
            
            categorySection.appendChild(badgeGrid);
            this.badgesContainer.appendChild(categorySection);
        });
    }

    // ... rest of the BadgeSystem class methods ...
}

// Chatbot
class Chatbot {
    constructor() {
        try {
            this.chatMessages = document.getElementById('chatMessages');
            this.chatInput = document.getElementById('chatInput');
            this.sendButton = document.getElementById('sendMessage');
            
            if (!this.chatMessages || !this.chatInput || !this.sendButton) {
                throw new Error('Required chatbot elements not found');
            }

            this.messageHistory = [];
            this.isProcessing = false;
            this.initializeEventListeners();
            this.addMessage('Hello! I\'m your AI productivity assistant. How can I help you today?');
        } catch (error) {
            console.error('Error initializing Chatbot:', error);
            this.showNotification('Error initializing chatbot. Please refresh the page.', 'error');
        }
    }

    initializeEventListeners() {
        try {
            this.sendButton.addEventListener('click', () => this.sendMessage());
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Handle window resize
            window.addEventListener('resize', this.debounce(() => {
                this.scrollToBottom();
            }, 250));
        } catch (error) {
            console.error('Error setting up chatbot event listeners:', error);
            this.showNotification('Error setting up chatbot controls.', 'error');
        }
    }

    addMessage(content, isUser = false) {
        try {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${this.escapeHtml(content)}
                </div>
            `;
            this.chatMessages.appendChild(messageDiv);
            this.scrollToBottom();
            this.messageHistory.push({ content, isUser, timestamp: Date.now() });
        } catch (error) {
            console.error('Error adding message:', error);
            this.showNotification('Error displaying message.', 'error');
        }
    }

    async sendMessage() {
        if (this.isProcessing) return;

        const message = this.chatInput.value.trim();
        if (!message) return;

        try {
            this.isProcessing = true;
            this.sendButton.disabled = true;
            this.chatInput.disabled = true;

            // Add user message to chat
            this.addMessage(message, true);
            this.chatInput.value = '';

            // Process message and get response
            const response = await this.processMessage(message);
            this.addMessage(response);
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('I apologize, but I encountered an error. Please try again.', false);
        } finally {
            this.isProcessing = false;
            this.sendButton.disabled = false;
            this.chatInput.disabled = false;
            this.chatInput.focus();
        }
    }

    async processMessage(message) {
        try {
            // Convert message to lowercase for easier matching
            const lowerMessage = message.toLowerCase();

            // Check for task-related queries
            if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
                return await this.handleTaskQuery(lowerMessage);
            }

            // Check for Pomodoro-related queries
            if (lowerMessage.includes('pomodoro') || lowerMessage.includes('timer')) {
                return await this.handlePomodoroQuery(lowerMessage);
            }

            // Check for analytics-related queries
            if (lowerMessage.includes('progress') || lowerMessage.includes('analytics')) {
                return await this.handleAnalyticsQuery();
            }

            // Check for diary-related queries
            if (lowerMessage.includes('diary') || lowerMessage.includes('journal')) {
                return await this.handleDiaryQuery(lowerMessage);
            }

            // Check for badge-related queries
            if (lowerMessage.includes('badge') || lowerMessage.includes('achievement')) {
                return await this.handleBadgeQuery();
            }

            // Handle general queries
            return this.handleGeneralQuery(lowerMessage);
        } catch (error) {
            console.error('Error processing message:', error);
            return 'I apologize, but I encountered an error processing your message. Please try again.';
        }
    }

    async handleTaskQuery(message) {
        const taskManager = window.taskManager;
        const completedTasks = taskManager.tasks.filter(t => t.completed).length;
        const totalTasks = taskManager.tasks.length;
        
        if (message.includes('how many')) {
            return `You have ${completedTasks} completed tasks out of ${totalTasks} total tasks.`;
        } else if (message.includes('add')) {
            return "To add a new task, use the task input field at the top of the Tasks section.";
        }
        return "I can help you with task management. You can ask about your tasks or how to add new ones.";
    }

    async handlePomodoroQuery(message) {
        if (message.includes('how to')) {
            return "The Pomodoro technique works by breaking your work into 25-minute focused sessions followed by 5-minute breaks. After 4 sessions, take a longer 15-minute break.";
        } else if (message.includes('start')) {
            return "You can start the Pomodoro timer by clicking the 'Start' button in the Pomodoro section.";
        }
        return "I can help you with the Pomodoro timer. You can ask how to use it or how to start a session.";
    }

    async handleAnalyticsQuery() {
        const analytics = window.analytics;
        const totalPomodoros = analytics.productivityChart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        return `You've completed ${totalPomodoros} Pomodoro sessions this week. Check the Analytics section for detailed statistics.`;
    }

    async handleDiaryQuery(message) {
        const diary = window.diary;
        if (message.includes('how many')) {
            return `You have written ${diary.entries.length} diary entries so far.`;
        }
        return "I can help you with your diary entries. You can ask about how many entries you've written or how to add new ones.";
    }

    async handleBadgeQuery() {
        const badgeSystem = window.badgeSystem;
        const earnedBadges = badgeSystem.earnedBadges.length;
        return `You have earned ${earnedBadges} badges so far. Check the Badges section to see your achievements!`;
    }

    handleGeneralQuery(message) {
        const lowerMessage = message.toLowerCase();
        
        // Motivational responses
        if (lowerMessage.includes('motivation') || lowerMessage.includes('motivate')) {
            const motivationalQuotes = [
                "Start with one task at a time.",
                "Focus on progress, not perfection.",
                "Take small steps consistently.",
                "Stay focused on your goals.",
                "Keep moving forward."
            ];
            return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        }

        // Productivity tips
        if (lowerMessage.includes('productivity') || lowerMessage.includes('productive')) {
            const productivityTips = [
                "Use the Pomodoro technique: 25 minutes work, 5 minutes break.",
                "Break large tasks into smaller ones.",
                "Set specific deadlines for tasks.",
                "Take regular breaks to stay fresh.",
                "Start with the most important task first."
            ];
            return productivityTips[Math.floor(Math.random() * productivityTips.length)];
        }

        // Greetings
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! How can I help you with your tasks today?";
        }

        // Help requests
        if (lowerMessage.includes('help')) {
            return "I can help you with:\n- Tasks\n- Pomodoro Timer\n- Analytics\n- Diary\n- Badges\n\nWhat would you like to know?";
        }

        // Thank you responses
        if (lowerMessage.includes('thank')) {
            return "You're welcome! Let me know if you need anything else.";
        }

        // Default response
        return "I can help you with tasks, Pomodoro timer, analytics, diary, or badges. What would you like to know?";
    }

    scrollToBottom() {
        try {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        } catch (error) {
            console.error('Error scrolling chat:', error);
        }
    }

    showNotification(message, type = 'info') {
        try {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Remove existing notifications
            const existingNotifications = document.querySelectorAll('.notification');
            existingNotifications.forEach(notif => {
                if (notif !== notification) {
                    notif.remove();
                }
            });
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// AI Performance Analyzer
class PerformanceAnalyzer {
    constructor() {
        this.performanceTrends = document.getElementById('performanceTrends');
        this.peakHours = document.getElementById('peakHours');
        this.procrastinationPatterns = document.getElementById('procrastinationPatterns');
        this.aiRecommendations = document.getElementById('aiRecommendations');
        this.reflectionPrompts = document.getElementById('reflectionPrompts');
        
        this.initializeEventListeners();
        this.updateInsights();
    }

    initializeEventListeners() {
        // Update insights periodically
        setInterval(() => this.updateInsights(), 300000); // Every 5 minutes
    }

    updateInsights() {
        this.analyzePerformanceTrends();
        this.analyzePeakHours();
        this.analyzeProcrastinationPatterns();
        this.generateRecommendations();
        this.generateReflectionPrompts();
    }

    analyzePerformanceTrends() {
        const taskManager = window.taskManager;
        const completedTasks = taskManager.tasks.filter(t => t.completed);
        const completionRate = (completedTasks.length / taskManager.tasks.length) * 100 || 0;
        
        const trend = completionRate > 70 ? 'increasing' : completionRate > 40 ? 'stable' : 'decreasing';
        const trendEmoji = trend === 'increasing' ? '📈' : trend === 'stable' ? '📊' : '📉';
        
        this.performanceTrends.innerHTML = `
            <p>${trendEmoji} Your task completion rate is ${completionRate.toFixed(1)}%</p>
            <p>${this.getTrendMessage(trend)}</p>
        `;
    }

    analyzePeakHours() {
        const taskManager = window.taskManager;
        const completedTasks = taskManager.tasks.filter(t => t.completed);
        const hourDistribution = new Array(24).fill(0);
        
        completedTasks.forEach(task => {
            const hour = new Date(task.createdAt).getHours();
            hourDistribution[hour]++;
        });

        const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));
        const peakHourFormatted = new Date(2000, 0, 1, peakHour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        this.peakHours.innerHTML = `
            <p>⏰ Your most productive hour is ${peakHourFormatted}</p>
            <p>Consider scheduling important tasks during this time</p>
        `;
    }

    analyzeProcrastinationPatterns() {
        const taskManager = window.taskManager;
        const delayedTasks = taskManager.tasks.filter(task => {
            if (!task.deadline) return false;
            const deadline = new Date(task.deadline);
            const now = new Date();
            return deadline < now && !task.completed;
        });

        const procrastinationRate = (delayedTasks.length / taskManager.tasks.length) * 100 || 0;
        
        this.procrastinationPatterns.innerHTML = `
            <p>⚠️ ${delayedTasks.length} tasks are past their deadline</p>
            <p>${this.getProcrastinationMessage(procrastinationRate)}</p>
        `;
    }

    generateRecommendations() {
        const taskManager = window.taskManager;
        const highPriorityTasks = taskManager.tasks.filter(t => t.priority === 'high' && !t.completed);
        
        let recommendations = [];
        if (highPriorityTasks.length > 0) {
            recommendations.push('Focus on completing high-priority tasks first');
        }
        if (taskManager.tasks.length > 10) {
            recommendations.push('Consider breaking down large tasks into smaller ones');
        }
        if (taskManager.tasks.filter(t => !t.deadline).length > 0) {
            recommendations.push('Set deadlines for tasks to improve accountability');
        }

        this.aiRecommendations.innerHTML = recommendations.map(rec => `<p>💡 ${rec}</p>`).join('');
    }

    generateReflectionPrompts() {
        const prompts = [
            'What was your biggest achievement today?',
            'What challenges did you face and how did you overcome them?',
            'What could you have done better?',
            'What are you looking forward to tomorrow?',
            'How did your mood affect your productivity today?'
        ];

        this.reflectionPrompts.innerHTML = prompts.map(prompt => 
            `<div class="prompt-item" onclick="performanceAnalyzer.usePrompt('${prompt}')">${prompt}</div>`
        ).join('');
    }

    usePrompt(prompt) {
        const diaryEntry = document.getElementById('diaryEntry');
        diaryEntry.value = prompt + '\n\n';
        diaryEntry.focus();
    }

    getTrendMessage(trend) {
        switch(trend) {
            case 'increasing':
                return 'Great job! Keep up the momentum!';
            case 'stable':
                return 'Maintaining steady progress. Consider setting more challenging goals.';
            case 'decreasing':
                return 'Try breaking tasks into smaller, more manageable steps.';
            default:
                return '';
        }
    }

    getProcrastinationMessage(rate) {
        if (rate > 50) {
            return 'High procrastination detected. Try using the Pomodoro technique to stay focused.';
        } else if (rate > 20) {
            return 'Moderate procrastination. Consider setting more realistic deadlines.';
        } else {
            return 'Good time management! Keep it up!';
        }
    }
}

// Enhanced Diary
class EnhancedDiary extends Diary {
    constructor() {
        super();
        this.currentMood = null;
        this.productivityRating = 0;
        this.mediaFiles = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Mood selection
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setMood(btn.dataset.mood));
        });

        // Productivity rating
        document.querySelectorAll('.rating-stars i').forEach((star, index) => {
            star.addEventListener('click', () => this.setProductivityRating(index + 1));
        });

        // Media upload
        document.getElementById('addMedia').addEventListener('click', () => this.handleMediaUpload());

        // Diary filters
        document.querySelectorAll('.diary-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => this.filterEntries(btn.dataset.filter));
        });
    }

    setMood(mood) {
        this.currentMood = mood;
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.mood === mood);
        });
    }

    setProductivityRating(rating) {
        this.productivityRating = rating;
        document.querySelectorAll('.rating-stars i').forEach((star, index) => {
            star.classList.toggle('active', index < rating);
        });
    }

    async handleMediaUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,audio/*';
        input.multiple = true;

        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.mediaFiles.push({
                        type: file.type.split('/')[0],
                        url: e.target.result,
                        name: file.name
                    });
                    this.showNotification('Media added successfully!', 'success');
                };
                reader.readAsDataURL(file);
            });
        };

        input.click();
    }

    filterEntries(filter) {
        const entries = this.entries;
        let filteredEntries = entries;

        switch(filter) {
            case 'happy':
                filteredEntries = entries.filter(entry => entry.mood === 'happy');
                break;
            case 'productive':
                filteredEntries = entries.filter(entry => entry.productivityRating >= 4);
                break;
            case 'recent':
                filteredEntries = entries.slice(0, 5);
                break;
        }

        this.renderFilteredEntries(filteredEntries);
    }

    renderFilteredEntries(entries) {
        const entriesList = document.querySelector('.entries-list');
        entriesList.innerHTML = '';

        entries.forEach(entry => {
            const entryElement = this.createEntryElement(entry);
            entriesList.appendChild(entryElement);
        });
    }

    createEntryElement(entry) {
        const div = document.createElement('div');
        div.className = 'diary-entry';
        div.innerHTML = `
            <div class="entry-header">
                <span class="entry-date">${new Date(entry.date).toLocaleDateString()}</span>
                <div class="entry-meta">
                    <span class="entry-mood">${this.getMoodEmoji(entry.mood)}</span>
                    <span class="entry-productivity">${'★'.repeat(entry.productivityRating)}${'☆'.repeat(5-entry.productivityRating)}</span>
                </div>
            </div>
            <div class="entry-text">${entry.text}</div>
            ${entry.mediaFiles?.length ? this.createMediaGrid(entry.mediaFiles) : ''}
        `;
        return div;
    }

    getMoodEmoji(mood) {
        const emojis = {
            happy: '😊',
            neutral: '😐',
            sad: '😢',
            angry: '😠',
            excited: '🤩'
        };
        return emojis[mood] || '😐';
    }

    createMediaGrid(mediaFiles) {
        return `
            <div class="entry-media">
                ${mediaFiles.map(file => `
                    <div class="media-item">
                        ${file.type === 'image' ? `<img src="${file.url}" alt="${file.name}">` : ''}
                        ${file.type === 'video' ? `<video src="${file.url}" controls></video>` : ''}
                        ${file.type === 'audio' ? `<audio src="${file.url}" controls></audio>` : ''}
                        <span class="media-type">${file.type}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    saveEntry() {
        const text = this.diaryEntry.value.trim();
        if (!text) return;

        const entry = {
            id: Date.now(),
            text,
            date: new Date().toISOString(),
            mood: this.currentMood || 'neutral',
            productivityRating: this.productivityRating || 0,
            mediaFiles: this.mediaFiles
        };

        this.entries.push(entry);
        this.saveEntries();
        this.renderEntries();
        this.clearEntry();
        this.showNotification('Entry saved successfully!', 'success');
    }

    clearEntry() {
        this.diaryEntry.value = '';
        this.currentMood = null;
        this.productivityRating = 0;
        this.mediaFiles = [];
        
        document.querySelectorAll('.mood-btn').forEach(btn => btn.classList.remove('selected'));
        document.querySelectorAll('.rating-stars i').forEach(star => star.classList.remove('active'));
    }
}

// Initialize all components
window.taskManager = new TaskManager();
window.pomodoroTimer = new PomodoroTimer();
window.analytics = new Analytics();
window.diary = new Diary();
window.badgeSystem = new BadgeSystem();
window.chatbot = new Chatbot();
window.performanceAnalyzer = new PerformanceAnalyzer();
window.diary = new EnhancedDiary();

// Update analytics periodically
function updateAnalytics() {
    const taskManager = window.taskManager;
    const completedTasks = taskManager.tasks.filter(t => t.completed).length;
    const totalTasks = taskManager.tasks.length;
    window.analytics.updateTaskCompletion(completedTasks, totalTasks);
    window.badgeSystem.checkBadges();
}

// Update analytics when Pomodoro session completes
function updateProductivityAnalytics() {
    const dayIndex = new Date().getDay();
    window.analytics.updateProductivity(dayIndex);
    window.badgeSystem.checkBadges();
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 8px;
        color: white;
        animation: slideIn 0.3s ease-out;
        z-index: 1000;
    }

    .notification.success {
        background-color: #4caf50;
    }

    .notification.error {
        background-color: #f44336;
    }

    .notification.warning {
        background-color: #ff9800;
    }

    .notification.info {
        background-color: #2196f3;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 