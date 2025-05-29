import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import JoinRoomPage from "./JoinRoomPage";
import ChatPage from "./ChatPage";
import "./App.css";
import 'font-awesome/css/font-awesome.min.css';

function App() {
    return (
        <Router>
            <div className="container">
                <Routes>
                    <Route path="/" element={<JoinRoomPage />} />
                    <Route path="/chat/:room" element={<ChatPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;