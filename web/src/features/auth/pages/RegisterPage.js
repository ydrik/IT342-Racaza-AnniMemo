import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PASSWORD_RULES = [
    {
        key: 'length',
        label: '12 to 100 characters',
        test: (password) => password.length >= 12 && password.length <= 100
    },
    {
        key: 'uppercase',
        label: 'At least one uppercase letter',
        test: (password) => /[A-Z]/.test(password)
    },
    {
        key: 'lowercase',
        label: 'At least one lowercase letter',
        test: (password) => /[a-z]/.test(password)
    },
    {
        key: 'number',
        label: 'At least one number',
        test: (password) => /\d/.test(password)
    },
    {
        key: 'special',
        label: 'At least one special character',
        test: (password) => /[^A-Za-z0-9]/.test(password)
    },
    {
        key: 'noSpaces',
        label: 'No spaces',
        test: (password) => !/\s/.test(password)
    }
];

const getPasswordStrength = (password) => {
    const passedRules = PASSWORD_RULES.filter((rule) => rule.test(password)).length;

    if (!password) {
        return { label: 'Not entered', color: '#718096' };
    }
    if (passedRules <= 2) {
        return { label: 'Weak', color: '#e53e3e' };
    }
    if (passedRules <= 4) {
        return { label: 'Moderate', color: '#dd6b20' };
    }
    if (passedRules === 5) {
        return { label: 'Strong', color: '#2b6cb0' };
    }
    return { label: 'Very Strong', color: '#2f855a' };
};

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        email: ''
    });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'error' or 'success'
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const passwordChecks = PASSWORD_RULES.map((rule) => ({
        ...rule,
        passed: rule.test(formData.password)
    }));
    const passwordStrength = getPasswordStrength(formData.password);
    const isPasswordValid = passwordChecks.every((rule) => rule.passed);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setMessageType('');

        if (!isPasswordValid) {
            setMessage('Password does not meet the required password policy.');
            setMessageType('error');
            return;
        }

        setIsLoading(true);

        const payload = {
            username: formData.username.trim(),
            password: formData.password,
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim()
        };

        try {
            const response = await axios.post('http://localhost:8080/api/auth/register', payload);
            
            if (response.status === 201 || response.status === 200) {
                // Activity Diagram: 201 Created -> Redirect to Login
                setMessage('Registration successful! Redirecting to login...');
                setMessageType('success');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        } catch (err) {
            const validationErrors = err.response?.data;
            if (validationErrors && typeof validationErrors === 'object' && !validationErrors.message) {
                setMessage(Object.values(validationErrors).join(' '));
            } else {
                setMessage(err.response?.data?.message || 'Registration failed. Please review your input and try again.');
            }
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
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    placeholder="Create a password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength="12"
                                    style={{ ...styles.input, width: '100%', boxSizing: 'border-box', paddingRight: '48px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0
                                    }}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {formData.password && (
                                <>
                                    <div style={styles.passwordSummary}>
                                        <span style={styles.hint}>Password strength:</span>
                                        <span style={{ ...styles.passwordStrength, color: passwordStrength.color }}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div style={styles.passwordChecklist}>
                                        {passwordChecks.map((rule) => (
                                            <div key={rule.key} style={styles.passwordRuleRow}>
                                                <span style={{ ...styles.passwordRuleIcon, color: rule.passed ? '#2f855a' : '#c53030' }}>
                                                    {rule.passed ? '✓' : '✗'}
                                                </span>
                                                <span style={{ ...styles.passwordRuleText, color: rule.passed ? '#2f855a' : 'var(--text-muted)' }}>
                                                    {rule.label}
                                                </span>
                                            </div>
                                        ))}
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
                            disabled={isLoading || !isPasswordValid}
                            style={{
                                ...styles.button,
                                opacity: isLoading || !isPasswordValid ? 0.7 : 1,
                                cursor: isLoading || !isPasswordValid ? 'not-allowed' : 'pointer'
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
    hint: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        marginTop: '4px'
    },
    passwordSummary: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
    },
    passwordStrength: {
        fontSize: '12px',
        fontWeight: '700'
    },
    passwordChecklist: {
        display: 'grid',
        gap: '6px',
        padding: '12px',
        borderRadius: '12px',
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        border: '1px solid rgba(102, 126, 234, 0.14)'
    },
    passwordRuleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    passwordRuleIcon: {
        fontSize: '12px',
        fontWeight: '700'
    },
    passwordRuleText: {
        fontSize: '12px'
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