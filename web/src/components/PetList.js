import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ActivityService from '../services/activity.service';

const PetList = () => {
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchPets();
    }, [navigate]);

    const fetchPets = async () => {
        try {
            // FRS Requirement: View Pet Profiles
            // In production: GET /api/pets
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                setPets(response.data);
            }
        } catch (err) {
            // For now, use mock data since backend isn't ready
            const mockPets = [
                {
                    id: 1,
                    name: 'Max',
                    species: 'Dog',
                    breed: 'Golden Retriever',
                    dateOfBirth: '2020-05-15',
                    gender: 'Male',
                    weight: 30.5,
                    color: 'Golden'
                },
                {
                    id: 2,
                    name: 'Luna',
                    species: 'Cat',
                    breed: 'Persian',
                    dateOfBirth: '2021-08-20',
                    gender: 'Female',
                    weight: 4.2,
                    color: 'White'
                }
            ];
            setPets(mockPets);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePet = async (petId, petName) => {
        if (!window.confirm(`Are you sure you want to delete ${petName}'s profile?`)) {
            return;
        }

        try {
            // In production: DELETE /api/pets/{id}
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8080/api/pets/${petId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage(`${petName}'s profile has been deleted successfully!`);
            setMessageType('success');
            ActivityService.logActivity({
                type: 'petDeleted',
                description: `Deleted ${petName}'s profile`,
                icon: '🗑️',
                meta: { petName }
            });
            fetchPets();
        } catch (err) {
            // For now, simulate success
            setPets(pets.filter(pet => pet.id !== petId));
            setMessage(`${petName}'s profile has been deleted! (Frontend only - backend pending)`);
            setMessageType('success');
            ActivityService.logActivity({
                type: 'petDeleted',
                description: `Deleted ${petName}'s profile`,
                icon: '🗑️',
                meta: { petName }
            });
        }
    };

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'Unknown';
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age > 0 ? `${age} year${age !== 1 ? 's' : ''}` : 'Less than 1 year';
    };

    if (isLoading) {
        return (
            <div style={styles.pageContainer}>
                <div style={styles.loadingContainer}>
                    <p style={styles.loadingText}>Loading your pets...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            <div style={styles.container}>
                <div style={styles.headerSection}>
                    <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
                        ← Back to Dashboard
                    </button>
                    <div style={styles.headerContent}>
                        <div>
                            <h1 style={styles.title}>My Pets</h1>
                            <p style={styles.subtitle}>Manage your pet profiles and health records</p>
                        </div>
                        <button onClick={() => navigate('/pets/add')} style={styles.addButton}>
                            + Add New Pet
                        </button>
                    </div>
                </div>

                {message && (
                    <div style={{
                        ...styles.messageBox,
                        backgroundColor: messageType === 'success' ? '#d4edda' : '#f8d7da',
                        color: messageType === 'success' ? '#155724' : '#721c24',
                        borderColor: messageType === 'success' ? '#c3e6cb' : '#f5c6cb'
                    }}>
                        {message}
                    </div>
                )}

                {pets.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}>🐾</div>
                        <h2 style={styles.emptyTitle}>No pets yet</h2>
                        <p style={styles.emptyText}>Start by adding your first pet profile!</p>
                        <button onClick={() => navigate('/pets/add')} style={styles.emptyButton}>
                            Add Your First Pet
                        </button>
                    </div>
                ) : (
                    <div style={styles.petGrid}>
                        {pets.map((pet) => (
                            <div key={pet.id} style={styles.petCard}>
                                <div style={styles.petHeader}>
                                    <div style={styles.petImageWrap}>
                                        {pet.imageUrl ? (
                                            <img src={pet.imageUrl} alt={pet.name} style={styles.petImage} />
                                        ) : (
                                            <div style={styles.petImageFallback}>
                                                {pet.species === 'Dog' ? '🐕' : 
                                                 pet.species === 'Cat' ? '🐱' : 
                                                 pet.species === 'Bird' ? '🦜' : 
                                                 pet.species === 'Rabbit' ? '🐰' : 
                                                 pet.species === 'Fish' ? '🐟' : '🐾'}
                                            </div>
                                        )}
                                    </div>
                                    <div style={styles.petBasicInfo}>
                                        <h3 style={styles.petName}>{pet.name}</h3>
                                        <p style={styles.petBreed}>{pet.breed || pet.species}</p>
                                    </div>
                                </div>

                                <div style={styles.petDetails}>
                                    <div style={styles.detailRow}>
                                        <span style={styles.detailLabel}>Species:</span>
                                        <span style={styles.detailValue}>{pet.species}</span>
                                    </div>
                                    {pet.gender && (
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Gender:</span>
                                            <span style={styles.detailValue}>{pet.gender}</span>
                                        </div>
                                    )}
                                    {pet.dateOfBirth && (
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Age:</span>
                                            <span style={styles.detailValue}>{calculateAge(pet.dateOfBirth)}</span>
                                        </div>
                                    )}
                                    {pet.weight && (
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Weight:</span>
                                            <span style={styles.detailValue}>{pet.weight} kg</span>
                                        </div>
                                    )}
                                    {pet.color && (
                                        <div style={styles.detailRow}>
                                            <span style={styles.detailLabel}>Color:</span>
                                            <span style={styles.detailValue}>{pet.color}</span>
                                        </div>
                                    )}
                                </div>

                                <div style={styles.petActions}>
                                    <button 
                                        onClick={() => navigate(`/pets/edit/${pet.id}`)}
                                        style={styles.editButton}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => navigate(`/pets/${pet.id}/health`)}
                                        style={styles.healthButton}
                                    >
                                        Health Records
                                    </button>
                                    <button 
                                        onClick={() => handleDeletePet(pet.id, pet.name)}
                                        style={styles.deleteButton}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: '100vh',
        background: 'var(--app-bg)',
        padding: '40px 20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    container: {
        maxWidth: '1200px',
        margin: '0 auto'
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
    headerSection: {
        marginBottom: '40px',
        animation: 'fadeInDown 0.6s ease-out'
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
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px'
    },
    title: {
        fontSize: '40px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '10px 0',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    subtitle: {
        fontSize: '18px',
        color: 'var(--text-muted)',
        margin: '5px 0',
        fontWeight: '300'
    },
    addButton: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        padding: '14px 32px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(17, 153, 142, 0.3)',
        transition: 'all 0.3s ease'
    },
    messageBox: {
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '25px',
        border: 'none',
        fontSize: '15px',
        fontWeight: '500',
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        animation: 'fadeIn 0.3s ease-in'
    },
    emptyState: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '24px',
        padding: '80px 40px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.5s ease-out'
    },
    emptyIcon: {
        fontSize: '80px',
        marginBottom: '24px'
    },
    emptyTitle: {
        fontSize: '28px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '12px'
    },
    emptyText: {
        fontSize: '17px',
        color: 'var(--text-muted)',
        marginBottom: '30px',
        fontWeight: '500'
    },
    emptyButton: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        padding: '16px 32px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 8px 20px rgba(17, 153, 142, 0.3)',
        transition: 'all 0.3s ease'
    },
    petGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '24px',
        animation: 'fadeInUp 0.6s ease-out'
    },
    petCard: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease'
    },
    petHeader: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '2px solid var(--card-border)'
    },
    petImageWrap: {
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        backgroundColor: 'rgba(102, 126, 234, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginRight: '16px'
    },
    petImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    petImageFallback: {
        fontSize: '28px'
    },
    petBasicInfo: {
        flex: 1
    },
    petName: {
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 6px 0'
    },
    petBreed: {
        fontSize: '15px',
        color: 'var(--text-muted)',
        margin: 0,
        fontWeight: '500'
    },
    petDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '20px',
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
        padding: '16px',
        borderRadius: '14px'
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '15px'
    },
    detailLabel: {
        fontWeight: '700',
        color: 'var(--text-muted)'
    },
    detailValue: {
        color: 'var(--text-primary)',
        fontWeight: '600'
    },
    petActions: {
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
    },
    editButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        flex: 1,
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease'
    },
    healthButton: {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        flex: 1,
        boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)',
        transition: 'all 0.3s ease'
    },
    deleteButton: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)',
        transition: 'all 0.3s ease'
    }
};

export default PetList;
