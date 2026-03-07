import React from 'react';

const ThemeToggle = ({ theme, onToggle }) => {
    return (
        <button type="button" onClick={onToggle} style={styles.button} aria-label="Toggle theme">
            <span style={styles.icon}>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <span style={styles.text}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
        </button>
    );
};

const styles = {
    button: {
        position: 'fixed',
        right: '20px',
        bottom: '24px',
        zIndex: 2000,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        borderRadius: '999px',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        background: 'var(--toggle-bg)',
        color: 'var(--toggle-text)',
        fontWeight: '600',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer'
    },
    icon: {
        fontSize: '16px'
    },
    text: {
        fontSize: '14px'
    }
};

export default ThemeToggle;
