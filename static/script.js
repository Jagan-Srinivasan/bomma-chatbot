
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
        initializeMobileLayout();
    }, 2000);
});

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

function initializeMobileLayout() {
    // Hide sidebar on mobile devices
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
        }
    }
}

function setupInputHandlers() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    if (messageInput && sendBtn) {
        messageInput.addEventListener('input', function() {
            sendBtn.disabled = !this.value.trim();
            autoResize(this);
        });

        messageInput.addEventListener('keydown', handleKeyDown);
    }
}

function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const messageInput = document.getElementById('messageInput');
            if (messageInput) {
                messageInput.value = transcript;
                document.getElementById('sendBtn').disabled = false;
            }
        };

        recognition.onstart = function() {
            isRecording = true;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
                voiceBtn.classList.add('recording');
            }
        };

        recognition.onend = function() {
            isRecording = false;
            const voiceBtn = document.getElementById('voiceBtn');
            if (voiceBtn) {
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceBtn.classList.remove('recording');
            }
        };
    }
}

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (!message || isTyping) return;

    addMessage(message, 'user');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    document.getElementById('sendBtn').disabled = true;

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
            hideTypingIndicator();
            addMessage(data.response, 'assistant');
        } else {
            hideTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    }
}

function addMessage(content, role) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';

    if (role === 'user') {
        avatar.innerHTML = '<i class="fas fa-user"></i>';
    } else {
        avatar.innerHTML = '<i class="fas fa-brain"></i>';
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.innerHTML = formatMessage(content);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatMessage(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    isTyping = true;
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing-indicator';
    typingDiv.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-brain"></i>';

    const typingContent = document.createElement('div');
    typingContent.className = 'message-content';
    typingContent.innerHTML = '<div class="typing-dots"><div></div><div></div><div></div></div>';

    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingContent);

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
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

async function newChat() {
    try {
        const response = await fetch('/api/new-chat', {
            method: 'POST'
        });

        if (response.ok) {
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-icon">
                            <i class="fas fa-brain"></i>
                        </div>
                        <h2>Welcome to Bomma AI</h2>
                        <p>Your intelligent assistant powered by advanced AI technology. I'm here to help you with information, coding, creative tasks, and thoughtful conversations.</p>
                        <div class="features">
                            <div class="feature">
                                <i class="fas fa-code"></i>
                                <span>Code Assistance</span>
                            </div>
                            <div class="feature">
                                <i class="fas fa-lightbulb"></i>
                                <span>Creative Solutions</span>
                            </div>
                            <div class="feature">
                                <i class="fas fa-book"></i>
                                <span>Knowledge Base</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error starting new chat:', error);
    }
}

async function clearHistory() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        try {
            const response = await fetch('/api/clear-history', {
                method: 'POST'
            });

            if (response.ok) {
                const messagesContainer = document.getElementById('messages');
                if (messagesContainer) {
                    messagesContainer.innerHTML = `
                        <div class="welcome-message">
                            <div class="welcome-icon">
                                <i class="fas fa-brain"></i>
                            </div>
                            <h2>Welcome to Bomma AI</h2>
                            <p>Your intelligent assistant powered by advanced AI technology. I'm here to help you with information, coding, creative tasks, and thoughtful conversations.</p>
                            <div class="features">
                                <div class="feature">
                                    <i class="fas fa-code"></i>
                                    <span>Code Assistance</span>
                                </div>
                                <div class="feature">
                                    <i class="fas fa-lightbulb"></i>
                                    <span>Creative Solutions</span>
                                </div>
                                <div class="feature">
                                    <i class="fas fa-book"></i>
                                    <span>Knowledge Base</span>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageDataUrl = e.target.result;
            addImageMessage(imageDataUrl, 'user');
            
            setTimeout(() => {
                addMessage('I can see the image you uploaded! However, image analysis functionality is not fully implemented yet. I can help you with text-based questions and conversations.', 'assistant');
            }, 1000);
        };
        reader.readAsDataURL(file);
        
        // Clear the input
        event.target.value = '';
    } else {
        alert('Please select a valid image file.');
    }
}

function addImageMessage(imageDataUrl, role) {
    const messagesContainer = document.getElementById('messages');
    if (!messagesContainer) return;

    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-user"></i>';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const img = document.createElement('img');
    img.src = imageDataUrl;
    img.style.maxWidth = '300px';
    img.style.maxHeight = '300px';
    img.style.borderRadius = '8px';
    img.style.objectFit = 'cover';
    
    messageContent.appendChild(img);

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function loadConversation() {
    try {
        const response = await fetch('/api/conversations');
        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
            const messagesContainer = document.getElementById('messages');
            if (messagesContainer) {
                messagesContainer.innerHTML = '';

                data.messages.forEach(message => {
                    addMessage(message.content, message.role);
                });
            }
        }
    } catch (error) {
        console.error('Error loading conversation:', error);
    }
}
