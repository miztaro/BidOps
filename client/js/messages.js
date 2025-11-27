document.addEventListener("DOMContentLoaded", () => {
    
    const chatListContainer = document.getElementById("chatListContainer");
    const messagesContent = document.getElementById("messagesContent");
    const messageInput = document.getElementById("messageInput");
    
    // We now store the Chat ID, not just the user ID
    const currentChatIdInput = document.getElementById("currentChatId"); 
    
    const sendBtn = document.querySelector(".send-btn");
    const attachBtn = document.querySelector(".attach-btn");
    const uploadInput = document.getElementById("uploadInput");
    const imagePreview = document.getElementById("imagePreview");
    const userInfo = document.getElementById("userInfo");
    
    let selectedImage = null;
    let refreshInterval = null;

    // 1. LOAD HEADER
    fetch("header.html")
        .then(res => res.text())
        .then(data => {
             const header = document.getElementById("header");
             if(header) header.innerHTML = data;
        })
        .catch(e => console.log(e));

    // 2. LOAD CHAT LIST (Based on 'chat' table)
    function loadChatList() {
        fetch("server/message/get_chat_list.php")
            .then(res => res.json())
            .then(chats => {
                chatListContainer.innerHTML = "";
                chats.forEach(chat => {
                    const div = document.createElement("div");
                    div.className = "chat-item";
                    // Using default avatar if profile_pic is missing
                    div.innerHTML = `
                        <img src="img/${chat.profile_pic || 'default.png'}" onerror="this.src='https://ui-avatars.com/api/?name=${chat.username}'">
                        <div>
                            <h4>${chat.username}</h4>
                            <p>${chat.last_msg}</p>
                        </div>
                    `;
                    
                    div.addEventListener("click", () => {
                        document.querySelectorAll(".chat-item").forEach(el => el.classList.remove("active"));
                        div.classList.add("active");
                        
                        // Pass the CHAT ID here
                        loadChat(chat.chat_id, chat.username, chat.profile_pic, chat.item_name);
                    });
                    chatListContainer.appendChild(div);
                });
            });
    }

    // 3. LOAD MESSAGES
    function loadChat(chatId, username, pic, itemName) {
        currentChatIdInput.value = chatId;
        
        // Update User Info Panel
        userInfo.innerHTML = `
             <img src="img/${pic || 'default.png'}" onerror="this.src='https://ui-avatars.com/api/?name=${username}'" style="width:80px;height:80px;border-radius:50%;margin-bottom:10px;">
             <h2 class="name">${username}</h2>
             <p class="email">Trading: ${itemName || 'Item'}</p>
             <div class="user-actions">
                <button>Profile</button> <button>Mute</button>
             </div>
        `;

        const fetchMsgs = () => {
            fetch(`server/message/get_messages.php?chat_id=${chatId}`)
            .then(res => res.json())
            .then(data => {
                messagesContent.innerHTML = "";
                data.forEach(msg => {
                    const msgDiv = document.createElement("div");
                    msgDiv.className = `message ${msg.is_me ? "sent" : "received"}`;
                    
                    let content = `<div class="bubble">`;
                    if(msg.image_path) {
                        content += `<img src="${msg.image_path}" style="max-width:200px; border-radius:10px; display:block; margin-bottom:5px;">`;
                    }
                    // Assuming column is named 'content' or 'message_text'
                    if(msg.content || msg.message_text) {
                        content += `${msg.content || msg.message_text}`;
                    }
                    content += `</div>`;
                    
                    msgDiv.innerHTML = content;
                    messagesContent.appendChild(msgDiv);
                });
            });
        };

        fetchMsgs();
        if(refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(fetchMsgs, 3000);
    }

    // 4. SEND MESSAGE
    function sendMessage() {
        const chatId = currentChatIdInput.value;
        const text = messageInput.value.trim();

        if(!chatId) return alert("Select a chat first.");
        if(!text && !selectedImage) return;

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
                messageInput.value = "";
                selectedImage = null;
                imagePreview.style.display = "none";
                imagePreview.innerHTML = "";
                uploadInput.value = "";
                
                // Refresh immediately
                const name = document.querySelector(".user-info .name").innerText;
                loadChat(chatId, name, "", ""); 
            } else {
                console.error("Send failed", data);
            }
        });
    }

    // Events
    sendBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter") sendMessage();
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