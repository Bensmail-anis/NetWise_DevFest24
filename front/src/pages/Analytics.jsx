import { useState, useEffect } from 'react';
import Logo from "../assets/logo.svg";
import './Dashboard.css';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Link } from 'react-router-dom';
import profile_pic from '../assets/Vector.png';

const Analytics = () => {
    // State to control the modal visibility
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reportInput, setReportInput] = useState("");
    const [chatInput, setChatInput] = useState("");
    const token = sessionStorage.getItem('token'); 

    const [data, setData] = useState({
        labels: ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm'],
        datasets: [
            {
                label: 'Number of users',
                data: [50, 100, 200, 300, 150, 150, 250, 350],
                fill: true,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.2)',
                tension: 0.4,
            },
        ],
    });

    useEffect(() => {
        // Récupérer les données des clients connectés par heure
        const fetchClientsConnectedPerHour = async () => {
            try {
                const response = await fetch('http://localhost:5000/dashboard/clients-connected-per-hour', {
                    method: 'GET',
                    headers: {
                        'Authorization': `${token}`,
                    },
                });
                const connectedClientsByHour = await response.json();

                // Transformer les données pour le graphique
                const labels = [];
                const counts = [];

                connectedClientsByHour.forEach(item => {
                    labels.push(`${item._id}h`); // Formater l'heure
                    counts.push(item.count); // Compter les clients
                });

                // Mettre à jour l'état des données pour le graphique
                setData({
                    labels,
                    datasets: [
                        {
                            label: 'Number of users',
                            data: counts,
                            fill: true,
                            borderColor: '#4CAF50',
                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                            tension: 0.4,
                        },
                    ],
                });
            } catch (error) {
                console.error('Error fetching clients connected per hour:', error);
            }
        };

        fetchClientsConnectedPerHour();
    }, []); // Ajouter token à la liste des dépendances
    

    // Chart options
    const options = {
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    // Function to open the modal
    const openModal = () => {
        setIsModalOpen(true);
    };

    // Function to close the modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Function to handle the report submission to the backend
    const handleReportSubmit = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/download-report/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: reportInput }), // Send the report input to the backend
            });

            // Check if the response is okay
            if (response.ok) {
                // Convert the response into a Blob (binary large object)
                const blob = await response.blob();

                // Create a link element to trigger the download
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;

                // Optional: Set the download file name (you can customize this)
                a.download = 'report.pdf';

                // Append the link to the body, trigger the click event, then remove the link
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                // Optionally, show a success message
                alert("Report downloaded successfully!");
            } else {
                // Handle error
                const data = await response.json();
                console.error("Error generating report:", data);
            }
        } catch (error) {
            console.error("Error submitting report:", error);
        }

        setIsModalOpen(false);  // Close the modal after submission
        setReportInput("");  // Clear the input field after submission
    };

    // Function to send a message to the chatbot
    const handleChatSubmit = async () => {
        console.log(chatInput)
        try {
            const response = await fetch('http://localhost:8000/api/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input_text: chatInput }), // Send the chat input to the backend
            });

            const data = await response.json();
            if (response.ok) {
                // Display the chatbot's response
                console.log("Chatbot response:", data.response);
                alert("Chatbot says: " + data.response);
            } else {
                // Handle error
                console.error("Error communicating with chatbot:", data);
            }
        } catch (error) {
            console.error("Error:", error);
        }

        setChatInput("");  // Clear the chat input after sending
    };

    return (
        <>
            <Navbar/>
            <div className="container">
                <div className="content">
                    <h2>Network Evaluation</h2>
                    <div className="tab-menu">
                        <button className="tab-btn active">Traffic Analytics</button>
                        <button className="tab-btn">Network Performance</button>
                    </div>

                    <div className="graph-section">
                        <h3>Graph description</h3>
                        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                            labore et dolore magna aliqua.</p>

                        <div className="chart-container" style={{width: '1200px', height: '650px'}}>
                            <Line data={data} options={options}/>
                        </div>
                    </div>

                    <button className="report-btn" onClick={openModal}>Make a report</button>
                </div>
            </div>

            {/* Modal Section */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-btn" onClick={closeModal}>&times;</span>
                        <h3>Generate a Report</h3>
                        <input
                            type="text"
                            value={reportInput}
                            onChange={(e) => setReportInput(e.target.value)}
                            placeholder="Enter report details"
                        />
                        <button onClick={handleReportSubmit}>Send Report</button>
                    </div>
                </div>
            )}

            {/* Chatbot Section */}
            <div className="chat-section">
                <h3>Chat with the Bot</h3>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask the chatbot"
                />
                <button onClick={handleChatSubmit}>Send to Chatbot</button>
            </div>
        </>
    );
};

// Navbar component remains unchanged
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
            <div className="profile-icon"><img src={profile_pic} /></div>
        </nav>
    );
};

export default Analytics;
