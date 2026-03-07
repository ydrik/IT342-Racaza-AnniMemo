import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage = () => {
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
            padding: '40px 20px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        },
        container: {
            maxWidth: '900px',
            margin: '0 auto'
        },
        header: {
            marginBottom: '40px'
        },
        backButton: {
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '10px 0',
            fontWeight: '500',
            marginBottom: '20px'
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
            <div style={styles.container}>
                <div style={styles.header}>
                    <button
                        onClick={handleBackClick}
                        style={styles.backButton}
                        onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        ← Back to Home
                    </button>
                    <h1 style={styles.title}>Privacy Policy</h1>
                </div>

                <div style={styles.card}>
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Introduction</h2>
                        <p style={styles.paragraph}>
                            AnniMemo ("we", "us", "our", or "Company") operates the AnniMemo website and mobile application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Information Collection and Use</h2>
                        <p style={styles.paragraph}>
                            We collect several different types of information for various purposes to provide and improve our service to you.
                        </p>
                        <ul style={styles.list}>
                            <li style={styles.listItem}><strong>Account Information</strong>: Name, email address, and password</li>
                            <li style={styles.listItem}><strong>Pet Information</strong>: Pet names, species, breed, and health records</li>
                            <li style={styles.listItem}><strong>Profile Information</strong>: Profile photos and personal preferences</li>
                            <li style={styles.listItem}><strong>Usage Data</strong>: Browser type, IP address, pages visited, and time spent</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Security of Data</h2>
                        <p style={styles.paragraph}>
                            The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Contact Us</h2>
                        <p style={styles.paragraph}>
                            If you have any questions about this Privacy Policy, please contact us at: support@annimemo.com
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

export default PrivacyPage;
