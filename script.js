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
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.taskInput = document.getElementById('taskInput');
        this.taskDeadline = document.getElementById('taskDeadline');
        this.addTaskBtn = document.getElementById('addTask');
        this.taskList = document.getElementById('taskList');

        this.addTaskBtn.addEventListener('click', () => this.addTask());
        this.renderTasks();
    }

    addTask() {
        const taskText = this.taskInput.value.trim();
        const deadline = this.taskDeadline.value;

        if (taskText) {
            const task = {
                id: Date.now(),
                text: taskText,
                deadline: deadline,
                completed: false,
                createdAt: new Date().toISOString()
            };

            this.tasks.push(task);
            this.saveTasks();
            this.renderTasks();
            this.taskInput.value = '';
            this.taskDeadline.value = '';
            this.updateAnalytics();
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateAnalytics();
            this.checkBadges();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateAnalytics();
    }

    renderTasks() {
        this.taskList.innerHTML = '';
        this.tasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = 'task-item';
            taskElement.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span style="text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.text}</span>
                <span class="deadline">${task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline'}</span>
                <button class="delete-task">×</button>
            `;

            const checkbox = taskElement.querySelector('input');
            checkbox.addEventListener('change', () => this.toggleTask(task.id));

            const deleteBtn = taskElement.querySelector('.delete-task');
            deleteBtn.addEventListener('click', () => this.deleteTask(task.id));

            this.taskList.appendChild(taskElement);
        });
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
}

// Pomodoro Timer
class PomodoroTimer {
    constructor() {
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.startBtn = document.getElementById('startTimer');
        this.pauseBtn = document.getElementById('pauseTimer');
        this.resetBtn = document.getElementById('resetTimer');
        this.modeButtons = document.querySelectorAll('.timer-mode button');

        this.timeLeft = 25 * 60; // 25 minutes in seconds
        this.timerId = null;
        this.isRunning = false;

        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());

        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timeLeft = parseInt(btn.dataset.time) * 60;
                this.updateDisplay();
            });
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.timerId = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                if (this.timeLeft === 0) {
                    this.complete();
                }
            }, 1000);
        }
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timerId);
    }

    reset() {
        this.pause();
        this.timeLeft = 25 * 60;
        this.updateDisplay();
    }

    complete() {
        this.pause();
        this.playNotification();
        this.updateAnalytics();
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }

    playNotification() {
        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        audio.play();
    }
}

// Analytics
class Analytics {
    constructor() {
        this.taskCompletionChart = new Chart(
            document.getElementById('taskCompletionChart'),
            {
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
                    plugins: {
                        title: {
                            display: true,
                            text: 'Task Completion Rate'
                        }
                    }
                }
            }
        );

        this.productivityChart = new Chart(
            document.getElementById('productivityChart'),
            {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Pomodoro Sessions',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: '#4a90e2'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Weekly Productivity'
                        }
                    }
                }
            }
        );
    }

    updateTaskCompletion(completed, total) {
        this.taskCompletionChart.data.datasets[0].data = [completed, total - completed];
        this.taskCompletionChart.update();
    }

    updateProductivity(dayIndex) {
        const data = this.productivityChart.data.datasets[0].data;
        data[dayIndex]++;
        this.productivityChart.update();
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
            { id: 'first_task', name: 'First Task', icon: 'fa-check-circle', description: 'Complete your first task' },
            { id: 'task_master', name: 'Task Master', icon: 'fa-trophy', description: 'Complete 10 tasks' },
            { id: 'pomodoro_pro', name: 'Pomodoro Pro', icon: 'fa-clock', description: 'Complete 5 Pomodoro sessions' },
            { id: 'reflection_king', name: 'Reflection King', icon: 'fa-book', description: 'Write 5 diary entries' }
        ];
        this.earnedBadges = JSON.parse(localStorage.getItem('earnedBadges')) || [];
        this.badgesContainer = document.getElementById('badgesContainer');
        this.renderBadges();
    }

    checkBadges() {
        const taskManager = window.taskManager;
        const analytics = window.analytics;
        const diary = window.diary;

        // Check task-related badges
        if (taskManager.tasks.some(t => t.completed) && !this.earnedBadges.includes('first_task')) {
            this.earnBadge('first_task');
        }

        if (taskManager.tasks.filter(t => t.completed).length >= 10 && !this.earnedBadges.includes('task_master')) {
            this.earnBadge('task_master');
        }

        // Check Pomodoro badge
        const totalPomodoros = analytics.productivityChart.data.datasets[0].data.reduce((a, b) => a + b, 0);
        if (totalPomodoros >= 5 && !this.earnedBadges.includes('pomodoro_pro')) {
            this.earnBadge('pomodoro_pro');
        }

        // Check diary badge
        if (diary.entries.length >= 5 && !this.earnedBadges.includes('reflection_king')) {
            this.earnBadge('reflection_king');
        }
    }

    earnBadge(badgeId) {
        this.earnedBadges.push(badgeId);
        localStorage.setItem('earnedBadges', JSON.stringify(this.earnedBadges));
        this.renderBadges();
    }

    renderBadges() {
        this.badgesContainer.innerHTML = '';
        this.badges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = `badge ${this.earnedBadges.includes(badge.id) ? 'earned' : ''}`;
            badgeElement.innerHTML = `
                <i class="fas ${badge.icon}"></i>
                <h3>${badge.name}</h3>
                <p>${badge.description}</p>
            `;
            this.badgesContainer.appendChild(badgeElement);
        });
    }
}

// Chatbot
class Chatbot {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendMessage');
        this.messageHistory = [];

        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                ${content}
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        this.messageHistory.push({ content, isUser });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, true);
        this.chatInput.value = '';

        // Process message and get response
        const response = await this.processMessage(message);
        this.addMessage(response);
    }

    async processMessage(message) {
        // Convert message to lowercase for easier matching
        const lowerMessage = message.toLowerCase();

        // Check for task-related queries
        if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
            const taskManager = window.taskManager;
            const completedTasks = taskManager.tasks.filter(t => t.completed).length;
            const totalTasks = taskManager.tasks.length;
            
            if (lowerMessage.includes('how many')) {
                return `You have ${completedTasks} completed tasks out of ${totalTasks} total tasks.`;
            } else if (lowerMessage.includes('add')) {
                return "To add a new task, use the task input field at the top of the Tasks section.";
            }
        }

        // Check for Pomodoro-related queries
        if (lowerMessage.includes('pomodoro') || lowerMessage.includes('timer')) {
            if (lowerMessage.includes('how to')) {
                return "The Pomodoro technique works by breaking your work into 25-minute focused sessions followed by 5-minute breaks. After 4 sessions, take a longer 15-minute break.";
            } else if (lowerMessage.includes('start')) {
                return "You can start the Pomodoro timer by clicking the 'Start' button in the Pomodoro section.";
            }
        }

        // Check for analytics-related queries
        if (lowerMessage.includes('progress') || lowerMessage.includes('analytics')) {
            const analytics = window.analytics;
            const totalPomodoros = analytics.productivityChart.data.datasets[0].data.reduce((a, b) => a + b, 0);
            return `You've completed ${totalPomodoros} Pomodoro sessions this week. Check the Analytics section for detailed statistics.`;
        }

        // Check for diary-related queries
        if (lowerMessage.includes('diary') || lowerMessage.includes('journal')) {
            const diary = window.diary;
            if (lowerMessage.includes('how many')) {
                return `You have written ${diary.entries.length} diary entries so far.`;
            }
        }

        // Check for badge-related queries
        if (lowerMessage.includes('badge') || lowerMessage.includes('achievement')) {
            const badgeSystem = window.badgeSystem;
            const earnedBadges = badgeSystem.earnedBadges.length;
            return `You have earned ${earnedBadges} badges so far. Check the Badges section to see your achievements!`;
        }

        // Default responses for general queries
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
            return "Hello! How can I help you with your productivity today?";
        } else if (lowerMessage.includes('help')) {
            return "I can help you with:\n- Managing tasks\n- Using the Pomodoro timer\n- Tracking your progress\n- Writing diary entries\n- Earning badges\n\nWhat would you like to know more about?";
        } else if (lowerMessage.includes('thank')) {
            return "You're welcome! Let me know if you need any other assistance.";
        }

        // Default response for unknown queries
        return "I'm not sure about that. You can ask me about tasks, Pomodoro timer, analytics, diary entries, or badges. How can I help you?";
    }
}

// Initialize all components
window.taskManager = new TaskManager();
window.pomodoroTimer = new PomodoroTimer();
window.analytics = new Analytics();
window.diary = new Diary();
window.badgeSystem = new BadgeSystem();
window.chatbot = new Chatbot();

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