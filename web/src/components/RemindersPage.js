import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

const RemindersPage = () => {
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [petSearch, setPetSearch] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [form, setForm] = useState({
        petId: '',
        title: '',
        type: 'medication',
        dueDate: '',
        notes: ''
    });

    const todayStr = useMemo(() => {
        const d = new Date();
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    }, []);

    const limitStr = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    }, []);

    const dueSoon = useMemo(() => {
        return reminders.filter((r) => {
            if (r.completed) return false;
            if (!r.dueDate) return false;
            return r.dueDate >= todayStr && r.dueDate <= limitStr;
        });
    }, [reminders, todayStr, limitStr]);

    const filteredReminders = useMemo(() => {
        return reminders.filter((item) => {
            if (!item.dueDate) {
                switch (activeFilter) {
                    case 'due-soon':
                    case 'overdue':
                        return false;
                    case 'completed':
                        return Boolean(item.completed);
                    default:
                        return true;
                }
            }

            const isOverdue = !item.completed && item.dueDate < todayStr;
            const isDueSoon = !item.completed && item.dueDate >= todayStr && item.dueDate <= limitStr;

            switch (activeFilter) {
                case 'due-soon':
                    return isDueSoon;
                case 'overdue':
                    return isOverdue;
                case 'completed':
                    return Boolean(item.completed);
                default:
                    return true;
            }
        });
    }, [activeFilter, reminders, todayStr, limitStr]);

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
        const token = localStorage.getItem('token');
        
        let petsData = [];
        try {
            const petsResponse = await axios.get('http://localhost:8080/api/pets', {
                headers: { Authorization: `Bearer ${token}` }
            });
            petsData = petsResponse.data || [];
        } catch (err) {
            petsData = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
        }
        setPets(petsData);

        let remindersData = [];
        try {
            const remindersResponse = await axios.get('http://localhost:8080/api/reminders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            remindersData = remindersResponse.data || [];
        } catch (err) {
            // Reminders fallback database
            remindersData = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
        }
        
        // Dynamically enrich reminders with petName from petsData for database-free accounts
        const enrichedReminders = remindersData.map(reminder => {
            if (!reminder.petName && reminder.petId) {
                const pet = petsData.find(p => String(p.id) === String(reminder.petId));
                return {
                    ...reminder,
                    petName: pet ? pet.name : 'Unknown Pet'
                };
            }
            return reminder;
        });
        setReminders(enrichedReminders);

        if (petsData.length > 0 && form.petId) {
            const selectedPet = petsData.find(p => String(p.id) === String(form.petId));
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
        setIsLoading(false);
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

    const handleCreate = async (event) => {
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
                'http://localhost:8080/api/reminders',
                {
                    petId: Number(form.petId),
                    title: form.title.trim(),
                    type: form.type,
                    dueDate: form.dueDate,
                    notes: form.notes.trim()
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage('Reminder created successfully.');
            setMessageType('success');
            setForm((prev) => ({ ...prev, title: '', notes: '', dueDate: '', petId: '' }));
            setPetSearch('');
            fetchData();
        } catch (error) {
            // Persistent localStorage fallback database
            const newReminder = {
                id: Date.now(),
                petId: Number(form.petId),
                title: form.title.trim(),
                type: form.type,
                dueDate: form.dueDate,
                notes: form.notes.trim(),
                completed: false
            };
            const existingReminders = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
            existingReminders.push(newReminder);
            localStorage.setItem('annimemo_reminders', JSON.stringify(existingReminders));

            setMessage('Reminder created successfully. (Frontend only - backend pending)');
            setMessageType('success');
            setForm((prev) => ({ ...prev, title: '', notes: '', dueDate: '', petId: '' }));
            setPetSearch('');
            fetchData();
        }
    };

    const toggleComplete = async (reminder) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8080/api/reminders/${reminder.id}/status?completed=${!reminder.completed}`,
                null,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
        } catch (error) {
            // Toggle completed status in localStorage fallback database
            const existingReminders = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
            const updatedReminders = existingReminders.map(r => {
                if (String(r.id) === String(reminder.id)) {
                    return { ...r, completed: !r.completed };
                }
                return r;
            });
            localStorage.setItem('annimemo_reminders', JSON.stringify(updatedReminders));
            fetchData();
        }
    };

    const sendDigest = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/reminders/notify-due-soon?days=7',
                null,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(response.data?.message || 'Digest sent.');
            setMessageType('success');
        } catch (error) {
            setMessage('Failed to send reminder digest.');
            setMessageType('error');
        }
    };

    const deleteReminder = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8080/api/reminders/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Reminder deleted.');
            setMessageType('success');
            fetchData();
        } catch (error) {
            // Delete from localStorage fallback database
            const existingReminders = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
            const filteredReminders = existingReminders.filter(r => String(r.id) !== String(id));
            localStorage.setItem('annimemo_reminders', JSON.stringify(filteredReminders));
            setMessage('Reminder deleted successfully. (Frontend only - backend pending)');
            setMessageType('success');
            fetchData();
        }
    };

    if (isLoading) {
        return <div style={styles.loading}>Loading reminders...</div>;
    }

    return (
        <div style={styles.page}>
            <Header />
            <div style={styles.container}>
                <button onClick={() => navigate('/dashboard')} style={styles.backButton}>← Back to Dashboard</button>
                <h1 style={styles.title}>Reminders</h1>
                <p style={styles.subtitle}>Create care reminders and send due-soon email digests.</p>

                {message && (
                    <div style={{ ...styles.message, ...(messageType === 'success' ? styles.success : styles.error) }}>
                        {message}
                    </div>
                )}

                <div style={styles.grid}>
                    <section style={styles.card}>
                        <h3 style={styles.cardTitle}>New Reminder</h3>
                        <form onSubmit={handleCreate} style={styles.form}>
                            <div style={{ ...styles.inputGroup, position: 'relative' }}>
                                <label style={styles.label}>Select Pet</label>
                                <input
                                    type="text"
                                    name="petSearch"
                                    value={petSearch}
                                    onChange={handlePetSearchChange}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => {
                                        // Slight delay to trigger click on suggestion item
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
                                <label style={styles.label}>Reminder Title</label>
                                <input name="title" value={form.title} onChange={handleChange} placeholder="Reminder title" style={styles.input} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Reminder Type</label>
                                <select name="type" value={form.type} onChange={handleChange} style={styles.input}>
                                    <option value="medication">Medication</option>
                                    <option value="vaccination">Vaccination</option>
                                    <option value="appointment">Appointment</option>
                                    <option value="general">General</option>
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Due Date</label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={form.dueDate}
                                    onChange={handleChange}
                                    onKeyDown={(e) => e.preventDefault()}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Notes (optional)</label>
                                <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes (optional)" style={styles.textarea} />
                            </div>
                            <button type="submit" style={styles.primaryButton}>Create Reminder</button>
                        </form>
                    </section>

                    <section style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h3 style={styles.cardTitle}>Due In 7 Days ({dueSoon.length})</h3>
                            <button onClick={sendDigest} style={styles.secondaryButton}>Send Email Digest</button>
                        </div>
                        {dueSoon.length === 0 ? (
                            <p style={styles.muted}>No upcoming reminders.</p>
                        ) : (
                            <ul style={styles.list}>
                                {dueSoon.map((item) => (
                                    <li key={item.id} style={styles.listItem}>
                                        <div>
                                            <strong>{item.title}</strong>
                                            <div style={styles.muted}>{item.petName} • {item.type} • due {item.dueDate}</div>
                                        </div>
                                        <button onClick={() => toggleComplete(item)} style={styles.completeButton}>Mark Done</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <section style={styles.card}>
                    <h3 style={styles.cardTitle}>All Reminders</h3>
                    <div style={styles.filterRow}>
                        <button
                            onClick={() => setActiveFilter('all')}
                            style={activeFilter === 'all' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveFilter('due-soon')}
                            style={activeFilter === 'due-soon' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                        >
                            Due Soon
                        </button>
                        <button
                            onClick={() => setActiveFilter('overdue')}
                            style={activeFilter === 'overdue' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                        >
                            Overdue
                        </button>
                        <button
                            onClick={() => setActiveFilter('completed')}
                            style={activeFilter === 'completed' ? { ...styles.filterButton, ...styles.filterButtonActive } : styles.filterButton}
                        >
                            Completed
                        </button>
                    </div>
                    {filteredReminders.length === 0 ? (
                        <p style={styles.muted}>No reminders yet.</p>
                    ) : (
                        <ul style={styles.list}>
                            {filteredReminders.map((item) => (
                                <li key={item.id} style={styles.listItem}>
                                    <div>
                                        <strong style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>{item.title}</strong>
                                        <div style={styles.muted}>{item.petName} • {item.type} • due {item.dueDate}</div>
                                    </div>
                                    <div style={styles.rowActions}>
                                        <button
                                            onClick={() => toggleComplete(item)}
                                            style={item.completed ? styles.reopenButton : styles.completeButton}
                                        >
                                            {item.completed ? 'Reopen' : 'Mark Done'}
                                        </button>
                                        <button onClick={() => deleteReminder(item.id)} style={styles.deleteButton}>Delete</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: 'var(--app-bg)' },
    container: { maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' },
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
    title: { color: 'var(--text-primary)', margin: 0 },
    subtitle: { color: 'var(--text-muted)', marginTop: '8px', marginBottom: '18px' },
    message: { padding: '10px 12px', borderRadius: '10px', marginBottom: '14px' },
    success: { background: '#d1fae5', color: '#065f46' },
    error: { background: '#fee2e2', color: '#991b1b' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
    card: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' },
    cardTitle: { margin: '0 0 20px 0', color: 'var(--text-primary)' },
    filterRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' },
    filterButton: { border: '1px solid var(--card-border)', borderRadius: '999px', background: 'transparent', color: 'var(--text-primary)', padding: '6px 10px', cursor: 'pointer' },
    filterButtonActive: { background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderColor: 'transparent', color: '#fff' },
    form: { display: 'grid', gap: '14px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'left' },
    input: { borderRadius: '10px', border: '1px solid var(--card-border)', padding: '10px 12px', background: 'var(--app-bg)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' },
    textarea: { minHeight: '90px', borderRadius: '10px', border: '1px solid var(--card-border)', padding: '10px 12px', background: 'var(--app-bg)', color: 'var(--text-primary)', resize: 'none', width: '100%', boxSizing: 'border-box' },
    primaryButton: { border: 'none', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
    secondaryButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    completeButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #10b981, #059669)' },
    reopenButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    deleteButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    rowActions: { display: 'flex', gap: '8px' },
    list: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '10px 12px' },
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

export default RemindersPage;
