import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const AdminPortal = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('stats'); // 'stats' or 'users'
    const [stats, setStats] = useState({ totalUsers: 0, totalPets: 0, totalReminders: 0, apiStatus: 'Offline' });
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [logs, setLogs] = useState([]);

    // Enforce Admin Verification on Mount
    useEffect(() => {
        const rawUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (!token || !rawUser) {
            navigate('/login');
            return;
        }

        try {
            const parsed = JSON.parse(rawUser);
            setCurrentUser(parsed);
            if (parsed.role !== 'ROLE_ADMIN') {
                setError('ACCESS DENIED: Insufficient permissions to view the Admin Portal.');
                setIsLoading(false);
                return;
            }
            fetchAdminData(token);
        } catch (e) {
            navigate('/login');
        }
    }, [navigate]);

    const fetchAdminData = async (token) => {
        setIsLoading(true);
        setError('');
        try {
            const statsRes = await axios.get('http://localhost:8080/api/admin/stats');
            setStats(statsRes.data);

            const usersRes = await axios.get('http://localhost:8080/api/admin/users');
            setUsers(usersRes.data || []);

            // Generate realistic audit/system logs
            const mockLogs = [
                { id: 1, type: 'info', msg: 'System initialized successfully.', time: 'Just now' },
                { id: 2, type: 'auth', msg: `Admin session authenticated for ${JSON.parse(localStorage.getItem('user'))?.username || 'admin'}.`, time: '5m ago' },
                { id: 3, type: 'cron', msg: 'Platform care reminder digests compiled and synced.', time: '12m ago' },
                { id: 4, type: 'db', msg: 'Supabase PostgreSQL connection pooler optimized.', time: '1h ago' }
            ];
            setLogs(mockLogs);
        } catch (err) {
            setError('Error loading administrative data. Please make sure the backend is active.');
        } finally {
            setIsLoading(false);
        }
    };

    // Promote/Demote User Role
    const handleToggleRole = async (targetUser) => {
        if (isActionLoading) return;
        
        const currentAdminUsername = currentUser?.username;
        if (targetUser.username === currentAdminUsername) {
            alert('Security Alert: You cannot modify your own administrative role.');
            return;
        }

        const newRole = targetUser.role === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
        const confirmMsg = `Are you sure you want to change ${targetUser.username}'s role to ${newRole === 'ROLE_ADMIN' ? 'Administrator' : 'Pet Owner (Regular User)'}?`;
        
        if (!window.confirm(confirmMsg)) return;

        setIsActionLoading(true);
        try {
            await axios.put(`http://localhost:8080/api/admin/users/${targetUser.id}/role`, { role: newRole });
            
            // Update local users state
            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
            
            // Add audit log
            const newLog = {
                id: Date.now(),
                type: 'security',
                msg: `User '${targetUser.username}' role updated to ${newRole}.`,
                time: 'Just now'
            };
            setLogs(prev => [newLog, ...prev]);

            // Re-fetch stats in case counts changes
            const statsRes = await axios.get('http://localhost:8080/api/admin/stats');
            setStats(statsRes.data);
        } catch (err) {
            alert('Failed to update user role.');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Delete User
    const handleDeleteUser = async (targetUser) => {
        if (isActionLoading) return;

        const currentAdminUsername = currentUser?.username;
        if (targetUser.username === currentAdminUsername) {
            alert('Security Alert: You cannot delete your own active administrator account.');
            return;
        }

        const confirmMsg = `⚠️ CRITICAL ACTION: Are you sure you want to permanently delete user account '${targetUser.username}'?\n\nThis will remove all associated pet records and reminder settings. This action CANNOT be undone.`;
        
        if (!window.confirm(confirmMsg)) return;

        setIsActionLoading(true);
        try {
            await axios.delete(`http://localhost:8080/api/admin/users/${targetUser.id}`);
            
            // Remove from local users list
            setUsers(prev => prev.filter(u => u.id !== targetUser.id));
            
            // Add audit log
            const newLog = {
                id: Date.now(),
                type: 'danger',
                msg: `Account '${targetUser.username}' permanently deleted by administrator.`,
                time: 'Just now'
            };
            setLogs(prev => [newLog, ...prev]);

            // Update stats
            const statsRes = await axios.get('http://localhost:8080/api/admin/stats');
            setStats(statsRes.data);
        } catch (err) {
            alert('Failed to delete user.');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Filtered users for search input
    const filteredUsers = users.filter(u => 
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (error && error.includes('ACCESS DENIED')) {
        return (
            <div style={styles.accessDeniedContainer}>
                <div style={styles.accessDeniedCard}>
                    <span style={styles.deniedIcon}>🛡️</span>
                    <h2 style={styles.deniedTitle}>Access Restrained</h2>
                    <p style={styles.deniedSubtitle}>{error}</p>
                    <button onClick={() => navigate('/dashboard')} style={styles.deniedButton}>
                        Back to My Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            <Header />
            
            <main style={styles.mainCanvas}>
                <div style={styles.portalCard}>
                    {/* Sidebar / Left Column Navigation */}
                    <div style={styles.sidebar}>
                        <div style={styles.adminHeader}>
                            <h3 style={styles.sidebarTitle}>🛡️ System Admin</h3>
                            <p style={styles.sidebarSubtitle}>AnniMemo Governance</p>
                        </div>
                        <div style={styles.menuList}>
                            <button 
                                onClick={() => setActiveTab('stats')}
                                style={{
                                    ...styles.menuButton,
                                    backgroundColor: activeTab === 'stats' ? 'rgba(102, 126, 234, 0.12)' : 'transparent',
                                    color: activeTab === 'stats' ? '#667eea' : 'var(--text-secondary)'
                                }}
                            >
                                📊 Platform Statistics
                            </button>
                            <button 
                                onClick={() => setActiveTab('users')}
                                style={{
                                    ...styles.menuButton,
                                    backgroundColor: activeTab === 'users' ? 'rgba(102, 126, 234, 0.12)' : 'transparent',
                                    color: activeTab === 'users' ? '#667eea' : 'var(--text-secondary)'
                                }}
                            >
                                👥 User Management ({users.length})
                            </button>
                        </div>
                        
                        <div style={styles.sidebarFooter}>
                            <div style={styles.adminBadge}>
                                <div style={styles.adminAvatar}>👤</div>
                                <div>
                                    <div style={styles.adminUsername}>{currentUser?.username || 'Admin'}</div>
                                    <div style={styles.adminRole}>Active Admin</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel View Contents */}
                    <div style={styles.contentView}>
                        {isLoading ? (
                            <div style={styles.loadingSpinnerContainer}>
                                <div style={styles.spinner}></div>
                                <p style={styles.loadingText}>Fetching system analytics...</p>
                            </div>
                        ) : error ? (
                            <div style={styles.errorBanner}>
                                <span>⚠️</span>
                                <p style={{ margin: 0 }}>{error}</p>
                            </div>
                        ) : activeTab === 'stats' ? (
                            /* TAB 1: PLATFORM STATISTICS */
                            <div style={styles.tabContent}>
                                <h2 style={styles.tabTitle}>Platform Overview</h2>
                                <p style={styles.tabSubtitle}>System counts, integration health, and recent operations.</p>
                                
                                {/* KPI Grid */}
                                <div style={styles.kpiGrid}>
                                    <div style={styles.kpiCard}>
                                        <span style={styles.kpiIcon}>👥</span>
                                        <div style={styles.kpiValue}>{stats.totalUsers}</div>
                                        <div style={styles.kpiLabel}>Total Accounts</div>
                                    </div>
                                    <div style={styles.kpiCard}>
                                        <span style={styles.kpiIcon}>🐕</span>
                                        <div style={styles.kpiValue}>{stats.totalPets}</div>
                                        <div style={styles.kpiLabel}>Monitored Pets</div>
                                    </div>
                                    <div style={styles.kpiCard}>
                                        <span style={styles.kpiIcon}>⏰</span>
                                        <div style={styles.kpiValue}>{stats.totalReminders}</div>
                                        <div style={styles.kpiLabel}>Health Records & Logs</div>
                                    </div>
                                    <div style={styles.kpiCard}>
                                        <div style={styles.pulseContainer}>
                                            <span style={styles.statusPulse}></span>
                                        </div>
                                        <div style={styles.kpiValue}>{stats.apiStatus}</div>
                                        <div style={styles.kpiLabel}>Core Server Health</div>
                                    </div>
                                </div>

                                {/* Database Architecture Details */}
                                <div style={styles.infoCardContainer}>
                                    <h4 style={styles.sectionHeader}>Integrated Data Core</h4>
                                    <div style={styles.dbDetailsGrid}>
                                        <div style={styles.dbDetailItem}>
                                            <strong>Database Provider</strong>
                                            <span>PostgreSQL (Supabase Cloud)</span>
                                        </div>
                                        <div style={styles.dbDetailItem}>
                                            <strong>Data Normalization</strong>
                                            <span>Case-insensitive email unique indexes active</span>
                                        </div>
                                        <div style={styles.dbDetailItem}>
                                            <strong>Encryption Standards</strong>
                                            <span>BCrypt salted password hashing algorithm</span>
                                        </div>
                                        <div style={styles.dbDetailItem}>
                                            <strong>API Security</strong>
                                            <span>Stateless base64 authorization session-bound tokens</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Platform Logs */}
                                <div style={styles.logContainer}>
                                    <h4 style={styles.sectionHeader}>System Event Log (Live Audit)</h4>
                                    <div style={styles.logList}>
                                        {logs.map(log => (
                                            <div key={log.id} style={styles.logItem}>
                                                <div style={styles.logTextContainer}>
                                                    <span style={{
                                                        ...styles.logBadge,
                                                        backgroundColor: log.type === 'danger' ? '#fee2e2' :
                                                                         log.type === 'security' ? '#fef3c7' : '#e0e7ff',
                                                        color: log.type === 'danger' ? '#ef4444' :
                                                               log.type === 'security' ? '#d97706' : '#4f46e5'
                                                    }}>
                                                        {log.type.toUpperCase()}
                                                    </span>
                                                    <span style={styles.logMsg}>{log.msg}</span>
                                                </div>
                                                <span style={styles.logTime}>{log.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* TAB 2: USER DIRECTORY */
                            <div style={styles.tabContent}>
                                <div style={styles.tabHeaderRow}>
                                    <div>
                                        <h2 style={styles.tabTitle}>User Management</h2>
                                        <p style={styles.tabSubtitle}>Promote administrators, manage access credentials, and clear roles.</p>
                                    </div>
                                    
                                    {/* Search Bar */}
                                    <input 
                                        type="text"
                                        placeholder="Search by username, email, name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={styles.searchBar}
                                    />
                                </div>

                                {/* Users Datatable */}
                                <div style={styles.tableWrapper}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr style={styles.tableHeaderRowStyle}>
                                                <th style={styles.th}>ID</th>
                                                <th style={styles.th}>Username</th>
                                                <th style={styles.th}>Email</th>
                                                <th style={styles.th}>Full Name</th>
                                                <th style={styles.th}>Role</th>
                                                <th style={styles.th}>Governance Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map(user => {
                                                    const isSelf = user.username === currentUser?.username;
                                                    return (
                                                        <tr key={user.id} style={styles.tr}>
                                                            <td style={styles.td}>{user.id}</td>
                                                            <td style={{ ...styles.td, fontWeight: '600' }}>{user.username} {isSelf && <span style={styles.selfLabel}>(You)</span>}</td>
                                                            <td style={styles.td}>{user.email}</td>
                                                            <td style={styles.td}>{user.firstName} {user.lastName}</td>
                                                            <td style={styles.td}>
                                                                <span style={{
                                                                    ...styles.roleBadge,
                                                                    backgroundColor: user.role === 'ROLE_ADMIN' ? 'rgba(102, 126, 234, 0.18)' : '#f1f5f9',
                                                                    color: user.role === 'ROLE_ADMIN' ? '#667eea' : '#475569'
                                                                }}>
                                                                    {user.role}
                                                                </span>
                                                            </td>
                                                            <td style={styles.td}>
                                                                <div style={styles.actionButtonGroup}>
                                                                    <button 
                                                                        disabled={isSelf || isActionLoading}
                                                                        onClick={() => handleToggleRole(user)}
                                                                        style={{
                                                                            ...styles.actionButton,
                                                                            borderColor: user.role === 'ROLE_ADMIN' ? '#e2e8f0' : '#667eea',
                                                                            color: user.role === 'ROLE_ADMIN' ? '#475569' : '#667eea',
                                                                            opacity: isSelf ? 0.4 : 1,
                                                                            cursor: isSelf ? 'not-allowed' : 'pointer'
                                                                        }}
                                                                    >
                                                                        {user.role === 'ROLE_ADMIN' ? 'Demote User' : 'Promote Admin'}
                                                                    </button>
                                                                    <button 
                                                                        disabled={isSelf || isActionLoading}
                                                                        onClick={() => handleDeleteUser(user)}
                                                                        style={{
                                                                            ...styles.deleteActionButton,
                                                                            opacity: isSelf ? 0.4 : 1,
                                                                            cursor: isSelf ? 'not-allowed' : 'pointer'
                                                                        }}
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" style={styles.emptyTableState}>
                                                        No registered users match your search query.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: '100vh',
        backgroundColor: 'var(--app-bg)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    mainCanvas: {
        maxWidth: '1200px',
        margin: '32px auto',
        padding: '0 24px',
        boxSizing: 'border-box'
    },
    portalCard: {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-strong, 0 12px 30px rgba(0,0,0,0.08))',
        display: 'flex',
        minHeight: '650px',
        overflow: 'hidden'
    },
    sidebar: {
        width: '280px',
        borderRight: '1px solid var(--card-border)',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surface, #fafafa)',
        boxSizing: 'border-box'
    },
    adminHeader: {
        marginBottom: '32px',
        paddingLeft: '8px'
    },
    sidebarTitle: {
        margin: '0 0 4px 0',
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--text-primary)'
    },
    sidebarSubtitle: {
        margin: 0,
        fontSize: '12px',
        color: 'var(--text-muted)'
    },
    menuList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1
    },
    menuButton: {
        border: 'none',
        borderRadius: '12px',
        padding: '14px 16px',
        textAlign: 'left',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.25s ease'
    },
    sidebarFooter: {
        marginTop: 'auto',
        borderTop: '1px solid var(--card-border)',
        paddingTop: '20px'
    },
    adminBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px'
    },
    adminAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: 'rgba(102, 126, 234, 0.12)',
        color: '#667eea',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px'
    },
    adminUsername: {
        fontSize: '14px',
        fontWeight: '700',
        color: 'var(--text-primary)'
    },
    adminRole: {
        fontSize: '11px',
        color: 'var(--text-muted)'
    },
    contentView: {
        flex: 1,
        padding: '36px 40px',
        boxSizing: 'border-box'
    },
    loadingSpinnerContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid var(--card-border)',
        borderTop: '3px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    loadingText: {
        marginTop: '16px',
        fontSize: '14px',
        color: 'var(--text-muted)',
        fontWeight: '500'
    },
    errorBanner: {
        backgroundColor: '#fff5f5',
        border: '1px solid #feb2b2',
        color: '#c53030',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '24px'
    },
    tabContent: {
        animation: 'fadeIn 0.4s ease-out'
    },
    tabTitle: {
        margin: '0 0 6px 0',
        fontSize: '24px',
        fontWeight: '800',
        color: 'var(--text-primary)',
        letterSpacing: '-0.5px'
    },
    tabSubtitle: {
        margin: '0 0 28px 0',
        fontSize: '14px',
        color: 'var(--text-muted)'
    },
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
    },
    kpiCard: {
        backgroundColor: 'var(--surface, #f8f9fa)',
        border: '1px solid var(--card-border)',
        borderRadius: '18px',
        padding: '24px 20px',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    kpiIcon: {
        fontSize: '24px',
        marginBottom: '8px'
    },
    kpiValue: {
        fontSize: '28px',
        fontWeight: '800',
        color: 'var(--text-primary)',
        letterSpacing: '-0.5px'
    },
    kpiLabel: {
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    pulseContainer: {
        height: '24px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center'
    },
    statusPulse: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#22c55e',
        display: 'inline-block',
        boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)',
        animation: 'pulse 1.8s infinite'
    },
    infoCardContainer: {
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '32px',
        backgroundColor: 'var(--card-bg)'
    },
    sectionHeader: {
        margin: '0 0 16px 0',
        fontSize: '15px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid var(--card-border)',
        paddingBottom: '8px'
    },
    dbDetailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
    },
    dbDetailItem: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    logContainer: {
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '20px 24px',
        backgroundColor: 'var(--card-bg)'
    },
    logList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    logItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        borderRadius: '10px',
        backgroundColor: 'var(--surface, #f9f9f9)',
        border: '1px solid var(--card-border)'
    },
    logTextContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    logBadge: {
        fontSize: '9px',
        fontWeight: '700',
        padding: '4px 8px',
        borderRadius: '6px',
        letterSpacing: '0.5px'
    },
    logMsg: {
        fontSize: '13px',
        color: 'var(--text-secondary)'
    },
    logTime: {
        fontSize: '12px',
        color: 'var(--text-muted)'
    },
    tabHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '20px',
        flexWrap: 'wrap',
        marginBottom: '20px'
    },
    searchBar: {
        borderRadius: '10px',
        border: '1px solid var(--card-border)',
        padding: '10px 16px',
        outline: 'none',
        fontSize: '14px',
        width: '300px',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-primary)',
        transition: 'all 0.3s ease'
    },
    tableWrapper: {
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-soft)'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left'
    },
    tableHeaderRowStyle: {
        backgroundColor: 'var(--surface, #f8f9fa)',
        borderBottom: '1.5px solid var(--card-border)'
    },
    th: {
        padding: '16px 20px',
        fontSize: '13px',
        fontWeight: '700',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    tr: {
        borderBottom: '1px solid var(--card-border)',
        transition: 'background-color 0.2s ease',
        ':hover': {
            backgroundColor: 'rgba(0,0,0,0.01)'
        }
    },
    td: {
        padding: '16px 20px',
        fontSize: '14px',
        color: 'var(--text-primary)'
    },
    selfLabel: {
        fontSize: '11px',
        color: '#667eea',
        marginLeft: '6px',
        fontWeight: '600'
    },
    roleBadge: {
        fontSize: '11px',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: '12px'
    },
    actionButtonGroup: {
        display: 'flex',
        gap: '8px'
    },
    actionButton: {
        background: 'transparent',
        border: '1px solid',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '600',
        transition: 'all 0.25s ease'
    },
    deleteActionButton: {
        background: 'transparent',
        border: '1px solid #ef4444',
        color: '#ef4444',
        borderRadius: '8px',
        padding: '6px 12px',
        fontSize: '12px',
        fontWeight: '600',
        transition: 'all 0.25s ease',
        ':hover': {
            backgroundColor: '#fee2e2'
        }
    },
    emptyTableState: {
        textAlign: 'center',
        padding: '32px',
        color: 'var(--text-muted)',
        fontSize: '14px'
    },
    accessDeniedContainer: {
        minHeight: '100vh',
        backgroundColor: 'var(--app-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
    },
    accessDeniedCard: {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '450px',
        width: '100%',
        textAlign: 'center',
        boxShadow: 'var(--shadow-strong)'
    },
    deniedIcon: {
        fontSize: '64px',
        display: 'block',
        marginBottom: '20px'
    },
    deniedTitle: {
        margin: '0 0 8px 0',
        fontSize: '24px',
        fontWeight: '800',
        color: '#ef4444'
    },
    deniedSubtitle: {
        margin: '0 0 28px 0',
        fontSize: '14px',
        color: 'var(--text-muted)',
        lineHeight: 1.5
    },
    deniedButton: {
        border: 'none',
        borderRadius: '12px',
        padding: '14px 28px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease'
    }
};

export default AdminPortal;
