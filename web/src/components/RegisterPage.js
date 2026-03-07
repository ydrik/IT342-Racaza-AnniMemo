import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081';

const getPasswordChecks = (password) => ({
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z\d]/.test(password),
    hasNoSpaces: !/\s/.test(password)
});

const getPasswordStrength = (checks) => {
    const passed = Object.values(checks).filter(Boolean).length;
    const percent = Math.round((passed / 6) * 100);

    if (passed <= 2) {
        return { label: 'Weak', color: '#e53e3e', percent, isValid: false };
    }

    if (passed <= 4) {
        return { label: 'Medium', color: '#dd6b20', percent, isValid: false };
    }

    if (passed === 5) {
        return { label: 'Strong', color: '#2f855a', percent, isValid: false };
    }

    return { label: 'Very Strong', color: '#276749', percent, isValid: true };
};

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'error' or 'success'
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const passwordChecks = getPasswordChecks(formData.password);
    const passwordStrength = getPasswordStrength(passwordChecks);
    const hasPasswordInput = formData.password.length > 0;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        if (!passwordStrength.isValid) {
            setMessage('Password does not meet the required strength rules.');
            setMessageType('error');
            return;
        }

        setIsLoading(true);

        try {
            // FRS Requirement: POST /api/auth/register
            const response = await axios.post(`${API_BASE_URL}/api/auth/register`, formData);
            
            if (response.status === 201 || response.status === 200) {
                // Activity Diagram: 201 Created -> Redirect to Login
                setMessage('Registration successful! Redirecting to login...');
                setMessageType('success');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        } catch (err) {
            // Show error if user already exists or server is down
            setMessage(err.response?.data?.message || 'Registration failed. Please check backend connection and try again.');
            setMessageType('error');
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
                                <path d="M15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12Z" fill="currentColor"/>
                                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 11.71 4.02 11.42 4.05 11.14C6.41 10.09 8.28 8.16 9.26 5.77C11.07 8.33 14.05 10 17.42 10C18.2 10 18.95 9.91 19.67 9.74C19.88 10.45 20 11.21 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                            </svg>
                        </div>
                        <h1 style={styles.title}>Create Account</h1>
                        <p style={styles.subtitle}>Join AnniMemo to start tracking your pet's health</p>
                    </div>

                    <form onSubmit={handleRegister} style={styles.form}>
                        <div style={styles.inputRow}>
                            <div style={{...styles.inputGroup, flex: 1}}>
                                <label style={styles.label}>First Name</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Enter first name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                    style={styles.input}
                                />
                            </div>
                            <div style={{...styles.inputGroup, flex: 1}}>
                                <label style={styles.label}>Last Name</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Enter last name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                    style={styles.input}
                                />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input
                                type="text"
                                name="username"
                                placeholder="Choose a username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
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
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="12"
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
                            <span style={styles.hint}>Minimum 12 characters</span>

                            {hasPasswordInput && (
                                <>
                                    <div style={styles.passwordMeter}>
                                        <div
                                            style={{
                                                ...styles.passwordMeterFill,
                                                width: `${passwordStrength.percent}%`,
                                                backgroundColor: passwordStrength.color
                                            }}
                                        ></div>
                                    </div>
                                    <span style={{ ...styles.passwordStrengthText, color: passwordStrength.color }}>
                                        Strength: {passwordStrength.label}
                                    </span>

                                    <div style={styles.passwordRuleList}>
                                        <span style={passwordChecks.minLength ? styles.passwordRuleMet : styles.passwordRuleUnmet}>
                                            {passwordChecks.minLength ? 'OK' : 'X'} At least 12 characters
                                        </span>
                                        <span style={passwordChecks.hasUppercase ? styles.passwordRuleMet : styles.passwordRuleUnmet}>
                                            {passwordChecks.hasUppercase ? 'OK' : 'X'} One uppercase letter
                                        </span>
                                        <span style={passwordChecks.hasLowercase ? styles.passwordRuleMet : styles.passwordRuleUnmet}>
                                            {passwordChecks.hasLowercase ? 'OK' : 'X'} One lowercase letter
                                        </span>
                                        <span style={passwordChecks.hasNumber ? styles.passwordRuleMet : styles.passwordRuleUnmet}>
                                            {passwordChecks.hasNumber ? 'OK' : 'X'} One number
                                        </span>
                                        <span style={passwordChecks.hasSpecial ? styles.passwordRuleMet : styles.passwordRuleUnmet}>
                                            {passwordChecks.hasSpecial ? 'OK' : 'X'} One special character
                                        </span>
                                        <span style={passwordChecks.hasNoSpaces ? styles.passwordRuleMet : styles.passwordRuleUnmet}>
                                            {passwordChecks.hasNoSpaces ? 'OK' : 'X'} No spaces
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        {message && (
                            <div style={messageType === 'error' ? styles.errorContainer : styles.successContainer}>
                                <span style={styles.messageIcon}>
                                    {messageType === 'error' ? '⚠️' : '✅'}
                                </span>
                                <p style={messageType === 'error' ? styles.error : styles.success}>
                                    {message}
                                </p>
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
                            {isLoading ? 'Creating Account...' : 'Register'}
                        </button>
                    </form>

                    <div style={styles.footer}>
                        <p style={styles.footerText}>
                            Already have an account? {' '}
                            <a href="/login" style={styles.link}>Login here</a>
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
        maxWidth: '520px',
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
    inputRow: {
        display: 'flex',
        gap: '16px'
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
    hint: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginTop: '4px'
    },
    passwordMeter: {
        height: '8px',
        backgroundColor: '#e2e8f0',
        borderRadius: '999px',
        overflow: 'hidden',
        marginTop: '8px'
    },
    passwordMeterFill: {
        height: '100%',
        width: '0%',
        transition: 'width 0.25s ease, background-color 0.25s ease'
    },
    passwordStrengthText: {
        fontSize: '12px',
        fontWeight: '600',
        marginTop: '6px'
    },
    passwordRuleList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginTop: '8px'
    },
    passwordRuleMet: {
        fontSize: '12px',
        color: '#2f855a',
        fontWeight: '500'
    },
    passwordRuleUnmet: {
        fontSize: '12px',
        color: '#a0aec0',
        fontWeight: '500'
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
    successContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: '#f0fff4',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #9ae6b4'
    },
    messageIcon: {
        fontSize: '18px'
    },
    error: {
        color: '#c53030',
        fontSize: '14px',
        margin: 0,
        fontWeight: '500'
    },
    success: {
        color: '#22543d',
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

export default RegisterPage;