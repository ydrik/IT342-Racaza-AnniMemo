import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PetFactsPage = () => {
    const navigate = useNavigate();
    const [species, setSpecies] = useState('any');
    const [facts, setFacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadFacts = async (count = 1) => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(
                `http://localhost:8080/api/facts/random-list?species=${species}&count=${count}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setFacts(response.data || []);
        } catch (err) {
            setError('Unable to load facts right now.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <button style={styles.backButton} onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
                <h1 style={styles.title}>Pet Facts</h1>
                <p style={styles.subtitle}>Learn helpful and interesting facts about pets.</p>

                <div style={styles.toolbar}>
                    <select value={species} onChange={(e) => setSpecies(e.target.value)} style={styles.select}>
                        <option value="any">Any Pet</option>
                        <option value="dog">Dogs</option>
                        <option value="cat">Cats</option>
                    </select>
                    <button style={styles.button} onClick={() => loadFacts(1)}>Get 1 Fact</button>
                    <button style={styles.buttonSecondary} onClick={() => loadFacts(5)}>Get 5 Facts</button>
                </div>

                {loading && <p style={styles.muted}>Loading facts...</p>}
                {error && <p style={styles.error}>{error}</p>}

                <div style={styles.grid}>
                    {facts.map((item, index) => (
                        <div key={`${item.species}-${index}`} style={styles.card}>
                            <div style={styles.badge}>{item.species === 'dog' ? 'Dog' : item.species === 'cat' ? 'Cat' : 'Pet'}</div>
                            <p style={styles.factText}>{item.fact}</p>
                            <p style={styles.source}>Source: {item.source}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: 'var(--app-bg)', padding: '32px 20px' },
    container: { maxWidth: '1100px', margin: '0 auto' },
    backButton: { border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', marginBottom: '14px' },
    title: { margin: 0, color: 'var(--text-primary)' },
    subtitle: { color: 'var(--text-muted)', marginTop: '8px', marginBottom: '18px' },
    toolbar: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' },
    select: {
        borderRadius: '10px',
        border: '1px solid var(--card-border)',
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
        padding: '10px 12px'
    },
    button: {
        border: 'none',
        borderRadius: '10px',
        padding: '10px 12px',
        color: '#fff',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
    },
    buttonSecondary: {
        border: 'none',
        borderRadius: '10px',
        padding: '10px 12px',
        color: '#fff',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)'
    },
    muted: { color: 'var(--text-muted)' },
    error: { color: '#b91c1c' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' },
    card: { background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '14px' },
    badge: {
        display: 'inline-block',
        fontSize: '12px',
        borderRadius: '999px',
        background: 'rgba(59,130,246,0.12)',
        color: '#1d4ed8',
        padding: '4px 10px',
        marginBottom: '10px'
    },
    factText: { color: 'var(--text-primary)', margin: 0, lineHeight: 1.55 },
    source: { color: 'var(--text-muted)', marginTop: '10px', marginBottom: 0, fontSize: '12px' }
};

export default PetFactsPage;
