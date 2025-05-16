import { useEffect, useState } from "react";
import io from "socket.io-client";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./App.css";
import 'font-awesome/css/font-awesome.min.css'; // Iconițe Font Awesome

const socket = io("http://localhost:3001");

const ChatPage = () => {
    const { room } = useParams();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [color, setColor] = useState("#ffb3b3");
    const [editMessageId, setEditMessageId] = useState(null);
    const [editMessageContent, setEditMessageContent] = useState("");
    const navigate = useNavigate();

    const noteColors = [
        "#ffb3b3", // pastel pink
        "#fff9b3", // pastel yellow
        "#b3cfff", // pastel blue
        "#c8f7c5", // pastel green
        "#ffe0b3", // pastel orange
        "#e6ccff"  // pastel purple
    ];

    useEffect(() => {
        socket.emit("join_room", room);

        socket.on("previous_messages", setMessages);
        socket.on("receive_message", (data) => setMessages((prev) => [...prev, data]));
        socket.on("message_deleted", (data) => {
            setMessages((prev) => prev.filter((msg) => msg._id !== data.id));
        });
        socket.on("message_updated", (data) => {
            setMessages((prev) => prev.map((msg) => (msg._id === data._id ? data : msg)));
        });

        return () => {
            socket.off("previous_messages");
            socket.off("receive_message");
            socket.off("message_deleted");
            socket.off("message_updated");
        };
    }, [room]);

    const sendMessage = () => {
        if (message.trim()) {
            socket.emit("send_message", { room, message, color });
            setMessage("");
        }
    };

    const updateMessage = (id) => {
        if (editMessageContent.trim()) {
            const original = messages.find((m) => m._id === id);
            socket.emit("update_message", {
                id,
                room,
                newMessage: editMessageContent,
                color: original.color
            });
            setEditMessageId(null);
            setEditMessageContent("");
        }
    };

    const deleteMessage = (id) => {
        socket.emit("delete_message", { id, room });
    };

    return (
        <div className="chat-page">
            <button className="home-button" onClick={() => navigate("/")}>
                <i className="fa fa-home icon-lg" aria-hidden="true"></i> Home
            </button>
            <h2>Room: {room}</h2>
            <textarea
                className="chat-input"
                placeholder="Write your note or message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />

            <div className="color-picker">
                {noteColors.map((c) => (
                    <div
                        key={c}
                        className={`color-option ${color === c ? "selected" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setColor(c)}
                    />
                ))}
            </div>

            <button className="send-button" onClick={sendMessage}>Send</button>

            <div className="message-list">
                {messages.map((msg) => (
                    <div key={msg._id} className="message-card" style={{ backgroundColor: msg.color }}>
                        {editMessageId === msg._id ? (
                            <div className="edit-mode">
                                <input
                                    className="edit-input"
                                    value={editMessageContent}
                                    onChange={(e) => setEditMessageContent(e.target.value)}
                                />
                                <button className="save-button" onClick={() => updateMessage(msg._id)}>
                                    <i className="fa fa-floppy-o icon-lg" aria-hidden="true"></i>
                                </button>
                            </div>
                        ) : (
                            <>
                                <span>{msg.message}</span>
                                <div className="actions">
                                    <button className="icon-button" onClick={() => {
                                        setEditMessageId(msg._id);
                                        setEditMessageContent(msg.message);
                                    }}>
                                        <i className="fa fa-pencil icon-lg" aria-hidden="true"></i>
                                    </button>
                                    <button className="icon-button" onClick={() => deleteMessage(msg._id)}>
                                        <i className="fa fa-trash icon-lg" aria-hidden="true"></i>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatPage;
