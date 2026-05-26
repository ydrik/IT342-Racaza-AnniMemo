import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const TermsPage = () => {
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
                    <h1 style={styles.title}>Terms of Service</h1>
                </div>

                <div style={styles.card}>
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>1. Agreement to Terms</h2>
                        <p style={styles.paragraph}>
                            By accessing and using AnniMemo, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>2. Use License</h2>
                        <p style={styles.paragraph}>
                            Permission is granted to temporarily download one copy of the materials (information or software) on AnniMemo for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul style={styles.list}>
                            <li style={styles.listItem}>Modifying or copying the materials</li>
                            <li style={styles.listItem}>Using the materials for any commercial purpose or for any public display</li>
                            <li style={styles.listItem}>Attempting to decompile or reverse engineer any software on AnniMemo</li>
                            <li style={styles.listItem}>Removing any copyright or other proprietary notations from the materials</li>
                            <li style={styles.listItem}>Transferring the materials to another person or "mirroring" the materials on any other server</li>
                        </ul>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>3. Disclaimer</h2>
                        <p style={styles.paragraph}>
                            The materials on AnniMemo are provided on an 'as is' basis. AnniMemo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>4. Limitations</h2>
                        <p style={styles.paragraph}>
                            In no event shall AnniMemo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on AnniMemo.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>5. Contact Information</h2>
                        <p style={styles.paragraph}>
                            If you have any questions about these Terms of Service, please contact us at: support@annimemo.com
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

export default TermsPage;
