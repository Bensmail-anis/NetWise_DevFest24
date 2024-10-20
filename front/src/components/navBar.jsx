// Navbar Component
import './navBar.css';
import Logo from '../assets/logo-notext.png';
const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="logo"><img src={Logo} className='logo-img'/></div>
            <div className="nav-links">
                <a href="#dashboard">Dashboard</a>
                <a href="#analytics">Analytics</a>
                <a href="#topology">Topology</a>
                <a href="#chatbot">ChatBot</a>
            </div>
            <div className="profile-icon">
                <img src="https://via.placeholder.com/40" alt="Profile" className="profile-img" />
            </div>
        </nav>
    );
};

export default Navbar;