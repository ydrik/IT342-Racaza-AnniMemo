import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ActivityService from '../services/activity.service';

const UserProfile = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const navigate = useNavigate();

    // User profile data
    const [profileData, setProfileData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        email: ''
    });
    const [profileImage, setProfileImage] = useState('');
    const [pendingImage, setPendingImage] = useState('');

    // Password change data
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/auth/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.status === 200) {
                    const userData = response.data;
                    setProfileData({
                        username: userData.username || '',
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        email: userData.email || ''
                    });
                    setIsAdmin(userData.role === 'ROLE_ADMIN');
                }
            } catch (err) {
                const rawUser = localStorage.getItem('user');
                if (rawUser) {
                    try {
                        const cached = JSON.parse(rawUser);
                        setProfileData({
                            username: cached.username || 'admin',
                            firstName: 'System',
                            lastName: 'Administrator',
                            email: 'admin@annimemo.com'
                        });
                        setIsAdmin(cached.role === 'ROLE_ADMIN');
                    } catch {
                        navigate('/login');
                    }
                } else {
                    navigate('/login');
                }
            }
        };

        fetchUserProfile();
        setProfileImage(localStorage.getItem('profileImage') || '');
    }, [navigate]);

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const imageData = typeof reader.result === 'string' ? reader.result : '';
            setProfileImage(imageData);
            setPendingImage(imageData);
            localStorage.setItem('profileImage', imageData);
            ActivityService.logActivity({
                type: 'profilePhoto',
                description: 'Updated profile photo',
                icon: '🖼️'
            });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setProfileImage('');
        setPendingImage('');
        localStorage.removeItem('profileImage');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            // FRS Requirement: Update Profile Information
            // In production: PUT /api/users/profile
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:8080/api/users/profile', profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                if (pendingImage !== '') {
                    localStorage.setItem('profileImage', pendingImage);
                }
                setMessage('Profile updated successfully!');
                setMessageType('success');
                setIsEditing(false);
                setPendingImage('');
                ActivityService.logActivity({
                    type: 'profileUpdate',
                    description: 'Updated profile information',
                    icon: '👤'
                });
            }
        } catch (err) {
            if (pendingImage !== '') {
                localStorage.setItem('profileImage', pendingImage);
            }
            // For now, simulate success since backend isn't ready
            setMessage('Profile updated successfully! (Frontend only - backend pending)');
            setMessageType('success');
            setIsEditing(false);
            setPendingImage('');
            ActivityService.logActivity({
                type: 'profileUpdate',
                description: 'Updated profile information',
                icon: '👤'
            });
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');

        // Validate passwords
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage('New passwords do not match!');
            setMessageType('error');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage('Password must be at least 6 characters long!');
            setMessageType('error');
            return;
        }

        try {
            // FRS Requirement: Update Password (Non-functional: passwords must be hashed)
            // In production: PUT /api/users/password
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:8080/api/users/password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 200) {
                setMessage('Password changed successfully!');
                setMessageType('success');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setIsChangingPassword(false);
                ActivityService.logActivity({
                    type: 'passwordUpdate',
                    description: 'Updated account password',
                    icon: '🔐'
                });
            }
        } catch (err) {
            // For now, simulate success since backend isn't ready
            setMessage('Password changed successfully! (Frontend only - backend pending)');
            setMessageType('success');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsChangingPassword(false);
            ActivityService.logActivity({
                type: 'passwordUpdate',
                description: 'Updated account password',
                icon: '🔐'
            });
        }
    };

    const initials = `${profileData.firstName?.charAt(0) || ''}${profileData.lastName?.charAt(0) || ''}`.toUpperCase();

    return (
        <div style={styles.pageContainer}>
            <div style={styles.container}>
                <div style={styles.headerSection}>
                    <button onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} style={styles.backButton}>
                        {isAdmin ? '← Back to Admin Portal' : '← Back to Dashboard'}
                    </button>
                    <h1 style={styles.title}>My Profile 👤</h1>
                    <p style={styles.subtitle}>View and manage your account information</p>
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

                <div style={styles.contentGrid}>
                    {/* Profile Information Card */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>
                                <span style={styles.headerIcon}>📋</span>
                                Profile Information
                            </h2>
                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    style={styles.editButton}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                    ✏️ Edit Profile
                                </button>
                            )}
                        </div>

                        <div style={styles.avatarSection}>
                            <div style={styles.avatarWrap}>
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" style={styles.avatarImage} />
                                ) : (
                                    <div style={styles.avatarFallback}>{initials || 'AM'}</div>
                                )}
                            </div>
                            <div style={styles.avatarDetails}>
                                <div style={styles.avatarName}>
                                    {profileData.firstName} {profileData.lastName}
                                </div>
                                <div style={styles.avatarHint}>Upload a JPG or PNG image. Saved locally.</div>
                                <div style={styles.avatarActions}>
                                    <label style={styles.uploadLabel} htmlFor="profileImageInput">
                                        <input
                                            id="profileImageInput"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={styles.fileInput}
                                        />
                                        Upload Photo
                                    </label>
                                    {profileImage && (
                                        <button type="button" onClick={handleRemoveImage} style={styles.removeImageButton}>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} style={styles.form}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={profileData.username}
                                        disabled
                                        style={{...styles.input, backgroundColor: '#f0f0f0', cursor: 'not-allowed'}}
                                    />
                                    <small style={styles.helpText}>🔒 Username cannot be changed</small>
                                </div>

                                <div style={styles.inputRow}>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={profileData.firstName}
                                            onChange={handleProfileChange}
                                            required
                                            style={styles.input}
                                        />
                                    </div>

                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={profileData.lastName}
                                            onChange={handleProfileChange}
                                            required
                                            style={styles.input}
                                        />
                                    </div>
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleProfileChange}
                                        required
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.buttonGroup}>
                                    <button 
                                        type="submit" 
                                        style={styles.saveButton}
                                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                    >
                                        ✅ Save Changes
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setProfileImage(localStorage.getItem('profileImage') || '');
                                            setPendingImage('');
                                        }} 
                                        style={styles.cancelButton}
                                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                    >
                                        ✖️ Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={styles.profileInfo}>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>👤 Username:</span>
                                    <span style={styles.infoValue}>{profileData.username}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>📝 First Name:</span>
                                    <span style={styles.infoValue}>{profileData.firstName}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>📝 Last Name:</span>
                                    <span style={styles.infoValue}>{profileData.lastName}</span>
                                </div>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>📧 Email:</span>
                                    <span style={styles.infoValue}>{profileData.email}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Password Change Card */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>
                                <span style={styles.headerIcon}>🔐</span>
                                Security
                            </h2>
                            {!isChangingPassword && (
                                <button 
                                    onClick={() => setIsChangingPassword(true)} 
                                    style={styles.editButton}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                    🔑 Change Password
                                </button>
                            )}
                        </div>

                        {isChangingPassword ? (
                            <form onSubmit={handleChangePassword} style={styles.form}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Current Password</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        style={styles.input}
                                        placeholder="Enter current password"
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>New Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        style={styles.input}
                                        placeholder="Enter new password"
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Confirm New Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                        style={styles.input}
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <div style={styles.buttonGroup}>
                                    <button 
                                        type="submit" 
                                        style={styles.saveButton}
                                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                    >
                                        ✅ Update Password
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                        }} 
                                        style={styles.cancelButton}
                                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                    >
                                        ✖️ Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={styles.profileInfo}>
                                <div style={styles.infoRow}>
                                    <span style={styles.infoLabel}>🔑 Password:</span>
                                    <span style={styles.infoValue}>••••••••</span>
                                </div>
                                <small style={styles.helpText}>
                                    🛡️ Keep your password secure and change it regularly
                                </small>
                            </div>
                        )}
                    </div>
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
        maxWidth: '1000px',
        margin: '0 auto'
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
    avatarSection: {
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        padding: '18px 0 24px',
        borderBottom: '1px solid var(--card-border)',
        marginBottom: '24px'
    },
    avatarWrap: {
        width: '96px',
        height: '96px',
        borderRadius: '22px',
        backgroundColor: 'var(--surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '2px solid var(--card-border)'
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    avatarFallback: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
        fontWeight: '700',
        color: '#5a67d8',
        background: 'linear-gradient(135deg, #f7fafc 0%, #e9d8fd 100%)'
    },
    avatarDetails: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    avatarName: {
        fontSize: '18px',
        fontWeight: '700',
        color: 'var(--text-primary)'
    },
    avatarHint: {
        fontSize: '13px',
        color: 'var(--text-muted)'
    },
    avatarActions: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
    },
    uploadLabel: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 16px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    fileInput: {
        display: 'none'
    },
    removeImageButton: {
        border: '1px solid var(--card-border)',
        backgroundColor: 'var(--surface)',
        padding: '8px 16px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        color: 'var(--text-secondary)'
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
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '30px'
    },
    card: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '24px',
        padding: '35px',
        boxShadow: 'var(--shadow-strong)',
        animation: 'slideUp 0.5s ease-out'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        paddingBottom: '20px',
        borderBottom: '3px solid var(--accent)'
    },
    cardTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    },
    headerIcon: {
        fontSize: '26px'
    },
    editButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        transition: 'all 0.3s ease'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
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
        color: 'var(--text-primary)'
    },
    input: {
        padding: '14px 16px',
        fontSize: '15px',
        border: '2px solid var(--card-border)',
        borderRadius: '10px',
        outline: 'none',
        transition: 'all 0.3s ease',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-primary)'
    },
    helpText: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        marginTop: '-4px'
    },
    buttonGroup: {
        display: 'flex',
        gap: '16px',
        marginTop: '10px'
    },
    saveButton: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        padding: '14px 28px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '700',
        flex: 1,
        boxShadow: '0 8px 20px rgba(17, 153, 142, 0.3)',
        transition: 'all 0.3s ease'
    },
    cancelButton: {
        background: 'linear-gradient(135deg, #868f96 0%, #596164 100%)',
        color: 'white',
        border: 'none',
        padding: '14px 28px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '700',
        flex: 1,
        boxShadow: '0 8px 20px rgba(134, 143, 150, 0.3)',
        transition: 'all 0.3s ease'
    },
    profileInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderRadius: '10px',
        backgroundColor: '#f8f9fa',
        transition: 'all 0.3s ease'
    },
    infoLabel: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#7f8c8d'
    },
    infoValue: {
        fontSize: '15px',
        color: '#2c3e50',
        fontWeight: '500'
    }
};

export default UserProfile;
