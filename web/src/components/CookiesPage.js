import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const CookiesPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Keep page mounted even when authenticated
    }, []);

    const handleBackClick = () => {
        const token = localStorage.getItem('token');
        navigate(token ? '/dashboard' : '/');
    };

    const styles = {
        pageContainer: {
            minHeight: '100vh',
            background: 'var(--app-bg)',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        },
        container: {
            maxWidth: '900px',
            margin: '0 auto',
            padding: '40px 20px'
        },
        header: {
            marginBottom: '40px'
        },
        backButton: {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '16px',
            padding: '10px 20px',
            fontWeight: '600',
            borderRadius: '20px',
            transition: 'all 0.3s ease',
            display: 'inline-block'
        },
        title: {
            fontSize: '42px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '10px 0'
        },
        card: {
            backgroundColor: 'var(--card-bg)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: 'var(--shadow-strong)',
            marginBottom: '30px',
            animation: 'slideUp 0.5s ease-out',
            lineHeight: '1.8',
            color: 'var(--text-secondary)'
        },
        section: {
            marginBottom: '30px'
        },
        sectionTitle: {
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '15px',
            paddingBottom: '10px',
            borderBottom: '2px solid var(--accent)'
        },
        paragraph: {
            fontSize: '15px',
            lineHeight: '1.8',
            marginBottom: '15px',
            color: 'var(--text-secondary)'
        },
        list: {
            fontSize: '15px',
            lineHeight: '1.8',
            marginLeft: '20px',
            color: 'var(--text-secondary)'
        },
        listItem: {
            marginBottom: '10px'
        }
    };

    return (
        <div style={styles.pageContainer}>
            <Header />
            <div style={styles.container}>
                <div style={styles.header}>
                    <button
                        onClick={handleBackClick}
                        style={styles.backButton}
                    >
                        {localStorage.getItem('token') ? '← Back to Dashboard' : '← Back to Home'}
                    </button>
                    <h1 style={styles.title}>Cookie Policy</h1>
                </div>

                <div style={styles.card}>
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>What Are Cookies?</h2>
                        <p style={styles.paragraph}>
                            Cookies are small pieces of data stored on your browser or device. They help websites and applications remember information about you, such as your login status, preferences, and browsing history.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>How AnniMemo Uses Cookies</h2>
                        <p style={styles.paragraph}>
                            We use cookies and similar tracking technologies to track activity on our service and hold certain information. We use cookies for the following purposes:
                        </p>
                        <ul style={styles.list}>
                            <li style={styles.listItem}><strong>Authentication</strong>: To keep you logged in securely</li>
                            <li style={styles.listItem}><strong>Preferences</strong>: To remember your theme (light/dark mode) and other settings</li>
                            <li style={styles.listItem}><strong>Analytics</strong>: To understand how users interact with our service</li>
                            <li style={styles.listItem}><strong>Performance</strong>: To optimize page loading and functionality</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Types of Cookies</h2>
                        <ul style={styles.list}>
                            <li style={styles.listItem}><strong>Session Cookies</strong>: Deleted when you close your browser</li>
                            <li style={styles.listItem}><strong>Persistent Cookies</strong>: Remain on your device until you delete them</li>
                            <li style={styles.listItem}><strong>First-party Cookies</strong>: Set by AnniMemo</li>
                            <li style={styles.listItem}><strong>Third-party Cookies</strong>: Set by other services we use</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Managing Cookies</h2>
                        <p style={styles.paragraph}>
                            You can control cookies through your browser settings. Most browsers allow you to refuse cookies or alert you when cookies are being sent. However, blocking cookies may affect the functionality of AnniMemo.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Contact Us</h2>
                        <p style={styles.paragraph}>
                            If you have any questions about our Cookie Policy, please contact us at: support@annimemo.com
                        </p>
                    </div>

                    <p style={{...styles.paragraph, fontSize: '12px', marginTop: '30px', borderTop: '1px solid var(--card-border)', paddingTop: '20px'}}>
                        Last updated: February 2026
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default CookiesPage;
