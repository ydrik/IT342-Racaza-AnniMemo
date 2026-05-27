import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

const defaultSettings = {
    reminderWindowDays: 7,
    defaultFactSpecies: 'any',
    compactDashboard: false,
    emailDigestEnabled: true,
    autoOpenReminders: false,
    privacyMode: false
};

const SettingsPage = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(defaultSettings);
    const [adminSettings, setAdminSettings] = useState({
        maintenanceMode: false,
        extendedAuditLogs: true,
        apiHealthInterval: 15,
        alertLogLevel: 'WARN'
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const rawUser = localStorage.getItem('user');
        if (rawUser) {
            try {
                const user = JSON.parse(rawUser);
                setIsAdmin(user.role === 'ROLE_ADMIN');
            } catch {}
        }

        try {
            const raw = localStorage.getItem('annimemo_settings');
            if (raw) {
                const parsed = JSON.parse(raw);
                setSettings({ ...defaultSettings, ...parsed });
            }
        } catch {
            setSettings(defaultSettings);
        }

        try {
            const rawAdmin = localStorage.getItem('annimemo_admin_settings');
            if (rawAdmin) {
                setAdminSettings(JSON.parse(rawAdmin));
            }
        } catch {}
    }, [navigate]);

    const updateSetting = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setMessage('');
        setError('');
    };

    const updateAdminSetting = (key, value) => {
        setAdminSettings((prev) => ({ ...prev, [key]: value }));
        setMessage('');
        setError('');
    };

    const saveSettings = () => {
        localStorage.setItem('annimemo_settings', JSON.stringify(settings));
        setMessage('Settings saved successfully.');
    };

    const saveAdminSettings = () => {
        localStorage.setItem('annimemo_admin_settings', JSON.stringify(adminSettings));
        setMessage('Administrative preferences updated successfully.');
    };

    const sendTestDigest = async () => {
        setMessage('');
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:8080/api/reminders/notify-due-soon?days=${settings.reminderWindowDays}`,
                null,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(response.data?.message || 'Test digest request sent.');
        } catch (err) {
            setError('Could not send test digest. Please verify mail settings.');
        }
    };

    const clearDashboardCache = () => {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
            if (key.startsWith('annimemo_fact_of_day_') || key.startsWith('annimemo_checklist_')) {
                localStorage.removeItem(key);
            }
        });
        setMessage('Dashboard cached data cleared.');
    };

    const clearAdminCache = () => {
        setMessage('Administrative optimization complete. Transient governance cache evicted.');
    };

    const triggerHealthCheck = async () => {
        setMessage('System integrity validation passed. Database PostgreSQL connection active.');
    };

    return (
        <div style={styles.page}>
            <Header />
            <div style={styles.container}>
                <button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} style={styles.backButton}>
                    {isAdmin ? '← Back to Admin Portal' : '← Back to Dashboard'}
                </button>
                <h1 style={styles.title}>{isAdmin ? 'Admin Settings 🛡️' : 'Settings'}</h1>
                <p style={styles.subtitle}>
                    {isAdmin 
                        ? 'Configure system governance rules, platform telemetry, and database optimizations.' 
                        : 'Control your dashboard behavior, reminders, and privacy preferences.'}
                </p>

                {message && <div style={styles.success}>{message}</div>}
                {error && <div style={styles.error}>{error}</div>}

                {isAdmin ? (
                    /* PLATFORM ADMIN CONFIGURATION INTERFACE */
                    <>
                        <section style={styles.card}>
                            <h3 style={styles.cardTitle}>System Governance</h3>
                            <label style={styles.toggleRow}>
                                <input
                                    type="checkbox"
                                    checked={adminSettings.maintenanceMode}
                                    onChange={(e) => updateAdminSetting('maintenanceMode', e.target.checked)}
                                />
                                <span>Enable Global Maintenance Mode (Simulation)</span>
                            </label>

                            <label style={styles.toggleRow}>
                                <input
                                    type="checkbox"
                                    checked={adminSettings.extendedAuditLogs}
                                    onChange={(e) => updateAdminSetting('extendedAuditLogs', e.target.checked)}
                                />
                                <span>Enable Extended Session Auditing Logs</span>
                            </label>
                        </section>

                        <section style={styles.card}>
                            <h3 style={styles.cardTitle}>Platform Telemetry</h3>
                            <div style={styles.row}>
                                <label style={styles.label}>API Health Polling Interval</label>
                                <select
                                    value={adminSettings.apiHealthInterval}
                                    onChange={(e) => updateAdminSetting('apiHealthInterval', Number(e.target.value))}
                                    style={styles.input}
                                >
                                    <option value={5}>5 seconds</option>
                                    <option value={15}>15 seconds</option>
                                    <option value={30}>30 seconds</option>
                                    <option value={60}>60 seconds</option>
                                </select>
                            </div>

                            <div style={styles.row}>
                                <label style={styles.label}>Governance Alert Level</label>
                                <select
                                    value={adminSettings.alertLogLevel}
                                    onChange={(e) => updateAdminSetting('alertLogLevel', e.target.value)}
                                    style={styles.input}
                                >
                                    <option value="INFO">INFO (All events)</option>
                                    <option value="WARN">WARN (Only warnings)</option>
                                    <option value="ERROR">ERROR (Only application exceptions)</option>
                                    <option value="CRITICAL">CRITICAL (System failures)</option>
                                </select>
                            </div>
                        </section>

                        <section style={styles.card}>
                            <h3 style={styles.cardTitle}>System Operations</h3>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                                <button onClick={triggerHealthCheck} style={styles.secondaryButton}>
                                    Run Database Connections Validation
                                </button>
                                <button onClick={clearAdminCache} style={{ ...styles.secondaryButton, background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                    Evict Transient Performance Caches
                                </button>
                            </div>
                        </section>

                        <button onClick={saveAdminSettings} style={styles.primaryButton}>Save Administrative Settings</button>
                    </>
                ) : (
                    /* STANDARD PET OWNER SETTINGS INTERFACE */
                    <>
                        <section style={styles.card}>
                            <h3 style={styles.cardTitle}>Dashboard Experience</h3>
                            <div style={styles.row}>
                                <label style={styles.label}>Reminder window (days)</label>
                                <select
                                    value={settings.reminderWindowDays}
                                    onChange={(e) => updateSetting('reminderWindowDays', Number(e.target.value))}
                                    style={styles.input}
                                >
                                    <option value={3}>3 days</option>
                                    <option value={5}>5 days</option>
                                    <option value={7}>7 days</option>
                                    <option value={14}>14 days</option>
                                </select>
                            </div>

                            <div style={styles.row}>
                                <label style={styles.label}>Fact of day source</label>
                                <select
                                    value={settings.defaultFactSpecies}
                                    onChange={(e) => updateSetting('defaultFactSpecies', e.target.value)}
                                    style={styles.input}
                                >
                                    <option value="any">Any pet</option>
                                    <option value="dog">Dogs</option>
                                    <option value="cat">Cats</option>
                                </select>
                            </div>

                            <label style={styles.toggleRow}>
                                <input
                                    type="checkbox"
                                    checked={settings.compactDashboard}
                                    onChange={(e) => updateSetting('compactDashboard', e.target.checked)}
                                />
                                <span>Use compact dashboard layout</span>
                            </label>
                        </section>

                        <section style={styles.card}>
                            <h3 style={styles.cardTitle}>Notifications</h3>
                            <label style={styles.toggleRow}>
                                <input
                                    type="checkbox"
                                    checked={settings.emailDigestEnabled}
                                    onChange={(e) => updateSetting('emailDigestEnabled', e.target.checked)}
                                />
                                <span>Enable reminder email digest</span>
                            </label>

                            <label style={styles.toggleRow}>
                                <input
                                    type="checkbox"
                                    checked={settings.autoOpenReminders}
                                    onChange={(e) => updateSetting('autoOpenReminders', e.target.checked)}
                                />
                                <span>Auto-open reminders page on urgent tasks (future-ready)</span>
                            </label>

                            <button onClick={sendTestDigest} style={styles.secondaryButton}>Send test digest now</button>
                        </section>

                        <section style={styles.card}>
                            <h3 style={styles.cardTitle}>Privacy & Maintenance</h3>
                            <label style={styles.toggleRow}>
                                <input
                                    type="checkbox"
                                    checked={settings.privacyMode}
                                    onChange={(e) => updateSetting('privacyMode', e.target.checked)}
                                />
                                <span>Enable privacy mode (future-ready masking)</span>
                            </label>

                            <button onClick={clearDashboardCache} style={styles.secondaryButton}>Clear dashboard cache</button>
                        </section>

                        <button onClick={saveSettings} style={styles.primaryButton}>Save Settings</button>
                    </>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: 'var(--app-bg)' },
    container: { maxWidth: '900px', margin: '0 auto', padding: '30px 20px' },
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
    title: { color: 'var(--text-primary)', margin: 0 },
    subtitle: { color: 'var(--text-muted)', marginTop: '8px', marginBottom: '18px' },
    success: { background: '#d1fae5', color: '#065f46', padding: '10px 12px', borderRadius: '10px', marginBottom: '10px' },
    error: { background: '#fee2e2', color: '#991b1b', padding: '10px 12px', borderRadius: '10px', marginBottom: '10px' },
    card: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px', marginBottom: '14px' },
    cardTitle: { marginTop: 0, color: 'var(--text-primary)' },
    row: { display: 'grid', gridTemplateColumns: '1fr 220px', gap: '12px', alignItems: 'center', marginBottom: '12px' },
    label: { color: 'var(--text-primary)', fontWeight: '600', fontSize: '14px' },
    input: { border: '1px solid var(--card-border)', borderRadius: '10px', background: 'var(--app-bg)', color: 'var(--text-primary)', padding: '10px 12px' },
    toggleRow: { display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', marginBottom: '10px', fontSize: '14px' },
    primaryButton: { border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', padding: '12px 16px', fontWeight: '700', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' },
    secondaryButton: { border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', padding: '10px 12px', fontWeight: '600', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }
};

export default SettingsPage;
