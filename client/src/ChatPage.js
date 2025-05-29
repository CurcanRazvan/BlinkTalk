import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import 'font-awesome/css/font-awesome.min.css';

const socket = io("http://localhost:3001");

const ChatPage = () => {
    const { room } = useParams();
    const { state } = useLocation();
    const user = state?.user || "";
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [color, setColor] = useState("#ffb3b3");
    const [editMessageId, setEditMessageId] = useState(null);
    const [editMessageContent, setEditMessageContent] = useState("");
    const [dragIndex, setDragIndex] = useState(null);

    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [selectedChatIds, setSelectedChatIds] = useState(new Set());

    const navigate = useNavigate();
    const noteColors = ["#ffb3b3", "#fff9b3", "#b3cfff", "#c8f7c5", "#ffe0b3", "#e6ccff"];

    const chatContainerRef = useRef(null);

    useEffect(() => {
        socket.emit("join_room", room);
        socket.emit("join_chat", room);

        socket.on("previous_messages", setMessages);
        socket.on("receive_message", (data) => setMessages((prev) => [...prev, data]));
        socket.on("message_deleted", (data) => setMessages((prev) => prev.filter((msg) => msg._id !== data.id)));
        socket.on("message_updated", (data) => setMessages((prev) => prev.map((msg) => msg._id === data._id ? data : msg)));

        socket.on("receive_chat_history", setChatMessages);
        socket.on("receive_chat", (msg) => setChatMessages((prev) => [...prev, msg]));
        socket.on("chat_deleted", (data) => setChatMessages((prev) => prev.filter((msg) => msg._id !== data.id)));

        return () => {
            socket.off("previous_messages");
            socket.off("receive_message");
            socket.off("message_deleted");
            socket.off("message_updated");
            socket.off("receive_chat_history");
            socket.off("receive_chat");
            socket.off("chat_deleted");
        };
    }, [room]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Backspace" && selectedChatIds.size > 0) {
                selectedChatIds.forEach((id) => {
                    socket.emit("delete_chat", { id, room });
                });
                setSelectedChatIds(new Set());
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedChatIds, room]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const toggleChatSelection = (id) => {
        setSelectedChatIds(prev => {
            const updated = new Set(prev);
            if (updated.has(id)) {
                updated.delete(id);
            } else {
                updated.add(id);
            }
            return updated;
        });
    };

    const sendMessage = () => {
        if (message.trim()) {
            socket.emit("send_message", { room, message, color });
            setMessage("");
        }
    };

    const updateMessage = (id) => {
        if (editMessageContent.trim()) {
            const original = messages.find((m) => m._id === id);
            socket.emit("update_message", { id, room, newMessage: editMessageContent, color: original.color });
            setEditMessageId(null);
            setEditMessageContent("");
        }
    };

    const deleteMessage = (id) => {
        socket.emit("delete_message", { id, room });
    };

    const sendChat = () => {
        if (chatInput.trim()) {
            socket.emit("send_chat", { room, user, text: chatInput });
            setChatInput("");
        }
    };

    const handleRightClick = (e, text) => {
        e.preventDefault();
        socket.emit("send_message", { room, message: text, color });
    };

    const handleDragStart = (index) => setDragIndex(index);
    const handleDrop = (index) => {
        if (dragIndex !== null) {
            const updated = [...messages];
            const [moved] = updated.splice(dragIndex, 1);
            updated.splice(index, 0, moved);
            setMessages(updated);
            setDragIndex(null);
        }
    };

    return (
        <div className="chat-page">
            <button className="home-button" onClick={() => navigate("/")}>
                <i className="fa fa-home icon-lg" /> Home
            </button>
            <h2>Room: {room}</h2>
            <div className="chat-layout">
                {/* Notes Section */}
                <div className="notes-section">
                    <h2>Notes</h2>
                    <div className="message-list-container">
                        <div className="message-list">
                            {messages.map((msg, index) => (
                                <div key={msg._id} className="message-card"
                                     draggable
                                     onDragStart={() => handleDragStart(index)}
                                     onDragOver={(e) => e.preventDefault()}
                                     onDrop={() => handleDrop(index)}
                                     style={{ backgroundColor: msg.color }}>
                                    {editMessageId === msg._id ? (
                                        <div className="edit-mode">
                                            <input
                                                className="edit-input"
                                                value={editMessageContent}
                                                onChange={(e) => setEditMessageContent(e.target.value)}
                                            />
                                            <button className="save-button" onClick={() => updateMessage(msg._id)}>
                                                <i className="fa fa-floppy-o icon-lg"></i>
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
                                                    <i className="fa fa-pencil icon-lg"></i>
                                                </button>
                                                <button className="icon-button" onClick={() => deleteMessage(msg._id)}>
                                                    <i className="fa fa-trash icon-lg"></i>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <textarea
                        className="chat-input"
                        placeholder="Write your note or message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                            }
                        }}
                    />
                    <div className="color-picker">
                        {noteColors.map((c) => (
                            <div key={c} className={`color-option ${color === c ? "selected" : ""}`}
                                 style={{ backgroundColor: c }} onClick={() => setColor(c)} />
                        ))}
                    </div>
                    <button className="send-button" onClick={sendMessage}>
                        <i className="fa fa-paper-plane" aria-hidden="true"></i> {/* 🔥 Săgeată de WhatsApp */}
                    </button>
                </div>

                {/* Live Chat Section */}
                <div className="livechat-section">
                    <h2>Live Chat</h2>
                    <div className="messages-container" ref={chatContainerRef}>
                        {chatMessages.map((c) => (
                            <div key={c._id}
                                 onContextMenu={(e) => handleRightClick(e, c.text)}
                                 onClick={() => toggleChatSelection(c._id)}
                                 className="message"
                                 title="Right-click to create note, click to select"
                                 style={{
                                     backgroundColor: selectedChatIds.has(c._id) ? 'rgba(100, 181, 246, 0.3)' : undefined,
                                     border: selectedChatIds.has(c._id) ? '1px solid #90caf9' : '1px solid transparent'
                                 }}>
                                {c.text}
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    sendChat();
                                }
                            }}
                            placeholder="Type your message..."
                            className="edit-input"
                            style={{ flex: 1 }}
                        />
                        <button className="send-button" onClick={sendChat}>
                            <i className="fa fa-paper-plane" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
