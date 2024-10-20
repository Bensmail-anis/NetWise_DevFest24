import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import './Topology.css';
import Logo from "../assets/logo.svg";
import profile_pic from '../assets/Vector.png';
import { Link } from 'react-router-dom';

const Topology = () => {
    const [connectedUsers, setConnectedUsers] = useState([]);

    useEffect(() => {
        const fetchConnectedUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/dashboard/connected', {
                    method: 'GET',
                    headers: {
                        'Authorization': `${sessionStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const users = await response.json();
                setConnectedUsers(users);
            } catch (error) {
                console.error('Error fetching connected users:', error);
            }
        };

        fetchConnectedUsers();
    }, []);

    return (
        <div className="container">
            <Navbar />

            <div className="content">
                <h2>Topology</h2>
                <div className="topology-container">
                    <div className="topology-node central-node">
                        <img src="https://img.icons8.com/ios-filled/50/4CAF50/home.png" alt="central" />
                    </div>

                    <div className="line-vertical"></div>
                    <div className="line-horizontal">
                        <div className="horizontal-line-left"></div>
                        <div className="horizontal-line-right"></div>
                    </div>

                    <div className="topology-connection">
                        {connectedUsers.map(user => (
                            <div className="child-node" key={user._id}>
                                <img src="https://img.icons8.com/ios-filled/50/000000/user.png" alt="client" />
                                
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="logo"><img src={Logo} /></div>
            <div className="nav-links">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/analytics">Analytics</Link>
                <Link to="/topology">Topology</Link>
                <Link to="/chatBot">ChatBot</Link>
            </div>
            <div className="profile-icon"><img src={profile_pic} /></div>
        </nav>
    );
};

export default Topology;
