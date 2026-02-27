const CACHE_TTL = 60 * 60 * 1000; // 1 час

export const saveCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem('cacheTime', Date.now().toString());
  } catch (e) { /* переполнен */ }
};

export const loadCache = (key) => {
  try {
    const t = localStorage.getItem('cacheTime');
    if (t && Date.now() - parseInt(t) > CACHE_TTL) return null;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
};
