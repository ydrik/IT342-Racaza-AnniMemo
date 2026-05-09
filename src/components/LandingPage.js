import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1>Welcome to AnniMemo</h1>
                <p>Your centralized digital workspace for pet health management.</p>
            </header>

            <main style={styles.mainContent}>
                <section style={styles.features}>
                    <h3>What you can do:</h3>
                    <ul>
                        <li>Manage detailed pet profiles [cite: 63, 92]</li>
                        <li>Log health metrics like weight and vaccines [cite: 63, 93]</li>
                        <li>Monitor nutrition and daily activities [cite: 60]</li>
                        <li>View a dashboard of recent pet activities [cite: 94]</li>
                    </ul>
                </section>

                <div style={styles.buttonGroup}>
                    {/* Entry points for the Login and Registration processes  */}
                    <Link to="/login">
                        <button style={styles.loginButton}>Login</button>
                    </Link>
                    <Link to="/register">
                        <button style={styles.registerButton}>Register</button>
                    </Link>
                </div>
            </main>

            <footer style={styles.footer}>
                <p>© 2026 AnniMemo - Helping pet owners stay organized.</p>
            </footer>
        </div>
    );
};

const styles = {
    container: { textAlign: 'center', padding: '50px', fontFamily: 'Arial, sans-serif' },
    header: { marginBottom: '30px' },
    mainContent: { maxWidth: '600px', margin: '0 auto' },
    features: { textAlign: 'left', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px' },
    buttonGroup: { display: 'flex', justifyContent: 'center', gap: '20px' },
    loginButton: { padding: '10px 30px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    registerButton: { padding: '10px 30px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
    footer: { marginTop: '50px', fontSize: '12px', color: '#888' }
};

export default LandingPage;