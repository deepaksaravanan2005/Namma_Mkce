// Copilot functionality
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    const sidebarIcons = document.querySelectorAll('.sidebar-icon');

    // Dark mode toggle
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const icon = darkModeToggle.querySelector('i');
            icon.classList.toggle('fa-moon');
            icon.classList.toggle('fa-sun');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });

        // Load dark mode preference
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            const icon = darkModeToggle.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    // Sidebar navigation
    sidebarIcons.forEach((icon, index) => {
        icon.addEventListener('click', () => {
            sidebarIcons.forEach(i => i.classList.remove('active'));
            icon.classList.add('active');
            // For demo, just change active state
            // In real app, would navigate to different pages
            if (index === 0) {
                window.location.href = '/';
            } else if (index === 1) {
                window.location.href = '/chat';
            }
        });
    });

    // Suggestion buttons
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.textContent.trim();
            if (window.location.pathname === '/') {
                // On home page, fill input and switch to chat
                messageInput.value = text;
                window.location.href = '/chat?message=' + encodeURIComponent(text);
            } else {
                sendMessage(text);
            }
        });
    });

    // Check for message from URL params (for home page suggestions)
    const urlParams = new URLSearchParams(window.location.search);
    const initialMessage = urlParams.get('message');
    if (initialMessage && chatMessages) {
        sendMessage(initialMessage);
    }

    function addMessage(text, sender) {
        if (!chatMessages) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(timestamp);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTyping() {
        if (typingIndicator) {
            typingIndicator.classList.remove('d-none');
            if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    function hideTyping() {
        if (typingIndicator) {
            typingIndicator.classList.add('d-none');
        }
    }

    async function sendMessage(text) {
        addMessage(text, 'user');
        messageInput.value = '';
        showTyping();

        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            hideTyping();
            const responses = {
                'Create an image': 'I can help you create an image. What would you like to visualize?',
                'Simplify a topic': 'I\'d be happy to simplify a topic for you. What subject would you like me to explain?',
                'Improve writing': 'I can help improve your writing. Please share the text you\'d like me to review.',
                'Take a quiz': 'Let\'s take a quiz! What topic are you interested in?',
                'Design a logo': 'I can help with logo design concepts. What\'s your brand about?',
                'Build a playlist': 'Music recommendations coming up! What genre or mood are you in?',
                'Draft an email': 'I can help draft a professional email. What\'s the purpose?',
                'Draft a reply': 'Let me help you craft a thoughtful reply. What\'s the context?'
            };
            const response = responses[text] || `I understand you said: "${text}". How can I assist you further?`;
            addMessage(response, 'bot');
        }, 2000);
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const text = messageInput.value.trim();
            if (text) {
                sendMessage(text);
            }
        });
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = messageInput.value.trim();
                if (text) {
                    sendMessage(text);
                }
            }
        });
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            // Voice input using Web Speech API
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    messageInput.value = transcript;
                };

                recognition.onerror = () => {
                    alert('Voice recognition failed. Please try again.');
                };

                recognition.start();
            } else {
                alert('Voice input not supported in this browser.');
            }
        });
    }
});