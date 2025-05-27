let isTyping = false;
let isRecording = false;
let recognition = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    showLoadingScreen();
    setTimeout(() => {
        hideLoadingScreen();
        loadConversation();
        setupInputHandlers();
        setupVoiceRecognition();
        setupSidebarToggle();
    }, 2000); // Show loading for 2 seconds
});

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.style.display = 'flex';
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
        loadingScreen.style.display = 'none';
    }, 500);
}

function setupSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            toggleSidebar();
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            closeSidebar();
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            const isClickInsideSidebar = sidebar.contains(event.target);
            const isClickOnToggle = sidebarToggle && sidebarToggle.contains(event.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        }
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.toggle('open');
    
    if (sidebar.classList.contains('open')) {
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function setupInputHandlers() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    messageInput.addEventListener('input', function() {
        adjustTextareaHeight();
        toggleSendButton();
    });

    messageInput.addEventListener('paste', function() {
        setTimeout(adjustTextareaHeight, 0);
    });
}

function adjustTextareaHeight() {
    const textarea = document.getElementById('messageInput');
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

function toggleSendButton() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const hasText = messageInput.value.trim().length > 0;

    sendBtn.disabled = !hasText || isTyping;
}

function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isRecording = true;
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const messageInput = document.getElementById('messageInput');
            messageInput.value = transcript;
            adjustTextareaHeight();
            toggleSendButton();
        };
        
        recognition.onend = function() {
            isRecording = false;
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            isRecording = false;
            const voiceBtn = document.getElementById('voiceBtn');
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };
    } else {
        // Hide voice button if not supported
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.style.display = 'none';
        }
    }
}

function toggleVoiceRecording() {
    if (!recognition) {
        alert('Voice recognition is not supported in your browser.');
        return;
    }
    
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!isTyping && document.getElementById('messageInput').value.trim()) {
            sendMessage();
        }
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message || isTyping) return;

    // Clear input and disable button
    messageInput.value = '';
    adjustTextareaHeight();
    toggleSendButton();
    isTyping = true;

    // Add user message to chat
    addMessage('user', message);

    // Show typing indicator
    showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });

        const data = await response.json();

        if (response.ok) {
            // Remove typing indicator and add AI response
            removeTypingIndicator();
            addMessage('assistant', data.response);
        } else {
            removeTypingIndicator();
            addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage('assistant', 'Sorry, I encountered a network error. Please try again.');
    }

    isTyping = false;
    toggleSendButton();
}

function addMessage(role, content, timestamp = null, isImage = false) {
    const messagesContainer = document.getElementById('messages');

    // Remove welcome message if it exists
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (isImage) {
        messageContent.innerHTML = `<img src="${content}" alt="Uploaded image" style="max-width: 300px; max-height: 300px; border-radius: 8px;">`;
    } else if (role === 'assistant') {
        messageContent.innerHTML = formatAIResponse(content);
    } else {
        // Keep user messages exactly as entered - no formatting
        messageContent.textContent = content;
    }

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'message-timestamp';
    timestampDiv.textContent = timestamp ? formatTimestamp(new Date(timestamp)) : formatTimestamp(new Date());

    messageDiv.appendChild(avatar);
    const contentWrapper = document.createElement('div');
    contentWrapper.appendChild(messageContent);
    contentWrapper.appendChild(timestampDiv);
    messageDiv.appendChild(contentWrapper);

    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
}

function formatAIResponse(content) {
    // Convert text to HTML with proper formatting
    let formatted = content;

    // Handle code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Handle inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Handle numbered lists
    formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Handle bullet points
    formatted = formatted.replace(/^[•\-\*]\s+(.+)$/gm, '<li>$1</li>');

    // Wrap consecutive list items in ul tags
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, (match) => {
        return '<ul>' + match + '</ul>';
    });

    // Handle paragraphs (split by double newlines)
    const paragraphs = formatted.split(/\n\s*\n/);
    formatted = paragraphs.map(p => {
        p = p.trim();
        if (p && !p.startsWith('<')) {
            return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
        }
        return p;
    }).join('');

    // Handle bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Handle italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    return formatted;
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = 'typing-indicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-brain"></i>';

    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator';
    typingContent.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);
    messagesContainer.appendChild(typingDiv);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTimestamp(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function loadConversation() {
    try {
        const response = await fetch('/api/conversations');
        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
            const messagesContainer = document.getElementById('messages');
            const welcomeMessage = messagesContainer.querySelector('.welcome-message');
            if (welcomeMessage) {
                welcomeMessage.remove();
            }

            data.messages.forEach(message => {
                addMessageFromHistory(message.role, message.content, message.timestamp);
            });
        }
    } catch (error) {
        console.error('Failed to load conversation:', error);
    }
}

function addMessageFromHistory(role, content, timestamp) {
    const messagesContainer = document.getElementById('messages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-brain"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    if (role === 'assistant') {
        messageContent.innerHTML = formatAIResponse(content);
    } else {
        // Keep user messages exactly as entered - no formatting
        messageContent.textContent = content;
    }

    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'message-timestamp';
    timestampDiv.textContent = formatTimestamp(new Date(timestamp));

    messageDiv.appendChild(avatar);
    const contentWrapper = document.createElement('div');
    contentWrapper.appendChild(messageContent);
    contentWrapper.appendChild(timestampDiv);
    messageDiv.appendChild(contentWrapper);

    messagesContainer.appendChild(messageDiv);
}

async function newChat() {
    try {
        await fetch('/api/new-chat', { method: 'POST' });

        // Clear the messages container
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-brain"></i>
                </div>
                <h2>Welcome to Bomma AI</h2>
                <p>Your intelligent assistant powered by advanced AI technology. Start a conversation by typing a message below.</p>
            </div>
        `;

        // Clear input
        document.getElementById('messageInput').value = '';
        adjustTextareaHeight();
        toggleSendButton();

    } catch (error) {
        console.error('Failed to start new chat:', error);
    }
}

async function clearHistory() {
    if (confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
        try {
            await fetch('/api/clear-history', { method: 'POST' });

            // Clear the messages container
            const messagesContainer = document.getElementById('messages');
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">
                        <i class="fas fa-brain"></i>
                </div>
                <h2>Welcome to Bomma AI</h2>
                <p>Your intelligent assistant powered by advanced AI technology. Start a conversation by typing a message below.</p>
                </div>
            `;

        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDataUrl = e.target.result;
            addMessage('user', imageDataUrl, null, true);
            
            // You can extend this to send the image to the backend
            // For now, just show a response from the AI
            setTimeout(() => {
                addMessage('assistant', 'I can see the image you uploaded! However, image analysis functionality is not fully implemented yet. I can help you with text-based questions and conversations.');
            }, 1000);
        };
        reader.readAsDataURL(file);
        
        // Clear the input
        event.target.value = '';
    } else {
        alert('Please select a valid image file.');
    }
}