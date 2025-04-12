// App.js
import "./App.css";
import io from "socket.io-client";
import { useEffect, useState } from "react";

// Conectarea la serverul Socket.io
const socket = io.connect("http://localhost:3001");

function App() {
    // State pentru cameră, mesajul de trimis și lista de mesaje
    const [room, setRoom] = useState("");
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    // State pentru editarea unui mesaj
    const [editMessageId, setEditMessageId] = useState(null);
    const [editMessageContent, setEditMessageContent] = useState("");

    const joinRoom = () => {
        if (room !== "") {
            socket.emit("join_room", room);
        }
    };

    const sendMessage = () => {
        if (message.trim() !== "") {
            // Trimiterea mesajului la server
            socket.emit("send_message", { room, message });
            setMessage("");
        }
    };

    // Funcție pentru ștergerea unui mesaj
    const deleteMessage = (id) => {
        socket.emit("delete_message", { id, room });
    };

    // Funcție pentru actualizarea unui mesaj
    const updateMessage = (id) => {
        if (editMessageContent.trim() !== "") {
            socket.emit("update_message", { id, room, newMessage: editMessageContent });
            setEditMessageId(null);
            setEditMessageContent("");
        }
    };

    useEffect(() => {
        // Ascultare pentru primirea mesajelor noi
        socket.on("receive_message", (data) => {
            setMessages((prev) => [...prev, data]);
        });
        // La conectarea în cameră, primim mesajele anterioare
        socket.on("previous_messages", (data) => {
            setMessages(data);
        });
        // Când un mesaj este șters, îl eliminăm din listă
        socket.on("message_deleted", (data) => {
            setMessages((prev) => prev.filter((msg) => msg._id !== data.id));
        });
        // Când un mesaj este actualizat, actualizăm în listă
        socket.on("message_updated", (data) => {
            setMessages((prev) =>
                prev.map((msg) => (msg._id === data._id ? data : msg))
            );
        });

        return () => {
            socket.off("receive_message");
            socket.off("previous_messages");
            socket.off("message_deleted");
            socket.off("message_updated");
        };
    }, []);

    return (
        <div className="App">
            <div>
                <input
                    placeholder="Room Number..."
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                />
                <button onClick={joinRoom}>Join Room</button>
            </div>
            <div>
                <input
                    placeholder="Message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={sendMessage}>Send Message</button>
            </div>
            <h1>Messages:</h1>
            <div>
                {messages.map((msg) => (
                    <div key={msg._id} style={{ marginBottom: "1rem", border: "1px solid #ccc", padding: "0.5rem" }}>
                        {editMessageId === msg._id ? (
                            <div>
                                <input
                                    value={editMessageContent}
                                    onChange={(e) => setEditMessageContent(e.target.value)}
                                />
                                <button onClick={() => updateMessage(msg._id)}>Save</button>
                            </div>
                        ) : (
                            <div>
                                <span>{msg.message}</span>
                                <button className="delete-button" onClick={() => deleteMessage(msg._id)}>Delete</button>
                                <button onClick={() => {
                                    setEditMessageId(msg._id);
                                    setEditMessageContent(msg.message);
                                }}>
                                    Edit
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
