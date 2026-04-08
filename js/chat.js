// Chat functionality
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const quickReplies = document.querySelectorAll('.quick-reply');

    // Sample responses
    const responses = {
        'Timetable': 'Here is the timetable: Monday - 9AM Math, 11AM Physics...',
        'Fees': 'Current fees: Tuition $5000, Hostel $2000...',
        'Departments': 'Departments: Computer Science, Engineering, Business...',
        'Announcements': 'Latest announcement: Exam schedule updated...'
    };

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        const bubble = document.createElement('div');
        bubble.className = 'message-content'; // Use correct class for styling
        bubble.textContent = text;
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(bubble);
        messageDiv.appendChild(timestamp);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Clear chat function
    function clearChat() {
        chatMessages.innerHTML = '';
    }

    function showTyping() {
        typingIndicator.classList.remove('d-none');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
        typingIndicator.classList.add('d-none');
    }

    function sendMessage(text) {
        addMessage(text, 'user');
        messageInput.value = '';
        showTyping();
        setTimeout(() => {
            hideTyping();
            const response = responses[text] || 'I\'m sorry, I don\'t have information on that. Please contact the admin.';
            addMessage(response, 'bot');
        }, 2000);
    }

    sendBtn.addEventListener('click', () => {
        const text = messageInput.value.trim();
        if (text) {
            sendMessage(text);
        }
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const text = messageInput.value.trim();
            if (text) {
                sendMessage(text);
            }
        }
    });


    quickReplies.forEach(btn => {
        btn.addEventListener('click', () => {
            const reply = btn.getAttribute('data-reply');
            sendMessage(reply);
        });
    });

    // Add event listener for clear chat button if it exists
    const clearChatBtn = document.getElementById('clear-chat-btn');
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChat);
    }

    voiceBtn.addEventListener('click', () => {
        // Simulate voice input
        alert('Voice input not implemented yet. This is a UI demo.');
    });
});