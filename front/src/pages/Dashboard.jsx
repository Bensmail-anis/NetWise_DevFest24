import { useState, useEffect } from "react";
import Logo from '../assets/logo-notext.png';
import { NavLink } from 'react-router-dom';
import io from "socket.io-client";



import profile_pic from '../assets/Vector.png'

/*import NavBar from '../components/navBar.jsx';*/
import "./Dashboard.css";

// Sample data for network tracking
const initialData = [
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    { clientId: "4736829", time: "8:00 pm", requestedBw: "15 Mb/s", allocatedBw: "20 Mb/s", connected: true },
    // Add more data entries as needed
];


const Dashboard = () => {
    const [clients, setClients] = useState(initialData);
    // Récupérer le token d'authentification (par exemple, depuis le localStorage)
    const token = sessionStorage.getItem('token'); // Assurez-vous que c'est le bon chemin pour récupérer votre token

    // Se connecter au serveur Socket.IO avec le token
    const socket = io('http://localhost:5000', {
        auth: { token: token }
    });

    useEffect(() => {
        // Écouter l'événement pour les nouvelles données de bande passante
        socket.on("newBandwidth", (newBandwidth) => {
            setClients((prevData) => [...prevData, newBandwidth]);
        });

        // Écouter l'événement pour obtenir toutes les données existantes
        socket.on("bandwidthData", (data) => {
            console.log(data)
            setClients(data);
        });

        // Nettoyer l'écouteur lors de la destruction du composant
        return () => {
            socket.off("newBandwidth");
            socket.off("bandwidthData");
        };
    }, [socket]); // Ajoutez socket à la liste des dépendances
     

    const handleConnect = async(client) => {
            console.log(client.id_client._id)
            const response = await fetch(`http://localhost:5000/dashboard/${client.id_client._id}/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${sessionStorage.getItem('token')}`
                },
            });

            const data = await response.json(); // Parse the response from the server

            if (response.ok) {
                window.location.reload();            
            }
        }

    const handleDisconnect = (index) => {
        const updatedClients = [...clients];
        updatedClients[index].connected = false;
        setClients(updatedClients);
    };

    const handleAdjustBandwidth = async (client) => {
        const newBandwidth = prompt("Enter new bandwidth (e.g., 25 Mb/s):");
        const maxBandwidth = parseFloat(newBandwidth);  // Convertir la chaîne en nombre flottant
        console.log
        if (newBandwidth) {
            console.log(client.id_client._id)
            const response = await fetch(`http://localhost:5000/dashboard/${client.id_client._id}/maxClient`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${sessionStorage.getItem('token')}`
                },
                body: JSON.stringify({ max: maxBandwidth }) // Send form data as JSON
            });

            const data = await response.json(); // Parse the response from the server

            if (response.ok) {
                window.location.reload();            
            }
        }
    };

    return (
        <>
            <Navbar />
            <div class="bg-white w-full " className="dashboard-container" >
                <div className="title" ><h1 className="dashboard-title" style={{color:"white"}}>Network Tracking</h1></div>
                <div className="table-color"><table className="dashboard-table">
                    <thead>
                    <tr>
                        <th>Client ID</th>
                        <th>Time</th>
                        <th>Requested bw</th>
                        <th>Allocated bw</th>
                        <th>Control Panel</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clients.map((client, index) => (
                        <tr key={index}>
                            <td>{client.id_client ? client.id_client._id : 'ID not available'}</td>
                            <td>{new Date(client.timestamp).toLocaleString()}</td>
                            <td>{client.want}</td>
                            <td>{client.get}</td>
                            <td>
                                {client.id_client && client.id_client.connected === false ? (
                                    <button className="button disconnect">
                                        Disconnect
                                    </button>
                                ) : (
                                    <button className="button connect" onClick={() => handleConnect(client)}>
                                        Connect
                                    </button>
                                )}
                                <button className="button adjust" onClick={() => handleAdjustBandwidth(client)}>
                                    Adjust Bw
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>
        </>
    );
};

// Navbar Component
const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="logo"><img src={Logo} className='logo-img' /></div>
            <div className="nav-links">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/analytics"
                    className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                    Analytics
                </NavLink>
                <NavLink
                    to="/topology"
                    className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                    Topology
                </NavLink>
                <NavLink
                    to="/chatBot"
                    className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                    ChatBot
                </NavLink>
            </div>
            <div className="profile-icon"><img src={profile_pic} /></div>
        </nav>
    );
};

export default Dashboard;