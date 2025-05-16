import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

function JoinRoomPage() {
    const [room, setRoom] = useState("");
    const navigate = useNavigate();

    const handleJoin = () => {
        if (room.trim() !== "") {
            navigate(`/chat/${room}`);
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
                />
                <button className="join-button" onClick={handleJoin}>
                    Enter
                </button>
            </div>
        </div>
    );
}

export default JoinRoomPage;
