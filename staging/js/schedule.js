// Shared schedule loader — provides ordered dance list for both admin and parent views

let scheduleData = null;
let orderedKeys = [];
let danceMap = {};

export async function loadSchedule() {
    if (scheduleData) return scheduleData;
    const res = await fetch('./schedule-optimized.json');
    scheduleData = await res.json();
    danceMap = scheduleData.dances;

    // Build ordered key list — sorts numerically, with "55A" after "55", etc.
    orderedKeys = Object.keys(danceMap).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (numA !== numB) return numA - numB;
        // Same number prefix — pure number comes before suffixed (e.g. "55" before "55A")
        return a.localeCompare(b);
    });

    return scheduleData;
}

export function getDanceMap() { return danceMap; }
export function getOrderedKeys() { return orderedKeys; }
export function getDance(key) { return danceMap[String(key)]; }
export function getTotalDances() { return orderedKeys.length; }

export function getCompetitionName() {
    return scheduleData?.competitionInfo?.name || 'Dance Competition';
}

// Get the position index (0-based) of a dance key in the ordered list
export function getPosition(key) {
    return orderedKeys.indexOf(String(key));
}

// Get the dance key at a given position index
export function getKeyAtPosition(pos) {
    if (pos < 0 || pos >= orderedKeys.length) return null;
    return orderedKeys[pos];
}

// How many dances away is targetKey from currentKey (by position, not number)
export function dancesAway(currentKey, targetKey) {
    const currentPos = getPosition(String(currentKey));
    const targetPos = getPosition(String(targetKey));
    if (currentPos === -1 || targetPos === -1) return null;
    return targetPos - currentPos;
}

// Get the next N dances after the given key (by position order)
export function getUpcoming(currentKey, count = 5) {
    const pos = getPosition(String(currentKey));
    if (pos === -1) return [];
    const upcoming = [];
    for (let i = pos + 1; i < Math.min(pos + 1 + count, orderedKeys.length); i++) {
        const key = orderedKeys[i];
        upcoming.push({ key, ...danceMap[key] });
    }
    return upcoming;
}

// Search dances by name, studio, or number — returns matching keys
export function searchDances(query) {
    const q = query.toLowerCase();
    const results = [];
    for (const key of orderedKeys) {
        const d = danceMap[key];
        if (
            key.toLowerCase().includes(q) ||
            (d.routine_title && d.routine_title.toLowerCase().includes(q)) ||
            (d.studio && d.studio.toLowerCase().includes(q))
        ) {
            results.push(key);
        }
    }
    return results;
}

// Get dances for a specific day
export function getDaysAvailable() {
    const days = new Set();
    for (const d of Object.values(danceMap)) {
        if (d.day) days.add(d.day);
    }
    return [...days];
}

// Get all dances for a specific studio on a specific day
export function getDancesByStudioAndDay(studio, day) {
    const results = [];
    for (const key of orderedKeys) {
        const d = danceMap[key];
        if (d.studio && d.studio.toLowerCase().includes(studio.toLowerCase()) &&
            d.day && d.day.toLowerCase() === day.toLowerCase()) {
            results.push(key);
        }
    }
    return results;
}
