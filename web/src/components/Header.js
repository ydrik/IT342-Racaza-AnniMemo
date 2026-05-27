import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LogoutModal from './LogoutModal';

const Header = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [pets, setPets] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
            try {
                const user = JSON.parse(rawUser);
                setIsAdmin(user.role === 'ROLE_ADMIN');
            } catch (e) {
                setIsAdmin(false);
            }
        } else {
            setIsAdmin(false);
        }
    }, []);

    useEffect(() => {
        const fetchSearchIndex = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const petRes = await axios.get('http://localhost:8080/api/pets', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const petList = petRes.data || [];
                    setPets(petList);
                    localStorage.setItem('annimemo_pets', JSON.stringify(petList));
                } catch (err) {
                    const petList = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
                    setPets(petList);
                }

                try {
                    const reminderRes = await axios.get('http://localhost:8080/api/reminders', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const reminderList = reminderRes.data || [];
                    setReminders(reminderList);
                    localStorage.setItem('annimemo_reminders', JSON.stringify(reminderList));
                } catch (err) {
                    const reminderList = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
                    setReminders(reminderList);
                }
            } else {
                const petList = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
                const reminderList = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
                setPets(petList);
                setReminders(reminderList);
            }
        };

        fetchSearchIndex();
    }, [showSuggestions, searchQuery]); // Refresh when query changes or when box is focused

    useEffect(() => {
        setActiveIdx(-1);
    }, [searchQuery]);

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const pages = useMemo(() => [
        { title: '🏠 Dashboard', path: '/dashboard', type: 'page', subtitle: 'Main canvas and overview' },
        { title: '🐾 My Pets', path: '/pets', type: 'page', subtitle: 'Manage your pet profiles' },
        { title: '⏰ Reminders', path: '/reminders', type: 'page', subtitle: 'Care tasks and notifications' },
        { title: '🗓️ Appointments', path: '/appointments', type: 'page', subtitle: 'Schedule and track vet visits' },
        { title: '🔍 Explore Breeds', path: '/breeds', type: 'page', subtitle: 'Dog & Cat breeds information search' },
        { title: '📚 Pet Facts', path: '/facts', type: 'page', subtitle: 'Dog, Cat and other pet facts library' },
        { title: '⚙️ Settings', path: '/settings', type: 'page', subtitle: 'Preferences and dashboard settings' },
        { title: '👤 My Profile', path: '/profile', type: 'page', subtitle: 'View and edit account profile' }
    ], []);

    const suggestions = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return [];

        const list = [];

        // 1. Pages matching query
        pages.forEach(p => {
            if (p.title.toLowerCase().includes(query) || p.subtitle.toLowerCase().includes(query)) {
                list.push(p);
            }
        });

        // 2. Pets matching query
        pets.forEach(pet => {
            if (pet.name.toLowerCase().includes(query) || (pet.species && pet.species.toLowerCase().includes(query))) {
                const emoji = pet.species === 'Dog' ? '🐕' : 
                              pet.species === 'Cat' ? '🐱' : 
                              pet.species === 'Bird' ? '🦜' : 
                              pet.species === 'Rabbit' ? '🐰' : 
                              pet.species === 'Fish' ? '🐟' : '🐾';
                
                list.push({
                    title: `${emoji} ${pet.name} (Pet)`,
                    subtitle: `View details in My Pets`,
                    path: '/pets',
                    type: 'pet'
                });
                
                list.push({
                    title: `📈 ${pet.name} - Health Trends`,
                    subtitle: `View health metrics for ${pet.name}`,
                    path: `/pets/${pet.id}/health`,
                    type: 'health'
                });
            }
        });

        // 3. Reminders & Appointments matching query
        reminders.forEach(rem => {
            if (rem.title.toLowerCase().includes(query) || (rem.petName && rem.petName.toLowerCase().includes(query))) {
                const isAppt = (rem.type || '').toLowerCase() === 'appointment';
                const emoji = isAppt ? '🗓️' : '⏰';
                const path = isAppt ? '/appointments' : '/reminders';
                list.push({
                    title: `${emoji} ${rem.title} (${isAppt ? 'Appointment' : 'Reminder'})`,
                    subtitle: `Assigned to: ${rem.petName || 'Unknown Pet'}`,
                    path,
                    type: 'reminder'
                });
            }
        });

        return list.slice(0, 8); // Max 8 suggestions
    }, [searchQuery, pets, reminders, pages]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const query = searchQuery.trim().toLowerCase();
        if (!query) return;

        if (activeIdx >= 0 && activeIdx < suggestions.length) {
            navigate(suggestions[activeIdx].path);
            setSearchQuery('');
            setShowSuggestions(false);
        } else if (suggestions.length > 0) {
            navigate(suggestions[0].path);
            setSearchQuery('');
            setShowSuggestions(false);
        } else {
            // Simple keyword fallbacks
            if (query.includes('pet')) {
                navigate('/pets');
            } else if (query.includes('reminder') || query.includes('task')) {
                navigate('/reminders');
            } else if (query.includes('appoint')) {
                navigate('/appointments');
            } else if (query.includes('fact')) {
                navigate('/facts');
            } else if (query.includes('breed')) {
                navigate('/breeds');
            } else if (query.includes('setting')) {
                navigate('/settings');
            } else if (query.includes('profile')) {
                navigate('/profile');
            }
            setSearchQuery('');
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            if (activeIdx >= 0 && activeIdx < suggestions.length) {
                e.preventDefault();
                navigate(suggestions[activeIdx].path);
                setSearchQuery('');
                setShowSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <header style={styles.navbar}>
            <div style={styles.navbarContent}>
                <div style={styles.navbarBrand} onClick={() => navigate('/dashboard')}>
                    <h2 style={styles.brandTitle}>🐾 AnniMemo</h2>
                </div>

                <div style={styles.navbarCenter}>
                    <form onSubmit={handleSearchSubmit} style={styles.commandForm}>
                        <input
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => {
                                setTimeout(() => setShowSuggestions(false), 250);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Search pets, reminders, appointments, pages..."
                            style={styles.commandInput}
                            autoComplete="off"
                        />
                        <button type="submit" style={styles.commandButton}>Go</button>
                        
                        {showSuggestions && searchQuery.trim().length > 0 && (
                            <div style={styles.suggestionsContainer}>
                                {suggestions.length > 0 ? (
                                    suggestions.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onMouseDown={() => {
                                                navigate(item.path);
                                                setSearchQuery('');
                                                setShowSuggestions(false);
                                            }}
                                            onMouseEnter={() => setActiveIdx(idx)}
                                            style={{
                                                ...styles.suggestionItem,
                                                backgroundColor: idx === activeIdx ? 'rgba(102, 126, 234, 0.15)' : 'transparent'
                                            }}
                                        >
                                            <div style={styles.itemTitle}>{item.title}</div>
                                            <div style={styles.itemSubtitle}>{item.subtitle}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ ...styles.suggestionItem, cursor: 'default', color: 'var(--text-muted)' }}>
                                        No matching results found
                                    </div>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                <div style={styles.navbarActions}>
                    {isAdmin && (
                        <button onClick={() => navigate('/admin')} style={styles.adminButton}>
                            🛡️ Admin Portal
                        </button>
                    )}
                    <button onClick={() => navigate('/settings')} style={styles.settingsButton}>
                        ⚙️ Settings
                    </button>
                    <button onClick={() => navigate('/profile')} style={styles.profileButton}>
                        👤 Profile
                    </button>
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Logout
                    </button>
                </div>
            </div>
            
            <LogoutModal
                isOpen={showLogoutModal}
                onConfirm={confirmLogout}
                onCancel={cancelLogout}
            />
        </header>
    );
};

const styles = {
    navbar: {
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--card-border)',
        padding: '16px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-soft)'
    },
    navbarContent: {
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
    },
    navbarBrand: {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
    },
    brandTitle: {
        margin: 0,
        fontSize: '22px',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    navbarCenter: {
        flex: 1,
        maxWidth: '500px',
        position: 'relative'
    },
    commandForm: {
        display: 'flex',
        gap: '8px',
        width: '100%'
    },
    commandInput: {
        flex: 1,
        borderRadius: '10px',
        border: '1px solid var(--card-border)',
        padding: '10px 14px',
        background: 'var(--app-bg)',
        color: 'var(--text-primary)',
        outline: 'none',
        fontSize: '14px',
        transition: 'all 0.3s ease'
    },
    commandButton: {
        border: 'none',
        borderRadius: '10px',
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
        transition: 'all 0.3s ease'
    },
    navbarActions: {
        display: 'flex',
        gap: '12px',
        alignItems: 'center'
    },
    adminButton: {
        background: 'rgba(102, 126, 234, 0.1)',
        border: '1.5px solid #667eea',
        color: '#667eea',
        borderRadius: '10px',
        padding: '8px 14px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    settingsButton: {
        background: 'transparent',
        border: '1px solid var(--card-border)',
        color: 'var(--text-primary)',
        borderRadius: '10px',
        padding: '8px 14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    profileButton: {
        background: 'transparent',
        border: '1px solid var(--card-border)',
        color: 'var(--text-primary)',
        borderRadius: '10px',
        padding: '8px 14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    },
    logoutButton: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        padding: '8px 16px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
        transition: 'all 0.3s ease'
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: 0,
        right: 0,
        zIndex: 2000,
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-strong, 0 10px 30px rgba(0,0,0,0.15))',
        maxHeight: '300px',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease-out'
    },
    suggestionItem: {
        padding: '10px 14px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--card-border)',
        transition: 'background-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '2px'
    },
    itemTitle: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--text-primary)'
    },
    itemSubtitle: {
        fontSize: '12px',
        color: 'var(--text-muted)'
    }
};

export default Header;
