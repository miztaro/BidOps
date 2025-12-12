// client/js/messages.js

const chatListContainer = document.getElementById('chatListContainer'); // Container for list on the left
const chatWindowHeader = document.querySelector('.chat-window-header'); // Area showing the recipient's name/profile
const messageContainer = document.getElementById('messagesContent'); // Main message history
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const urlParams = new URLSearchParams(window.location.search);

let currentChatId = urlParams.get('chat_id');
let currentRecipientId = null;
let currentRecipientName = null;

// Helper to get time in a readable format
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours() % 12 || 12;
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
}

// ----------------------------------------------------------------------
// A. CHAT LIST LOGIC (Left Sidebar)
// ----------------------------------------------------------------------

function loadChatList() {
    fetch('../server/message/get_chat_list.php', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.chats.length > 0) {
            displayChatList(data.chats);
        } else {
            chatListContainer.innerHTML = '<p class="text-center p-3">No active chats.</p>';
        }
    })
    .catch(error => console.error('Error loading chat list:', error));
}

function displayChatList(chats) {
    chatListContainer.innerHTML = '';
    chats.forEach(chat => {
        const isSelected = chat.chat_id == currentChatId;
        const chatItem = document.createElement('div');
        // NOTE: If you use .chat-item in your CSS, change .chat-list-item below
        chatItem.className = 'chat-list-item ' + (isSelected ? 'active' : ''); 
        chatItem.dataset.chatId = chat.chat_id;
        chatItem.dataset.recipientId = chat.recipient_id;
        chatItem.dataset.recipientName = chat.recipient_name;

        if (isSelected) {
            currentRecipientId = chat.recipient_id;
            currentRecipientName = chat.recipient_name;
            updateChatHeader(chat.recipient_name);
            loadMessages(chat.chat_id);
        }

        chatItem.innerHTML = `
            <div class="initials-circle">${chat.recipient_name.charAt(0).toUpperCase()}</div>
            <div class="chat-info">
                <h4>${chat.recipient_name}</h4>
                <p>${chat.last_message_text || 'Start a conversation...'}</p>
            </div>
            <span class="chat-time">${chat.last_message_time ? formatTime(chat.last_message_time) : ''}</span>
        `;

        chatItem.addEventListener('click', () => {
            document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
            chatItem.classList.add('active');
            
            history.pushState(null, '', `messages.html?chat_id=${chat.chat_id}`);
            
            currentChatId = chat.chat_id;
            currentRecipientId = chat.recipient_id;
            currentRecipientName = chat.recipient_name;
            
            updateChatHeader(currentRecipientName);
            loadMessages(currentChatId);
        });

        chatListContainer.appendChild(chatItem);
    });
}

// ----------------------------------------------------------------------
// B. MESSAGE DISPLAY LOGIC (Main Window)
// ----------------------------------------------------------------------

function updateChatHeader(name) {
    if (chatWindowHeader) {
        chatWindowHeader.innerHTML = `
            <div class="initials-circle">${name.charAt(0).toUpperCase()}</div>
            <h3>${name}</h3>
        `;
    }
}

function loadMessages(chatId) {
    if (!chatId) {
        messageContainer.innerHTML = '<p class="text-center p-5">Select a chat to view messages.</p>';
        return;
    }

    messageContainer.innerHTML = '<p class="text-center p-5">Loading messages...</p>';

    fetch(`../server/message/get_messages.php?chat_id=${chatId}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            displayMessages(data.messages, data.current_user_id);
        } else {
            messageContainer.innerHTML = `<p class="text-center p-5">Error: ${data.message}</p>`;
        }
    })
    .catch(error => console.error('Error loading messages:', error));
}

function displayMessages(messages, currentUserId) {
    messageContainer.innerHTML = '';
    
    if (messages.length === 0) {
        messageContainer.innerHTML = '<p class="text-center p-5">No messages yet. Start the conversation!</p>';
        return;
    }

    messages.forEach(msg => {
        const isSender = msg.user_id === currentUserId; 
        const messageEl = document.createElement('div');
        
        // **FIXED: Uses '.message' and '.bubble' classes for correct CSS rendering**
        messageEl.className = 'message ' + (isSender ? 'sent' : 'received'); 
        
        messageEl.innerHTML = `
            <div class="bubble"> 
                <p>${msg.message}</p> 
                <span class="time">${formatTime(msg.sent_at)}</span>
            </div>
        `;
        messageContainer.appendChild(messageEl);
    });

    messageContainer.scrollTop = messageContainer.scrollHeight;
}


// ----------------------------------------------------------------------
// C. SEND MESSAGE LOGIC
// ----------------------------------------------------------------------

function sendMessage() {
    const content = messageInput.value.trim();
    
    if (!content || !currentChatId) return;

    fetch('../server/message/send_message.php', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: currentChatId,
            recipient_id: currentRecipientId,
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageInput.value = ''; // Clear input
            loadMessages(currentChatId); 
        } else {
            alert('Failed to send message: ' + (data.message || 'Server error.'));
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        alert('Could not connect to send message service.');
    });
}


// Event listeners
if (sendMessageBtn) {
    sendMessageBtn.addEventListener('click', sendMessage);
}
if (messageInput) {
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadChatList();
});