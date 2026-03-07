import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SupportPage = () => {
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
        subtitle: {
            fontSize: '18px',
            color: 'var(--text-secondary)',
            marginTop: '10px'
        },
        card: {
            backgroundColor: 'var(--card-bg)',
            borderRadius: '24px',
            padding: '40px',
            boxShadow: 'var(--shadow-strong)',
            marginBottom: '30px',
            animation: 'slideUp 0.5s ease-out'
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
        contactItem: {
            display: 'flex',
            gap: '15px',
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'var(--surface)',
            borderRadius: '12px',
            borderLeft: '4px solid var(--accent)'
        },
        contactIcon: {
            fontSize: '24px',
            minWidth: '30px'
        },
        contactContent: {
            flex: 1
        },
        contactTitle: {
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginBottom: '5px'
        },
        contactInfo: {
            color: 'var(--text-secondary)',
            fontSize: '14px'
        },
        link: {
            color: 'var(--accent)',
            textDecoration: 'none',
            fontWeight: '600',
            cursor: 'pointer'
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
                    <h1 style={styles.title}>Support Center</h1>
                    <p style={styles.subtitle}>We're here to help. Get answers and support for AnniMemo.</p>
                </div>

                <div style={styles.card}>
                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Contact Us</h2>
                        
                        <div style={styles.contactItem}>
                            <div style={styles.contactIcon}>📧</div>
                            <div style={styles.contactContent}>
                                <div style={styles.contactTitle}>Email Support</div>
                                <div style={styles.contactInfo}>
                                    <a href="mailto:support@annimemo.com" style={styles.link}>
                                        support@annimemo.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div style={styles.contactItem}>
                            <div style={styles.contactIcon}>💬</div>
                            <div style={styles.contactContent}>
                                <div style={styles.contactTitle}>Live Chat</div>
                                <div style={styles.contactInfo}>
                                    Contact our support team via live chat during business hours
                                </div>
                            </div>
                        </div>

                        <div style={styles.contactItem}>
                            <div style={styles.contactIcon}>📞</div>
                            <div style={styles.contactContent}>
                                <div style={styles.contactTitle}>Phone Support</div>
                                <div style={styles.contactInfo}>
                                    Available Monday-Friday, 9am-6pm EST
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
                        <p style={styles.paragraph}>
                            <strong>Q: How do I reset my password?</strong><br/>
                            A: Click "Forgot Password" on the login page and follow the instructions sent to your email.
                        </p>
                        <p style={styles.paragraph}>
                            <strong>Q: Can I upload pet photos?</strong><br/>
                            A: Yes! You can upload photos for each pet profile. Images must be 2MB or smaller in JPG or PNG format.
                        </p>
                        <p style={styles.paragraph}>
                            <strong>Q: How is my pet's health data stored securely?</strong><br/>
                            A: All data is encrypted and stored on secure servers. We comply with data protection regulations.
                        </p>
                        <p style={styles.paragraph}>
                            <strong>Q: Can I export my pet's health records?</strong><br/>
                            A: Contact our support team for assistance with exporting health records for your veterinarian.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Getting Started</h2>
                        <p style={styles.paragraph}>
                            <strong>Setting Up Your Account:</strong> Create an account with your email, verify it, and start adding your pets to get started tracking their health.
                        </p>
                        <p style={styles.paragraph}>
                            <strong>Adding Pets:</strong> Click the "Add Pet" button and fill in your pet's basic information. Upload a photo to make it memorable!
                        </p>
                        <p style={styles.paragraph}>
                            <strong>Tracking Health Metrics:</strong> Go to your pet's profile and use the Health Metrics tab to record weight, medications, vaccinations, and vet visits.
                        </p>
                    </div>

                    <div style={styles.section}>
                        <h2 style={styles.sectionTitle}>Report an Issue</h2>
                        <p style={styles.paragraph}>
                            If you encounter any bugs or issues while using AnniMemo, please report them by emailing our support team at <a href="mailto:support@annimemo.com" style={styles.link}>support@annimemo.com</a> with a detailed description of the problem.
                        </p>
                    </div>
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

export default SupportPage;
