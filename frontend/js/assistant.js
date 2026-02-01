// AI Assistant JavaScript - Conversational Flow System with Chat History
// Enhanced with Voice-to-Text and Multi-language Command Support

document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const newChatBtn = document.getElementById('newChatBtn');
    const chatHistoryList = document.getElementById('chatHistoryList');
    
    // Modal elements (for editing file content)
    const fileModal = document.getElementById('fileModal');
    const modalClose = document.getElementById('modalClose');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalSaveBtn = document.getElementById('modalSaveBtn');
    const modalTitle = document.getElementById('modalTitle');
    const modalTextarea = document.getElementById('modalTextarea');
    
    // Quick commands
    const quickCmds = document.querySelectorAll('.quick-cmd');
    
    // Current chat ID and editing file
    let currentChatId = null;
    let currentEditingFile = null;
    
    // Voice recognition
    let recognition = null;
    let isListening = false;
    
    // Conversation state management
    let conversationState = {
        active: false,
        type: null,
        step: 0,
        data: {}
    };

    // ==================== VOICE COMMAND MAPPINGS ====================
    // Common words in English and Roman Urdu for commands
    
    const voiceCommands = {
        // Email commands - English & Roman Urdu
        email: [
            'send email', 'email', 'compose email', 'write email', 'mail',
            'email bhejo', 'mail bhejo', 'email karo', 'mail karo',
            'email bhejna', 'mail bhejna', 'email likhna', 'mail likhna',
            'email bhej do', 'mail bhej do', 'email kar do', 'mail kar do',
            'email send karo', 'mail send karo', 'email bna do', 'mail bna do'
        ],
        
        // Create file commands - English & Roman Urdu
        create: [
            'create file', 'new file', 'make file', 'create', 'add file',
            'file banao', 'file bnao', 'nayi file', 'naya file', 'file bna do',
            'file create karo', 'file banado', 'nayi file banao', 'naya file bnao',
            'file banayen', 'file bnaye', 'create kar do', 'file add karo'
        ],
        
        // Read/Open file commands - English & Roman Urdu
        read: [
            'read file', 'open file', 'show file', 'view file', 'display file',
            'file dikhao', 'file dikha do', 'file kholao', 'file kholo',
            'file parho', 'file parhao', 'file dekho', 'file dekhao',
            'file open karo', 'file read karo', 'file show karo'
        ],
        
        // Edit/Update file commands - English & Roman Urdu
        edit: [
            'edit file', 'update file', 'modify file', 'change file',
            'file edit karo', 'file update karo', 'file badlo', 'file tabdeel karo',
            'file mein tabdeeli', 'file modify karo', 'file change karo',
            'file ko edit karo', 'file ko badlo', 'file mein change karo'
        ],
        
        // Delete/Remove file commands - English & Roman Urdu
        delete: [
            'delete file', 'remove file', 'erase file', 'delete',
            'file delete karo', 'file hatao', 'file mitao', 'file remove karo',
            'file khatam karo', 'file hata do', 'file mita do', 'file delete kar do',
            'file ko hatao', 'file ko mitao', 'delete kar do'
        ],
        
        // Search/Find file commands - English & Roman Urdu
        search: [
            'search', 'find file', 'list files', 'search file', 'find',
            'file dhundo', 'file talash karo', 'file khojo', 'files dikhao',
            'file search karo', 'file find karo', 'sari files', 'all files',
            'file dhundho', 'dhundo file', 'khojo file'
        ],
        
        // Help commands - English & Roman Urdu
        help: [
            'help', 'commands', 'what can you do', 'options',
            'madad', 'help karo', 'madad karo', 'kya kar sakte ho',
            'commands dikhao', 'options dikhao', 'help chahiye', 'madad chahiye'
        ],
        
        // Cancel commands - English & Roman Urdu
        cancel: [
            'cancel', 'stop', 'exit', 'quit', 'nevermind', 'never mind', 'abort',
            'band karo', 'ruko', 'rok do', 'cancel karo', 'mat karo', 'rehne do',
            'choro', 'chor do', 'nahi chahiye', 'khatam karo'
        ],
        
        // Confirmation commands - English & Roman Urdu
        yes: [
            'yes', 'ok', 'okay', 'confirm', 'sure', 'send', 'create', 'delete', 'save',
            'haan', 'han', 'theek hai', 'thik hai', 'bilkul', 'zaroor', 'kar do',
            'bhej do', 'bana do', 'hata do', 'save karo', 'confirm karo', 'ji haan', 'ji'
        ]
    };

    // ==================== VOICE RECOGNITION SETUP ====================
    
    function setupVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            recognition.onstart = function() {
                isListening = true;
                updateVoiceButton(true);
                addMessage('<p style="color: var(--color-accent);"><strong>Listening...</strong> Speak your command now.</p>');
            };
            
            recognition.onresult = function(event) {
                let finalTranscript = '';
                let interimTranscript = '';
                
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                if (finalTranscript) {
                    chatInput.value = finalTranscript;
                    setTimeout(() => {
                        sendMessage();
                    }, 500);
                } else if (interimTranscript) {
                    chatInput.value = interimTranscript;
                }
            };
            
            recognition.onerror = function(event) {
                console.error('Speech recognition error:', event.error);
                isListening = false;
                updateVoiceButton(false);
                
                let errorMsg = 'Voice recognition error. ';
                if (event.error === 'not-allowed') {
                    errorMsg += 'Please allow microphone access.';
                } else if (event.error === 'no-speech') {
                    errorMsg += 'No speech detected. Try again.';
                } else {
                    errorMsg += 'Please try again.';
                }
                addMessage('<p style="color: var(--color-error);">' + errorMsg + '</p>');
            };
            
            recognition.onend = function() {
                isListening = false;
                updateVoiceButton(false);
            };
            
            return true;
        }
        return false;
    }
    
    function updateVoiceButton(listening) {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            if (listening) {
                voiceBtn.classList.add('listening');
                voiceBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg>';
            } else {
                voiceBtn.classList.remove('listening');
                voiceBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
            }
        }
    }
    
    function toggleVoiceRecognition() {
        if (!recognition) {
            if (!setupVoiceRecognition()) {
                addMessage('<p style="color: var(--color-error);">Voice recognition is not supported in your browser. Please use Chrome or Edge.</p>');
                return;
            }
        }
        
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }
    
    function setupVoiceButton() {
        const voiceBtn = document.getElementById('voiceBtn');
        if (voiceBtn) {
            voiceBtn.addEventListener('click', toggleVoiceRecognition);
        }
        addDynamicStyles();
    }
    
    function addDynamicStyles() {
        if (!document.getElementById('dynamicStyles')) {
            const style = document.createElement('style');
            style.id = 'dynamicStyles';
            style.textContent = '.chat-history-item-edit{opacity:0;padding:4px;border-radius:4px;transition:all 0.2s;background:none;border:none;cursor:pointer;color:var(--color-gray-500)}.chat-history-item:hover .chat-history-item-edit{opacity:1}.chat-history-item-edit:hover{background:var(--color-gray-300);color:var(--color-accent)}.chat-rename-input{width:100%;padding:4px 8px;font-size:13px;border:1px solid var(--color-accent);border-radius:4px;background:white;outline:none}';
            document.head.appendChild(style);
        }
    }

    // ==================== CHAT HISTORY FUNCTIONS ====================
    
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    function getAllChats() {
        const chats = localStorage.getItem('virtuai_chats');
        return chats ? JSON.parse(chats) : [];
    }

    function saveAllChats(chats) {
        localStorage.setItem('virtuai_chats', JSON.stringify(chats));
    }

    function getCurrentChat() {
        const chats = getAllChats();
        return chats.find(chat => chat.id === currentChatId);
    }

    function saveCurrentChat() {
        if (!currentChatId) return;
        
        const chats = getAllChats();
        const chatIndex = chats.findIndex(chat => chat.id === currentChatId);
        
        const messages = [];
        chatMessages.querySelectorAll('.message:not(.typing-message)').forEach(msg => {
            const isUser = msg.classList.contains('user');
            const content = msg.querySelector('.message-content').innerHTML;
            messages.push({ isUser, content });
        });
        
        if (chatIndex !== -1) {
            chats[chatIndex].messages = messages;
            chats[chatIndex].updatedAt = new Date().toISOString();
            if (!chats[chatIndex].title || chats[chatIndex].title === 'New Chat') {
                const firstUserMsg = messages.find(m => m.isUser);
                if (firstUserMsg) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = firstUserMsg.content;
                    const text = tempDiv.textContent || tempDiv.innerText;
                    chats[chatIndex].title = text.substring(0, 30) + (text.length > 30 ? '...' : '');
                }
            }
        }
        
        saveAllChats(chats);
        renderChatHistory();
    }

    function renameChat(chatId, newTitle) {
        const chats = getAllChats();
        const chatIndex = chats.findIndex(chat => chat.id === chatId);
        
        if (chatIndex !== -1) {
            chats[chatIndex].title = newTitle.substring(0, 50);
            chats[chatIndex].updatedAt = new Date().toISOString();
            saveAllChats(chats);
            renderChatHistory();
        }
    }

    function createNewChat() {
        const chats = getAllChats();
        const newChat = {
            id: generateId(),
            title: 'New Chat',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        chats.unshift(newChat);
        saveAllChats(chats);
        currentChatId = newChat.id;
        resetConversation();
        loadChat(newChat.id);
        renderChatHistory();
    }

    function loadChat(chatId) {
        currentChatId = chatId;
        const chat = getCurrentChat();
        
        chatMessages.innerHTML = '';
        
        if (chat && chat.messages && chat.messages.length > 0) {
            chat.messages.forEach(msg => {
                addMessageToDOM(msg.content, msg.isUser, false);
            });
        } else {
            showWelcomeMessage();
        }
        
        resetConversation();
        renderChatHistory();
    }

    function deleteChat(chatId) {
        let chats = getAllChats();
        chats = chats.filter(chat => chat.id !== chatId);
        saveAllChats(chats);
        
        if (chatId === currentChatId) {
            if (chats.length > 0) {
                loadChat(chats[0].id);
            } else {
                createNewChat();
            }
        }
        renderChatHistory();
    }

    function renderChatHistory() {
        const chats = getAllChats();
        chatHistoryList.innerHTML = '';
        
        if (chats.length === 0) {
            chatHistoryList.innerHTML = '<p class="no-history">No chat history yet</p>';
            return;
        }
        
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-history-item' + (chat.id === currentChatId ? ' active' : '');
            item.dataset.chatId = chat.id;
            item.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><div class="chat-history-item-content"><div class="chat-history-item-title">' + escapeHtml(chat.title || 'New Chat') + '</div><div class="chat-history-item-date">' + formatDate(chat.updatedAt || chat.createdAt) + '</div></div><button class="chat-history-item-edit" data-id="' + chat.id + '" title="Rename chat"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button><button class="chat-history-item-delete" data-id="' + chat.id + '" title="Delete chat"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>';
            
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.chat-history-item-delete') && !e.target.closest('.chat-history-item-edit') && !e.target.closest('.chat-rename-input')) {
                    loadChat(chat.id);
                }
            });
            
            const editBtn = item.querySelector('.chat-history-item-edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                startChatRename(item, chat);
            });
            
            const deleteBtn = item.querySelector('.chat-history-item-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this chat?')) {
                    deleteChat(chat.id);
                }
            });
            
            chatHistoryList.appendChild(item);
        });
    }
    
    function startChatRename(itemElement, chat) {
        const titleElement = itemElement.querySelector('.chat-history-item-title');
        const currentTitle = chat.title || 'New Chat';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'chat-rename-input';
        input.value = currentTitle;
        
        titleElement.innerHTML = '';
        titleElement.appendChild(input);
        input.focus();
        input.select();
        
        function saveRename() {
            const newTitle = input.value.trim() || 'New Chat';
            renameChat(chat.id, newTitle);
        }
        
        input.addEventListener('blur', saveRename);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveRename();
            } else if (e.key === 'Escape') {
                renderChatHistory();
            }
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return diffDays + ' days ago';
        } else {
            return date.toLocaleDateString();
        }
    }

    function showWelcomeMessage() {
        const welcomeHtml = '<div class="message assistant"><div class="message-avatar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg></div><div class="message-content"><p>Hello! I\'m your AI assistant. I can help you with:</p><ul style="margin: 12px 0 0 20px; color: inherit;"><li><strong>Send email</strong> - I\'ll guide you through sending emails step by step</li><li><strong>Create file</strong> - I\'ll ask for extension, name, and content</li><li><strong>Read file</strong> - View the contents of any file</li><li><strong>Edit file</strong> - Modify existing files</li><li><strong>Delete file</strong> - Remove files with confirmation</li><li><strong>Search files</strong> - Find files by name</li></ul><p style="margin-top: 12px;">Just type a command or use the <strong>microphone button</strong> to speak! I understand both English and Roman Urdu commands.</p><p style="margin-top: 8px; color: var(--color-gray-500); font-size: 13px;"><strong>Voice Examples:</strong> "email bhejo", "file banao", "file dikhao", "file delete karo"</p></div></div>';
        chatMessages.innerHTML = welcomeHtml;
    }

    function initializeChat() {
        const chats = getAllChats();
        if (chats.length > 0) {
            loadChat(chats[0].id);
        } else {
            createNewChat();
        }
        
        setupVoiceButton();
        setupVoiceRecognition();
    }

    // ==================== MESSAGE FUNCTIONS ====================

    function resetConversation() {
        conversationState = {
            active: false,
            type: null,
            step: 0,
            data: {}
        };
    }

    function addMessageToDOM(content, isUser, shouldSave) {
        if (shouldSave === undefined) shouldSave = true;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + (isUser ? 'user' : 'assistant');
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = isUser 
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg>';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        if (shouldSave) {
            saveCurrentChat();
        }
    }

    function addMessage(content, isUser) {
        addMessageToDOM(content, isUser || false, true);
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing-message';
        typingDiv.innerHTML = '<div class="message-avatar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/></svg></div><div class="message-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTyping() {
        const typingMessage = chatMessages.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatFileSize(size) {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let i = 0;
        while (size >= 1024 && i < 4) {
            size /= 1024;
            i++;
        }
        return size.toFixed(2) + ' ' + units[i];
    }

    // ==================== API REQUEST ====================

    async function apiRequest(options) {
        try {
            const currentPath = window.location.pathname;
            let apiUrl;
            
            if (currentPath.includes('/frontend/')) {
                apiUrl = currentPath.replace(/\/frontend\/.*$/, '/backend/api/command_handler.php');
            } else if (currentPath.includes('/virtual-assistant/')) {
                apiUrl = '/virtual-assistant/backend/api/command_handler.php';
            } else {
                apiUrl = '../backend/api/command_handler.php';
            }
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(options)
            });
            
            const rawText = await response.text();
            
            if (rawText.startsWith('<!') || rawText.startsWith('<html') || rawText.startsWith('<br')) {
                return { 
                    success: false, 
                    message: 'PHP error or server not configured correctly.'
                };
            }
            
            try {
                const data = JSON.parse(rawText);
                return data;
            } catch (parseError) {
                return { 
                    success: false, 
                    message: 'Invalid response from server.'
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: 'Cannot connect to PHP backend. Make sure XAMPP is running.'
            };
        }
    }

    // ==================== COMMAND PARSING WITH MULTI-LANGUAGE SUPPORT ====================

    function matchesCommand(input, commandList) {
        const lowerInput = input.toLowerCase().trim();
        return commandList.some(function(cmd) {
            return lowerInput.includes(cmd.toLowerCase());
        });
    }

    function isCancelCommand(input) {
        return matchesCommand(input, voiceCommands.cancel);
    }
    
    function isConfirmCommand(input) {
        return matchesCommand(input, voiceCommands.yes);
    }

    // Helper function to extract filename with extension from input
    function extractFilename(input) {
        // Pattern to match filename with extension (e.g., report.txt, test.js, file-name.html)
        const filenamePattern = /([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/g;
        const matches = input.match(filenamePattern);
        
        if (matches && matches.length > 0) {
            // Return the last match (most likely to be the actual filename)
            return matches[matches.length - 1];
        }
        return null;
    }

    function parseCommand(input) {
        const lowerInput = input.toLowerCase().trim();
        
        // Help commands
        if (matchesCommand(input, voiceCommands.help)) {
            return { action: 'help' };
        }
        
        // Email commands
        if (matchesCommand(input, voiceCommands.email)) {
            return { action: 'start_email' };
        }
        
        // Create file commands
        if (matchesCommand(input, voiceCommands.create)) {
            return { action: 'start_create_file' };
        }
        
        // Edit file commands - IMPROVED: Check for filename with extension
        if (matchesCommand(input, voiceCommands.edit)) {
            const filename = extractFilename(input);
            if (filename) {
                return { action: 'start_edit_file', filename: filename };
            }
            return { action: 'start_edit_file' };
        }
        
        // Read file commands - IMPROVED: Check for filename with extension
        if (matchesCommand(input, voiceCommands.read)) {
            const filename = extractFilename(input);
            if (filename) {
                return { action: 'read_file', filename: filename };
            }
            return { action: 'start_read_file' };
        }
        
        // Delete file commands - IMPROVED: Check for filename with extension
        if (matchesCommand(input, voiceCommands.delete)) {
            const filename = extractFilename(input);
            if (filename) {
                return { action: 'start_delete_file', filename: filename };
            }
            return { action: 'start_delete_file' };
        }
        
        // Search file commands
        if (matchesCommand(input, voiceCommands.search)) {
            const match = input.match(/(?:search|find|dhundo|talash|khojo)\s+(?:file\s+)?(?:for\s+)?([^\s]+)?/i);
            if (match && match[1] && !voiceCommands.search.includes(match[1].toLowerCase())) {
                return { action: 'search', query: match[1] };
            }
            return { action: 'search', query: '' };
        }
        
        // Check if input is JUST a filename with extension (direct file input)
        const justFilename = extractFilename(input);
        if (justFilename && input.trim() === justFilename) {
            // User just typed a filename - treat as edit request
            return { action: 'start_edit_file', filename: justFilename };
        }
        
        return { action: 'unknown', input: input };
    }

    // ==================== CONVERSATION HANDLERS ====================

    async function handleConversation(userInput) {
        const input = userInput.trim();
        
        if (isCancelCommand(input)) {
            resetConversation();
            addMessage('<p>Operation cancelled. How can I help you?</p>');
            return;
        }
        
        switch(conversationState.type) {
            case 'email':
                await handleEmailConversation(input);
                break;
            case 'create_file':
                await handleCreateFileConversation(input);
                break;
            case 'edit_file':
                await handleEditFileConversation(input);
                break;
            case 'delete_file':
                await handleDeleteFileConversation(input);
                break;
            case 'read_file':
                await handleReadFileConversation(input);
                break;
        }
    }

    // EMAIL CONVERSATION
    async function handleEmailConversation(input) {
        switch(conversationState.step) {
            case 1:
                if (!isValidEmail(input)) {
                    addMessage('<p>That doesn\'t look like a valid email address. Please enter a valid email address (e.g., example@gmail.com):</p>');
                    return;
                }
                conversationState.data.to = input;
                conversationState.step = 2;
                addMessage('<p>Got it! Now, what should the <strong>subject</strong> of the email be?</p>');
                break;
                
            case 2:
                conversationState.data.subject = input;
                conversationState.step = 3;
                addMessage('<p>Perfect! Now, please type the <strong>message content</strong> you want to send:</p>');
                break;
                
            case 3:
                conversationState.data.message = input;
                conversationState.step = 4;
                addMessage('<p>Great! Here\'s a summary of your email:</p><div style="background: var(--color-gray-100); padding: 16px; border-radius: 8px; margin: 12px 0; border: 1px solid var(--color-gray-200);"><p><strong>To:</strong> ' + escapeHtml(conversationState.data.to) + '</p><p><strong>Subject:</strong> ' + escapeHtml(conversationState.data.subject) + '</p><p><strong>Message:</strong> ' + escapeHtml(conversationState.data.message) + '</p></div><p>Type <strong>"yes"</strong> or <strong>"haan"</strong> to send this email, or <strong>"cancel"</strong> to abort.</p>');
                break;
                
            case 4:
                if (isConfirmCommand(input)) {
                    showTyping();
                    const result = await apiRequest({
                        action: 'email',
                        to: conversationState.data.to,
                        subject: conversationState.data.subject,
                        message: conversationState.data.message
                    });
                    hideTyping();
                    
                    if (result.success) {
                        addMessage('<p style="color: var(--color-success);">Email sent successfully to <strong>' + escapeHtml(conversationState.data.to) + '</strong>!</p>');
                    } else {
                        addMessage('<p style="color: var(--color-error);">Failed to send email: ' + escapeHtml(result.message) + '</p>');
                    }
                    resetConversation();
                } else {
                    addMessage('<p>Email cancelled. How can I help you?</p>');
                    resetConversation();
                }
                break;
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // CREATE FILE CONVERSATION
    async function handleCreateFileConversation(input) {
        switch(conversationState.step) {
            case 1:
                let extension = input.replace(/^\./, '').toLowerCase();
                const allowedExtensions = ['txt', 'md', 'json', 'html', 'css', 'js', 'xml', 'csv', 'log', 'php', 'py'];
                
                if (!allowedExtensions.includes(extension)) {
                    addMessage('<p>That extension is not supported. Please choose one of: <strong>' + allowedExtensions.join(', ') + '</strong></p>');
                    return;
                }
                
                conversationState.data.extension = extension;
                conversationState.step = 2;
                addMessage('<p>Good! Now, what would you like to <strong>name</strong> this file? (without the extension)</p>');
                break;
                
            case 2:
                let filename = input.replace(/[^a-zA-Z0-9_\-]/g, '');
                if (!filename) {
                    addMessage('<p>Invalid filename. Please use only letters, numbers, underscores, and hyphens:</p>');
                    return;
                }
                
                conversationState.data.filename = filename + '.' + conversationState.data.extension;
                conversationState.step = 3;
                addMessage('<p>The file will be named <strong>' + escapeHtml(conversationState.data.filename) + '</strong>. Now, please enter the <strong>content</strong> for the file (or type "empty" for an empty file):</p>');
                break;
                
            case 3:
                conversationState.data.content = input.toLowerCase() === 'empty' ? '' : input;
                conversationState.step = 4;
                const contentPreview = conversationState.data.content ? escapeHtml(conversationState.data.content.substring(0, 100)) + (conversationState.data.content.length > 100 ? '...' : '') : '(empty)';
                addMessage('<p>Ready to create the file:</p><div style="background: var(--color-gray-100); padding: 16px; border-radius: 8px; margin: 12px 0; border: 1px solid var(--color-gray-200);"><p><strong>Filename:</strong> ' + escapeHtml(conversationState.data.filename) + '</p><p><strong>Content:</strong> ' + contentPreview + '</p></div><p>Type <strong>"yes"</strong> or <strong>"haan"</strong> to create this file, or <strong>"cancel"</strong> to abort.</p>');
                break;
                
            case 4:
                if (isConfirmCommand(input)) {
                    showTyping();
                    const result = await apiRequest({
                        action: 'create',
                        filename: conversationState.data.filename,
                        content: conversationState.data.content
                    });
                    hideTyping();
                    
                    if (result.success) {
                        addMessage('<p style="color: var(--color-success);">File <strong>' + escapeHtml(conversationState.data.filename) + '</strong> created successfully!</p>');
                    } else {
                        addMessage('<p style="color: var(--color-error);">Failed to create file: ' + escapeHtml(result.message) + '</p>');
                    }
                    resetConversation();
                } else {
                    addMessage('<p>File creation cancelled. How can I help you?</p>');
                    resetConversation();
                }
                break;
        }
    }

    // EDIT FILE CONVERSATION - Opens modal directly when filename with extension is provided
    async function handleEditFileConversation(input) {
        switch(conversationState.step) {
            case 1:
                // Check if input has a file extension
                const hasExtension = /\.[a-zA-Z0-9]+$/.test(input);
                
                if (!hasExtension) {
                    addMessage('<p>Please provide the complete filename with extension (e.g., report.txt, test.js):</p>');
                    return;
                }
                
                conversationState.data.filename = input;
                
                showTyping();
                const readResult = await apiRequest({
                    action: 'read',
                    filename: input
                });
                hideTyping();
                
                if (readResult.success) {
                    // File exists - open modal for editing
                    currentEditingFile = input;
                    
                    if (modalTitle) {
                        modalTitle.textContent = 'Edit: ' + input;
                    }
                    if (modalTextarea) {
                        modalTextarea.value = readResult.content || '';
                    }
                    
                    if (fileModal) {
                        fileModal.classList.add('active');
                        fileModal.style.display = 'flex';
                        document.body.style.overflow = 'hidden';
                    }
                    
                    addMessage('<p>File <strong>' + escapeHtml(input) + '</strong> loaded in the editor. Make your changes and click "Save Changes".</p>');
                    resetConversation();
                } else {
                    addMessage('<p style="color: var(--color-error);">File not found: <strong>' + escapeHtml(input) + '</strong>. Please check the filename and try again.</p>');
                    resetConversation();
                }
                break;
        }
    }

    // READ FILE CONVERSATION
    async function handleReadFileConversation(input) {
        switch(conversationState.step) {
            case 1:
                showTyping();
                const readResult = await apiRequest({
                    action: 'read',
                    filename: input
                });
                hideTyping();
                
                if (readResult.success) {
                    addMessage('<p>Here\'s the content of <strong>' + escapeHtml(input) + '</strong>:</p><pre style="background: var(--color-gray-100); color: var(--color-primary); padding: 12px; border-radius: 8px; margin-top: 8px; max-height: 300px; overflow-y: auto; border: 1px solid var(--color-gray-200);">' + (escapeHtml(readResult.content) || '(Empty file)') + '</pre>');
                } else {
                    addMessage('<p style="color: var(--color-error);">Could not read file: ' + escapeHtml(readResult.message) + '</p>');
                }
                resetConversation();
                break;
        }
    }

    // DELETE FILE CONVERSATION
    async function handleDeleteFileConversation(input) {
        switch(conversationState.step) {
            case 1:
                conversationState.data.filename = input;
                conversationState.step = 2;
                addMessage('<p>Are you sure you want to delete <strong>' + escapeHtml(input) + '</strong>? This action cannot be undone.</p><p>Type <strong>"yes"</strong> or <strong>"haan"</strong> to confirm deletion, or <strong>"cancel"</strong> to abort.</p>');
                break;
                
            case 2:
                if (isConfirmCommand(input)) {
                    showTyping();
                    const result = await apiRequest({
                        action: 'delete',
                        filename: conversationState.data.filename
                    });
                    hideTyping();
                    
                    if (result.success) {
                        addMessage('<p style="color: var(--color-success);">File <strong>' + escapeHtml(conversationState.data.filename) + '</strong> deleted successfully!</p>');
                    } else {
                        addMessage('<p style="color: var(--color-error);">Failed to delete file: ' + escapeHtml(result.message) + '</p>');
                    }
                    resetConversation();
                } else {
                    addMessage('<p>File deletion cancelled. How can I help you?</p>');
                    resetConversation();
                }
                break;
        }
    }

    // ==================== PROCESS COMMAND ====================

    async function processCommand(command) {
        switch(command.action) {
            case 'help':
                addMessage('<p>Here are the commands I understand (English & Roman Urdu):</p><ul style="margin: 12px 0 0 20px;"><li><strong>Send email / Email bhejo</strong> - I\'ll guide you step by step</li><li><strong>Create file / File banao</strong> - I\'ll ask for extension, name, and content</li><li><strong>Read file / File dikhao</strong> - Shows file contents</li><li><strong>Edit file / File edit karo</strong> - Opens file in editor for you to modify</li><li><strong>Delete file / File hatao</strong> - I\'ll ask you which file to delete</li><li><strong>Search files / File dhundo</strong> - Search for files by name</li></ul><p style="margin-top: 12px;">Just type a command or click the microphone to speak!</p><p style="margin-top: 8px; color: var(--color-gray-400);">Tip: You can say "cancel" or "band karo" at any time to abort an operation.</p>');
                break;
                
            case 'start_email':
                conversationState = { active: true, type: 'email', step: 1, data: {} };
                addMessage('<p>I\'ll help you send an email. First, please enter the <strong>recipient\'s email address</strong>:</p>');
                break;
                
            case 'start_create_file':
                conversationState = { active: true, type: 'create_file', step: 1, data: {} };
                addMessage('<p>I\'ll help you create a new file. First, what <strong>file extension</strong> would you like?</p><p style="color: var(--color-gray-400); font-size: 14px; margin-top: 8px;">Supported: txt, md, json, html, css, js, xml, csv, log, php, py</p>');
                break;
                
            case 'start_read_file':
                conversationState = { active: true, type: 'read_file', step: 1, data: {} };
                addMessage('<p>Which file would you like to read? Please enter the <strong>filename</strong> (e.g., notes.txt):</p>');
                break;
                
            case 'read_file':
                showTyping();
                const readResult = await apiRequest({ action: 'read', filename: command.filename });
                hideTyping();
                
                if (readResult.success) {
                    addMessage('<p>Here\'s the content of <strong>' + escapeHtml(command.filename) + '</strong>:</p><pre style="background: var(--color-gray-100); color: var(--color-primary); padding: 12px; border-radius: 8px; margin-top: 8px; max-height: 300px; overflow-y: auto; border: 1px solid var(--color-gray-200);">' + (escapeHtml(readResult.content) || '(Empty file)') + '</pre>');
                } else {
                    addMessage('<p style="color: var(--color-error);">Could not read file: ' + escapeHtml(readResult.message) + '</p>');
                }
                break;
                
            case 'start_edit_file':
                conversationState = { active: true, type: 'edit_file', step: 1, data: {} };
                if (command.filename) {
                    // Filename provided - directly try to open it
                    await handleEditFileConversation(command.filename);
                } else {
                    addMessage('<p>Which file would you like to edit? Please enter the <strong>filename with extension</strong> (e.g., report.txt):</p>');
                }
                break;
                
            case 'start_delete_file':
                conversationState = { active: true, type: 'delete_file', step: 1, data: {} };
                if (command.filename) {
                    await handleDeleteFileConversation(command.filename);
                } else {
                    addMessage('<p>Which file would you like to delete? Please enter the <strong>filename</strong>:</p>');
                }
                break;
                
            case 'search':
                showTyping();
                const searchResult = await apiRequest({ action: 'search', query: command.query || '' });
                hideTyping();
                
                if (searchResult.success && searchResult.files && searchResult.files.length > 0) {
                    let fileList = searchResult.files.map(function(f) {
                        return '<li>' + escapeHtml(f.filename) + ' (' + formatFileSize(f.size) + ')</li>';
                    }).join('');
                    addMessage('<p>Found ' + searchResult.files.length + ' file(s):</p><ul style="margin: 12px 0 0 20px;">' + fileList + '</ul>');
                } else {
                    addMessage('<p>' + (command.query ? 'No files found matching "' + escapeHtml(command.query) + '".' : 'No files found.') + '</p>');
                }
                break;
                
            case 'unknown':
            default:
                addMessage('<p>I\'m not sure what you mean by "' + escapeHtml(command.input) + '". Try saying things like:</p><ul style="margin: 12px 0 0 20px;"><li>"send email" or "email bhejo" - to send an email</li><li>"create file" or "file banao" - to create a new file</li><li>"read file notes.txt" or "file dikhao" - to read a file</li><li>"edit file notes.txt" or "file edit karo notes.txt" - to edit a file</li><li>"help" or "madad" - to see all commands</li></ul>');
        }
    }

    // ==================== SEND MESSAGE ====================

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        addMessage('<p>' + escapeHtml(message) + '</p>', true);
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        if (conversationState.active) {
            handleConversation(message);
        } else {
            const command = parseCommand(message);
            processCommand(command);
        }
    }

    // ==================== EVENT LISTENERS ====================

    sendBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    quickCmds.forEach(function(cmd) {
        cmd.addEventListener('click', function() {
            const command = this.dataset.cmd;
            chatInput.value = command;
            sendMessage();
        });
    });

    if (newChatBtn) {
        newChatBtn.addEventListener('click', createNewChat);
    }

    if (modalClose) {
        modalClose.addEventListener('click', function() {
            if (fileModal) {
                fileModal.classList.remove('active');
                fileModal.style.display = 'none';
                document.body.style.overflow = '';
            }
            currentEditingFile = null;
        });
    }
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function() {
            if (fileModal) {
                fileModal.classList.remove('active');
                fileModal.style.display = 'none';
                document.body.style.overflow = '';
            }
            currentEditingFile = null;
        });
    }

    if (modalSaveBtn) {
        modalSaveBtn.addEventListener('click', async function() {
            if (!currentEditingFile) return;
            
            const newContent = modalTextarea.value;
            
            modalSaveBtn.disabled = true;
            modalSaveBtn.textContent = 'Saving...';
            
            const result = await apiRequest({
                action: 'edit',
                filename: currentEditingFile,
                content: newContent
            });
            
            modalSaveBtn.disabled = false;
            modalSaveBtn.textContent = 'Save Changes';
            
            if (result.success) {
                addMessage('<p style="color: var(--color-success);">File <strong>' + escapeHtml(currentEditingFile) + '</strong> updated successfully!</p>');
                if (fileModal) {
                    fileModal.classList.remove('active');
                    fileModal.style.display = 'none';
                    document.body.style.overflow = '';
                }
                currentEditingFile = null;
            } else {
                alert('Failed to save: ' + result.message);
            }
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target === fileModal) {
            fileModal.classList.remove('active');
            fileModal.style.display = 'none';
            document.body.style.overflow = '';
            currentEditingFile = null;
        }
    });

    // Initialize
    initializeChat();
});
