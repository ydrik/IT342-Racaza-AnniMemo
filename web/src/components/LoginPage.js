import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

const LoginPage = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
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
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials);
            
            if (response.status === 200) {
                // Activity Diagram: Generate and store Session Token (JWT)
                const token = response.data.token;
                localStorage.setItem('token', token);
                
                // Activity Diagram: Redirect to Dashboard
                navigate('/dashboard');
            }
        } catch (err) {
            // Activity Diagram: Show authentication error
            setError('Invalid username/email or password. Please try again.');
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
                            <label style={styles.label}>Email or Username</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Enter your email or username"
                                value={credentials.username}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>
                        
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <div style={styles.passwordWrapper}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={credentials.password}
                                    onChange={handleChange}
                                    required
                                    style={{ ...styles.input, ...styles.passwordInput }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    style={styles.passwordToggleBtn}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    <svg style={styles.eyeIcon} viewBox="0 0 24 24" fill="currentColor">
                                        {showPassword ? (
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                                        ) : (
                                            <path d="M11.83 9L15.23 12.39c.75-1.48.75-2.74.75-2.74s0-2.5-1.41-4.01C13.53 5 11.46 5 11.46 5L11.83 9zM2 4.27l2.21 2.21c.44.44 1.08.66 1.72.66.66 0 1.3-.22 1.75-.66l2.06 2.06c-.33.11-.66.23-.98.35l2.15 2.15c.25-.08.5-.16.74-.25l2.06 2.06c-.98 1.06-2.39 1.7-3.98 1.7-2.76 0-5-2.24-5-5 0-1.59.64-3 1.7-3.98L2 4.27zM12 4.5c-2.76 0-5 2.24-5 5 0 .65.13 1.29.36 1.85l2.21 2.21c.7.5 1.55.82 2.47.82 2.76 0 5-2.24 5-5 0-.91-.32-1.77-.82-2.47l-2.22-2.21c-.56-.23-1.2-.36-1.85-.36z" />
                                        )}
                                    </svg>
                                </button>
                            </div>
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
        background: 'var(--app-bg)',
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
        backgroundColor: 'var(--card-bg)',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: 'var(--shadow-strong)',
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
        color: 'var(--text-primary)',
        margin: '0 0 8px 0',
        letterSpacing: '-0.5px'
    },
    subtitle: {
        fontSize: '15px',
        color: 'var(--text-muted)',
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
        color: 'var(--text-secondary)',
        marginBottom: '4px'
    },
    input: {
        padding: '14px 16px',
        fontSize: '15px',
        borderRadius: '12px',
        border: '2px solid var(--card-border)',
        backgroundColor: 'var(--surface)',
        transition: 'all 0.3s ease',
        outline: 'none',
        fontFamily: 'inherit',
        color: 'var(--text-primary)'
    },
    passwordWrapper: {
        position: 'relative',
        width: '100%'
    },
    passwordInput: {
        paddingRight: '45px',
        width: '100%',
        boxSizing: 'border-box'
    },
    passwordToggleBtn: {
        position: 'absolute',
        right: '0',
        top: '0',
        bottom: '0',
        border: 'none',
        background: 'transparent',
        color: '#5a67d8',
        cursor: 'pointer',
        padding: '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    eyeIcon: {
        width: '18px',
        height: '18px'
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
        color: 'var(--text-muted)',
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