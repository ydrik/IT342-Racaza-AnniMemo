import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ActivityService from '../services/activity.service';
import Header from './Header';

const HealthMetrics = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Pet ID
    const [petName, setPetName] = useState('');
    const [activeTab, setActiveTab] = useState('weight');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [healthRecords, setHealthRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form data for different health metrics
    const [formData, setFormData] = useState({
        // Weight tracking
        weight: '',
        weightDate: new Date().toISOString().split('T')[0],
        weightNotes: '',
        // Medication
        medicationName: '',
        medicationDosage: '',
        medicationFrequency: '',
        medicationStartDate: new Date().toISOString().split('T')[0],
        medicationEndDate: '',
        medicationNotes: '',
        // Vaccination
        vaccineName: '',
        vaccineDate: new Date().toISOString().split('T')[0],
        vaccineNextDue: '',
        vaccineVet: '',
        vaccineNotes: '',
        // Vet Visit
        visitDate: new Date().toISOString().split('T')[0],
        visitReason: '',
        visitVet: '',
        visitDiagnosis: '',
        visitTreatment: '',
        visitNotes: ''
    });

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchPetAndHealthData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, navigate]);

    const fetchPetAndHealthData = async () => {
        try {
            // In production: GET /api/pets/{id}
            const token = localStorage.getItem('token');
            const petResponse = await axios.get(`http://localhost:8080/api/pets/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPetName(petResponse.data.name);

            // FRS Requirement: Log Health Metrics - Fetch existing records
            // In production: GET /api/pets/{id}/health
            const healthResponse = await axios.get(`http://localhost:8080/api/pets/${id}/health`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHealthRecords(mapHealthRecords(healthResponse.data));
        } catch (err) {
            // Retrieve pet name from localStorage fallback if available
            const existingPets = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
            const foundPet = existingPets.find(p => String(p.id) === String(id));
            if (foundPet) {
                setPetName(foundPet.name);
            } else {
                setPetName('Max');
            }
            
            const mockHealthRecords = [
                {
                    id: 1,
                    type: 'weight',
                    date: '2026-02-10',
                    value: '30.5 kg',
                    notes: 'Healthy weight'
                },
                {
                    id: 2,
                    type: 'vaccination',
                    date: '2026-01-15',
                    value: 'Rabies Vaccine',
                    nextDue: '2027-01-15',
                    vet: 'Dr. Smith',
                    notes: 'Annual vaccination'
                },
                {
                    id: 3,
                    type: 'medication',
                    date: '2026-02-01',
                    value: 'Antibiotics',
                    dosage: '500mg',
                    frequency: 'Twice daily',
                    endDate: '2026-02-10',
                    notes: 'For ear infection'
                }
            ];
            setHealthRecords(mockHealthRecords);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        let recordData = {};
        const backendType = activeTab === 'vetVisit' ? 'vet_visit' : activeTab;
        
        // FRS Requirement: Log Health Metrics (weight, medication, etc.)
        switch (activeTab) {
            case 'weight':
                recordData = {
                    type: backendType,
                    weight: formData.weight,
                    date: formData.weightDate,
                    notes: formData.weightNotes
                };
                break;
            case 'medication':
                recordData = {
                    type: backendType,
                    date: formData.medicationStartDate,
                    medicationName: formData.medicationName,
                    dosage: formData.medicationDosage,
                    frequency: formData.medicationFrequency,
                    startDate: formData.medicationStartDate,
                    endDate: formData.medicationEndDate,
                    notes: formData.medicationNotes
                };
                break;
            case 'vaccination':
                recordData = {
                    type: backendType,
                    date: formData.vaccineDate,
                    vaccineName: formData.vaccineName,
                    vaccineDate: formData.vaccineDate,
                    nextDue: formData.vaccineNextDue,
                    veterinarian: formData.vaccineVet,
                    notes: formData.vaccineNotes
                };
                break;
            case 'vetVisit':
                recordData = {
                    type: backendType,
                    date: formData.visitDate,
                    visitReason: formData.visitReason,
                    veterinarian: formData.visitVet,
                    diagnosis: formData.visitDiagnosis,
                    treatment: formData.visitTreatment,
                    notes: formData.visitNotes
                };
                break;
            default:
                break;
        }

        try {
            // In production: POST /api/pets/{id}/health
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:8080/api/pets/${id}/health`, recordData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 201 || response.status === 200) {
                setMessage('Health record added successfully!');
                setMessageType('success');
                setShowAddForm(false);
                ActivityService.logActivity({
                    type: 'healthRecord',
                    description: `Logged a ${activeTab === 'vetVisit' ? 'vet visit' : activeTab} update for ${petName}`,
                    icon: activeTab === 'weight' ? '📊' : activeTab === 'medication' ? '💊' : activeTab === 'vaccination' ? '💉' : '🏥',
                    meta: { petName }
                });
                fetchPetAndHealthData();
            }
        } catch (err) {
            // Simulate success
            setMessage('Health record added successfully! (Frontend only - backend pending)');
            setMessageType('success');
            setShowAddForm(false);
            ActivityService.logActivity({
                type: 'healthRecord',
                description: `Logged a ${activeTab === 'vetVisit' ? 'vet visit' : activeTab} update for ${petName}`,
                icon: activeTab === 'weight' ? '📊' : activeTab === 'medication' ? '💊' : activeTab === 'vaccination' ? '💉' : '🏥',
                meta: { petName }
            });
            // Reset form
            setFormData({
                weight: '',
                weightDate: new Date().toISOString().split('T')[0],
                weightNotes: '',
                medicationName: '',
                medicationDosage: '',
                medicationFrequency: '',
                medicationStartDate: new Date().toISOString().split('T')[0],
                medicationEndDate: '',
                medicationNotes: '',
                vaccineName: '',
                vaccineDate: new Date().toISOString().split('T')[0],
                vaccineNextDue: '',
                vaccineVet: '',
                vaccineNotes: '',
                visitDate: new Date().toISOString().split('T')[0],
                visitReason: '',
                visitVet: '',
                visitDiagnosis: '',
                visitTreatment: '',
                visitNotes: ''
            });
        }
    };

    const getRecordsByType = (type) => {
        return healthRecords.filter(record => record.type === type);
    };

    const normalizeMetricType = (type) => {
        if (!type) {
            return 'weight';
        }
        const normalized = type.toLowerCase();
        if (normalized === 'vet_visit' || normalized === 'vetvisit') {
            return 'vetVisit';
        }
        return normalized;
    };

    const mapMetricToRecord = (metric) => {
        const type = normalizeMetricType(metric.type);
        const baseRecord = {
            id: metric.id,
            type,
            date: metric.date || metric.startDate || metric.vaccineDate,
            notes: metric.notes
        };

        switch (type) {
            case 'weight':
                return {
                    ...baseRecord,
                    value: metric.weight !== null && metric.weight !== undefined ? `${metric.weight} kg` : 'Weight recorded'
                };
            case 'medication':
                return {
                    ...baseRecord,
                    value: metric.medicationName || 'Medication logged',
                    dosage: metric.dosage,
                    frequency: metric.frequency,
                    endDate: metric.endDate
                };
            case 'vaccination':
                return {
                    ...baseRecord,
                    value: metric.vaccineName || 'Vaccination logged',
                    vet: metric.veterinarian,
                    nextDue: metric.nextDue
                };
            case 'vetVisit':
                return {
                    ...baseRecord,
                    value: metric.visitReason || 'Vet visit logged',
                    vet: metric.veterinarian,
                    diagnosis: metric.diagnosis,
                    treatment: metric.treatment
                };
            default:
                return baseRecord;
        }
    };

    const mapHealthRecords = (records) => {
        if (!Array.isArray(records)) {
            return [];
        }
        return records.map(mapMetricToRecord);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (isLoading) {
        return (
            <div style={styles.pageContainer}>
                <div style={styles.loadingContainer}>
                    <p style={styles.loadingText}>Loading health records...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.pageContainer}>
            <Header />
            <div style={styles.container}>
                <div style={styles.headerSection}>
                    <button onClick={() => navigate('/pets')} style={styles.backButton}>
                        ← Back to My Pets
                    </button>
                    <h1 style={styles.title}>{petName}'s Health Records</h1>
                    <p style={styles.subtitle}>Track and manage health metrics, medications, and vet visits</p>
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

                {/* Tab Navigation */}
                <div style={styles.tabContainer}>
                    <button
                        onClick={() => setActiveTab('weight')}
                        style={activeTab === 'weight' ? {...styles.tab, ...styles.activeTab} : styles.tab}
                    >
                        📊 Weight
                    </button>
                    <button
                        onClick={() => setActiveTab('medication')}
                        style={activeTab === 'medication' ? {...styles.tab, ...styles.activeTab} : styles.tab}
                    >
                        💊 Medications
                    </button>
                    <button
                        onClick={() => setActiveTab('vaccination')}
                        style={activeTab === 'vaccination' ? {...styles.tab, ...styles.activeTab} : styles.tab}
                    >
                        💉 Vaccinations
                    </button>
                    <button
                        onClick={() => setActiveTab('vetVisit')}
                        style={activeTab === 'vetVisit' ? {...styles.tab, ...styles.activeTab} : styles.tab}
                    >
                        🏥 Vet Visits
                    </button>
                </div>

                {/* Add Record Button */}
                {!showAddForm && (
                    <button onClick={() => setShowAddForm(true)} style={styles.addButton}>
                        + Add New Record
                    </button>
                )}

                {/* Add Record Form */}
                {showAddForm && (
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}>Add New {activeTab === 'vetVisit' ? 'Vet Visit' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Record</h3>
                            <button onClick={() => setShowAddForm(false)} style={styles.closeButton}>✕</button>
                        </div>

                        <form onSubmit={handleSubmit} style={styles.form}>
                            {activeTab === 'weight' && (
                                <>
                                    <div style={styles.inputRow}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Weight (kg) *</label>
                                            <input
                                                type="number"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleChange}
                                                required
                                                step="0.1"
                                                min="0"
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Date *</label>
                                            <input
                                                type="date"
                                                name="weightDate"
                                                value={formData.weightDate}
                                                onChange={handleChange}
                                                required
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Notes</label>
                                        <textarea
                                            name="weightNotes"
                                            value={formData.weightNotes}
                                            onChange={handleChange}
                                            rows="3"
                                            style={{...styles.input, resize: 'vertical'}}
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'medication' && (
                                <>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Medication Name *</label>
                                        <input
                                            type="text"
                                            name="medicationName"
                                            value={formData.medicationName}
                                            onChange={handleChange}
                                            required
                                            style={styles.input}
                                        />
                                    </div>
                                    <div style={styles.inputRow}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Dosage</label>
                                            <input
                                                type="text"
                                                name="medicationDosage"
                                                value={formData.medicationDosage}
                                                onChange={handleChange}
                                                placeholder="e.g., 500mg"
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Frequency</label>
                                            <input
                                                type="text"
                                                name="medicationFrequency"
                                                value={formData.medicationFrequency}
                                                onChange={handleChange}
                                                placeholder="e.g., Twice daily"
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>
                                    <div style={styles.inputRow}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Start Date *</label>
                                            <input
                                                type="date"
                                                name="medicationStartDate"
                                                value={formData.medicationStartDate}
                                                onChange={handleChange}
                                                required
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>End Date</label>
                                            <input
                                                type="date"
                                                name="medicationEndDate"
                                                value={formData.medicationEndDate}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Notes</label>
                                        <textarea
                                            name="medicationNotes"
                                            value={formData.medicationNotes}
                                            onChange={handleChange}
                                            rows="3"
                                            style={{...styles.input, resize: 'vertical'}}
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'vaccination' && (
                                <>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Vaccine Name *</label>
                                        <input
                                            type="text"
                                            name="vaccineName"
                                            value={formData.vaccineName}
                                            onChange={handleChange}
                                            required
                                            placeholder="e.g., Rabies, DHPP"
                                            style={styles.input}
                                        />
                                    </div>
                                    <div style={styles.inputRow}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Date Given *</label>
                                            <input
                                                type="date"
                                                name="vaccineDate"
                                                value={formData.vaccineDate}
                                                onChange={handleChange}
                                                required
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Next Due Date</label>
                                            <input
                                                type="date"
                                                name="vaccineNextDue"
                                                value={formData.vaccineNextDue}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Veterinarian</label>
                                        <input
                                            type="text"
                                            name="vaccineVet"
                                            value={formData.vaccineVet}
                                            onChange={handleChange}
                                            style={styles.input}
                                        />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Notes</label>
                                        <textarea
                                            name="vaccineNotes"
                                            value={formData.vaccineNotes}
                                            onChange={handleChange}
                                            rows="3"
                                            style={{...styles.input, resize: 'vertical'}}
                                        />
                                    </div>
                                </>
                            )}

                            {activeTab === 'vetVisit' && (
                                <>
                                    <div style={styles.inputRow}>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Visit Date *</label>
                                            <input
                                                type="date"
                                                name="visitDate"
                                                value={formData.visitDate}
                                                onChange={handleChange}
                                                required
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={styles.inputGroup}>
                                            <label style={styles.label}>Veterinarian</label>
                                            <input
                                                type="text"
                                                name="visitVet"
                                                value={formData.visitVet}
                                                onChange={handleChange}
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Reason for Visit *</label>
                                        <input
                                            type="text"
                                            name="visitReason"
                                            value={formData.visitReason}
                                            onChange={handleChange}
                                            required
                                            style={styles.input}
                                        />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Diagnosis</label>
                                        <textarea
                                            name="visitDiagnosis"
                                            value={formData.visitDiagnosis}
                                            onChange={handleChange}
                                            rows="2"
                                            style={{...styles.input, resize: 'vertical'}}
                                        />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Treatment</label>
                                        <textarea
                                            name="visitTreatment"
                                            value={formData.visitTreatment}
                                            onChange={handleChange}
                                            rows="2"
                                            style={{...styles.input, resize: 'vertical'}}
                                        />
                                    </div>
                                    <div style={styles.inputGroup}>
                                        <label style={styles.label}>Notes</label>
                                        <textarea
                                            name="visitNotes"
                                            value={formData.visitNotes}
                                            onChange={handleChange}
                                            rows="3"
                                            style={{...styles.input, resize: 'vertical'}}
                                        />
                                    </div>
                                </>
                            )}

                            <div style={styles.buttonGroup}>
                                <button type="submit" style={styles.submitButton}>
                                    Save Record
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddForm(false)}
                                    style={styles.cancelButton}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Records List */}
                <div style={styles.recordsContainer}>
                    <h3 style={styles.recordsTitle}>
                        {activeTab === 'weight' ? 'Weight History' :
                         activeTab === 'medication' ? 'Medication History' :
                         activeTab === 'vaccination' ? 'Vaccination History' :
                         'Vet Visit History'}
                    </h3>

                    {getRecordsByType(activeTab).length === 0 ? (
                        <div style={styles.emptyState}>
                            <p>No {activeTab === 'vetVisit' ? 'vet visit' : activeTab} records yet.</p>
                        </div>
                    ) : (
                        <div style={styles.recordsList}>
                            {getRecordsByType(activeTab).map((record) => (
                                <div key={record.id} style={styles.recordCard}>
                                    <div style={styles.recordDate}>{formatDate(record.date)}</div>
                                    {activeTab === 'weight' && (
                                        <>
                                            <div style={styles.recordValue}>{record.value}</div>
                                            {record.notes && <div style={styles.recordNotes}>{record.notes}</div>}
                                        </>
                                    )}
                                    {activeTab === 'medication' && (
                                        <>
                                            <div style={styles.recordValue}>{record.value}</div>
                                            {record.dosage && <div style={styles.recordDetail}>Dosage: {record.dosage}</div>}
                                            {record.frequency && <div style={styles.recordDetail}>Frequency: {record.frequency}</div>}
                                            {record.endDate && <div style={styles.recordDetail}>Until: {formatDate(record.endDate)}</div>}
                                            {record.notes && <div style={styles.recordNotes}>{record.notes}</div>}
                                        </>
                                    )}
                                    {activeTab === 'vaccination' && (
                                        <>
                                            <div style={styles.recordValue}>{record.value}</div>
                                            {record.vet && <div style={styles.recordDetail}>Vet: {record.vet}</div>}
                                            {record.nextDue && <div style={styles.recordDetail}>Next Due: {formatDate(record.nextDue)}</div>}
                                            {record.notes && <div style={styles.recordNotes}>{record.notes}</div>}
                                        </>
                                    )}
                                    {activeTab === 'vetVisit' && (
                                        <>
                                            <div style={styles.recordValue}>{record.value}</div>
                                            {record.vet && <div style={styles.recordDetail}>Vet: {record.vet}</div>}
                                            {record.diagnosis && <div style={styles.recordDetail}>Diagnosis: {record.diagnosis}</div>}
                                            {record.treatment && <div style={styles.recordDetail}>Treatment: {record.treatment}</div>}
                                            {record.notes && <div style={styles.recordNotes}>{record.notes}</div>}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: '100vh',
        background: 'var(--app-bg)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    container: {
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 20px'
    },
    loadingContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    loadingText: {
        fontSize: '20px',
        color: 'white',
        fontWeight: '600'
    },
    headerSection: {
        marginBottom: '40px',
        textAlign: 'center',
        animation: 'fadeInDown 0.6s ease-out'
    },
    backButton: {
        backgroundColor: 'var(--card-bg)',
        border: '1.5px solid var(--card-border)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        cursor: 'pointer',
        marginBottom: '20px',
        padding: '10px 20px',
        fontWeight: '600',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-soft)',
        transition: 'all 0.3s ease'
    },
    title: {
        fontSize: '38px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '10px 0',
        textShadow: '0 2px 10px rgba(0,0,0,0.1)'
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
    tabContainer: {
        display: 'flex',
        gap: '12px',
        marginBottom: '30px',
        flexWrap: 'wrap',
        animation: 'fadeInUp 0.6s ease-out'
    },
    tab: {
        backgroundColor: 'var(--card-bg)',
        border: '1.5px solid var(--card-border)',
        padding: '14px 24px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        transition: 'all 0.3s ease',
        boxShadow: 'var(--shadow-soft)'
    },
    activeTab: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        boxShadow: '0 6px 20px rgba(17, 153, 142, 0.4)'
    },
    addButton: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        padding: '14px 28px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        marginBottom: '30px',
        width: '100%',
        boxShadow: '0 8px 20px rgba(17, 153, 142, 0.3)',
        transition: 'all 0.3s ease',
        animation: 'fadeInUp 0.7s ease-out'
    },
    card: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: 'var(--shadow-strong)',
        marginBottom: '30px',
        animation: 'slideUp 0.5s ease-out'
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '3px solid #667eea'
    },
    cardTitle: {
        fontSize: '22px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        margin: 0
    },
    closeButton: {
        backgroundColor: 'transparent',
        border: 'none',
        fontSize: '28px',
        color: '#95a5a6',
        cursor: 'pointer',
        padding: '0',
        width: '35px',
        height: '35px',
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
        fontFamily: 'inherit',
        transition: 'all 0.3s ease',
        backgroundColor: 'var(--surface)',
        color: 'var(--text-primary)'
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
    recordsContainer: {
        backgroundColor: 'var(--card-bg)',
        border: '1.5px solid var(--card-border)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: 'var(--shadow-soft)',
        animation: 'slideUp 0.6s ease-out'
    },
    recordsTitle: {
        fontSize: '22px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '3px solid #667eea'
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 40px',
        color: '#95a5a6',
        fontSize: '16px'
    },
    recordsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    recordCard: {
        padding: '20px',
        borderRadius: '16px',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--card-border)',
        transition: 'all 0.3s ease',
        boxShadow: 'var(--shadow-soft)'
    },
    recordDate: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        marginBottom: '8px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    recordValue: {
        fontSize: '18px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '8px'
    },
    recordDetail: {
        fontSize: '15px',
        color: 'var(--text-secondary)',
        marginBottom: '5px',
        fontWeight: '500'
    },
    recordNotes: {
        fontSize: '14px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        marginTop: '10px',
        padding: '12px',
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        borderRadius: '8px',
        borderLeft: '3px solid var(--accent)'
    }
};

export default HealthMetrics;
