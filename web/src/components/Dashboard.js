import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LogoutModal from './LogoutModal';
import ActivityService from '../services/activity.service';

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [pets, setPets] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in (Authentication Check)
        const token = localStorage.getItem('token');
        if (!token) {
            // Activity Diagram: If not authenticated, redirect to Login
            navigate('/login'); 
        } else {
            fetchDashboardData();
        }
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch user profile
            const userResponse = await axios.get('http://localhost:8080/api/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(userResponse.data);

            // FRS Requirement: Display Dashboard summarizing recent pet activities
            // Fetch pets
            const petsResponse = await axios.get('http://localhost:8080/api/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const petsData = petsResponse.data;
            setPets(petsData);

            // Fetch recent activities
            const activitiesResponse = await axios.get('http://localhost:8080/api/activities/recent', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const metricActivities = mapMetricsToActivities(activitiesResponse.data);
            const petActivities = mapPetsToActivities(petsData);
            const localActivities = mapLocalActivities(ActivityService.getActivities());
            setRecentActivities(sortActivitiesByDate([...metricActivities, ...petActivities, ...localActivities]));
        } catch (err) {
            // Mock data for frontend-only mode
            setUser({ 
                username: 'johndoe',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com' 
            });

            const mockPets = [
                {
                    id: 1,
                    name: 'Max',
                    species: 'Dog',
                    breed: 'Golden Retriever',
                    weight: 30.5,
                    color: 'Golden'
                },
                {
                    id: 2,
                    name: 'Luna',
                    species: 'Cat',
                    breed: 'Persian',
                    weight: 4.2,
                    color: 'White'
                }
            ];
            setPets(mockPets);

            const mockActivities = [
                {
                    id: 1,
                    type: 'vaccination',
                    petName: 'Max',
                    description: 'Rabies Vaccine',
                    timestamp: '2026-02-10T09:12:00',
                    icon: '💉'
                },
                {
                    id: 2,
                    type: 'weight',
                    petName: 'Luna',
                    description: 'Weight recorded: 4.2 kg',
                    timestamp: '2026-02-09T14:30:00',
                    icon: '📊'
                },
                {
                    id: 3,
                    type: 'medication',
                    petName: 'Max',
                    description: 'Started Antibiotics',
                    timestamp: '2026-02-08T08:05:00',
                    icon: '💊'
                },
                {
                    id: 4,
                    type: 'vetVisit',
                    petName: 'Max',
                    description: 'Routine checkup',
                    timestamp: '2026-02-05T15:20:00',
                    icon: '🏥'
                }
            ];
            const localActivities = mapLocalActivities(ActivityService.getActivities());
            setRecentActivities(sortActivitiesByDate([...mockActivities, ...localActivities]));
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        // Activity Diagram: Destroy Session / Clear Token
        localStorage.removeItem('token');
        navigate('/login');
    };

    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    const formatActivityTimestamp = (value) => {
        if (!value) {
            return 'Recently';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'Recently';
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const timeLabel = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        if (date.toDateString() === today.toDateString()) {
            return `Today • ${timeLabel}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday • ${timeLabel}`;
        }

        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dateLabel} • ${timeLabel}`;
    };

    const normalizeMetricType = (type) => {
        if (!type) {
            return 'other';
        }
        const normalized = type.toLowerCase();
        if (normalized === 'vet_visit' || normalized === 'vetvisit') {
            return 'vetVisit';
        }
        return normalized;
    };

    const mapMetricsToActivities = (metrics) => {
        if (!Array.isArray(metrics)) {
            return [];
        }

        return metrics.map((metric) => {
            const type = normalizeMetricType(metric.type);
            const petName = metric.petName || 'Your pet';
            const dateValue = metric.date || metric.startDate || metric.vaccineDate || metric.createdAt;
            let description = 'Health update logged';
            let icon = '📌';

            switch (type) {
                case 'weight':
                    description = metric.weight ? `Weight recorded: ${metric.weight} kg` : 'Weight recorded';
                    icon = '📊';
                    break;
                case 'medication':
                    description = metric.medicationName || 'Medication logged';
                    if (metric.dosage) {
                        description = `${description} (${metric.dosage})`;
                    }
                    icon = '💊';
                    break;
                case 'vaccination':
                    description = metric.vaccineName || 'Vaccination logged';
                    icon = '💉';
                    break;
                case 'vetVisit':
                    description = metric.visitReason ? `Vet visit: ${metric.visitReason}` : 'Vet visit logged';
                    icon = '🏥';
                    break;
                default:
                    description = metric.notes || 'Health update logged';
            }

            return {
                id: metric.id,
                type,
                petName,
                description,
                timestamp: dateValue,
                icon
            };
        });
    };

    const mapPetsToActivities = (petsData) => {
        if (!Array.isArray(petsData)) {
            return [];
        }

        return petsData.map((pet) => ({
            id: `pet-${pet.id}`,
            type: 'petCreated',
            petName: pet.name || 'New pet',
            description: `New pet profile created${pet.species ? `: ${pet.species}` : ''}`,
            timestamp: pet.createdAt || null,
            icon: '🐾'
        }));
    };

    const mapLocalActivities = (activities) => {
        if (!Array.isArray(activities)) {
            return [];
        }

        return activities.map((activity) => ({
            id: activity.id,
            type: activity.type,
            petName: activity.meta?.petName || 'Activity',
            description: activity.description,
            timestamp: activity.timestamp,
            icon: activity.icon || '📌'
        }));
    };

    const sortActivitiesByDate = (activities) => {
        return activities
            .slice()
            .sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeB - timeA;
            })
            .slice(0, 8);
    };

    if (isLoading) {
        return (
            <div style={styles.loadingContainer}>
                <p style={styles.loadingText}>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            {/* Header / Navigation Bar */}
            <header style={styles.navbar}>
                <div style={styles.navbarContent}>
                    <div style={styles.navbarBrand}>
                        <h2 style={styles.brandTitle}>🐾 AnniMemo</h2>
                    </div>
                    <div style={styles.navbarActions}>
                        <button onClick={() => navigate('/profile')} style={styles.profileButton}>
                            👤 Profile
                        </button>
                        <button onClick={handleLogout} style={styles.logoutButton}>
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div style={styles.container}>
                {/* Welcome Section */}
                <div style={styles.welcomeSection}>
                    <h1 style={styles.welcomeTitle}>
                        Welcome back, {user?.firstName || user?.name}! 👋
                    </h1>
                    <p style={styles.welcomeSubtitle}>
                        Here's what's happening with your pets today
                    </p>
                </div>

                {/* Quick Actions */}
                <div style={styles.quickActions}>
                    <h3 style={styles.sectionTitle}>Quick Actions</h3>
                    <div style={styles.actionGrid}>
                        <button onClick={() => navigate('/pets')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>🐾</div>
                            <div style={styles.actionTitle}>My Pets</div>
                            <div style={styles.actionSubtitle}>{pets.length} pet{pets.length !== 1 ? 's' : ''}</div>
                        </button>
                        <button onClick={() => navigate('/dashboard')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>📊</div>
                            <div style={styles.actionTitle}>Health Records</div>
                            <div style={styles.actionSubtitle}>Track wellness</div>
                        </button>
                        <button onClick={() => navigate('/profile')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>👤</div>
                            <div style={styles.actionTitle}>My Profile</div>
                            <div style={styles.actionSubtitle}>Account settings</div>
                        </button>
                        <button onClick={() => navigate('/pets/add')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>➕</div>
                            <div style={styles.actionTitle}>Add Pet</div>
                            <div style={styles.actionSubtitle}>New companion</div>
                        </button>
                    </div>
                </div>

                {/* Your Pets Section */}
                <div style={styles.petsSection}>
                    <h3 style={styles.sectionTitle}>Your Pets</h3>
                    {pets.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p style={styles.emptyStateText}>🐾 No pets yet. Add your first companion!</p>
                            <button onClick={() => navigate('/pets/add')} style={styles.addPetCTA}>
                                Add Your First Pet
                            </button>
                        </div>
                    ) : (
                        <div style={styles.petsGridLayout}>
                            {pets.map((pet) => (
                                <div key={pet.id} style={styles.petCardWrapper}>
                                    <div style={styles.petCardInner}>
                                        <div style={styles.petImageContainer}>
                                            {pet.imageUrl ? (
                                                <img src={pet.imageUrl} alt={pet.name} style={styles.petImage} />
                                            ) : (
                                                <div style={styles.petPlaceholder}>
                                                    {pet.species === 'Dog' ? '🐕' : 
                                                     pet.species === 'Cat' ? '🐱' : 
                                                     pet.species === 'Bird' ? '🦜' : 
                                                     pet.species === 'Rabbit' ? '🐰' : 
                                                     pet.species === 'Fish' ? '🐟' : '🐾'}
                                                </div>
                                            )}
                                        </div>
                                        <div style={styles.petDetails}>
                                            <h4 style={styles.petTitle}>{pet.name}</h4>
                                            <p style={styles.petSubtitle}>{pet.species}{pet.breed ? ` • ${pet.breed}` : ''}</p>
                                            <div style={styles.petButtonRow}>
                                                <button 
                                                    onClick={() => navigate(`/pets/edit/${pet.id}`)}
                                                    style={styles.petSmallButton}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/pets/${pet.id}/health`)}
                                                    style={{...styles.petSmallButton, ...styles.healthBtn}}
                                                >
                                                    📊 Health
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Grid - Pets and Activities */}
                <div style={styles.mainGrid}>
                    <div style={styles.rightColumn}>
                        <h3 style={styles.sectionTitle}>Recent Activities</h3>
                        {recentActivities.length === 0 ? (
                            <div style={styles.emptyActivities}>
                                <p style={styles.emptyText}>No recent activities</p>
                            </div>
                        ) : (
                            <div style={styles.activitiesList}>
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} style={styles.activityItem}>
                                        <div style={styles.activityIcon}>{activity.icon}</div>
                                        <div style={styles.activityContent}>
                                            <div style={styles.activityPetName}>{activity.petName}</div>
                                            <div style={styles.activityDescription}>{activity.description}</div>
                                            <div style={styles.activityDate}>{formatActivityTimestamp(activity.timestamp)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <LogoutModal 
                isOpen={showLogoutModal}
                onConfirm={confirmLogout}
                onCancel={cancelLogout}
            />
        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: '100vh',
        background: 'var(--app-bg)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        paddingBottom: '40px'
    },
    navbar: {
        backgroundColor: 'var(--card-bg)',
        backdropFilter: 'blur(10px)',
        borderBottom: 'none',
        padding: '18px 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    },
    navbarContent: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    navbarBrand: {
        display: 'flex',
        alignItems: 'center'
    },
    brandTitle: {
        margin: 0,
        fontSize: '26px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    navbarActions: {
        display: 'flex',
        gap: '12px'
    },
    profileButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        transition: 'all 0.3s ease'
    },
    logoutButton: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)',
        transition: 'all 0.3s ease'
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--app-bg)'
    },
    loadingText: {
        fontSize: '20px',
        color: 'var(--text-primary)',
        fontWeight: '600'
    },
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '40px 20px'
    },
    welcomeSection: {
        marginBottom: '40px',
        textAlign: 'center',
        animation: 'fadeInDown 0.6s ease-out'
    },
    welcomeTitle: {
        fontSize: '38px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 12px 0',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    welcomeSubtitle: {
        fontSize: '18px',
        color: 'var(--text-muted)',
        margin: 0,
        fontWeight: '300'
    },
    quickActions: {
        marginBottom: '40px',
        animation: 'fadeInUp 0.6s ease-out'
    },
    sectionTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '20px',
        textShadow: '0 2px 8px rgba(0,0,0,0.15)'
    },
    actionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
    },
    actionCard: {
        backgroundColor: 'var(--card-bg)',
        border: 'none',
        borderRadius: '20px',
        padding: '30px 20px',
        cursor: 'pointer',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
    },
    actionIcon: {
        fontSize: '48px'
    },
    actionTitle: {
        fontSize: '18px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    actionSubtitle: {
        fontSize: '14px',
        color: 'var(--text-muted)',
        fontWeight: '500'
    },
    mainContent: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '30px',
        animation: 'fadeInUp 0.8s ease-out'
    },
    leftColumn: {},
    rightColumn: {},
    emptyState: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    },
    emptyStateText: {
        fontSize: '16px',
        color: 'var(--text-secondary)',
        margin: '0 0 20px 0',
        fontWeight: '500'
    },
    emptyIcon: {
        fontSize: '64px',
        margin: '0 0 20px 0'
    },
    emptyText: {
        fontSize: '18px',
        color: 'var(--text-muted)',
        margin: '0 0 30px 0',
        fontWeight: '500'
    },
    addPetButton: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        padding: '14px 32px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '700',
        boxShadow: '0 8px 20px rgba(17, 153, 142, 0.3)',
        transition: 'all 0.3s ease'
    },
    petsGridLayout: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '24px',
        marginTop: '20px'
    },
    petCardWrapper: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        transition: 'all 0.3s ease',
        border: '1px solid var(--card-border)',
        cursor: 'pointer'
    },
    petCardInner: {
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    },
    petImageContainer: {
        width: '100%',
        height: '160px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'rgba(102, 126, 234, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '14px'
    },
    petImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    petPlaceholder: {
        fontSize: '64px',
        lineHeight: 1
    },
    petDetails: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    petTitle: {
        fontSize: '17px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 4px 0',
        lineHeight: 1.2
    },
    petSubtitle: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        margin: '0 0 12px 0',
        fontWeight: '500'
    },
    petButtonRow: {
        display: 'flex',
        gap: '10px',
        marginTop: 'auto'
    },
    petSmallButton: {
        flex: 1,
        padding: '10px 14px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.2s ease'
    },
    healthBtn: {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        boxShadow: '0 4px 12px rgba(250, 112, 154, 0.3)'
    },
    addPetCTA: {
        marginTop: '20px',
        padding: '14px 28px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease'
    },
    petActions: {
        display: 'flex',
        gap: '10px'
    },
    petActionButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        flex: 1,
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease'
    },
    healthActionButton: {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
    },
    activitiesList: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    },
    activityItem: {
        display: 'flex',
        gap: '14px',
        padding: '16px 0',
        borderBottom: '1px solid var(--card-border)'
    },
    activityIcon: {
        fontSize: '28px',
        flexShrink: 0
    },
    activityContent: {
        flex: 1
    },
    activityPetName: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '5px'
    },
    activityDescription: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '5px'
    },
    activityDate: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontWeight: '600'
    },
    emptyActivities: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    }
};

export default Dashboard;