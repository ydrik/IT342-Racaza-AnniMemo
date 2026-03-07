import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <header style={styles.header}>
                    <div style={styles.badge}>🐾 Pet Health Management</div>
                    <h1 style={styles.title}>Welcome to <span style={styles.brandName}>AnniMemo</span></h1>
                    <p style={styles.subtitle}>Your centralized digital workspace for pet health management</p>
                </header>

                <main style={styles.mainContent}>
                    <section style={styles.featuresCard}>
                        <h3 style={styles.featuresTitle}>What you can do:</h3>
                        <ul style={styles.featuresList}>
                            <li style={styles.featureItem}>
                                <span style={styles.featureIcon}>🐕</span>
                                <span>Manage detailed pet profiles</span>
                            </li>
                            <li style={styles.featureItem}>
                                <span style={styles.featureIcon}>💉</span>
                                <span>Log health metrics like weight and vaccines</span>
                            </li>
                            <li style={styles.featureItem}>
                                <span style={styles.featureIcon}>🥗</span>
                                <span>Monitor nutrition and daily activities</span>
                            </li>
                            <li style={styles.featureItem}>
                                <span style={styles.featureIcon}>📊</span>
                                <span>View a dashboard of recent pet activities</span>
                            </li>
                        </ul>
                    </section>

                    <div style={styles.buttonGroup}>
                        <Link to="/login" style={styles.linkStyle}>
                            <button style={styles.loginButton} 
                                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                                Login
                            </button>
                        </Link>
                        <Link to="/register" style={styles.linkStyle}>
                            <button style={styles.registerButton}
                                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                                Register
                            </button>
                        </Link>
                    </div>
                </main>

            </div>
        </div>
    );
};

const styles = {
    container: { 
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: '20px'
    },
    content: {
        maxWidth: '800px',
        width: '100%'
    },
    header: { 
        textAlign: 'center',
        marginBottom: '40px',
        animation: 'fadeInDown 0.8s ease-out'
    },
    badge: {
        display: 'inline-block',
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-primary)',
        padding: '8px 20px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '20px',
        backdropFilter: 'blur(10px)'
    },
    title: {
        fontSize: '48px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '20px 0',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    brandName: {
        background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    subtitle: {
        fontSize: '18px',
        color: 'var(--text-muted)',
        fontWeight: '300',
        lineHeight: '1.6'
    },
    mainContent: { 
        textAlign: 'center'
    },
    featuresCard: { 
        backgroundColor: 'var(--card-bg)',
        padding: '40px',
        borderRadius: '20px',
        marginBottom: '40px',
        boxShadow: 'var(--shadow-strong)',
        animation: 'fadeInUp 0.8s ease-out',
        backdropFilter: 'blur(10px)'
    },
    featuresTitle: {
        fontSize: '24px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        marginBottom: '25px',
        textAlign: 'left'
    },
    featuresList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        textAlign: 'left'
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '15px 0',
        fontSize: '16px',
        color: 'var(--text-secondary)',
        borderBottom: '1px solid var(--card-border)',
        transition: 'all 0.3s ease'
    },
    featureIcon: {
        fontSize: '24px',
        marginRight: '15px',
        minWidth: '30px'
    },
    buttonGroup: { 
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        flexWrap: 'wrap',
        animation: 'fadeInUp 1s ease-out'
    },
    linkStyle: {
        textDecoration: 'none'
    },
    loginButton: { 
        padding: '15px 40px',
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 10px 30px rgba(17, 153, 142, 0.4)',
        transition: 'all 0.3s ease',
        minWidth: '150px'
    },
    registerButton: { 
        padding: '15px 40px',
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 10px 30px rgba(79, 172, 254, 0.4)',
        transition: 'all 0.3s ease',
        minWidth: '150px'
    },
    
};

export default LandingPage;