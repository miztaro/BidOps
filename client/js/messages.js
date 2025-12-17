// client/js/messages.js

const chatListContainer = document.getElementById('chatListContainer');
const chatWindowHeader = document.querySelector('.chat-window-header');
const messageContainer = document.getElementById('messagesContent');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const urlParams = new URLSearchParams(window.location.search);

let currentChatId = urlParams.get('chat_id');
let currentRecipientId = null;
let currentRecipientName = null;
let currentUserId = null;
let messagesPollInterval = null;

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
        chatItem.className = 'chat-list-item ' + (isSelected ? 'active' : '');
        chatItem.dataset.chatId = chat.chat_id;
        chatItem.dataset.recipientId = chat.recipient_id;
        chatItem.dataset.recipientName = chat.recipient_name;

        if (isSelected) {
            currentRecipientId = chat.recipient_id;
            currentRecipientName = chat.recipient_name;
            updateChatHeader(chat.recipient_name);
            openChat(chat.chat_id); // use polling-aware openChat
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
            openChat(currentChatId);
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

function openChat(chatId) {
    if (!chatId) return;

    // clear old interval
    if (messagesPollInterval) {
        clearInterval(messagesPollInterval);
        messagesPollInterval = null;
    }

    // load immediately
    loadMessages(chatId, true);

    // start polling every 5 seconds
    messagesPollInterval = setInterval(() => {
        loadMessages(chatId, false);
    }, 5000);
}

function loadMessages(chatId, scrollToBottom = true) {
    if (!chatId) {
        messageContainer.innerHTML = '<p class="text-center p-5">Select a chat to view messages.</p>';
        return;
    }

    // Only show loading text on first load (scrollToBottom true)
    if (scrollToBottom) {
        messageContainer.innerHTML = '<p class="text-center p-5">Loading messages...</p>';
    }

    fetch(`../server/message/get_messages.php?chat_id=${encodeURIComponent(chatId)}`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUserId = data.current_user_id;
            displayMessages(data.messages, data.current_user_id, scrollToBottom);
        } else {
            messageContainer.innerHTML = `<p class="text-center p-5">Error: ${data.message}</p>`;
        }
    })
    .catch(error => console.error('Error loading messages:', error));
}

function displayMessages(messages, currentUserId, scrollToBottom) {
    messageContainer.innerHTML = '';

    if (!messages || messages.length === 0) {
        messageContainer.innerHTML = '<p class="text-center p-5">No messages yet. Start the conversation!</p>';
        return;
    }

    messages.forEach(msg => {
        const isSender = msg.user_id === currentUserId;
        const messageEl = document.createElement('div');

        messageEl.className = 'message ' + (isSender ? 'sent' : 'received');

        messageEl.innerHTML = `
            <div class="bubble">
                <p>${msg.message}</p>
                <span class="time">${formatTime(msg.sent_at)}</span>
            </div>
        `;
        messageContainer.appendChild(messageEl);
    });

    if (scrollToBottom) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
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
            messageInput.value = '';
            // Refresh immediately after sending
            loadMessages(currentChatId, true);
        } else {
            alert('Failed to send message: ' + (data.message || 'Server error.'));
        }
    })
    .catch(error => {
        console.error('Error sending message:', error);
        alert('Could not connect to send message service.');
    });
}

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
    // If URL already had chat_id, start polling for it
    if (currentChatId) {
        openChat(currentChatId);
    }
});
