// Premium Copilot-Style Chat Functionality
document.addEventListener('DOMContentLoaded', function() {
        // Delete All Chats Button
        const deleteAllChatsBtn = document.getElementById('delete-all-chats-btn');
        if (deleteAllChatsBtn) {
            deleteAllChatsBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
                    // Optionally clear local chat sessions if used
                    localStorage.removeItem('chat_sessions');
                    // Attempt to clear server-side chat logs (if API exists)
                    try {
                        await fetch('/api/chat_logs', { method: 'DELETE' });
                    } catch (e) {}
                    // Clear chat UI
                    chatMessages.innerHTML = '';
                    await resetConversationId();
                    renderRecentChats();
                }
            });
        }
    // Input Elements
    const homeInput = document.getElementById('home-message-input');
    const homeSendBtn = document.getElementById('home-send-btn');
    const homeVoiceBtn = document.getElementById('home-voice-btn');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    
    // Chat Display Elements
    const chatMessages = document.getElementById('chat-messages');
    const typingIndicator = document.getElementById('typing-indicator');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const shareChatBtn = document.getElementById('share-chat-btn');
    
    // Pane Elements
    const homePane = document.getElementById('home-pane');
    const chatPane = document.getElementById('chat-pane');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // Sidebar Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    const newChatBtn = document.querySelector('[data-action="new-chat"]');
    const userProfileBtn = document.getElementById('user-profile-btn');
    const signInBtn = document.getElementById('sign-in-btn');
    const signOutBtn = document.getElementById('sign-out-btn');
    const profileName = document.getElementById('profile-name');
    const recentChatsList = document.getElementById('recent-chats-list');
    let recentChatLogs = [];
    let currentConversationId = createConversationId();

    function createConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    }

    async function resetConversationId() {
        try {
            const res = await fetch('/api/chat/session/new', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            });

            if (!res.ok) {
                currentConversationId = createConversationId();
                return;
            }

            const data = await res.json();
            currentConversationId = data?.conversation_id || createConversationId();
        } catch (e) {
            currentConversationId = createConversationId();
        }
    }

    function getShareIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const shareId = (params.get('share') || '').trim();
        return shareId || null;
    }

    async function importSharedChatFromUrl() {
        const shareId = getShareIdFromUrl();
        if (!shareId) return;

        try {
            const res = await fetch(`/api/chat/shared/${encodeURIComponent(shareId)}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin'
            });

            if (!res.ok) return;

            const data = await res.json();
            if (!data || !Array.isArray(data.messages)) return;

            currentConversationId = data.conversation_id || createConversationId();
            chatMessages.innerHTML = '';

            data.messages.forEach((msg) => {
                if (msg.user_message) addMessageToUI(msg.user_message, 'user', msg.timestamp);
                if (msg.bot_response) addMessageToUI(msg.bot_response, 'bot', msg.timestamp);
            });

            switchToChatView();
            renderRecentChats();
        } catch (e) {
            console.error('Failed to import shared chat:', e);
        }
    }
    
    // Mode Selectors
    const modeSelector = document.getElementById('mode-selector');
    const chatModeSelector = document.getElementById('chat-mode-selector');
    const homeLanguageSelector = document.getElementById('home-language-selector');
    const chatLanguageSelector = document.getElementById('chat-language-selector');

    // Toggle Sidebar Collapse
    if (sidebarCollapseBtn) {
        sidebarCollapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // Restore sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState === 'true') {
        sidebar.classList.add('collapsed');
    }

    // New Chat Button - Premium Version
    if (newChatBtn) {
        newChatBtn.addEventListener('click', async () => {
            if (chatMessages.children.length > 0 && confirm('Start a new chat? Current conversation will be saved in history.')) {
                saveCurrentChat();
                chatMessages.innerHTML = '';
                await resetConversationId();
                homePane.classList.remove('d-none');
                chatPane.classList.add('d-none');
                document.body.classList.remove('copilot-chat');
                document.body.classList.add('copilot-home');
                renderRecentChats();
            }
        });
    }

    // Login/Logout Functionality - Premium
    function checkLoginStatus() {
        profileName.textContent = profileName.textContent || 'Guest User';
        signInBtn.classList.add('d-none');
        signOutBtn.classList.remove('d-none');
    }

    if (signInBtn) {
        signInBtn.addEventListener('click', () => {
            window.location.href = '/login';
        });
    }

    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out?')) {
                window.location.href = '/logout';
            }
        });
    }

    // Recent Chats Management - Premium Version
    async function renderRecentChats() {
        recentChatsList.innerHTML = '';

        try {
            const res = await fetch('/api/chat_logs');
            if (!res.ok) {
                recentChatsList.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:13px;">No recent chats</div>';
                return;
            }
            recentChatLogs = await res.json();
        } catch (e) {
            recentChatsList.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:13px;">No recent chats</div>';
            return;
        }

        if (recentChatLogs.length === 0) {
            recentChatsList.innerHTML = '<div style="text-align:center;padding:20px;color:#999;font-size:13px;">No recent chats</div>';
            return;
        }

        recentChatLogs.forEach((session, index) => {
            const item = document.createElement('div');
            item.className = 'recent-chat-item';
            if (index === 0) item.classList.add('active');

            item.innerHTML = `
                <i class=\"fas fa-comment chat-item-icon\"></i>
                <span class=\"chat-item-title\">${escapeHtml(session.user_message || 'Chat')}</span>
                <button class=\"chat-item-delete\" title=\"Delete this chat\" style=\"margin-left:auto;background:none;border:none;color:#dc3545;cursor:pointer;font-size:14px;\">
                    <i class=\"fas fa-trash-alt\"></i>
                </button>
            `;

            // Load chat on click (not on delete button click)
            item.addEventListener('click', (e) => {
                if (e.target.closest('.chat-item-delete')) return;
                loadChatSession(index);
            });

            // Delete button handler
            const deleteBtn = item.querySelector('.chat-item-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this chat session?')) {
                        try {
                            if (session.id) {
                                const res = await fetch(`/api/chat_logs/${session.id}`, { method: 'DELETE' });
                                if (!res.ok) {
                                    alert('Failed to delete chat from server.');
                                    return;
                                }
                            }
                        } catch (err) {
                            alert('Error deleting chat.');
                            return;
                        }
                        // Remove from UI
                        recentChatLogs.splice(index, 1);
                        renderRecentChats();
                    }
                });
            }

            recentChatsList.appendChild(item);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function saveCurrentChat() {
        const msgNodes = Array.from(chatMessages.querySelectorAll('.message'));
        if (msgNodes.length === 0) return;
        
        const messages = msgNodes.map(div => ({
            sender: div.classList.contains('user') ? 'user' : 'bot',
            text: div.querySelector('.message-content').textContent,
            ts: div.querySelector('.message-timestamp')?.textContent || new Date().toLocaleTimeString()
        }));
        
        const title = messages[0].text.substring(0, 30) + (messages[0].text.length > 30 ? '...' : '');
        
        const sessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
        
        const currentSession = {
            title: title,
            messages: messages,
            timestamp: new Date().toISOString()
        };
        
        if (sessions.length > 0 && sessions[0].title === title) {
            sessions[0] = currentSession;
        } else {
            sessions.unshift(currentSession);
        }
        
        localStorage.setItem('chat_sessions', JSON.stringify(sessions));
        renderRecentChats();
    }

    function loadChatSession(index) {
        const session = recentChatLogs[index];
        if (!session) return;
        currentConversationId = session.conversation_id || createConversationId();
        chatMessages.innerHTML = '';
        if (Array.isArray(session.messages) && session.messages.length > 0) {
            session.messages.forEach((msg) => {
                if (msg.user_message) addMessageToUI(msg.user_message, 'user', msg.timestamp);
                if (msg.bot_response) addMessageToUI(msg.bot_response, 'bot', msg.timestamp);
            });
        } else {
            addMessageToUI(session.user_message, 'user', session.timestamp);
            addMessageToUI(session.bot_response, 'bot', session.timestamp);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
        renderRecentChats();
        switchToChatView();
    }
    
    function switchToChatView() {
        homePane.classList.add('d-none');
        chatPane.classList.remove('d-none');
        document.body.classList.remove('copilot-home');
        document.body.classList.add('copilot-chat');
    }

    function deleteChatSession(index) {
        if (confirm('Delete this chat session?')) {
            const sessions = JSON.parse(localStorage.getItem('chat_sessions') || '[]');
            sessions.splice(index, 1);
            localStorage.setItem('chat_sessions', JSON.stringify(sessions));
            renderRecentChats();
        }
    }
    
    // Add Message to UI - Premium Style
    function addMessageToUI(text, sender, timestamp) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;
        
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'message-timestamp';
        timestampDiv.textContent = timestamp || new Date().toLocaleTimeString();
        
        messageDiv.appendChild(content);
        messageDiv.appendChild(timestampDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function toggleToChat() {
        homePane.classList.add('d-none');
        chatPane.classList.remove('d-none');
        document.body.classList.remove('copilot-home');
        document.body.classList.add('copilot-chat');
    }

    function addMessage(text, sender) {
        addMessageToUI(text, sender);
        saveCurrentChat();
    }

    function renderHistory() {
        // Keep main chat empty on page load; history stays in sidebar only.
        chatMessages.innerHTML = '';
    }

    function saveHistory() {
        const msgNodes = Array.from(chatMessages.querySelectorAll('.message'));
        const data = msgNodes.map(div => {
            return {
                sender: div.classList.contains('user') ? 'user' : 'bot',
                text: div.querySelector('.message-content').textContent,
                ts: div.querySelector('.message-timestamp')?.textContent
            };
        });
        localStorage.setItem('copilot_chat_history', JSON.stringify(data));
        saveCurrentChat();
    }

    function getActiveLanguage() {
        if (chatPane && !chatPane.classList.contains('d-none') && chatLanguageSelector) {
            return chatLanguageSelector.value || 'english';
        }
        return homeLanguageSelector ? homeLanguageSelector.value || 'english' : 'english';
    }

    function getSpeechRecognitionLang() {
        const lang = getActiveLanguage();
        if (lang === 'tamil') return 'ta-IN';
        if (lang === 'hindi') return 'hi-IN';
        return 'en-US';
    }

    function showTyping() {
        typingIndicator.classList.remove('d-none');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
        typingIndicator.classList.add('d-none');
    }

    async function sendMessage(text) {
        if (!text) return;
        switchToChatView();
        addMessage(text, 'user');
        homeInput.value = '';
        messageInput.value = '';
        showTyping();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    message: text,
                    language: getActiveLanguage(),
                    conversation_id: currentConversationId
                })
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse JSON from /api/chat:', jsonError);
                data = null;
            }

            hideTyping();

            if (!response.ok) {
                console.error('Chat API error:', response.status, data);
                if (response.status === 401) {
                    addMessage('You are not logged in. Please sign in again.', 'bot');
                    window.location.href = '/login';
                    return;
                }
                addMessage(data?.error || 'Sorry, there was an error. Please try again.', 'bot');
                return;
            }

            if (!data || typeof data.response !== 'string') {
                console.error('Invalid API response for /api/chat:', data);
                addMessage('Sorry, there was an error. Please try again.', 'bot');
                return;
            }

            if (data.conversation_id) {
                currentConversationId = data.conversation_id;
            }

            addMessage(data.response, 'bot');
        } catch (error) {
            hideTyping();
            console.error('Chat fetch failed:', error);
            addMessage('Sorry, there was an error. Please try again.', 'bot');
        }
    }

    function processInput(el) {
        const text = el.value.trim();
        if (!text) return;
        el.value = '';
        sendMessage(text);
    }
    
    function handleSuggestions() {
        const suggestions = document.querySelectorAll('.suggestion-pill');
        suggestions.forEach((btn) => {
            btn.addEventListener('click', () => {
                const query = btn.dataset.suggestion;
                sendMessage(query);
            });
        });
    }

    // Event Listeners - Premium Controls
    if (homeSendBtn) homeSendBtn.addEventListener('click', () => processInput(homeInput));
    if (homeInput) {
        homeInput.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter') processInput(homeInput); 
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', () => processInput(messageInput));
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => { 
            if (e.key === 'Enter') processInput(messageInput); 
        });
    }
    
    handleSuggestions();

    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', async () => {
            if (chatMessages.children.length === 0) return;
            if (confirm('Clear current conversation?')) {
                saveCurrentChat();
                chatMessages.innerHTML = '';
                await resetConversationId();
                homePane.classList.remove('d-none');
                chatPane.classList.add('d-none');
                document.body.classList.remove('copilot-chat');
                document.body.classList.add('copilot-home');
                renderRecentChats();
            }
        });
    }

    function buildChatTranscript() {
        const nodes = Array.from(chatMessages.querySelectorAll('.message'));
        if (nodes.length === 0) {
            return `Check out this chat assistant: ${window.location.origin}${window.location.pathname}`;
        }

        return nodes.map(node => {
            const sender = node.classList.contains('user') ? 'You' : 'AI';
            const text = node.querySelector('.message-content')?.textContent || '';
            const ts = node.querySelector('.message-timestamp')?.textContent || '';
            return `${sender} (${ts}): ${text}`;
        }).join('\n');
    }

    function buildChatMessages() {
        const nodes = Array.from(chatMessages.querySelectorAll('.message'));
        const messages = [];
        let pendingUser = null;

        nodes.forEach((node) => {
            const isUser = node.classList.contains('user');
            const text = (node.querySelector('.message-content')?.textContent || '').trim();
            const timestamp = (node.querySelector('.message-timestamp')?.textContent || '').trim();
            if (!text) return;

            if (isUser) {
                if (pendingUser) {
                    messages.push({
                        user_message: pendingUser.text,
                        bot_response: '',
                        timestamp: pendingUser.timestamp
                    });
                }
                pendingUser = { text, timestamp };
                return;
            }

            if (pendingUser) {
                messages.push({
                    user_message: pendingUser.text,
                    bot_response: text,
                    timestamp: pendingUser.timestamp || timestamp
                });
                pendingUser = null;
                return;
            }

            messages.push({
                user_message: '',
                bot_response: text,
                timestamp
            });
        });

        if (pendingUser) {
            messages.push({
                user_message: pendingUser.text,
                bot_response: '',
                timestamp: pendingUser.timestamp
            });
        }

        return messages;
    }

    async function shareChat() {
        if (!currentConversationId) {
            alert('Start chatting before sharing.');
            return;
        }

        let shareUrl = window.location.href;
        try {
            const res = await fetch('/api/chat/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({
                    conversation_id: currentConversationId,
                    messages: buildChatMessages()
                })
            });

            if (!res.ok) {
                alert('Unable to create a share link right now.');
                return;
            }

            const payload = await res.json();
            shareUrl = payload?.share_url || shareUrl;
        } catch (err) {
            alert('Unable to create a share link right now.');
            return;
        }

        const transcript = buildChatTranscript();
        const shareData = {
            title: 'My Namma Mkce Chat',
            text: transcript,
            url: shareUrl
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                // If user cancels or share fails, fallback to clipboard
            }
        }

        try {
            await navigator.clipboard.writeText(`${shareData.text}\n\nOpen the chat here: ${shareData.url}`);
            alert('Chat transcript copied to clipboard. Share it with your friends!');
        } catch (err) {
            alert('Unable to share automatically. Please copy this link: ' + shareData.url);
        }
    }

    if (shareChatBtn) {
        shareChatBtn.addEventListener('click', async () => {
            await shareChat();
        });
    }

    darkModeToggle.addEventListener('click', () => {
        const body = document.body;
        body.classList.toggle('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
        localStorage.setItem('darkMode', body.classList.contains('dark-mode'));
    });
    
    // Restore dark mode
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    // Voice Input - Premium
    function setupVoiceInput(btn, inputField) {
        if (!btn) return;
        btn.addEventListener('click', () => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                recognition.lang = getSpeechRecognitionLang();
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event) => {
                    const transcript = event.results[0][0].transcript;
                    inputField.value = transcript;
                };

                recognition.onerror = () => alert('Voice recognition failed. Please try again.');
                recognition.start();
            } else {
                alert('Voice input not supported in this browser.');
            }
        });
    }
    
    setupVoiceInput(homeVoiceBtn, homeInput);
    setupVoiceInput(voiceBtn, messageInput);

    // Initialize Premium Interface
    checkLoginStatus();
    renderRecentChats();
    renderHistory();
    importSharedChatFromUrl();
});