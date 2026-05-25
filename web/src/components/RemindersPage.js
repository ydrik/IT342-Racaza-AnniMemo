import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RemindersPage = () => {
    const navigate = useNavigate();
    const [pets, setPets] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const [form, setForm] = useState({
        petId: '',
        title: '',
        type: 'medication',
        dueDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const dueSoon = useMemo(() => {
        const now = new Date();
        const limit = new Date();
        limit.setDate(now.getDate() + 7);

        return reminders.filter((r) => {
            if (r.completed) return false;
            const due = new Date(r.dueDate);
            return due >= new Date(now.toDateString()) && due <= limit;
        });
    }, [reminders]);

    const filteredReminders = useMemo(() => {
        const today = new Date(new Date().toDateString());

        return reminders.filter((item) => {
            const due = new Date(item.dueDate);
            const isOverdue = !item.completed && !Number.isNaN(due.getTime()) && due < today;
            const isDueSoon = dueSoon.some((dueItem) => dueItem.id === item.id);

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
    }, [activeFilter, reminders, dueSoon]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchData();
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
            // Reminders fallback
            remindersData = [];
        }
        setReminders(remindersData);

        if (petsData.length > 0) {
            setForm((prev) => ({
                ...prev,
                petId: prev.petId || String(petsData[0].id)
            }));
        }
        setIsLoading(false);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

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
            setForm((prev) => ({ ...prev, title: '', notes: '' }));
            fetchData();
        } catch (error) {
            setMessage('Failed to create reminder.');
            setMessageType('error');
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
            setMessage('Failed to update reminder status.');
            setMessageType('error');
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
            setMessage('Failed to delete reminder.');
            setMessageType('error');
        }
    };

    if (isLoading) {
        return <div style={styles.loading}>Loading reminders...</div>;
    }

    return (
        <div style={styles.page}>
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
                            <select name="petId" value={form.petId} onChange={handleChange} style={styles.input}>
                                {pets.map((pet) => (
                                    <option key={pet.id} value={pet.id}>{pet.name}</option>
                                ))}
                            </select>
                            <input name="title" value={form.title} onChange={handleChange} placeholder="Reminder title" style={styles.input} />
                            <select name="type" value={form.type} onChange={handleChange} style={styles.input}>
                                <option value="medication">Medication</option>
                                <option value="vaccination">Vaccination</option>
                                <option value="appointment">Appointment</option>
                                <option value="general">General</option>
                            </select>
                            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} style={styles.input} />
                            <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes (optional)" style={styles.textarea} />
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
    page: { minHeight: '100vh', background: 'var(--app-bg)', padding: '30px 20px' },
    container: { maxWidth: '1100px', margin: '0 auto' },
    loading: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    backButton: { border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '12px' },
    title: { color: 'var(--text-primary)', margin: 0 },
    subtitle: { color: 'var(--text-muted)', marginTop: '8px', marginBottom: '18px' },
    message: { padding: '10px 12px', borderRadius: '10px', marginBottom: '14px' },
    success: { background: '#d1fae5', color: '#065f46' },
    error: { background: '#fee2e2', color: '#991b1b' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
    card: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '16px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '10px' },
    cardTitle: { margin: 0, color: 'var(--text-primary)' },
    filterRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' },
    filterButton: { border: '1px solid var(--card-border)', borderRadius: '999px', background: 'transparent', color: 'var(--text-primary)', padding: '6px 10px', cursor: 'pointer' },
    filterButtonActive: { background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', borderColor: 'transparent', color: '#fff' },
    form: { display: 'grid', gap: '10px' },
    input: { borderRadius: '10px', border: '1px solid var(--card-border)', padding: '10px 12px', background: 'var(--app-bg)', color: 'var(--text-primary)' },
    textarea: { minHeight: '90px', borderRadius: '10px', border: '1px solid var(--card-border)', padding: '10px 12px', background: 'var(--app-bg)', color: 'var(--text-primary)' },
    primaryButton: { border: 'none', borderRadius: '10px', padding: '10px 12px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
    secondaryButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    completeButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #10b981, #059669)' },
    reopenButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    deleteButton: { border: 'none', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#fff', background: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    rowActions: { display: 'flex', gap: '8px' },
    list: { listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '10px 12px' },
    muted: { color: 'var(--text-muted)', fontSize: '13px' }
};

export default RemindersPage;
