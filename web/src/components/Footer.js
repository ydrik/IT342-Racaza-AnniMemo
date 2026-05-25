import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer style={styles.footer}>
            <div style={styles.shell}>
                <div style={styles.mainRow}>
                    <div style={styles.brandColumn}>
                        <div style={styles.brandTitle}>AnniMemo</div>
                        <p style={styles.brandTagline}>
                            Pet care, minus the chaos. Keep health logs, reminders, and daily routines in one calm place.
                        </p>
                        <div style={styles.badges}>
                            <span style={styles.badge}>Secure</span>
                            <span style={styles.badge}>Simple</span>
                            <span style={styles.badge}>Built for Daily Use</span>
                        </div>
                    </div>

                    <div style={styles.linksColumn}>
                        <div style={styles.sectionTitle}>Explore</div>
                        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
                        <Link to="/pets" style={styles.link}>My Pets</Link>
                        <Link to="/reminders" style={styles.link}>Reminders</Link>
                        <Link to="/facts" style={styles.link}>Pet Facts</Link>
                    </div>

                    <div style={styles.linksColumn}>
                        <div style={styles.sectionTitle}>Account</div>
                        <Link to="/profile" style={styles.link}>Profile</Link>
                        <Link to="/settings" style={styles.link}>Settings</Link>
                        <Link to="/support" style={styles.link}>Support</Link>
                    </div>

                    <div style={styles.linksColumn}>
                        <div style={styles.sectionTitle}>Contact</div>
                        <div style={styles.textLine}>Cebu City, Philippines</div>
                        <div style={styles.textLine}>hello@annimemo.app</div>
                        <div style={styles.textLine}>Mon-Fri, 9:00-17:00</div>
                    </div>
                </div>

                <div style={styles.bottomBar}>
                    <div style={styles.bottomText}>© {year} AnniMemo. All rights reserved.</div>
                    <div style={styles.bottomLinks}>
                        <Link to="/privacy" style={styles.bottomLink}>Privacy</Link>
                        <Link to="/terms" style={styles.bottomLink}>Terms</Link>
                        <Link to="/cookies" style={styles.bottomLink}>Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

const styles = {
    footer: {
        background: 'var(--footer-bg)',
        color: 'white',
        padding: '44px 20px 24px',
        fontFamily: '"Space Grotesk", "Segoe UI", sans-serif'
    },
    shell: {
        maxWidth: '1580px',
        margin: '0 auto',
        borderRadius: '18px',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))',
        backdropFilter: 'blur(6px)',
        padding: '24px 24px 14px'
    },
    mainRow: {
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 1.4fr) repeat(auto-fit, minmax(180px, 1fr))',
        gap: '22px'
    },
    brandColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    brandTitle: {
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: '34px',
        letterSpacing: '0.5px'
    },
    brandTagline: {
        fontSize: '14px',
        color: 'var(--footer-text)',
        lineHeight: '1.65',
        maxWidth: '460px',
        margin: 0
    },
    badges: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '4px'
    },
    badge: {
        fontSize: '12px',
        padding: '6px 10px',
        borderRadius: '999px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.12)'
    },
    linksColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    sectionTitle: {
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '1.4px',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '2px'
    },
    link: {
        color: 'var(--footer-text)',
        textDecoration: 'none',
        fontSize: '14px',
        lineHeight: 1.6
    },
    textLine: {
        fontSize: '14px',
        color: 'var(--footer-text)',
        lineHeight: 1.6
    },
    bottomBar: {
        marginTop: '20px',
        paddingTop: '14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.14)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px'
    },
    bottomText: {
        fontSize: '13px',
        color: 'var(--footer-text)'
    },
    bottomLinks: {
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
    },
    bottomLink: {
        color: 'var(--footer-text)',
        fontSize: '13px',
        textDecoration: 'none'
    }
};

export default Footer;
