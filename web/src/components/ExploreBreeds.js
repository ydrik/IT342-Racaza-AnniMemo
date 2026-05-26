import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';

const ExploreBreeds = () => {
    const navigate = useNavigate();
    const [species, setSpecies] = useState('dog'); // 'dog', 'cat', 'others'
    const [breeds, setBreeds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        loadBreeds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [species, navigate]);

    const loadBreeds = async () => {
        setLoading(true);
        setError('');
        setBreeds([]);

        // Try to fetch from cache first to guarantee blistering fast page loads
        const cacheKey = `annimemo_explore_breeds_${species}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.length > 0) {
                    setBreeds(parsed);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                // Ignore cache parse error and fetch fresh
            }
        }

        try {
            let data = [];
            if (species === 'dog') {
                const res = await axios.get('https://api.thedogapi.com/v1/breeds', {
                    headers: { 'x-api-key': 'live_WvGQEESQRQwJZxfBt3yDqoTNI167OcAFDbUUKG01RmuzcWFAt6vWaXDWF6tQxGW8' }
                });
                data = res.data || [];
            } else if (species === 'cat') {
                const res = await axios.get('https://api.thecatapi.com/v1/breeds', {
                    headers: { 'x-api-key': 'live_RhwcJGAkjIOtOoPE8vt40pA5qW8Pki3WrBSgIRna2aHXi9Wrv0VLyzRQE9q6Yyi6' }
                });
                data = res.data || [];
            } else if (species === 'others') {
                const COMMON_OTHERS = ['rabbit', 'hamster', 'goldfish', 'parrot', 'iguana', 'ferret', 'turtle', 'chameleon'];
                const promises = COMMON_OTHERS.map(async (name) => {
                    const url = `https://api.api-ninjas.com/v1/animals?name=${name}`;
                    const res = await axios.get(url, {
                        headers: { 'X-Api-Key': 'umq5Kw3JhzWzxy3FbstB5hRFIwJargSdSta5PnyL' }
                    });
                    if (res.data && res.data.length > 0) {
                        return res.data[0];
                    }
                    return null;
                });
                const settled = await Promise.all(promises);
                data = settled.filter(Boolean);
            }

            if (data.length === 0) {
                throw new Error("Empty list returned");
            }

            setBreeds(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {
            setError(`Unable to load ${species} breeds from live API. Please check your network and try again.`);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredBreeds = () => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return breeds;

        return breeds.filter(item => {
            const name = (item.name || '').toLowerCase();
            const origin = (item.origin || '').toLowerCase();
            const temperament = (item.temperament || '').toLowerCase();
            const scientificName = (item.taxonomy?.scientific_name || '').toLowerCase();
            const breedGroup = (item.breed_group || '').toLowerCase();
            
            return name.includes(query) ||
                   origin.includes(query) ||
                   temperament.includes(query) ||
                   scientificName.includes(query) ||
                   breedGroup.includes(query);
        });
    };

    const filteredList = getFilteredBreeds();

    return (
        <div style={styles.page}>
            <Header />
            <div style={styles.container}>
                <button onClick={() => navigate('/dashboard')} style={styles.backButton}>
                    ← Back to Dashboard
                </button>
                <h1 style={styles.title}>Explore Breeds</h1>
                <p style={styles.subtitle}>Explore interesting information and temperaments of dogs, cats, and other pets.</p>

                {/* Species Navigation Tabs */}
                <div style={styles.tabContainer}>
                    <button
                        onClick={() => setSpecies('dog')}
                        style={species === 'dog' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
                    >
                        🐶 Dogs
                    </button>
                    <button
                        onClick={() => setSpecies('cat')}
                        style={species === 'cat' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
                    >
                        🐱 Cats
                    </button>
                    <button
                        onClick={() => setSpecies('others')}
                        style={species === 'others' ? { ...styles.tab, ...styles.activeTab } : styles.tab}
                    >
                        🐹 Other Animals
                    </button>
                </div>

                {/* Live Search Box */}
                <div style={styles.searchRow}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${species} breeds or keywords...`}
                        style={styles.searchInput}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={styles.clearSearchButton}>
                            Clear
                        </button>
                    )}
                </div>

                {loading && <p style={styles.muted}>Loading breeds from live APIs...</p>}
                {error && <p style={styles.error}>{error}</p>}

                {!loading && !error && filteredList.length === 0 && (
                    <p style={styles.muted}>No matching breeds found for "{searchQuery}"</p>
                )}

                {/* Breeds Card Grid */}
                {!loading && !error && (
                    <div style={styles.grid}>
                        {filteredList.map((item, index) => {
                            if (species === 'dog') {
                                return (
                                    <div key={`${item.id || index}`} style={styles.card}>
                                        <div style={styles.cardHeaderRow}>
                                            <div style={styles.badge}>🐶 {item.name}</div>
                                            {item.breed_group && <span style={styles.scientificNameLabel}>Group: {item.breed_group}</span>}
                                        </div>
                                        <div style={styles.cardAttrRow}>
                                            <div style={styles.cardAttrBox}>
                                                <span style={styles.cardAttrLabel}>⏳ Lifespan</span>
                                                <span style={styles.cardAttrVal}>{item.life_span || 'N/A'}</span>
                                            </div>
                                            <div style={styles.cardAttrBox}>
                                                <span style={styles.cardAttrLabel}>📍 Origin</span>
                                                <span style={styles.cardAttrVal}>{item.origin || 'N/A'}</span>
                                            </div>
                                        </div>
                                        {item.temperament && (
                                            <p style={styles.factText}>
                                                <strong>Temperament:</strong> {item.temperament}
                                            </p>
                                        )}
                                        {item.bred_for && (
                                            <p style={styles.source}>
                                                <strong>Bred For:</strong> {item.bred_for}
                                            </p>
                                        )}
                                    </div>
                                );
                            } else if (species === 'cat') {
                                return (
                                    <div key={`${item.id || index}`} style={styles.card}>
                                        <div style={styles.cardHeaderRow}>
                                            <div style={styles.badge}>🐱 {item.name}</div>
                                            {item.origin && <span style={styles.scientificNameLabel}>Origin: {item.origin}</span>}
                                        </div>
                                        <div style={styles.cardAttrRow}>
                                            <div style={styles.cardAttrBox}>
                                                <span style={styles.cardAttrLabel}>⏳ Lifespan</span>
                                                <span style={styles.cardAttrVal}>{item.life_span || 'N/A'} years</span>
                                            </div>
                                            <div style={styles.cardAttrBox}>
                                                <span style={styles.cardAttrLabel}>📍 Origin</span>
                                                <span style={styles.cardAttrVal}>{item.origin || 'N/A'}</span>
                                            </div>
                                        </div>
                                        {item.description && (
                                            <p style={styles.factText}>
                                                {item.description}
                                            </p>
                                        )}
                                        {item.temperament && (
                                            <p style={styles.source}>
                                                <strong>Temperament:</strong> {item.temperament}
                                            </p>
                                        )}
                                    </div>
                                );
                            } else {
                                // Others (API Ninjas)
                                const scientifique = item.taxonomy?.scientific_name || "";
                                const lifespan = item.characteristics?.lifespan || "";
                                const diet = item.characteristics?.diet || "";
                                const distinctive = item.characteristics?.most_distinctive_feature || item.characteristics?.distinctive_feature || "";
                                const temperament = item.characteristics?.temperament || item.characteristics?.group_behavior || "";
                                
                                return (
                                    <div key={`${item.name || index}`} style={styles.card}>
                                        <div style={styles.cardHeaderRow}>
                                            <div style={styles.badge}>🐾 {item.name}</div>
                                            {scientifique && <span style={styles.scientificNameLabel}>🔬 {scientifique}</span>}
                                        </div>
                                        <div style={styles.cardAttrRow}>
                                            <div style={styles.cardAttrBox}>
                                                <span style={styles.cardAttrLabel}>⏳ Lifespan</span>
                                                <span style={styles.cardAttrVal}>{lifespan || 'N/A'}</span>
                                            </div>
                                            <div style={styles.cardAttrBox}>
                                                <span style={styles.cardAttrLabel}>🥗 Diet</span>
                                                <span style={styles.cardAttrVal}>{diet || 'N/A'}</span>
                                            </div>
                                        </div>
                                        {distinctive && (
                                            <p style={styles.factText}>
                                                <strong>Distinctive Feature:</strong> {distinctive}
                                            </p>
                                        )}
                                        {temperament && (
                                            <p style={styles.source}>
                                                <strong>Group Behavior:</strong> {temperament}
                                            </p>
                                        )}
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { minHeight: '100vh', background: 'var(--app-bg)' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 90px' },
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
    title: { color: 'var(--text-primary)', margin: 0, fontSize: '38px', fontWeight: '700' },
    subtitle: { color: 'var(--text-muted)', marginTop: '8px', marginBottom: '25px', fontSize: '16px' },
    tabContainer: {
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap'
    },
    tab: {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        padding: '12px 24px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        transition: 'all 0.3s ease',
        boxShadow: 'var(--shadow-soft)'
    },
    activeTab: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderColor: 'transparent',
        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.35)'
    },
    searchRow: {
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        width: '100%',
        maxWidth: '500px',
        position: 'relative'
    },
    searchInput: {
        flex: 1,
        borderRadius: '10px',
        border: '1px solid var(--card-border)',
        padding: '12px 16px',
        background: 'var(--card-bg)',
        color: 'var(--text-primary)',
        outline: 'none',
        fontSize: '14px',
        transition: 'all 0.3s ease'
    },
    clearSearchButton: {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600'
    },
    muted: { color: 'var(--text-muted)', fontSize: '15px' },
    error: { color: '#ef4444', fontSize: '15px' },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
    },
    card: {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: 'var(--shadow-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    },
    cardHeaderRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--card-border)',
        paddingBottom: '12px'
    },
    badge: {
        display: 'inline-block',
        fontSize: '14px',
        fontWeight: '700',
        color: 'var(--text-primary)'
    },
    scientificNameLabel: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontStyle: 'italic',
        fontWeight: '500'
    },
    cardAttrRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
    },
    cardAttrBox: {
        backgroundColor: 'rgba(102, 126, 234, 0.04)',
        border: '1.5px solid var(--card-border)',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
    },
    cardAttrLabel: {
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
        fontWeight: '700'
    },
    cardAttrVal: {
        fontSize: '13px',
        color: 'var(--text-primary)',
        fontWeight: '700'
    },
    factText: {
        color: 'var(--text-secondary)',
        margin: 0,
        lineHeight: 1.6,
        fontSize: '14px'
    },
    source: {
        color: 'var(--text-muted)',
        margin: 0,
        fontSize: '13px'
    }
};

export default ExploreBreeds;
