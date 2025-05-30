import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function JoinRoomPage() {
    const [room, setRoom] = useState("");
    const navigate = useNavigate();

    const handleJoin = () => {
        const trimmedRoom = room.trim();
        if (trimmedRoom.length > 0 && trimmedRoom.length <= 50) {
            navigate(`/chat/${trimmedRoom}`);
        } else {
            alert("Please enter a valid room name (1-50 characters).");
        }
    };

    return (
        <div className="join-page">
            <div className="join-card">
                <h1 className="join-title">Join a Room</h1>
                <input
                    type="text"
                    placeholder="Enter room name..."
                    className="join-input"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    maxLength={50}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleJoin();  // 🔥 Enter trimite direct
                        }
                    }}
                />
                <button className="join-button" onClick={handleJoin}>
                    Join
                </button>
            </div>
        </div>
    );
}

export default JoinRoomPage;
