const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===========================
// ======== SCHEMAS =========
// ===========================

// Notes schema
const messageSchema = new mongoose.Schema({
    room: { type: String, required: true },
    message: { type: String, required: true },
    color: { type: String, default: "pink" },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

// Chat schema
const chatSchema = new mongoose.Schema({
    room: String,
    user: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
});
const Chat = mongoose.model("Chat", chatSchema);

// ===========================
// ===== SOCKET EVENTS =======
// ===========================

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_room", async (room) => {
        socket.join(room);

        try {
            const messages = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit("previous_messages", messages);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }

        socket.on("disconnect", () => {
            // Fără logică pentru live viewers
        });
    });

    socket.on("send_message", async (data) => {
        const newMessage = new Message({
            room: data.room,
            message: data.message,
            color: data.color
        });
        try {
            const saved = await newMessage.save();
            io.in(data.room).emit("receive_message", saved);
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    socket.on("delete_message", async (data) => {
        try {
            await Message.findByIdAndDelete(data.id);
            io.in(data.room).emit("message_deleted", { id: data.id });
        } catch (err) {
            console.error("Error deleting message:", err);
        }
    });

    socket.on("update_message", async (data) => {
        try {
            const updated = await Message.findByIdAndUpdate(
                data.id,
                { message: data.newMessage, color: data.color },
                { new: true }
            );
            io.in(data.room).emit("message_updated", updated);
        } catch (err) {
            console.error("Error updating message:", err);
        }
    });

    socket.on("join_chat", async (room) => {
        socket.join(room);
        try {
            const chats = await Chat.find({ room }).sort({ timestamp: 1 });
            socket.emit("receive_chat_history", chats);
        } catch (err) {
            console.error("Error fetching chat history:", err);
        }
    });

    socket.on("send_chat", async (data) => {
        try {
            const newChat = new Chat(data);
            const saved = await newChat.save();
            io.in(data.room).emit("receive_chat", saved);
        } catch (err) {
            console.error("Error saving chat:", err);
        }
    });

    socket.on("delete_chat", async (data) => {
        try {
            await Chat.findByIdAndDelete(data.id);
            io.in(data.room).emit("chat_deleted", { id: data.id });
        } catch (err) {
            console.error("Error deleting chat:", err);
        }
    });
});

server.listen(3001, () => {
    console.log("🚀 SERVER IS RUNNING on port 3001");
});
