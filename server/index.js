const express = require("express");
const app = express();
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});
//process.env.MONGO_URI
// Conectare la MongoDB
mongoose.connect("mongodb://localhost:27017/chatdb_docker")
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Error connecting to MongoDB", err));

// Definirea schemei și a modelului pentru mesaje
const messageSchema = new mongoose.Schema({
    room: { type: String, required: true },
    message: { type: String, required: true },
    color: { type: String, default: "pink" },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    // Când un utilizator se alătură unei camere, trimitem și mesajele anterioare
    socket.on("join_room", async (room) => {
        socket.join(room);
        try {
            const messages = await Message.find({ room }).sort({ timestamp: 1 });
            socket.emit("previous_messages", messages);
        } catch (err) {
            console.error("Error fetching messages:", err);
        }
    });

    // Când un mesaj este trimis
    socket.on("send_message", async (data) => {
        const newMessage = new Message({
            room: data.room,
            message: data.message,
            color: data.color // Salvăm culoarea mesajului în baza de date
        });
        try {
            const savedMessage = await newMessage.save();
            // Emitem către toți clienții din cameră mesajul salvat
            io.in(data.room).emit("receive_message", savedMessage);
        } catch (err) {
            console.error("Error saving message:", err);
        }
    });

    // Pentru ștergerea unui mesaj
    socket.on("delete_message", async (data) => {
        // data trebuie să conțină: { id: "mesaj_id", room: "room_name" }
        try {
            await Message.findByIdAndDelete(data.id);
            io.in(data.room).emit("message_deleted", { id: data.id });
        } catch (err) {
            console.error("Error deleting message:", err);
        }
    });

    // Pentru actualizarea unui mesaj
    socket.on("update_message", async (data) => {
        try {
            const updatedMessage = await Message.findByIdAndUpdate(
                data.id,
                {
                    message: data.newMessage,
                    color: data.color // ✅ adaugă și culoarea în actualizare
                },
                { new: true }
            );
            io.in(data.room).emit("message_updated", updatedMessage);
        } catch (err) {
            console.error("Error updating message:", err);
        }
    });

});

server.listen(3001, () => {
    console.log("SERVER IS RUNNING on port 3001");
});
