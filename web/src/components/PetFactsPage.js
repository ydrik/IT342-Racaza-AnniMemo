import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PetFactsPage = () => {
    const navigate = useNavigate();
    const [species, setSpecies] = useState('any');
    const [facts, setFacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

const formatAnimalFact = (animal) => {
    const name = animal.name;
    const scientific = animal.taxonomy?.scientific_name || "";
    const lifespan = animal.characteristics?.lifespan || "";
    const diet = animal.characteristics?.diet || "";
    const distinctive = animal.characteristics?.most_distinctive_feature || animal.characteristics?.distinctive_feature || "";
    const temperament = animal.characteristics?.temperament || animal.characteristics?.group_behavior || "";
    
    let factParts = [];
    if (distinctive) factParts.push(`Distinctive feature: ${distinctive}.`);
    if (temperament) factParts.push(`Temperament: ${temperament}.`);
    if (lifespan) factParts.push(`Average lifespan: ${lifespan}.`);
    if (diet) factParts.push(`Diet: ${diet}.`);
    
    const factText = factParts.length > 0 
        ? `The ${name} (${scientific || 'scientific name pending'}) is a fascinating animal. ${factParts.join(' ')}`
        : `The ${name} (${scientific || 'scientific name pending'}) is known for its unique characteristics and roles in human households and environments.`;

    return {
        species: name.toLowerCase(),
        name: name,
        scientificName: scientific,
        lifespan: lifespan,
        diet: diet,
        distinctiveFeature: distinctive,
        temperament: temperament,
        fact: factText,
        source: 'API Ninjas Animals API'
    };
};

    const loadFacts = async (count = 1) => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const apiKey = 'umq5Kw3JhzWzxy3FbstB5hRFIwJargSdSta5PnyL';
            const COMMON_PETS = ['dog', 'cat', 'rabbit', 'hamster', 'goldfish', 'parrot', 'iguana', 'ferret', 'turtle', 'chameleon'];

            let fetchTerms = [];
            if (species === 'any') {
                const shuffled = [...COMMON_PETS].sort(() => 0.5 - Math.random());
                fetchTerms = shuffled.slice(0, count);
            } else {
                fetchTerms = Array(count).fill(species);
            }

            const factPromises = fetchTerms.map(async (term) => {
                const url = `https://api.api-ninjas.com/v1/animals?name=${term}`;
                const response = await axios.get(url, {
                    headers: { 'X-Api-Key': apiKey }
                });
                
                if (response.data && response.data.length > 0) {
                    const randomAnimal = response.data[Math.floor(Math.random() * response.data.length)];
                    return formatAnimalFact(randomAnimal);
                }
                throw new Error("No data");
            });

            const settled = await Promise.allSettled(factPromises);
            const loadedFacts = settled
                .filter(res => res.status === 'fulfilled')
                .map(res => res.value);

            if (loadedFacts.length === 0) {
                throw new Error("Failed to load facts");
            }

            setFacts(loadedFacts);
        } catch (err) {
            setError('Unable to load facts from API Ninjas right now. Please check your network or try again.');
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
                            <div style={styles.cardHeaderRow}>
                                <div style={styles.badge}>
                                    {item.name || 'Pet'}
                                </div>
                                <span style={styles.scientificNameLabel}>
                                    {item.scientificName ? `🔬 ${item.scientificName}` : ''}
                                </span>
                            </div>
                            
                            <div style={styles.cardAttrRow}>
                                <div style={styles.cardAttrBox}>
                                    <span style={styles.cardAttrLabel}>⏳ Lifespan</span>
                                    <span style={styles.cardAttrVal}>{item.lifespan || 'N/A'}</span>
                                </div>
                                <div style={styles.cardAttrBox}>
                                    <span style={styles.cardAttrLabel}>🥗 Diet</span>
                                    <span style={styles.cardAttrVal}>{item.diet || 'N/A'}</span>
                                </div>
                            </div>
                            
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
    card: {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        justifyContent: 'space-between'
    },
    badge: {
        display: 'inline-block',
        fontSize: '12px',
        fontWeight: '700',
        borderRadius: '999px',
        background: 'rgba(102, 126, 234, 0.15)',
        color: '#667eea',
        padding: '6px 12px'
    },
    factText: {
        color: 'var(--text-primary)',
        margin: 0,
        lineHeight: 1.6,
        fontSize: '14px'
    },
    source: {
        color: 'var(--text-muted)',
        marginTop: '8px',
        marginBottom: 0,
        fontSize: '12px'
    },
    cardHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--card-border)',
        paddingBottom: '10px'
    },
    scientificNameLabel: {
        fontSize: '12px',
        color: 'var(--text-secondary)',
        fontStyle: 'italic',
        fontWeight: '500'
    },
    cardAttrRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
    },
    cardAttrBox: {
        backgroundColor: 'rgba(102, 126, 234, 0.03)',
        border: '1px solid var(--card-border)',
        borderRadius: '10px',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    cardAttrLabel: {
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
        fontWeight: '600'
    },
    cardAttrVal: {
        fontSize: '12px',
        color: 'var(--text-primary)',
        fontWeight: '700'
    },
};

export default PetFactsPage;
