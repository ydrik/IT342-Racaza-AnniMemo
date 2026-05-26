import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

const API_BASE = 'http://localhost:8080';

const AppointmentTrackerPage = () => {
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    const [petSearch, setPetSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [form, setForm] = useState({
        petId: '',
        title: '',
        dueDate: '',
        notes: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    const fetchData = async () => {
        setIsLoading(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [petsResponse, reminderResponse] = await Promise.all([
                axios.get(`${API_BASE}/api/pets`, { headers }),
                axios.get(`${API_BASE}/api/reminders`, { headers })
            ]);

            const petList = petsResponse.data || [];
            const reminderList = reminderResponse.data || [];
            const appointmentList = reminderList
                .filter((item) => (item.type || '').toLowerCase() === 'appointment')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            setPets(petList);
            setAppointments(appointmentList);

            if (petList.length > 0 && form.petId) {
                const selectedPet = petList.find(p => String(p.id) === String(form.petId));
                if (selectedPet) {
                    setPetSearch(selectedPet.name);
                } else {
                    setForm((prev) => ({ ...prev, petId: '' }));
                    setPetSearch('');
                }
            } else {
                setForm((prev) => ({ ...prev, petId: '' }));
                setPetSearch('');
            }
        } catch (error) {
            // Local Storage Persistence Fallback
            const petList = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
            const reminderList = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');

            const enrichedList = reminderList.map(reminder => {
                if (!reminder.petName && reminder.petId) {
                    const pet = petList.find(p => String(p.id) === String(reminder.petId));
                    return {
                        ...reminder,
                        petName: pet ? pet.name : 'Unknown Pet'
                    };
                }
                return reminder;
            });

            const appointmentList = enrichedList
                .filter((item) => (item.type || '').toLowerCase() === 'appointment')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

            setPets(petList);
            setAppointments(appointmentList);

            if (petList.length > 0 && form.petId) {
                const selectedPet = petList.find(p => String(p.id) === String(form.petId));
                if (selectedPet) {
                    setPetSearch(selectedPet.name);
                } else {
                    setForm((prev) => ({ ...prev, petId: '' }));
                    setPetSearch('');
                }
            } else {
                setForm((prev) => ({ ...prev, petId: '' }));
                setPetSearch('');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handlePetSearchChange = (e) => {
        const val = e.target.value;
        setPetSearch(val);
        setShowSuggestions(true);

        const match = pets.find(p => p.name.toLowerCase() === val.toLowerCase());
        if (match) {
            setForm(prev => ({ ...prev, petId: String(match.id) }));
        } else {
            setForm(prev => ({ ...prev, petId: '' }));
        }
    };

    const matchingSuggestions = useMemo(() => {
        if (!petSearch.trim()) return pets;
        return pets.filter(p => p.name.toLowerCase().includes(petSearch.toLowerCase()));
    }, [pets, petSearch]);

    const createAppointment = async (event) => {
        event.preventDefault();
        setMessage('');

        if (!form.petId || !form.title.trim()) {
            setMessage('Pet and title are required.');
            setMessageType('error');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE}/api/reminders`,
                {
                    petId: Number(form.petId),
                    title: form.title.trim(),
                    type: 'appointment',
                    dueDate: form.dueDate,
                    notes: form.notes.trim()
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Appointment added successfully.');
            setMessageType('success');
            setForm((prev) => ({ ...prev, title: '', notes: '', dueDate: '', petId: '' }));
            setPetSearch('');
            fetchData();
        } catch (error) {
            // Local Storage fallback creation
            const selectedPet = pets.find(p => String(p.id) === String(form.petId));
            const newReminder = {
                id: `reminder-${Date.now()}`,
                petId: Number(form.petId),
                petName: selectedPet ? selectedPet.name : 'Unknown Pet',
                title: form.title.trim(),
                type: 'appointment',
                dueDate: form.dueDate,
                notes: form.notes.trim(),
                completed: false
            };

            const existingReminders = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
            existingReminders.push(newReminder);
            localStorage.setItem('annimemo_reminders', JSON.stringify(existingReminders));

            setMessage('Appointment added successfully. (Frontend only - backend pending)');
            setMessageType('success');
            setForm((prev) => ({ ...prev, title: '', notes: '', dueDate: '', petId: '' }));
            setPetSearch('');
            fetchData();
        }
    };

    const toggleComplete = async (appointment) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${API_BASE}/api/reminders/${appointment.id}/status?completed=${!appointment.completed}`,
                null,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
        } catch (error) {
            // Toggle completed status in Local Storage fallback
            const existingReminders = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
            const updatedReminders = existingReminders.map(r => {
                if (String(r.id) === String(appointment.id)) {
                    return { ...r, completed: !r.completed };
                }
                return r;
            });
            localStorage.setItem('annimemo_reminders', JSON.stringify(updatedReminders));
            fetchData();
        }
    };

    const removeAppointment = async (appointmentId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE}/api/reminders/${appointmentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            // Delete from Local Storage fallback
            const existingReminders = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
            const filteredReminders = existingReminders.filter(r => String(r.id) !== String(appointmentId));
            localStorage.setItem('annimemo_reminders', JSON.stringify(filteredReminders));
            fetchData();
        }
    };

    const categorized = useMemo(() => {
        const today = new Date();
        const dayStart = new Date(today.toDateString());

        const upcoming = [];
        const overdue = [];
        const completed = [];

        appointments.forEach((item) => {
            if (item.completed) {
                completed.push(item);
                return;
            }
            const due = new Date(item.dueDate);
            if (Number.isNaN(due.getTime())) {
                upcoming.push(item);
                return;
            }
            if (due < dayStart) {
                overdue.push(item);
            } else {
                upcoming.push(item);
            }
        });

        return { upcoming, overdue, completed };
    }, [appointments]);

    if (isLoading) {
        return <div style={styles.loading}>Loading appointments...</div>;
    }

    return (
        <div style={styles.page}>
            <Header />
            <div style={styles.container}>
                <button onClick={() => navigate('/dashboard')} style={styles.backButton}>← Back to Dashboard</button>
                <h1 style={styles.title}>Appointment Tracker</h1>
                <p style={styles.subtitle}>Schedule vet visits and keep follow-up care visible.</p>

                {message && (
                    <div style={{ ...styles.message, ...(messageType === 'success' ? styles.success : styles.error) }}>
                        {message}
                    </div>
                )}

                <section style={styles.card}>
                    <h3 style={styles.cardTitle}>New Appointment</h3>
                    <form onSubmit={createAppointment} style={styles.form}>
                        <div style={{ ...styles.inputGroup, position: 'relative' }}>
                            <label style={styles.label}>Select Pet *</label>
                            <input
                                type="text"
                                name="petSearch"
                                value={petSearch}
                                onChange={handlePetSearchChange}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => {
                                    setTimeout(() => setShowSuggestions(false), 200);
                                }}
                                placeholder="Pet name"
                                autoComplete="off"
                                style={styles.input}
                            />
                            {showSuggestions && matchingSuggestions.length > 0 && (
                                <div style={styles.suggestionsContainer}>
                                    {matchingSuggestions.map((pet) => (
                                        <div
                                            key={pet.id}
                                            onMouseDown={() => {
                                                setPetSearch(pet.name);
                                                setForm(prev => ({ ...prev, petId: String(pet.id) }));
                                                setShowSuggestions(false);
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--app-bg)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            style={styles.suggestionItem}
                                        >
                                            {pet.species === 'Dog' ? '🐕' : 
                                             pet.species === 'Cat' ? '🐱' : 
                                             pet.species === 'Bird' ? '🦜' : 
                                             pet.species === 'Rabbit' ? '🐰' : 
                                             pet.species === 'Fish' ? '🐟' : '🐾'}{' '}
                                            <strong>{pet.name}</strong> <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>({pet.breed || pet.species})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {showSuggestions && matchingSuggestions.length === 0 && (
                                <div style={styles.suggestionsContainer}>
                                    <div style={{ ...styles.suggestionItem, color: 'var(--text-muted)', cursor: 'default' }}>
                                        No matching pets found
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Appointment Title *</label>
                            <input name="title" value={form.title} onChange={handleChange} placeholder="Appointment title" style={styles.input} />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Date *</label>
                            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} onKeyDown={(e) => e.preventDefault()} style={styles.input} />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Notes</label>
                            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Visit notes or purpose" style={styles.textarea} />
                        </div>

                        <button type="submit" style={styles.primaryButton}>Save Appointment</button>
                    </form>
                </section>

                <div style={styles.grid}>
                    <section style={styles.card}>
                        <h3 style={styles.cardTitle}>Upcoming ({categorized.upcoming.length})</h3>
                        <AppointmentList
                            items={categorized.upcoming}
                            onToggle={toggleComplete}
                            onDelete={removeAppointment}
                            actionLabel="Mark Done"
                        />
                    </section>

                    <section style={styles.card}>
                        <h3 style={styles.cardTitle}>Overdue ({categorized.overdue.length})</h3>
                        <AppointmentList
                            items={categorized.overdue}
                            onToggle={toggleComplete}
                            onDelete={removeAppointment}
                            actionLabel="Mark Done"
                        />
                    </section>
                </div>

                <section style={styles.card}>
                    <h3 style={styles.cardTitle}>Completed ({categorized.completed.length})</h3>
                    <AppointmentList
                        items={categorized.completed}
                        onToggle={toggleComplete}
                        onDelete={removeAppointment}
                        actionLabel="Reopen"
                    />
                </section>
            </div>
        </div>
    );
};

const AppointmentList = ({ items, onToggle, onDelete, actionLabel }) => {
    if (!items.length) {
        return <p style={styles.muted}>No items in this section.</p>;
    }

    return (
        <ul style={styles.list}>
            {items.map((item) => (
                <li key={item.id} style={styles.listItem}>
                    <div>
                        <strong>{item.title}</strong>
                        <div style={styles.muted}>{item.petName} • due {item.dueDate}</div>
                    </div>
                    <div style={styles.rowActions}>
                        <button onClick={() => onToggle(item)} style={styles.completeButton}>{actionLabel}</button>
                        <button onClick={() => onDelete(item.id)} style={styles.deleteButton}>Delete</button>
                    </div>
                </li>
            ))}
        </ul>
    );
};

const styles = {
    page: { minHeight: '100vh', background: 'var(--app-bg)' },
    container: { maxWidth: '1100px', margin: '0 auto', padding: '30px 20px 90px' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
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
    title: { color: 'var(--text-primary)', marginTop: 0, marginBottom: '4px' },
    subtitle: { color: 'var(--text-muted)', marginTop: 0, marginBottom: '16px' },
    message: { padding: '10px 12px', borderRadius: '10px', marginBottom: '14px' },
    success: { background: '#d1fae5', color: '#065f46' },
    error: { background: '#fee2e2', color: '#991b1b' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '16px', marginBottom: '16px' },
    card: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px' },
    cardTitle: { marginTop: 0, color: 'var(--text-primary)' },
    form: { display: 'grid', gap: '12px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'left' },
    input: { borderRadius: '10px', border: '1px solid var(--card-border)', padding: '10px 12px', background: 'var(--app-bg)', color: 'var(--text-primary)' },
    textarea: { minHeight: '90px', borderRadius: '10px', border: '1px solid var(--card-border)', padding: '10px 12px', background: 'var(--app-bg)', color: 'var(--text-primary)', resize: 'none' },
    primaryButton: { border: 'none', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
    list: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '10px 12px' },
    rowActions: { display: 'flex', gap: '8px' },
    completeButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #10b981, #059669)' },
    deleteButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    muted: { color: 'var(--text-muted)', fontSize: '13px' },
    suggestionsContainer: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-strong, 0 10px 30px rgba(0,0,0,0.15))',
        maxHeight: '200px',
        overflowY: 'auto'
    },
    suggestionItem: {
        padding: '10px 12px',
        cursor: 'pointer',
        borderBottom: '1px solid var(--card-border)',
        transition: 'background-color 0.2s ease',
        fontSize: '14px',
        color: 'var(--text-primary)',
        textAlign: 'left'
    }
};

export default AppointmentTrackerPage;
