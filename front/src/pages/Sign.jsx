import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sign.css';
import logo from '../assets/logo.png';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate(); 

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        console.log(formData); // Log form data for debugging

        try {
            // Make a POST request to sign in the user
            const response = await fetch("http://localhost:5000/signIn", { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData), // Send form data as JSON
            });

            const data = await response.json(); // Parse the response from the server

            if (response.ok) {
                // Store the access token in sessionStorage
                sessionStorage.setItem('token', data.token);
                // Redirect to the chat page upon successful sign-in
                navigate("/Dashboard");
            }
        } catch (error) {
            // Log any error that occurs during the fetch request
            console.error("Error during fetch: ", error);
        }
    };

    return (
        <div className='signin_page'>
            <div className="login-container">
                <div className="logo-container">
                    <img src={logo} alt="Logo" />
                </div>

                <div className="login-container">
                    <div className="login-box">
                        <h3>Sign in</h3>
                        <p>Please sign in to continue to your account.</p>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email" // Use name attribute
                                    value={formData.email} // Bind value to formData
                                    onChange={handleInputChange} // Handle input change
                                    placeholder="etudiant@estin@dz"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <div className="password-container">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password" // Use name attribute
                                        value={formData.password} // Bind value to formData
                                        onChange={handleInputChange} // Handle input change
                                        placeholder="Password"
                                        required
                                    />
                                    <span
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '🙈' : '👁️'}
                                    </span>
                                </div>
                            </div>
                            <button type="submit" className="login-btn">Sign in</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
