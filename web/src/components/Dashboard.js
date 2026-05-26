import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import ActivityService from '../services/activity.service';

const CALENDAR_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toLocalDateKey(dateInput) {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function buildCalendarCells(anchorMonth) {
    const year = anchorMonth.getFullYear();
    const month = anchorMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    const cells = [];
    for (let i = 0; i < 42; i += 1) {
        const cellDate = new Date(gridStart);
        cellDate.setDate(gridStart.getDate() + i);
        cells.push({
            key: toLocalDateKey(cellDate),
            label: cellDate.getDate(),
            inCurrentMonth: cellDate.getMonth() === month
        });
    }
    return cells;
}

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [pets, setPets] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [dueSoonReminders, setDueSoonReminders] = useState([]);
    const [factOfDay, setFactOfDay] = useState(null);
    const [activityStreak, setActivityStreak] = useState(0);
    const [todayChecklist, setTodayChecklist] = useState([]);
    const [newChecklistItemText, setNewChecklistItemText] = useState('');
    const [dashboardSettings, setDashboardSettings] = useState({
        reminderWindowDays: 7,
        defaultFactSpecies: 'any',
        compactDashboard: false
    });
    const [isLoading, setIsLoading] = useState(true);

    const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => toLocalDateKey(new Date()));
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in (Authentication Check)
        const token = localStorage.getItem('token');
        if (!token) {
            // Activity Diagram: If not authenticated, redirect to Login
            navigate('/login'); 
        } else {
            setDashboardSettings(getDashboardSettings());
            fetchDashboardData();
        }
    // Intentional one-time auth/bootstrap check for this route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate]);

    useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const getDashboardSettings = () => {
        try {
            const raw = localStorage.getItem('annimemo_settings');
            if (!raw) {
                return { reminderWindowDays: 7, defaultFactSpecies: 'any', compactDashboard: false };
            }
            const parsed = JSON.parse(raw);
            return {
                reminderWindowDays: Number(parsed.reminderWindowDays || 7),
                defaultFactSpecies: parsed.defaultFactSpecies || 'any',
                compactDashboard: Boolean(parsed.compactDashboard)
            };
        } catch {
            return { reminderWindowDays: 7, defaultFactSpecies: 'any', compactDashboard: false };
        }
    };

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const settings = getDashboardSettings();
            setDashboardSettings(settings);

            // Decode username from token to act as fallback
            let decodedUsername = 'User';
            if (token) {
                try {
                    const decoded = atob(token);
                    const parts = decoded.split(':');
                    if (parts[0]) {
                        decodedUsername = parts[0];
                    }
                } catch (e) {
                    // Ignore token decode error
                }
            }

            // 1. Fetch user profile
            try {
                const userResponse = await axios.get('http://localhost:8080/api/users/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(userResponse.data);
            } catch (err) {
                // Fallback to decoded username instead of hardcoded 'johndoe' / 'John'
                setUser({
                    username: decodedUsername,
                    firstName: decodedUsername,
                    lastName: '',
                    email: `${decodedUsername}@example.com`
                });
            }

            // 2. Fetch pets
            let petsData = [];
            try {
                const petsResponse = await axios.get('http://localhost:8080/api/pets', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                petsData = petsResponse.data || [];
                setPets(petsData);
            } catch (err) {
                petsData = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
                setPets(petsData);
            }

            // 3. Fetch recent activities
            let mergedActivities = [];
            try {
                const activitiesResponse = await axios.get('http://localhost:8080/api/activities/recent', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const metricActivities = mapMetricsToActivities(activitiesResponse.data);
                const petActivities = mapPetsToActivities(petsData);
                const localActivities = mapLocalActivities(ActivityService.getActivities());
                mergedActivities = sortActivitiesByDate([...metricActivities, ...petActivities, ...localActivities]);
                setRecentActivities(mergedActivities);
                setActivityStreak(calculateActivityStreak(mergedActivities));
            } catch (err) {
                const localActivities = mapLocalActivities(ActivityService.getActivities());
                mergedActivities = sortActivitiesByDate(localActivities);
                setRecentActivities(mergedActivities);
                setActivityStreak(calculateActivityStreak(mergedActivities));
            }

            // 4. Fetch due-soon reminders
            let reminders = [];
            try {
                const remindersResponse = await axios.get(`http://localhost:8080/api/reminders/due-soon?days=${settings.reminderWindowDays}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                reminders = remindersResponse.data || [];
                setDueSoonReminders(reminders);
            } catch (err) {
                const localReminders = JSON.parse(localStorage.getItem('annimemo_reminders') || '[]');
                const now = new Date();
                const limit = new Date();
                limit.setDate(now.getDate() + (settings.reminderWindowDays || 7));
                
                const filtered = localReminders.filter(r => {
                    if (r.completed) return false;
                    const due = new Date(r.dueDate);
                    return due >= new Date(now.toDateString()) && due <= limit;
                });
                setDueSoonReminders(filtered);
            }

            // 5. Load or Create Checklist
            setTodayChecklist(loadOrCreateChecklist(petsData, mergedActivities, reminders));

            // 6. Fetch fact of the day
            try {
                await loadFactOfTheDay(token, settings.defaultFactSpecies);
            } catch (err) {
                setFactOfDay({
                    species: 'pet',
                    fact: 'Pets thrive with predictable routines, especially around feeding, exercise, and sleep.',
                    source: 'Dashboard fallback'
                });
            }
        } catch (err) {
            console.error("Error loading dashboard details: ", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getFactDateKey = () => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const loadFactOfTheDay = async (token, species) => {
        const dayKey = getFactDateKey();
        const factSpecies = species || 'any';
        const storageKey = `annimemo_fact_of_day_${dayKey}_${factSpecies}`;
        const cached = localStorage.getItem(storageKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                // Dynamic cache validation to ensure it has all granular fields populated correctly (prevents N/A from old cache layout)
                if (parsed && parsed.name && parsed.scientificName && parsed.lifespan && parsed.diet && parsed.slogan) {
                    setFactOfDay(parsed);
                    return;
                }
            } catch {
                // ignore parsing issue and fetch fresh
            }
        }

        const apiKey = 'umq5Kw3JhzWzxy3FbstB5hRFIwJargSdSta5PnyL';
        const COMMON_PETS = ['dog', 'cat', 'rabbit', 'hamster', 'goldfish', 'parrot', 'iguana', 'ferret', 'turtle', 'chameleon'];
        
        let termIndex = factSpecies === 'any' ? (new Date().getDate() % COMMON_PETS.length) : COMMON_PETS.indexOf(factSpecies);
        if (termIndex === -1) termIndex = 0;

        let animal = null;

        // Loop through COMMON_PETS to find an animal with complete data
        for (let i = 0; i < COMMON_PETS.length; i++) {
            const index = (termIndex + i) % COMMON_PETS.length;
            const currentTerm = COMMON_PETS[index];
            
            try {
                const url = `https://api.api-ninjas.com/v1/animals?name=${currentTerm}`;
                const response = await axios.get(url, {
                    headers: { 'X-Api-Key': apiKey }
                });
                
                if (response.data && response.data.length > 0) {
                    // Filter candidates that have all critical fields populated
                    const candidate = response.data.find(a => 
                        a.name && 
                        a.taxonomy?.scientific_name && 
                        a.characteristics?.lifespan && 
                        a.characteristics?.diet
                    );
                    
                    if (candidate) {
                        animal = candidate;
                        break;
                    }
                }
            } catch (e) {
                // Try next species in the list if fetch fails
            }
        }

        // Ultimate reliable fallback if no candidate satisfies the filter
        if (!animal) {
            try {
                const response = await axios.get(`https://api.api-ninjas.com/v1/animals?name=dog`, {
                    headers: { 'X-Api-Key': apiKey }
                });
                if (response.data && response.data.length > 0) {
                    animal = response.data[0];
                }
            } catch (e) {
                // Final safety fallback to prevent empty state in case of extreme network/API issues
                animal = {
                    name: "Dog",
                    taxonomy: { scientific_name: "Canis lupus familiaris" },
                    characteristics: { lifespan: "10 - 13 years", diet: "Omnivore" }
                };
            }
        }

        // Fetch inspirational quote as slogan
        let quoteText = "Happiness is a warm puppy.";
        let quoteAuthor = "Charles M. Schulz";
        try {
            const quoteResponse = await axios.get('https://api.api-ninjas.com/v1/quotes?category=happiness', {
                headers: { 'X-Api-Key': apiKey }
            });
            if (quoteResponse.data && quoteResponse.data.length > 0) {
                quoteText = quoteResponse.data[0].quote;
                quoteAuthor = quoteResponse.data[0].author;
            }
        } catch (e) {
            // Ignore quotes API error, use fallback
        }

        if (animal) {
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

            const payload = {
                species: name.toLowerCase(),
                name: name,
                scientificName: scientific,
                lifespan: lifespan,
                diet: diet,
                distinctiveFeature: distinctive,
                temperament: temperament,
                fact: factText,
                slogan: `"${quoteText}" — ${quoteAuthor}`,
                source: 'API Ninjas Animals API'
            };

            setFactOfDay(payload);
            localStorage.setItem(storageKey, JSON.stringify(payload));
        } else {
            throw new Error("No animal details returned from API Ninjas");
        }
    };

    const calculateActivityStreak = (activities) => {
        if (!activities.length) {
            return 0;
        }

        const uniqueDays = new Set(
            activities
                .map((activity) => {
                    const date = new Date(activity.timestamp || 0);
                    if (Number.isNaN(date.getTime())) {
                        return null;
                    }
                    return date.toISOString().split('T')[0];
                })
                .filter(Boolean)
        );

        let streak = 0;
        const cursor = new Date();
        while (true) {
            const key = cursor.toISOString().split('T')[0];
            if (!uniqueDays.has(key)) {
                break;
            }
            streak += 1;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    };

    const calculateCareScore = (petCount, activityCount, reminderCount, checklistItems = []) => {
        if (!checklistItems || checklistItems.length === 0) {
            return 0;
        }

        const completedCount = checklistItems.filter(item => item.done).length;
        return Math.round((completedCount / checklistItems.length) * 100);
    };

    const getChecklistStorageKey = () => `annimemo_checklist_${getFactDateKey()}`;

    const createChecklistTemplate = (petsData, activities, reminders) => {
        return [];
    };

    const loadOrCreateChecklist = (petsData, activities, reminders) => {
        const storageKey = getChecklistStorageKey();
        const cached = localStorage.getItem(storageKey);

        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch {
                // Ignore invalid cache and recreate below.
            }
        }

        const template = createChecklistTemplate(petsData, activities, reminders);
        localStorage.setItem(storageKey, JSON.stringify(template));
        return template;
    };

    const toggleChecklistItem = (id) => {
        const updated = todayChecklist.map((item) =>
            item.id === id ? { ...item, done: !item.done } : item
        );
        setTodayChecklist(updated);
        localStorage.setItem(getChecklistStorageKey(), JSON.stringify(updated));
    };

    const handleAddChecklistItem = (e) => {
        e.preventDefault();
        const trimmed = newChecklistItemText.trim();
        if (!trimmed) {
            return;
        }
        const newItem = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: trimmed,
            done: false
        };
        const updated = [...todayChecklist, newItem];
        setTodayChecklist(updated);
        localStorage.setItem(getChecklistStorageKey(), JSON.stringify(updated));
        setNewChecklistItemText('');
    };

    const deleteChecklistItem = (id) => {
        const updated = todayChecklist.filter((item) => item.id !== id);
        setTodayChecklist(updated);
        localStorage.setItem(getChecklistStorageKey(), JSON.stringify(updated));
    };



    const completedChecklistCount = todayChecklist.filter((item) => item.done).length;
    const checklistCompletion = todayChecklist.length
        ? Math.round((completedChecklistCount / todayChecklist.length) * 100)
        : 0;

    const calendarEvents = [
        ...dueSoonReminders.map((item) => ({
            id: `reminder-${item.id}`,
            title: item.title,
            meta: item.petName,
            type: 'Reminder',
            dateKey: toLocalDateKey(item.dueDate)
        })),
        ...recentActivities.map((item) => ({
            id: `activity-${item.id}`,
            title: item.description,
            meta: item.petName,
            type: 'Activity',
            dateKey: toLocalDateKey(item.timestamp)
        }))
    ].filter((item) => item.dateKey);

    const eventsByDate = calendarEvents.reduce((acc, item) => {
        if (!acc[item.dateKey]) {
            acc[item.dateKey] = [];
        }
        acc[item.dateKey].push(item);
        return acc;
    }, {});

    const calendarCells = buildCalendarCells(calendarMonth);
    const selectedDateEvents = eventsByDate[selectedCalendarDate] || [];
    const calendarMonthLabel = calendarMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });



    const formatActivityTimestamp = (value) => {
        if (!value) {
            return 'Recently';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'Recently';
        }

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const timeLabel = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        if (date.toDateString() === today.toDateString()) {
            return `Today • ${timeLabel}`;
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return `Yesterday • ${timeLabel}`;
        }

        const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${dateLabel} • ${timeLabel}`;
    };

    const normalizeMetricType = (type) => {
        if (!type) {
            return 'other';
        }
        const normalized = type.toLowerCase();
        if (normalized === 'vet_visit' || normalized === 'vetvisit') {
            return 'vetVisit';
        }
        return normalized;
    };

    const mapMetricsToActivities = (metrics) => {
        if (!Array.isArray(metrics)) {
            return [];
        }

        return metrics.map((metric) => {
            const type = normalizeMetricType(metric.type);
            const petName = metric.petName || 'Your pet';
            const dateValue = metric.date || metric.startDate || metric.vaccineDate || metric.createdAt;
            let description = 'Health update logged';
            let icon = '📌';

            switch (type) {
                case 'weight':
                    description = metric.weight ? `Weight recorded: ${metric.weight} kg` : 'Weight recorded';
                    icon = '📊';
                    break;
                case 'medication':
                    description = metric.medicationName || 'Medication logged';
                    if (metric.dosage) {
                        description = `${description} (${metric.dosage})`;
                    }
                    icon = '💊';
                    break;
                case 'vaccination':
                    description = metric.vaccineName || 'Vaccination logged';
                    icon = '💉';
                    break;
                case 'vetVisit':
                    description = metric.visitReason ? `Vet visit: ${metric.visitReason}` : 'Vet visit logged';
                    icon = '🏥';
                    break;
                default:
                    description = metric.notes || 'Health update logged';
            }

            return {
                id: metric.id,
                type,
                petName,
                description,
                timestamp: dateValue,
                icon
            };
        });
    };

    const mapPetsToActivities = (petsData) => {
        if (!Array.isArray(petsData)) {
            return [];
        }

        return petsData.map((pet) => ({
            id: `pet-${pet.id}`,
            type: 'petCreated',
            petName: pet.name || 'New pet',
            description: `New pet profile created${pet.species ? `: ${pet.species}` : ''}`,
            timestamp: pet.createdAt || null,
            icon: '🐾'
        }));
    };

    const mapLocalActivities = (activities) => {
        if (!Array.isArray(activities)) {
            return [];
        }

        return activities.map((activity) => ({
            id: activity.id,
            type: activity.type,
            petName: activity.meta?.petName || 'Activity',
            description: activity.description,
            timestamp: activity.timestamp,
            icon: activity.icon || '📌'
        }));
    };

    const sortActivitiesByDate = (activities) => {
        return activities
            .slice()
            .sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeB - timeA;
            })
            .slice(0, 8);
    };

    const careScore = calculateCareScore(pets.length, recentActivities.length, dueSoonReminders.length, todayChecklist);

    if (isLoading) {
        return (
            <div style={styles.loadingContainer}>
                <p style={styles.loadingText}>Loading dashboard...</p>
            </div>
        );
    }

    const isTablet = viewportWidth < 1460;
    const isMobile = viewportWidth < 1024;
    const shellStyle = isMobile ? styles.shellGridMobile : isTablet ? styles.shellGridTablet : styles.shellGrid;
    const containerStyle = isMobile ? styles.containerMobile : styles.container;
    const leftSidebarStyle = isMobile ? styles.leftSidebarMobile : styles.leftSidebar;
    const rightSidebarStyle = isMobile ? styles.rightSidebarMobile : isTablet ? styles.rightSidebarTablet : styles.rightSidebar;
    const welcomeTitleStyle = isMobile ? styles.welcomeTitleMobile : styles.welcomeTitle;
    const welcomeSubtitleStyle = isMobile ? styles.welcomeSubtitleMobile : styles.welcomeSubtitle;

    return (
        <div style={styles.pageContainer}>
            {/* Header / Navigation Bar */}
            <Header />

            <div style={containerStyle}>
                <div style={shellStyle}>
                    <aside style={leftSidebarStyle}>
                        <h4 style={styles.sidebarTitle}>Navigation</h4>
                        <button onClick={() => navigate('/dashboard')} style={styles.sidebarButton}>🏠 Dashboard</button>
                        <button onClick={() => navigate('/pets')} style={styles.sidebarButton}>🐾 My Pets</button>
                        <button onClick={() => navigate('/reminders')} style={styles.sidebarButton}>⏰ Reminders</button>
                        <button onClick={() => navigate('/appointments')} style={styles.sidebarButton}>🗓️ Appointments</button>
                        <button onClick={() => {
                            const localPets = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
                            if (localPets.length > 0) {
                                navigate(`/pets/${localPets[0].id}/health`);
                            } else {
                                navigate('/pets');
                            }
                        }} style={styles.sidebarButton}>📈 Health Trends</button>
                        <button onClick={() => navigate('/facts')} style={styles.sidebarButton}>📚 Pet Facts</button>
                        <button onClick={() => navigate('/settings')} style={styles.sidebarButton}>⚙️ Settings</button>
                    </aside>

                    <div style={dashboardSettings.compactDashboard ? styles.mainCanvasCompact : styles.mainCanvas}>
                {/* Welcome Section */}
                <div style={styles.welcomeSection}>
                    <h1 style={welcomeTitleStyle}>
                        Welcome back, {user?.firstName || user?.name}! 👋
                    </h1>
                    <p style={welcomeSubtitleStyle}>
                        Here's what's happening with your pets today
                    </p>
                    <div style={styles.welcomeMetaRow}>
                        <span style={styles.welcomeMetaChip}>Pets: {pets.length}</span>
                        <span style={styles.welcomeMetaChip}>Due Soon: {dueSoonReminders.length}</span>
                        <span style={styles.welcomeMetaChip}>Streak: {activityStreak}d</span>
                    </div>
                </div>

                <div style={styles.hookStrip}>
                    <div style={styles.hookCard}>
                        <div style={styles.hookLabel}>Activity Streak</div>
                        <div style={styles.hookValue}>{activityStreak} day{activityStreak !== 1 ? 's' : ''}</div>
                        <div style={styles.hookHint}>Keep logging updates daily.</div>
                    </div>
                    <div style={styles.hookCard}>
                        <div style={styles.hookLabel}>Care Score</div>
                        <div style={styles.hookValue}>{careScore}%</div>
                        <div style={styles.scoreBar}>
                            <div style={{ ...styles.scoreFill, width: `${careScore}%` }}></div>
                        </div>
                    </div>
                    <div style={styles.hookCard}>
                        <div style={styles.hookLabel}>Due in 7 Days</div>
                        <div style={styles.hookValue}>{dueSoonReminders.length}</div>
                        <button onClick={() => navigate('/reminders')} style={styles.hookActionButton}>
                            View reminders
                        </button>
                    </div>
                </div>

                <div style={styles.factCard}>
                    <div style={styles.factHeader}>
                        <h3 style={styles.factTitle}>Fact of the Day</h3>
                        <button onClick={() => navigate('/facts')} style={styles.factMoreButton}>More facts</button>
                    </div>
                    {factOfDay ? (
                        <div style={styles.factContentLayout}>
                            <div style={styles.factGrid}>
                                <div style={styles.factMiniCard}>
                                    <span style={styles.factMiniLabel}>🧬 Species</span>
                                    <span style={styles.factMiniValue}>{factOfDay.name || 'Pet'}</span>
                                </div>
                                <div style={styles.factMiniCard}>
                                    <span style={styles.factMiniLabel}>🔬 Scientific</span>
                                    <span style={{ ...styles.factMiniValue, fontStyle: 'italic' }}>{factOfDay.scientificName || 'N/A'}</span>
                                </div>
                                <div style={styles.factMiniCard}>
                                    <span style={styles.factMiniLabel}>⏳ Lifespan</span>
                                    <span style={styles.factMiniValue}>{factOfDay.lifespan || 'N/A'}</span>
                                </div>
                                <div style={styles.factMiniCard}>
                                    <span style={styles.factMiniLabel}>🥗 Diet</span>
                                    <span style={styles.factMiniValue}>{factOfDay.diet || 'N/A'}</span>
                                </div>
                            </div>
                            <div style={styles.factDescWrap}>
                                <div>
                                    <p style={styles.factText}>{factOfDay.fact}</p>
                                    {factOfDay.slogan && (
                                        <p style={styles.factSloganQuote}>💡 {factOfDay.slogan}</p>
                                    )}
                                </div>
                                <p style={{ ...styles.factSource, marginTop: '8px' }}>Source: {factOfDay.source}</p>
                            </div>
                        </div>
                    ) : (
                        <p style={styles.factText}>Loading your daily pet fact...</p>
                    )}
                </div>

                <div style={styles.checklistCard}>
                    <div style={styles.checklistHeader}>
                        <h3 style={styles.checklistTitle}>Today's Checklist</h3>
                        <div style={styles.checklistProgressLabel}>{completedChecklistCount}/{todayChecklist.length} done</div>
                    </div>
                    <div style={styles.checklistProgressBar}>
                        <div style={{ ...styles.checklistProgressFill, width: `${checklistCompletion}%` }}></div>
                    </div>
                    
                    <form onSubmit={handleAddChecklistItem} style={styles.checklistForm}>
                        <input
                            value={newChecklistItemText}
                            onChange={(e) => setNewChecklistItemText(e.target.value)}
                            placeholder="Add a new checklist task..."
                            style={styles.checklistInput}
                            aria-label="New checklist item"
                        />
                        <button type="submit" style={styles.checklistAddButton}>Add</button>
                    </form>

                    <div style={styles.checklistItems}>
                        {todayChecklist.length === 0 ? (
                            <p style={styles.checklistEmptyText}>No checklist tasks for today. Add one above! ✨</p>
                        ) : (
                            todayChecklist.map((item) => (
                                <div
                                    key={item.id}
                                    style={item.done ? { ...styles.checklistItem, ...styles.checklistItemDone } : styles.checklistItem}
                                >
                                    <button
                                        onClick={() => toggleChecklistItem(item.id)}
                                        style={styles.checklistToggleBtn}
                                        aria-label={item.done ? "Mark incomplete" : "Mark complete"}
                                    >
                                        <span style={styles.checklistBullet}>{item.done ? '✅' : '⬜'}</span>
                                        <span style={{
                                            ...styles.checklistText,
                                            textDecoration: item.done ? 'line-through' : 'none',
                                            opacity: item.done ? 0.7 : 1
                                        }}>
                                            {item.label}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => deleteChecklistItem(item.id)}
                                        style={styles.checklistDeleteBtn}
                                        aria-label="Delete item"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={styles.quickActions}>
                    <h3 style={styles.sectionTitle}>Quick Actions</h3>
                    <div style={styles.actionGrid}>
                        <button onClick={() => navigate('/pets')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>🐾</div>
                            <div style={styles.actionTitle}>My Pets</div>
                            <div style={styles.actionSubtitle}>{pets.length} pet{pets.length !== 1 ? 's' : ''}</div>
                        </button>
                        <button onClick={() => {
                            const localPets = JSON.parse(localStorage.getItem('annimemo_pets') || '[]');
                            if (localPets.length > 0) {
                                navigate(`/pets/${localPets[0].id}/health`);
                            } else {
                                navigate('/pets');
                            }
                        }} style={styles.actionCard}>
                            <div style={styles.actionIcon}>📊</div>
                            <div style={styles.actionTitle}>Health Trends</div>
                            <div style={styles.actionSubtitle}>View progress over time</div>
                        </button>
                        <button onClick={() => navigate('/breeds')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>🔍</div>
                            <div style={styles.actionTitle}>Explore Breeds</div>
                            <div style={styles.actionSubtitle}>Dog & Cat breeds</div>
                        </button>
                        <button onClick={() => navigate('/reminders')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>⏰</div>
                            <div style={styles.actionTitle}>Reminders</div>
                            <div style={styles.actionSubtitle}>Upcoming care tasks</div>
                        </button>
                        <button onClick={() => navigate('/appointments')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>🗓️</div>
                            <div style={styles.actionTitle}>Appointments</div>
                            <div style={styles.actionSubtitle}>Track vet visits</div>
                        </button>
                        <button onClick={() => navigate('/facts')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>📚</div>
                            <div style={styles.actionTitle}>Pet Facts</div>
                            <div style={styles.actionSubtitle}>Learn something new</div>
                        </button>
                        <button onClick={() => navigate('/profile')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>👤</div>
                            <div style={styles.actionTitle}>My Profile</div>
                            <div style={styles.actionSubtitle}>Account settings</div>
                        </button>
                        {/* FRS Feature 2: Role-Based UI Restriction */}
                        {user?.role === 'ADMIN' && (
                            <button onClick={() => navigate('/admin')} style={{...styles.actionCard, ...styles.adminCard}}>
                                <div style={styles.actionIcon}>👨‍💼</div>
                                <div style={styles.actionTitle}>Admin Panel</div>
                                <div style={styles.actionSubtitle}>Manage users</div>
                            </button>
                        )}
                        <button onClick={() => navigate('/pets/add')} style={styles.actionCard}>
                            <div style={styles.actionIcon}>➕</div>
                            <div style={styles.actionTitle}>Add Pet</div>
                            <div style={styles.actionSubtitle}>New companion</div>
                        </button>
                    </div>
                </div>

                {/* Your Pets Section */}
                <div style={styles.petsSection}>
                    <h3 style={styles.sectionTitle}>Your Pets</h3>
                    {pets.length === 0 ? (
                        <div style={styles.emptyState}>
                            <p style={styles.emptyStateText}>🐾 No pets yet. Add your first companion!</p>
                            <button onClick={() => navigate('/pets/add')} style={styles.addPetCTA}>
                                Add Your First Pet
                            </button>
                        </div>
                    ) : (
                        <div style={styles.petsGridLayout}>
                            {pets.map((pet) => (
                                <div key={pet.id} style={styles.petCardWrapper}>
                                    <div style={styles.petCardInner}>
                                        <div style={styles.petImageContainer}>
                                            {pet.imageUrl ? (
                                                <img src={pet.imageUrl} alt={pet.name} style={styles.petImage} />
                                            ) : (
                                                <div style={styles.petPlaceholder}>
                                                    {pet.species === 'Dog' ? '🐕' : 
                                                     pet.species === 'Cat' ? '🐱' : 
                                                     pet.species === 'Bird' ? '🦜' : 
                                                     pet.species === 'Rabbit' ? '🐰' : 
                                                     pet.species === 'Fish' ? '🐟' : '🐾'}
                                                </div>
                                            )}
                                        </div>
                                        <div style={styles.petDetails}>
                                            <h4 style={styles.petTitle}>{pet.name}</h4>
                                            <p style={styles.petSubtitle}>{pet.species}{pet.breed ? ` • ${pet.breed}` : ''}</p>
                                            <div style={styles.petButtonRow}>
                                                <button 
                                                    onClick={() => navigate(`/pets/edit/${pet.id}`)}
                                                    style={styles.petSmallButton}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button 
                                                    onClick={() => navigate(`/pets/${pet.id}/health`)}
                                                    style={{...styles.petSmallButton, ...styles.healthBtn}}
                                                >
                                                    📊 Health
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Grid - Pets and Activities */}
                <div style={styles.mainGrid}>
                    <div style={styles.rightColumn}>
                        <h3 style={styles.sectionTitle}>Recent Activities</h3>
                        {recentActivities.length === 0 ? (
                            <div style={styles.emptyActivities}>
                                <p style={styles.emptyText}>No recent activities</p>
                            </div>
                        ) : (
                            <div style={styles.activitiesList}>
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} style={styles.activityItem}>
                                        <div style={styles.activityIcon}>{activity.icon}</div>
                                        <div style={styles.activityContent}>
                                            <div style={styles.activityPetName}>{activity.petName}</div>
                                            <div style={styles.activityDescription}>{activity.description}</div>
                                            <div style={styles.activityDate}>{formatActivityTimestamp(activity.timestamp)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                    </div>

                    <aside style={rightSidebarStyle}>
                        <div style={styles.sideCard}>
                            <div style={styles.calendarHeader}>
                                <h4 style={styles.sideCardTitle}>Calendar</h4>
                                <button
                                    onClick={() => {
                                        const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                                        setCalendarMonth(next);
                                    }}
                                    style={styles.calendarNavButton}
                                    aria-label="Previous month"
                                >
                                    {'<'}
                                </button>
                                <button
                                    onClick={() => {
                                        const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                                        setCalendarMonth(next);
                                    }}
                                    style={styles.calendarNavButton}
                                    aria-label="Next month"
                                >
                                    {'>'}
                                </button>
                            </div>
                            <div style={styles.calendarMonthLabel}>{calendarMonthLabel}</div>
                            <div style={styles.calendarWeekdays}>
                                {CALENDAR_WEEKDAYS.map((day) => (
                                    <div key={day} style={styles.calendarWeekdayCell}>{day}</div>
                                ))}
                            </div>
                            <div style={styles.calendarGrid}>
                                {calendarCells.map((cell) => {
                                    const hasEvents = Boolean(eventsByDate[cell.key]?.length);
                                    const isSelected = cell.key === selectedCalendarDate;
                                    const cellStyle = isSelected
                                        ? { ...styles.calendarDayCell, ...styles.calendarDayCellSelected }
                                        : !cell.inCurrentMonth
                                            ? { ...styles.calendarDayCell, ...styles.calendarDayCellMuted }
                                            : styles.calendarDayCell;

                                    return (
                                        <button
                                            key={cell.key}
                                            onClick={() => setSelectedCalendarDate(cell.key)}
                                            style={cellStyle}
                                        >
                                            <span>{cell.label}</span>
                                            {hasEvents && <span style={styles.calendarEventDot}></span>}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                                    setSelectedCalendarDate(toLocalDateKey(today));
                                }}
                                style={styles.sideActionButton}
                            >
                                Jump to Today
                            </button>
                            <div style={styles.calendarAgenda}>
                                <h5 style={styles.calendarAgendaTitle}>Selected Day Agenda</h5>
                                {selectedDateEvents.length === 0 ? (
                                    <p style={styles.sideEmpty}>No events on this day.</p>
                                ) : (
                                    <div style={styles.sideList}>
                                        {selectedDateEvents.slice(0, 5).map((item) => (
                                            <div key={item.id} style={styles.sideListItem}>
                                                <div style={styles.sideItemTitle}>{item.title}</div>
                                                <div style={styles.sideItemMeta}>{item.type} • {item.meta}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={styles.sideCard}>
                            <h4 style={styles.sideCardTitle}>Due Soon</h4>
                            {dueSoonReminders.length === 0 ? (
                                <p style={styles.sideEmpty}>Nothing urgent right now.</p>
                            ) : (
                                <div style={styles.sideList}>
                                    {dueSoonReminders.slice(0, 4).map((item) => (
                                        <div key={item.id} style={styles.sideListItem}>
                                            <div style={styles.sideItemTitle}>{item.title}</div>
                                            <div style={styles.sideItemMeta}>{item.petName} • {item.dueDate}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={styles.sideCard}>
                            <h4 style={styles.sideCardTitle}>Quick Adjustments</h4>
                            <p style={styles.sideEmpty}>Reminder window: {dashboardSettings.reminderWindowDays} day(s)</p>
                            <p style={styles.sideEmpty}>Fact species: {dashboardSettings.defaultFactSpecies}</p>
                            <button onClick={() => navigate('/settings')} style={styles.sideActionButton}>Open Settings</button>
                        </div>
                    </aside>
                </div>
            </div>


        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: '100vh',
        background: 'var(--app-bg)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        paddingBottom: '72px'
    },
    navbar: {
        backgroundColor: 'var(--card-bg)',
        backdropFilter: 'blur(10px)',
        borderBottom: 'none',
        padding: '18px 0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    },
    navbarContent: {
        maxWidth: '1580px',
        margin: '0 auto',
        padding: '0 32px',
        display: 'flex',
        gap: '22px',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    navbarContentMobile: {
        maxWidth: '1580px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '12px'
    },
    navbarCenter: {
        flex: 1,
        maxWidth: '760px',
        minWidth: 0
    },
    navbarBrand: {
        display: 'flex',
        alignItems: 'center'
    },
    brandTitle: {
        margin: 0,
        fontSize: '26px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    navbarActions: {
        display: 'flex',
        gap: '12px',
        flexShrink: 0
    },
    navbarActionsMobile: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '10px'
    },
    commandForm: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: '8px',
        alignItems: 'center'
    },
    commandInput: {
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '11px 14px',
        background: 'var(--app-bg)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        height: '44px',
        boxSizing: 'border-box'
    },
    commandButton: {
        border: 'none',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: '#fff',
        fontWeight: '700',
        height: '44px',
        padding: '0 16px',
        cursor: 'pointer'
    },
    profileButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        transition: 'all 0.3s ease'
    },
    settingsButton: {
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(2,132,199,0.4)',
        transition: 'all 0.3s ease'
    },
    logoutButton: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)',
        transition: 'all 0.3s ease'
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
    container: {
        maxWidth: '1580px',
        margin: '0 auto',
        padding: '46px 32px'
    },
    containerMobile: {
        maxWidth: '1580px',
        margin: '0 auto',
        padding: '24px 16px'
    },
    shellGrid: {
        display: 'grid',
        gridTemplateColumns: '240px minmax(760px, 1fr) 300px',
        gap: '28px',
        alignItems: 'start'
    },
    shellGridTablet: {
        display: 'grid',
        gridTemplateColumns: '220px minmax(0, 1fr)',
        gap: '20px',
        alignItems: 'start'
    },
    shellGridMobile: {
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
        alignItems: 'start'
    },
    leftSidebar: {
        position: 'sticky',
        top: '92px',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '18px',
        padding: '18px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
    },
    leftSidebarMobile: {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '14px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
    },
    sidebarTitle: {
        marginTop: 0,
        marginBottom: '10px',
        color: 'var(--text-primary)',
        fontSize: '15px'
    },
    sidebarButton: {
        width: '100%',
        border: '1px solid var(--card-border)',
        background: 'var(--app-bg)',
        color: 'var(--text-primary)',
        borderRadius: '12px',
        padding: '12px 14px',
        cursor: 'pointer',
        textAlign: 'left',
        marginBottom: '10px',
        fontWeight: '600'
    },
    mainCanvas: {
        minWidth: 0,
        display: 'grid',
        gap: '24px'
    },
    mainCanvasCompact: {
        minWidth: 0,
        display: 'grid',
        gap: '18px',
        transform: 'scale(0.98)',
        transformOrigin: 'top center'
    },
    rightSidebar: {
        position: 'sticky',
        top: '92px',
        display: 'grid',
        gap: '14px'
    },
    rightSidebarTablet: {
        display: 'grid',
        gap: '14px',
        gridColumn: '2 / 3'
    },
    rightSidebarMobile: {
        display: 'grid',
        gap: '12px'
    },
    sideCard: {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '18px',
        padding: '18px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
    },
    sideCardTitle: {
        marginTop: 0,
        marginBottom: '10px',
        color: 'var(--text-primary)',
        fontSize: '15px'
    },
    calendarHeader: {
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: '6px'
    },
    calendarNavButton: {
        border: '1px solid var(--card-border)',
        background: 'var(--app-bg)',
        color: 'var(--text-primary)',
        borderRadius: '8px',
        width: '30px',
        height: '30px',
        cursor: 'pointer',
        fontWeight: '700'
    },
    calendarMonthLabel: {
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontWeight: '700',
        marginBottom: '8px'
    },
    calendarWeekdays: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '6px'
    },
    calendarWeekdayCell: {
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '11px',
        fontWeight: '700'
    },
    calendarGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '4px',
        marginBottom: '10px'
    },
    calendarDayCell: {
        border: '1px solid var(--card-border)',
        background: 'var(--app-bg)',
        color: 'var(--text-primary)',
        borderRadius: '8px',
        height: '32px',
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        padding: 0
    },
    calendarDayCellMuted: {
        opacity: 0.45
    },
    calendarDayCellSelected: {
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        border: 'none',
        color: '#fff',
        fontWeight: '700'
    },
    calendarEventDot: {
        position: 'absolute',
        width: '5px',
        height: '5px',
        borderRadius: '999px',
        background: '#22c55e',
        bottom: '4px',
        right: '4px'
    },
    calendarAgenda: {
        marginTop: '10px'
    },
    calendarAgendaTitle: {
        margin: '0 0 8px 0',
        color: 'var(--text-primary)',
        fontSize: '13px'
    },
    sideEmpty: {
        margin: '6px 0',
        color: 'var(--text-muted)',
        fontSize: '13px'
    },
    sideList: {
        display: 'grid',
        gap: '8px'
    },
    sideListItem: {
        border: '1px solid var(--card-border)',
        borderRadius: '10px',
        padding: '8px 10px',
        background: 'var(--app-bg)'
    },
    sideItemTitle: {
        color: 'var(--text-primary)',
        fontSize: '13px',
        fontWeight: '700'
    },
    sideItemMeta: {
        color: 'var(--text-muted)',
        fontSize: '12px'
    },
    sideActionButton: {
        border: 'none',
        borderRadius: '10px',
        padding: '8px 10px',
        cursor: 'pointer',
        color: '#fff',
        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
        fontWeight: '600'
    },
    welcomeSection: {
        marginBottom: '10px',
        textAlign: 'center',
        animation: 'fadeInDown 0.6s ease-out'
    },
    welcomeTitle: {
        fontSize: '38px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 12px 0',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    welcomeTitleMobile: {
        fontSize: '30px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 8px 0',
        textShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    welcomeSubtitle: {
        fontSize: '18px',
        color: 'var(--text-muted)',
        margin: 0,
        fontWeight: '300'
    },
    welcomeSubtitleMobile: {
        fontSize: '16px',
        color: 'var(--text-muted)',
        margin: 0,
        fontWeight: '400'
    },
    welcomeMetaRow: {
        marginTop: '14px',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '10px'
    },
    welcomeMetaChip: {
        border: '1px solid var(--card-border)',
        borderRadius: '999px',
        padding: '6px 12px',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        background: 'var(--card-bg)',
        fontWeight: '600'
    },
    hookStrip: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '4px'
    },
    hookCard: {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '22px 24px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)'
    },
    hookLabel: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        marginBottom: '4px',
        fontWeight: '600'
    },
    hookValue: {
        fontSize: '28px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '6px'
    },
    hookHint: {
        fontSize: '13px',
        color: 'var(--text-muted)'
    },
    scoreBar: {
        width: '100%',
        background: 'rgba(100,116,139,0.2)',
        borderRadius: '999px',
        height: '8px',
        overflow: 'hidden',
        marginTop: '8px'
    },
    scoreFill: {
        height: '100%',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    },
    hookActionButton: {
        marginTop: '6px',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#fff',
        fontWeight: '600',
        padding: '8px 10px',
        background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)'
    },
    factCard: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        padding: '24px 26px',
        marginBottom: '8px',
        boxShadow: '0 10px 28px rgba(0,0,0,0.08)'
    },
    factHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px'
    },
    factTitle: {
        margin: 0,
        color: 'var(--text-primary)',
        fontSize: '20px'
    },
    factMoreButton: {
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        color: '#fff',
        fontWeight: '600',
        padding: '8px 12px',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
    },
    factText: {
        color: 'var(--text-primary)',
        fontSize: '15px',
        lineHeight: 1.6,
        marginTop: 0,
        marginBottom: '8px'
    },
    factSource: {
        color: 'var(--text-muted)',
        fontSize: '12px',
        margin: 0
    },
    factContentLayout: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginTop: '14px'
    },
    factGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
    },
    factMiniCard: {
        backgroundColor: 'rgba(102, 126, 234, 0.04)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        justifyContent: 'center'
    },
    factMiniLabel: {
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--text-muted)',
        fontWeight: '600'
    },
    factMiniValue: {
        fontSize: '13px',
        color: 'var(--text-primary)',
        fontWeight: '700'
    },
    factDescWrap: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(102, 126, 234, 0.02)',
        border: '1px solid var(--card-border)',
        borderRadius: '16px',
        padding: '18px'
    },
    factSloganQuote: {
        borderLeft: '4px solid #667eea',
        paddingLeft: '12px',
        margin: '10px 0 0 0',
        fontStyle: 'italic',
        fontSize: '13px',
        color: 'var(--text-secondary)',
        lineHeight: '1.5'
    },
    checklistCard: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        padding: '24px 26px',
        marginBottom: '8px',
        boxShadow: '0 10px 28px rgba(0,0,0,0.08)'
    },
    checklistHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '10px'
    },
    checklistTitle: {
        margin: 0,
        color: 'var(--text-primary)',
        fontSize: '20px'
    },
    checklistProgressLabel: {
        color: 'var(--text-muted)',
        fontSize: '13px',
        fontWeight: '600'
    },
    checklistProgressBar: {
        width: '100%',
        height: '8px',
        borderRadius: '999px',
        background: 'rgba(100,116,139,0.2)',
        overflow: 'hidden',
        marginBottom: '14px'
    },
    checklistProgressFill: {
        height: '100%',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
    },
    checklistItems: {
        display: 'grid',
        gap: '8px'
    },
    checklistItem: {
        border: '1px solid var(--card-border)',
        borderRadius: '10px',
        background: 'var(--app-bg)',
        color: 'var(--text-primary)',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
    },
    checklistItemDone: {
        background: 'rgba(34,197,94,0.12)',
        border: '1px solid rgba(34,197,94,0.5)'
    },
    checklistBullet: {
        flexShrink: 0
    },
    checklistText: {
        fontSize: '14px',
        lineHeight: 1.4
    },
    checklistForm: {
        display: 'flex',
        gap: '8px',
        marginBottom: '14px'
    },
    checklistInput: {
        flex: 1,
        border: '1px solid var(--card-border)',
        borderRadius: '10px',
        padding: '10px 12px',
        background: 'var(--app-bg)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    checklistAddButton: {
        border: 'none',
        borderRadius: '10px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontWeight: '600',
        padding: '0 16px',
        cursor: 'pointer',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.2s'
    },
    checklistToggleBtn: {
        border: 'none',
        background: 'transparent',
        color: 'inherit',
        textAlign: 'left',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flex: 1
    },
    checklistDeleteBtn: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '14px',
        padding: '4px 8px',
        borderRadius: '6px',
        transition: 'background 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checklistEmptyText: {
        color: 'var(--text-muted)',
        fontSize: '14px',
        textAlign: 'center',
        margin: '16px 0',
        fontStyle: 'italic'
    },
    quickActions: {
        marginBottom: '10px',
        animation: 'fadeInUp 0.6s ease-out'
    },
    sectionTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '20px',
        textShadow: '0 2px 8px rgba(0,0,0,0.15)'
    },
    actionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '22px'
    },
    actionCard: {
        backgroundColor: 'var(--card-bg)',
        border: 'none',
        borderRadius: '20px',
        padding: '30px 24px',
        cursor: 'pointer',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
    },
    actionIcon: {
        fontSize: '48px'
    },
    actionTitle: {
        fontSize: '18px',
        fontWeight: '700',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    actionSubtitle: {
        fontSize: '14px',
        color: 'var(--text-muted)',
        fontWeight: '500'
    },
    adminCard: {
        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        color: 'white'
    },
    mainContent: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '30px',
        animation: 'fadeInUp 0.8s ease-out'
    },
    leftColumn: {},
    rightColumn: {},
    emptyState: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    },
    emptyStateText: {
        fontSize: '16px',
        color: 'var(--text-secondary)',
        margin: '0 0 20px 0',
        fontWeight: '500'
    },
    emptyIcon: {
        fontSize: '64px',
        margin: '0 0 20px 0'
    },
    emptyText: {
        fontSize: '18px',
        color: 'var(--text-muted)',
        margin: '0 0 30px 0',
        fontWeight: '500'
    },
    addPetButton: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        border: 'none',
        padding: '14px 32px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '700',
        boxShadow: '0 8px 20px rgba(17, 153, 142, 0.3)',
        transition: 'all 0.3s ease'
    },
    petsGridLayout: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '26px',
        marginTop: '20px'
    },
    petCardWrapper: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '16px',
        overflow: 'visible',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        transition: 'all 0.3s ease',
        border: '1px solid var(--card-border)',
        cursor: 'pointer'
    },
    petCardInner: {
        padding: '20px 20px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%'
    },
    petImageContainer: {
        width: '100%',
        height: '160px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'rgba(102, 126, 234, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '14px'
    },
    petImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    petPlaceholder: {
        fontSize: '64px',
        lineHeight: 1
    },
    petDetails: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    petTitle: {
        fontSize: '17px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 4px 0',
        lineHeight: 1.2
    },
    petSubtitle: {
        fontSize: '13px',
        color: 'var(--text-muted)',
        margin: '0 0 12px 0',
        fontWeight: '500'
    },
    petButtonRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginTop: 'auto',
        paddingTop: '4px'
    },
    petSmallButton: {
        padding: '10px 14px',
        minHeight: '40px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '13px',
        fontWeight: '600',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.2s ease'
    },
    healthBtn: {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        boxShadow: '0 4px 12px rgba(250, 112, 154, 0.3)'
    },
    addPetCTA: {
        marginTop: '20px',
        padding: '14px 28px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease'
    },
    petActions: {
        display: 'flex',
        gap: '10px'
    },
    petActionButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        flex: 1,
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease'
    },
    healthActionButton: {
        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
    },
    activitiesList: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    },
    activityItem: {
        display: 'flex',
        gap: '14px',
        padding: '16px 0',
        borderBottom: '1px solid var(--card-border)'
    },
    activityIcon: {
        fontSize: '28px',
        flexShrink: 0
    },
    activityContent: {
        flex: 1
    },
    activityPetName: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '5px'
    },
    activityDescription: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '5px'
    },
    activityDate: {
        fontSize: '12px',
        color: 'var(--text-muted)',
        fontWeight: '600'
    },
    emptyActivities: {
        backgroundColor: 'var(--card-bg)',
        borderRadius: '20px',
        padding: '60px 40px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
    }
};

export default Dashboard;