import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div style={styles.container}>
            <div style={styles.backgroundGlowTop} />
            <div style={styles.backgroundGlowBottom} />
            <div style={styles.content}>
                <header style={styles.header}>
                    <div style={styles.badge}>Pet Health Management</div>
                    <h1 style={styles.title}>Care smarter with <span style={styles.brandName}>AnniMemo</span></h1>
                    <p style={styles.subtitle}>
                        A focused, all-in-one workspace where pet owners can organize care routines,
                        track health events, and stay ahead of appointments from day one.
                    </p>
                    <div style={styles.statRow}>
                        <div style={styles.statCard}>
                            <div style={styles.statValue}>10+</div>
                            <div style={styles.statLabel}>Core modules</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statValue}>1</div>
                            <div style={styles.statLabel}>Unified dashboard</div>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statValue}>24/7</div>
                            <div style={styles.statLabel}>Care visibility</div>
                        </div>
                    </div>
                </header>

                <main style={styles.mainContent}>
                    <section style={styles.featuresCard}>
                        <h3 style={styles.featuresTitle}>What you can do in minutes:</h3>
                        <ul style={styles.featuresList}>
                            <li style={styles.featureItem}>
                                <span style={styles.featureIcon}>Profiles</span>
                                <span>Create detailed pet records with breed, notes, and image history.</span>
                            </li>
                            <li style={styles.featureItem}>
                                <span style={styles.featureIcon}>Health</span>
                                <span>Log weight, medications, vaccinations, and vet visits in one timeline.</span>
                            </li>
                            <li style={styles.featureItem}>
                                <span style={styles.featureIcon}>Reminders</span>
                                <span>Track due-soon care tasks and upcoming appointments confidently.</span>
                            </li>
                            <li style={styles.featureItem}>
                                <span style={styles.featureIcon}>Insights</span>
                                <span>Review trends and dashboard highlights to guide daily care decisions.</span>
                            </li>
                        </ul>
                    </section>

                    <section style={styles.gridSection}>
                        <article style={styles.gridCard}>
                            <h4 style={styles.gridTitle}>For first-time users</h4>
                            <p style={styles.gridText}>
                                Register once, set up your first pet profile, and immediately start adding
                                reminders and health entries.
                            </p>
                        </article>
                        <article style={styles.gridCard}>
                            <h4 style={styles.gridTitle}>For daily use</h4>
                            <p style={styles.gridText}>
                                Open the dashboard to check activity streak, due-soon alerts, and recent
                                updates without jumping across pages.
                            </p>
                        </article>
                        <article style={styles.gridCard}>
                            <h4 style={styles.gridTitle}>For better decisions</h4>
                            <p style={styles.gridText}>
                                Use health trends, breed resources, and pet facts modules to support more
                                informed care routines.
                            </p>
                        </article>
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

                    <p style={styles.bottomNote}>
                        Built for responsible pet owners who want clear, consistent, and secure care tracking.
                    </p>
                </main>

            </div>
        </div>
    );
};

const styles = {
    container: { 
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eef0f8 0%, #dde9eb 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Poppins', 'Nunito Sans', 'Segoe UI', sans-serif",
        padding: '32px 20px',
        position: 'relative',
        overflow: 'hidden'
    },
    backgroundGlowTop: {
        position: 'absolute',
        width: '460px',
        height: '460px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(42, 157, 143, 0.22) 0%, rgba(42, 157, 143, 0) 68%)',
        top: '-140px',
        left: '-90px',
        pointerEvents: 'none'
    },
    backgroundGlowBottom: {
        position: 'absolute',
        width: '520px',
        height: '520px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(38, 70, 83, 0.18) 0%, rgba(38, 70, 83, 0) 70%)',
        bottom: '-190px',
        right: '-120px',
        pointerEvents: 'none'
    },
    content: {
        maxWidth: '980px',
        width: '100%',
        position: 'relative',
        zIndex: 1
    },
    header: { 
        textAlign: 'center',
        marginBottom: '34px',
        animation: 'fadeInDown 0.8s ease-out'
    },
    badge: {
        display: 'inline-block',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: '#2f3b4a',
        padding: '8px 18px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.3px',
        marginBottom: '18px',
        border: '1px solid rgba(56, 74, 91, 0.15)'
    },
    title: {
        fontSize: 'clamp(36px, 5vw, 58px)',
        fontWeight: '700',
        color: '#102233',
        margin: '12px 0',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    brandName: {
        background: 'linear-gradient(120deg, #f6bd60 0%, #2a9d8f 48%, #264653 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    subtitle: {
        fontSize: '17px',
        color: '#4b5b6a',
        fontWeight: '400',
        lineHeight: '1.7',
        maxWidth: '760px',
        margin: '0 auto'
    },
    statRow: {
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        maxWidth: '640px',
        marginLeft: 'auto',
        marginRight: 'auto'
    },
    statCard: {
        background: 'rgba(255, 255, 255, 0.72)',
        border: '1px solid rgba(38, 70, 83, 0.15)',
        borderRadius: '14px',
        padding: '10px 12px'
    },
    statValue: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#163347'
    },
    statLabel: {
        fontSize: '12px',
        color: '#52626f'
    },
    mainContent: { 
        textAlign: 'center'
    },
    featuresCard: { 
        backgroundColor: 'rgba(255, 255, 255, 0.86)',
        padding: '34px',
        borderRadius: '22px',
        marginBottom: '18px',
        boxShadow: '0 18px 46px rgba(26, 43, 57, 0.16)',
        animation: 'fadeInUp 0.8s ease-out',
        backdropFilter: 'blur(6px)'
    },
    featuresTitle: {
        fontSize: '26px',
        fontWeight: '600',
        color: '#1f2f3d',
        marginBottom: '18px',
        textAlign: 'left'
    },
    featuresList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        textAlign: 'left'
    },
    featureItem: {
        display: 'grid',
        gridTemplateColumns: '104px 1fr',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 0',
        fontSize: '16px',
        color: '#415263',
        borderBottom: '1px solid rgba(38, 70, 83, 0.18)',
        transition: 'all 0.3s ease'
    },
    featureIcon: {
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '0.35px',
        color: '#184e60',
        backgroundColor: 'rgba(42, 157, 143, 0.14)',
        border: '1px solid rgba(42, 157, 143, 0.33)',
        borderRadius: '10px',
        padding: '7px 9px',
        textAlign: 'center'
    },
    gridSection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '30px'
    },
    gridCard: {
        background: 'rgba(255, 255, 255, 0.7)',
        border: '1px solid rgba(30, 64, 80, 0.16)',
        borderRadius: '16px',
        padding: '18px',
        textAlign: 'left'
    },
    gridTitle: {
        margin: '0 0 8px 0',
        fontSize: '16px',
        color: '#1f3445'
    },
    gridText: {
        margin: 0,
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#4d5d6b'
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
        padding: '14px 34px',
        background: 'linear-gradient(125deg, #2a9d8f 0%, #48c78e 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 12px 28px rgba(42, 157, 143, 0.35)',
        transition: 'all 0.3s ease',
        minWidth: '152px'
    },
    registerButton: { 
        padding: '14px 34px',
        background: 'linear-gradient(125deg, #264653 0%, #2c7da0 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 12px 28px rgba(33, 74, 95, 0.32)',
        transition: 'all 0.3s ease',
        minWidth: '152px'
    },
    bottomNote: {
        marginTop: '18px',
        fontSize: '13px',
        color: '#5f6e7a',
        letterSpacing: '0.15px'
    }
};

export default LandingPage;