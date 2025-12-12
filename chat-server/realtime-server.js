// This is your dedicated Socket.io chat server file.

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const CHAT_PORT = 3001; // Ensure this is 3001

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allows connection from any origin (e.g., your XAMPP server on port 80/443)
        methods: ["GET", "POST"]
    }
});

const connectedUsers = {}; 

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // 1. User Identification (register)
    socket.on('register', (userId) => {
        connectedUsers[userId] = socket.id;
        socket.join(userId); 
        console.log(`User ${userId} registered and joined their room.`);
    });
    
    // 2. Listen for a new message
    socket.on('sendMessage', (data) => {
        // data structure: { conversationId, senderId, recipientId, content, timestamp }
        console.log(`Message from ${data.senderId} to ${data.recipientId}: ${data.content}`);
        
        // Broadcast the message to the recipient's personal room
        io.to(data.recipientId).emit('newMessage', data);
        
        socket.emit('messageSentConfirmation', data); 
    });

    // 3. Handle disconnection
    socket.on('disconnect', () => {
        const userId = Object.keys(connectedUsers).find(key => connectedUsers[key] === socket.id);
        if (userId) {
            delete connectedUsers[userId];
            console.log(`User ${userId} disconnected.`);
        }
    });
});

server.listen(CHAT_PORT, () => {
    console.log(`Socket.io Chat Server running on port ${CHAT_PORT}`);
});