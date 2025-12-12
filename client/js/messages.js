document.addEventListener("DOMContentLoaded", () => {
    
    // --- SOCKET.IO CONFIGURATION ---
    const CHAT_SERVER_URL = 'http://localhost:3001'; 
    // !!! IMPORTANT: REPLACE THIS with the actual logged-in user's ID !!!
    const CURRENT_USER_ID = 'USER_ID_123'; 

    const socket = io(CHAT_SERVER_URL);

    socket.on('connect', () => {
        console.log('Connected to chat server. Registering user:', CURRENT_USER_ID);
        // Tell the Socket server who we are, so it can route messages to us.
        socket.emit('register', CURRENT_USER_ID); 
    });
    // ---------------------------------
    
    // --- DOM ELEMENTS & STATE ---
    const chatListContainer = document.getElementById("chatListContainer");
    const messagesContent = document.getElementById("messagesContent");
    const messageInput = document.getElementById("messageInput");
    
    // Hidden inputs for state
    const currentChatIdInput = document.getElementById("currentChatId"); 
    const currentRecipientIdInput = document.getElementById("currentRecipientId"); // New
    
    const sendBtn = document.querySelector(".send-btn");
    const attachBtn = document.querySelector(".attach-btn");
    const uploadInput = document.getElementById("uploadInput");
    const imagePreview = document.getElementById("imagePreview");
    const userInfoWrapper = document.getElementById("userInfoWrapper"); // Updated ID from HTML
    
    let selectedImage = null;
    let refreshInterval = null; // We will remove polling but keep the variable for clarity

    // --- HELPER FUNCTION: Create Message Element ---
    function createMessageElement(msg, recipientPic = "") {
        // This function creates the message div structure dynamically
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${msg.is_me ? "sent" : "received"}`;
        
        // Time formatting (use msg.timestamp if provided, otherwise current time)
        const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        let bubbleContent = '';
        if(msg.image_path) {
            bubbleContent += `<img src="${msg.image_path}" style="max-width:200px; border-radius:10px; display:block; margin-bottom:5px;">`;
        }
        if(msg.content || msg.message_text) {
            bubbleContent += `${msg.content || msg.message_text}`;
        }

        const stack = `
            <div class="message-stack">
                <div class="bubble">${bubbleContent}</div>
                <span class="time">${time}</span>
            </div>
        `;
        
        if (msg.is_me) {
            // Sent message doesn't need recipient avatar
            msgDiv.innerHTML = stack;
        } else {
            // Received message needs recipient avatar (or default)
            msgDiv.innerHTML = `
                <img src="${recipientPic || 'https://ui-avatars.com/api/?name=User&background=random'}" class="avatar">
                ${stack}
            `;
        }

        return msgDiv;
    }


    // 1. LOAD HEADER
    fetch("header.html")
        .then(res => res.text())
        .then(data => {
            const header = document.getElementById("header");
            if(header) header.innerHTML = data;
        })
        .catch(e => console.log(e));

    // 2. LOAD CHAT LIST (Modified to store recipient_id)
    function loadChatList() {
        fetch("server/message/get_chat_list.php")
            .then(res => res.json())
            .then(chats => {
                chatListContainer.innerHTML = "";
                // Remove static examples from the DOM
                document.querySelectorAll('.chat-list > .chat-item').forEach(el => el.remove()); 
                
                chats.forEach(chat => {
                    const div = document.createElement("div");
                    div.className = "chat-item";
                    
                    // ASSUMPTION: PHP returns 'recipient_user_id' and 'recipient_profile_pic'
                    const recipientId = chat.recipient_user_id || chat.other_user_id; 
                    
                    div.innerHTML = `
                        <img src="img/${chat.profile_pic || 'default.png'}" onerror="this.src='https://ui-avatars.com/api/?name=${chat.username}'" alt="${chat.username}">
                        <div class="chat-info">
                            <h4>${chat.username}</h4>
                            <p class="sub-text">${chat.last_msg}</p>
                        </div>
                    `;
                    
                    div.addEventListener("click", () => {
                        document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
                        div.classList.add("active");
                        
                        // Pass the CHAT ID, RECIPIENT ID, and other details
                        loadChat(chat.chat_id, chat.username, chat.profile_pic, chat.item_name, recipientId);
                    });
                    chatListContainer.appendChild(div);
                });
            });
    }

    // 3. LOAD MESSAGES (Polling removed, initial load kept)
    function loadChat(chatId, username, pic, itemName, recipientId) {
        
        // 1. Set State Variables
        currentChatIdInput.value = chatId;
        currentRecipientIdInput.value = recipientId; // Set the recipient ID here
        
        // 2. Stop Polling (if it were still active)
        if(refreshInterval) clearInterval(refreshInterval);
        refreshInterval = null; 

        // 3. Update User Info Panel
        userInfoWrapper.innerHTML = `
             <div class="user-profile-header">
                <img src="img/${pic || 'default.png'}" onerror="this.src='https://ui-avatars.com/api/?name=${username}'" class="big-profile-pic">
                <h2 class="name">${username}</h2>
                <p class="email">Trading: ${itemName || 'Item'}</p>
             </div>
             <div class="user-actions">
                <button>Profile</button> <button>Mute</button>
             </div>
        `;

        // 4. Fetch initial messages (HTTP/REST - only on chat switch)
        fetch(`server/message/get_messages.php?chat_id=${chatId}`)
            .then(res => res.json())
            .then(data => {
                messagesContent.innerHTML = "";
                data.forEach(msg => {
                    // Check if sender is the current logged-in user
                    const isMe = msg.sender_id == CURRENT_USER_ID; 
                    const msgDiv = createMessageElement({...msg, is_me: isMe}, pic); 
                    messagesContent.appendChild(msgDiv);
                });
                messagesContent.scrollTop = messagesContent.scrollHeight;
            });
    }

    // 4. SEND MESSAGE (Modified to broadcast via Socket.io)
    function sendMessage() {
        const chatId = currentChatIdInput.value;
        const recipientId = currentRecipientIdInput.value;
        const text = messageInput.value.trim();

        if(!chatId || !recipientId) return alert("Select a chat first.");
        if(!text && !selectedImage) return;

        // 1. Persistent Save (via PHP/XAMPP)
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("message", text);
        if(selectedImage) formData.append("image", selectedImage);

        fetch("server/message/send_message.php", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if(data.status === "success") {
                // --- 2. Broadcast via Socket.io (Only on successful save) ---
                const messageData = {
                    conversationId: chatId,
                    senderId: CURRENT_USER_ID,
                    recipientId: recipientId,
                    content: text,
                    image_path: data.image_path || null, // Assuming PHP returns image path on success
                    timestamp: new Date().toISOString()
                };
                socket.emit('sendMessage', messageData); 

                // --- 3. Optimistic Update (Show sent message instantly) ---
                const sentMsg = { is_me: true, content: text, image_path: messageData.image_path, timestamp: messageData.timestamp };
                const sentDiv = createMessageElement(sentMsg);
                messagesContent.appendChild(sentDiv);
                messagesContent.scrollTop = messagesContent.scrollHeight;

                // Clear inputs
                messageInput.value = "";
                selectedImage = null;
                imagePreview.style.display = "none";
                imagePreview.innerHTML = "";
                uploadInput.value = "";
                uploadInput.value = null; // Reset file input correctly
                
            } else {
                console.error("Send failed", data);
            }
        });
    }


    // 5. SOCKET.IO LISTENER (The real-time receiver)
    socket.on('newMessage', (data) => {
        const currentChat = currentChatIdInput.value;
        
        if (data.conversationId === currentChat) {
            // Message is for the currently open chat: Render it instantly
            const recipientPic = document.querySelector(".user-profile-header .big-profile-pic").src;
            const receivedMsg = { is_me: false, content: data.content, image_path: data.image_path, timestamp: data.timestamp };
            const receivedDiv = createMessageElement(receivedMsg, recipientPic);
            messagesContent.appendChild(receivedDiv);
            messagesContent.scrollTop = messagesContent.scrollHeight;
        } else {
            // Message is for another chat: Update the chat list to show a notification/badge
            console.log(`New message received for chat ID ${data.conversationId}. Updating chat list.`);
            loadChatList(); 
        }
    });


    // --- EVENT LISTENERS ---
    sendBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter") {
            e.preventDefault(); // Prevent default form behavior
            sendMessage();
        }
    });
    attachBtn.addEventListener("click", () => uploadInput.click());
    uploadInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if(file) {
            selectedImage = file;
            const reader = new FileReader();
            reader.onload = (ev) => {
                imagePreview.style.display = "block";
                imagePreview.innerHTML = `<img src="${ev.target.result}">`;
            };
            reader.readAsDataURL(file);
        }
    });

    loadChatList();
});