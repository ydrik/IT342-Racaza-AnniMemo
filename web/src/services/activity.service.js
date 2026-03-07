const STORAGE_KEY = "annimemoActivityLog";

const readActivities = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const writeActivities = (activities) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
};

const logActivity = (activity) => {
  const next = {
    id: activity.id || `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: activity.type || "activity",
    description: activity.description || "Activity logged",
    timestamp: activity.timestamp || new Date().toISOString(),
    icon: activity.icon || "📌",
    meta: activity.meta || {}
  };

  const activities = readActivities();
  activities.unshift(next);
  writeActivities(activities.slice(0, 50));
  return next;
};

const getActivities = () => {
  return readActivities();
};

const clearActivities = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const ActivityService = {
  logActivity,
  getActivities,
  clearActivities
};

export default ActivityService;
