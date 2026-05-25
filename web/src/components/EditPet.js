import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ActivityService from '../services/activity.service';

const EditPet = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // FRS Requirement: Update Pet Profiles
    const [petData, setPetData] = useState({
        name: '',
        species: '',
        breed: '',
        dateOfBirth: '',
        gender: '',
        weight: '',
        color: '',
        imageUrl: '',
        notes: ''
    });

    const [imagePreview, setImagePreview] = useState(null);

    // Breed options based on species
    const breedOptions = {
        Dog: ['Golden Retriever', 'Labrador Retriever', 'German Shepherd', 'Bulldog', 'Beagle', 'Poodle', 'Rottweiler', 'Yorkshire Terrier', 'Boxer', 'Dachshund', 'Siberian Husky', 'Shih Tzu', 'Chihuahua', 'Other'],
        Cat: ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'British Shorthair', 'Sphynx', 'Scottish Fold', 'Abyssinian', 'American Shorthair', 'Other'],
        Bird: ['Parrot', 'Cockatiel', 'Parakeet', 'Canary', 'Finch', 'Lovebird', 'Macaw', 'Budgie', 'Other'],
        Rabbit: ['Holland Lop', 'Netherland Dwarf', 'Flemish Giant', 'Mini Rex', 'Lionhead', 'Dutch', 'Other'],
        Hamster: ['Syrian', 'Dwarf Campbell Russian', 'Dwarf Winter White Russian', 'Roborovski', 'Chinese', 'Other'],
        Fish: ['Goldfish', 'Betta', 'Guppy', 'Angel Fish', 'Tetra', 'Molly', 'Koi', 'Other'],
        Other: ['Mixed Breed', 'Unknown', 'Other']
    };

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchPetData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate]);

    const fetchPetData = async () => {
        try {
            // In production: GET /api/pets/{id}
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/pets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                setPetData(response.data);
                setImagePreview(response.data.imageUrl || null);
            }
        } catch (err) {
            // Load from localStorage fallback
            const existingPets = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
            const foundPet = existingPets.find(p => String(p.id) === String(id));
            if (foundPet) {
                setPetData(foundPet);
                setImagePreview(foundPet.imageUrl || null);
            } else {
                setMessage('Pet profile not found in local storage.');
                setMessageType('error');
                setTimeout(() => {
                    navigate('/pets');
                }, 2000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Reset breed when species changes
        if (name === 'species') {
            setPetData({ ...petData, species: value, breed: '' });
        } else {
            setPetData({ ...petData, [name]: value });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSizeBytes = 2 * 1024 * 1024;
            if (file.size > maxSizeBytes) {
                setMessage('Image must be 2MB or less. Please choose a smaller file.');
                setMessageType('error');
                return;
            }
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setPetData({ ...petData, imageUrl: reader.result });
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setPetData({ ...petData, imageUrl: '' });
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Date of Birth validation
        const dob = petData.dateOfBirth;
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            const minDate = new Date();
            minDate.setFullYear(today.getFullYear() - 35); // Realistic max pet age is 35 years

            if (birthDate > today) {
                setMessage('Date of Birth cannot be in the future.');
                setMessageType('error');
                return;
            }
            if (birthDate < minDate) {
                setMessage('Please enter a realistic Date of Birth (maximum 35 years ago).');
                setMessageType('error');
                return;
            }
        }

        setIsSaving(true);

        try {
            // FRS Requirement: Update Pet Profile
            // In production: PUT /api/pets/{id}
            const token = localStorage.getItem('token');
            const response = await axios.put(`http://localhost:8080/api/pets/${id}`, petData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                setMessage('Pet profile updated successfully!');
                setMessageType('success');
                ActivityService.logActivity({
                    type: 'petUpdated',
                    description: `Updated ${petData.name}'s profile` ,
                    icon: '📝',
                    meta: { petName: petData.name }
                });
                setTimeout(() => {
                    navigate('/pets');
                }, 1500);
            }
        } catch (err) {
            // Update in localStorage fallback
            const existingPets = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
            const updatedPets = existingPets.map(p => {
                if (String(p.id) === String(id)) {
                    return { ...p, ...petData };
                }
                return p;
            });
            localStorage.setItem('annimemo_pets', JSON.stringify(updatedPets));

            setMessage('Pet profile updated successfully! (Frontend only - backend pending)');
            setMessageType('success');
            ActivityService.logActivity({
                type: 'petUpdated',
                description: `Updated ${petData.name}'s profile`,
                icon: '📝',
                meta: { petName: petData.name }
            });
            setTimeout(() => {
                navigate('/pets');
            }, 1500);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div style={styles.pageContainer}>
                <div style={styles.loadingContainer}>
                    <p style={styles.loadingText}>🔄 Loading pet information...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            <div style={styles.container}>
                <div style={styles.headerSection}>
                    <button onClick={() => navigate('/pets')} style={styles.backButton}>
                        ← Back to My Pets
                    </button>
                    <h1 style={styles.title}>Edit Pet Profile 📝</h1>
                    <p style={styles.subtitle}>Update {petData.name}'s information</p>
                </div>

                {message && (
                    <div style={{
                        ...styles.messageBox,
                        backgroundColor: messageType === 'success' ? '#d1f2eb' : '#f8d7da',
                        color: messageType === 'success' ? '#0c5e47' : '#721c24',
                        borderLeft: messageType === 'success' ? '4px solid #0c5e47' : '4px solid #721c24'
                    }}>
                        {message}
                    </div>
                )}

                <div style={styles.card}>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>
                                <span style={styles.sectionIcon}>📝</span>
                                Basic Information
                            </h3>
                            
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>
                                    Pet Name <span style={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={petData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Max, Bella, Charlie"
                                    style={styles.input}
                                />
                            </div>

                            <div style={styles.inputRow}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>
                                        Species <span style={styles.required}>*</span>
                                    </label>
                                    <select
                                        name="species"
                                        value={petData.species}
                                        onChange={handleChange}
                                        required
                                        style={styles.select}
                                    >
                                        <option value="">Select species</option>
                                        <option value="Dog">🐕 Dog</option>
                                        <option value="Cat">🐱 Cat</option>
                                        <option value="Bird">🦜 Bird</option>
                                        <option value="Rabbit">🐰 Rabbit</option>
                                        <option value="Hamster">🐹 Hamster</option>
                                        <option value="Fish">🐟 Fish</option>
                                        <option value="Other">🐾 Other</option>
                                    </select>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Breed</label>
                                    <select
                                        name="breed"
                                        value={petData.breed}
                                        onChange={handleChange}
                                        style={styles.select}
                                        disabled={!petData.species}
                                    >
                                        <option value="">Select breed</option>
                                        {petData.species && breedOptions[petData.species]?.map((breed) => (
                                            <option key={breed} value={breed}>{breed}</option>
                                        ))}
                                    </select>
                                    {!petData.species && (
                                        <small style={styles.helpText}>Please select a species first</small>
                                    )}
                                </div>
                            </div>

                            <div style={styles.inputRow}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={petData.dateOfBirth}
                                        onChange={handleChange}
                                        min="1990-01-01"
                                        max={new Date().toISOString().split('T')[0]}
                                        onKeyDown={(e) => e.preventDefault()}
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Gender</label>
                                    <select
                                        name="gender"
                                        value={petData.gender}
                                        onChange={handleChange}
                                        style={styles.select}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="Male">♂️ Male</option>
                                        <option value="Female">♀️ Female</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>
                                <span style={styles.sectionIcon}>📊</span>
                                Physical Details
                            </h3>

                            <div style={styles.inputRow}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Weight (kg)</label>
                                    <input
                                        type="number"
                                        name="weight"
                                        value={petData.weight}
                                        onChange={handleChange}
                                        placeholder="e.g., 25.5"
                                        step="0.1"
                                        min="0"
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Color</label>
                                    <select
                                        name="color"
                                        value={petData.color}
                                        onChange={handleChange}
                                        style={styles.select}
                                    >
                                        <option value="">Select color</option>
                                        <option value="Black">Black</option>
                                        <option value="White">White</option>
                                        <option value="Brown">Brown</option>
                                        <option value="Golden">Golden</option>
                                        <option value="Yellow">Yellow</option>
                                        <option value="Cream">Cream</option>
                                        <option value="Grey">Grey</option>
                                        <option value="Orange">Orange</option>
                                        <option value="Red">Red</option>
                                        <option value="Blue">Blue</option>
                                        <option value="Green">Green</option>
                                        <option value="Silver">Silver</option>
                                        <option value="Fawn">Fawn</option>
                                        <option value="Brindle">Brindle</option>
                                        <option value="Calico">Calico</option>
                                        <option value="Tuxedo">Tuxedo</option>
                                        <option value="Tortoiseshell">Tortoiseshell</option>
                                        <option value="Multicolor">Multicolor</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>
                                <span style={styles.sectionIcon}>�</span>
                                Pet Photo
                            </h3>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Upload Pet Image</label>
                                
                                {!imagePreview ? (
                                    <div style={styles.imageUploadContainer}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={styles.fileInput}
                                            id="petImage"
                                        />
                                        <label htmlFor="petImage" style={styles.fileLabel}>
                                            <span style={styles.uploadIcon}>📷</span>
                                            <span style={styles.uploadText}>Click to upload pet photo</span>
                                            <span style={styles.uploadSubtext}>JPG, PNG, or GIF (Max 2MB)</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div style={styles.imagePreviewContainer}>
                                        <img src={imagePreview} alt="Pet preview" style={styles.imagePreview} />
                                        <button 
                                            type="button" 
                                            onClick={removeImage}
                                            style={styles.removeImageButton}
                                        >
                                            ✕ Remove Image
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={styles.section}>
                            <h3 style={styles.sectionTitle}>
                                <span style={styles.sectionIcon}>�📄</span>
                                Additional Information
                            </h3>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Notes</label>
                                <textarea
                                    name="notes"
                                    value={petData.notes}
                                    onChange={handleChange}
                                    placeholder="Any additional information about your pet..."
                                    rows="4"
                                    style={styles.textarea}
                                />
                            </div>
                        </div>

                        <div style={styles.buttonGroup}>
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                style={{
                                    ...styles.submitButton,
                                    opacity: isSaving ? 0.7 : 1,
                                    cursor: isSaving ? 'not-allowed' : 'pointer'
                                }}
                                onMouseEnter={(e) => !isSaving && (e.target.style.transform = 'translateY(-2px)')}
                                onMouseLeave={(e) => !isSaving && (e.target.style.transform = 'translateY(0)')}
                            >
                                {isSaving ? '🔄 Saving...' : '✅ Save Changes'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => navigate('/pets')}
                                style={styles.cancelButton}
                                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                                ✖️ Cancel
                            </button>
                        </div>
                    </form>
                </div>
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
        maxWidth: '900px',
        margin: '0 auto'
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
    },
    loadingText: {
        fontSize: '20px',
        color: 'white',
        fontWeight: '500'
    },
    headerSection: {
        marginBottom: '40px',
        textAlign: 'center'
    },
    backButton: {
        backgroundColor: 'transparent',
        border: 'none',
        color: 'var(--text-primary)',
        fontSize: '14px',
        cursor: 'pointer',
        marginBottom: '20px',
        padding: '10px 20px',
        fontWeight: '500',
        borderRadius: '20px',
        transition: 'all 0.3s ease'
    },
    title: {
        fontSize: '42px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '10px 0',
        textShadow: 'none'
    },
    subtitle: {
        fontSize: '18px',
        color: 'var(--text-secondary)',
        margin: '10px 0',
        fontWeight: '300'
    },
    messageBox: {
        padding: '16px 24px',
        borderRadius: '12px',
        marginBottom: '30px',
        fontSize: '15px',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        animation: 'fadeIn 0.3s ease-in'
    },
    card: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: 'var(--shadow-strong)',
        animation: 'slideUp 0.5s ease-out'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '35px'
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    sectionTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '10px',
        paddingBottom: '12px',
        borderBottom: '3px solid var(--accent)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    sectionIcon: {
        fontSize: '24px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    inputRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
    },
    label: {
        fontSize: '15px',
        fontWeight: '600',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    },
    required: {
        color: '#e74c3c',
        fontSize: '16px',
        fontWeight: '700'
    },
    input: {
        padding: '14px 16px',
        fontSize: '15px',
        border: '2px solid var(--card-border)',
        borderRadius: '10px',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'all 0.3s ease',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-primary)'
    },
    select: {
        padding: '14px 16px',
        fontSize: '15px',
        border: '2px solid var(--card-border)',
        borderRadius: '10px',
        outline: 'none',
        fontFamily: 'inherit',
        transition: 'all 0.3s ease',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-primary)',
        cursor: 'pointer'
    },
    textarea: {
        padding: '14px 16px',
        fontSize: '15px',
        border: '2px solid var(--card-border)',
        borderRadius: '10px',
        outline: 'none',
        fontFamily: 'inherit',
        resize: 'vertical',
        transition: 'all 0.3s ease',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-primary)',
        minHeight: '120px'
    },
    helpText: {
        fontSize: '13px',
        color: '#95a5a6',
        fontStyle: 'italic'
    },
    buttonGroup: {
        display: 'flex',
        gap: '16px',
        marginTop: '20px'
    },
    submitButton: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        padding: '16px 32px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        flex: 1,
        boxShadow: '0 8px 20px rgba(17, 153, 142, 0.3)',
        transition: 'all 0.3s ease'
    },
    cancelButton: {
        background: 'linear-gradient(135deg, #868f96 0%, #596164 100%)',
        color: 'white',
        border: 'none',
        padding: '16px 32px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        flex: 1,
        boxShadow: '0 8px 20px rgba(134, 143, 150, 0.3)',
        transition: 'all 0.3s ease'
    },
    imageUploadContainer: {
        position: 'relative'
    },
    fileInput: {
        display: 'none'
    },
    fileLabel: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        border: '3px dashed #667eea',
        borderRadius: '16px',
        backgroundColor: '#f8f9ff',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        gap: '10px'
    },
    uploadIcon: {
        fontSize: '48px'
    },
    uploadText: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#667eea'
    },
    uploadSubtext: {
        fontSize: '13px',
        color: '#95a5a6'
    },
    imagePreviewContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px'
    },
    imagePreview: {
        width: '100%',
        maxWidth: '400px',
        height: 'auto',
        maxHeight: '400px',
        objectFit: 'contain',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
    },
    removeImageButton: {
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '10px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
    }
};

export default EditPet;
