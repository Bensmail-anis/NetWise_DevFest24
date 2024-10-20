import { useState, useEffect } from "react";
import "./Dashboard.css";
import "./ChatBot.css";
import { Link } from 'react-router-dom';
import profile_pic from '../assets/Vector.png';
import Logo from '../assets/logo.svg';

const ChatBot = () => {
    const [messages, setMessages] = useState(() => {
        // Load conversation from localStorage or initialize with default messages
        const savedMessages = localStorage.getItem('chatMessages');
        return savedMessages ? JSON.parse(savedMessages) : [];
    });

    const [input, setInput] = useState("");

    // Save messages to localStorage every time they change
    useEffect(() => {
        localStorage.setItem('chatMessages', JSON.stringify(messages));
    }, [messages]);

    const handleSendMessage = async () => {
        if (input.trim()) {
            const userMessage = { text: input, sender: "user" };
            setMessages(prevMessages => [...prevMessages, userMessage]);
            setInput("");

            // Send message to the backend
            try {
                const response = await fetch('http://localhost:8000/api/chat/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ input_text: input }),
                });

                const data = await response.json();
                const botMessage = { text: data.response, sender: "bot" };

                // Add bot response to messages
                setMessages(prevMessages => [...prevMessages, botMessage]);
            } catch (error) {
                console.error("Error communicating with chatbot:", error);
            }
        }
    };

    return (
        <>
            <Navbar />
            <div className="chatbot-container">
                <div className="messages-container">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}`}>
                            <div className="logo-placeholder">NW</div>
                            <p>{msg.text}</p>
                        </div>
                    ))}
                </div>
                <div className="input-container">
                    <input
                        type="text"
                        placeholder="How can I help you?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage}>Send</button>
                </div>
            </div>
        </>
    );
};

// Navbar Component
const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="logo"><img src={Logo}/></div>
            <div className="nav-links">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/analytics">Analytics</Link>
                <Link to="/topology">Topology</Link>
                <Link to="/chatBot">ChatBot</Link>
            </div>
            <div className="profile-icon"><img src={profile_pic}  /></div>
        </nav>
    );
};

export default ChatBot;