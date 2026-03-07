import React from 'react';

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onCancel}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div style={styles.iconContainer}>
                    <span style={styles.icon}>�</span>
                </div>
                <h2 style={styles.title}>Sign Out</h2>
                <p style={styles.message}>
                    Are you sure you want to sign out? You'll need to log in again to access your pets.
                </p>
                <div style={styles.divider}></div>
                <div style={styles.buttonContainer}>
                    <button 
                        onClick={onCancel} 
                        style={styles.cancelButton}
                        onMouseEnter={(e) => e.target.style.background = 'var(--card-border)'}
                        onMouseLeave={(e) => e.target.style.background = 'var(--card-bg)'}
                    >
                        Stay Logged In
                    </button>
                    <button 
                        onClick={onConfirm} 
                        style={styles.confirmButton}
                        onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000,
        animation: 'fadeIn 0.3s ease-out'
    },
    modal: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '420px',
        width: '90%',
        boxShadow: 'var(--shadow-strong)',
        animation: 'slideUp 0.3s ease-out',
        textAlign: 'center',
        border: '1px solid var(--card-border)'
    },
    iconContainer: {
        marginBottom: '24px'
    },
    icon: {
        fontSize: '64px',
        display: 'inline-block',
        animation: 'bounce 0.6s ease-in-out'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '12px'
    },
    message: {
        fontSize: '15px',
        color: 'var(--text-secondary)',
        marginBottom: '28px',
        lineHeight: '1.6'
    },
    divider: {
        height: '1px',
        background: 'var(--card-border)',
        margin: '24px 0'
    },
    buttonContainer: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center'
    },
    cancelButton: {
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--card-border)',
        padding: '12px 28px',
        borderRadius: '10px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        flex: 1,
        transition: 'all 0.2s ease'
    },
    confirmButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 28px',
        borderRadius: '10px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        flex: 1,
        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)',
        transition: 'all 0.2s ease'
    }
};

export default LogoutModal;
