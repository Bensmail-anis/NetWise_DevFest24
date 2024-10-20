
import './App.css'
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from "./pages/Dashboard.jsx";
import ChatBot from "./pages/ChatBot.jsx";
import Analytics from "./pages/Analytics.jsx";
import Topology from "./pages/Topology.jsx";
import Login from "./pages/Sign.jsx";


function App() {

  return (
    <div>
         <Router>
            <Routes>
                <Route path="/" element={<Login />} /> {/* Login page */}
                <Route path="/dashboard" element={<Dashboard />} /> {/* Dashboard page */}
                <Route path="/chatBot" element={<ChatBot />} /> {/* ChatBot page */}
                <Route path="/topology" element={<Topology />} /> {/* toppology page */}
                <Route path="/analytics" element={<Analytics />} /> {/* Analytics page */}
            </Routes>
        </Router>
    </div>
  )
}

export default App
