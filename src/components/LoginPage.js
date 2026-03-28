import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Sequence Diagram: POST /api/auth/login {username, password}
            const response = await axios.post('http://localhost:8080/api/auth/login', credentials);
            
            if (response.status === 200) {
                // Activity Diagram: Generate and store Session Token (JWT)
                const token = response.data.token;
                localStorage.setItem('token', token);
                
                // Activity Diagram: Redirect to Dashboard
                navigate('/dashboard');
            }
        } catch (err) {
            // Activity Diagram: Show authentication error
            setError('Invalid username or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.pageContainer}>
            <div style={styles.backgroundOverlay}></div>
            <div style={styles.container}>
                <div style={styles.card}>
                    <div style={styles.header}>
                        <div style={styles.iconContainer}>
                            <svg style={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
                            </svg>
                        </div>
                        <h1 style={styles.title}>Welcome to AnniMemo</h1>
                        <p style={styles.subtitle}>Organize and monitor your pet's health</p>
                    </div>
                    
                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Enter your username"
                                value={credentials.username}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <input
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>
                        
                        {error && (
                            <div style={styles.errorContainer}>
                                <span style={styles.errorIcon}>⚠️</span>
                                <p style={styles.error}>{error}</p>
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            style={{
                                ...styles.button,
                                opacity: isLoading ? 0.7 : 1,
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                    
                    <div style={styles.footer}>
                        <p style={styles.footerText}>
                            Don't have an account? {' '}
                            <a href="/register" style={styles.link}>Register here</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Modern styling for the UI
const styles = {
    pageContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative',
        overflow: 'hidden'
    },
    backgroundOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
    },
    container: {
        width: '100%',
        maxWidth: '450px',
        padding: '20px',
        position: 'relative',
        zIndex: 1
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        animation: 'slideIn 0.5s ease-out'
    },
    header: {
        textAlign: 'center',
        marginBottom: '32px'
    },
    iconContainer: {
        width: '80px',
        height: '80px',
        margin: '0 auto 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
    },
    icon: {
        width: '40px',
        height: '40px',
        color: 'white'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1a202c',
        margin: '0 0 8px 0',
        letterSpacing: '-0.5px'
    },
    subtitle: {
        fontSize: '15px',
        color: '#718096',
        margin: 0,
        fontWeight: '400'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: '4px'
    },
    input: {
        padding: '14px 16px',
        fontSize: '15px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0',
        backgroundColor: '#f7fafc',
        transition: 'all 0.3s ease',
        outline: 'none',
        fontFamily: 'inherit',
        color: '#2d3748'
    },
    button: {
        padding: '16px',
        fontSize: '16px',
        fontWeight: '600',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        marginTop: '8px',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        fontFamily: 'inherit'
    },
    errorContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#fff5f5',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #feb2b2'
    },
    errorIcon: {
        fontSize: '18px'
    },
    error: {
        color: '#c53030',
        fontSize: '14px',
        margin: 0,
        fontWeight: '500'
    },
    footer: {
        marginTop: '28px',
        textAlign: 'center'
    },
    footerText: {
        fontSize: '15px',
        color: '#718096',
        margin: 0
    },
    link: {
        color: '#667eea',
        textDecoration: 'none',
        fontWeight: '600',
        transition: 'color 0.2s ease'
    }
};

// Add CSS for hover effects and animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    input:focus {
        border-color: #667eea !important;
        background-color: white !important;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
    }
    
    button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
    }
    
    button:active:not(:disabled) {
        transform: translateY(0);
    }
    
    a:hover {
        color: #5a67d8 !important;
        text-decoration: underline !important;
    }
`;
document.head.appendChild(styleSheet);

export default LoginPage;