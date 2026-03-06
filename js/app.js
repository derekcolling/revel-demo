import { database, ref, set, onValue } from './firebase-config.js';
import { triggerAlert } from './alerts.js';
import {
    loadSchedule, getDance, dancesAway, getCompetitionName, getPosition, getKeyAtPosition, searchDances
} from './schedule.js';

const currentDisplay = document.getElementById('currentDanceDisplay');
const currentTitle = document.getElementById('currentDanceTitle');
const currentStudio = document.getElementById('currentDanceStudio');
const trackedContainer = document.getElementById('trackedDancesContainer');
const trackInput = document.getElementById('danceTrackInput');
const trackBtn = document.getElementById('addTrackBtn');
const trackedCountDisplay = document.getElementById('trackedCount');
const competitionNameEl = document.getElementById('competitionName');
const alertToggle = document.getElementById('alertToggle');
const updateInput = document.getElementById('currentDanceInput');
const updateBtn = document.getElementById('setCurrentBtn');
const prevDanceBtn = document.getElementById('prevDanceBtn');
const nextDanceBtn = document.getElementById('nextDanceBtn');
const searchResults = document.getElementById('searchResults');

let currentDanceKey = null;
let trackedDances = JSON.parse(localStorage.getItem('danceTrack_saved')) || [];
let alertsEnabled = localStorage.getItem('danceTrack_alerts') !== 'off';
let lastAlertedKey = null;

// --- Set current dance ---

function pushUpdate() {
    const val = updateInput.value.trim().toUpperCase();
    if (!val) return;

    if (getPosition(val) === -1) {
        updateInput.classList.add('border-red-500');
        setTimeout(() => updateInput.classList.remove('border-red-500'), 1000);
        return;
    }

    if (database) {
        const danceRef = ref(database, 'competitions/revel2026/currentDance');
        set(danceRef, val)
            .then(() => {
                updateInput.value = '';
                updateInput.classList.add('border-neonGreen');
                setTimeout(() => updateInput.classList.remove('border-neonGreen'), 500);
            })
            .catch(err => console.error('Firebase update failed:', err));
    } else {
        updateCurrentDance(val);
        updateInput.value = '';
    }
}

function setDanceByKey(key) {
    if (database) {
        const danceRef = ref(database, 'competitions/revel2026/currentDance');
        set(danceRef, key).catch(err => console.error('Firebase update failed:', err));
    } else {
        updateCurrentDance(key);
    }
}

function goPrev() {
    if (!currentDanceKey) return;
    const pos = getPosition(currentDanceKey);
    const prevKey = getKeyAtPosition(pos - 1);
    if (prevKey) setDanceByKey(prevKey);
}

function goNext() {
    if (!currentDanceKey) return;
    const pos = getPosition(currentDanceKey);
    const nextKey = getKeyAtPosition(pos + 1);
    if (nextKey) setDanceByKey(nextKey);
}

// --- Track dances ---

function saveTracked() {
    localStorage.setItem('danceTrack_saved', JSON.stringify(trackedDances));
    renderTrackedList();
}

function addDance() {
    const val = trackInput.value.trim().toUpperCase();
    if (!val) return;

    if (getPosition(val) !== -1 && !trackedDances.includes(val)) {
        trackDanceKey(val);
        return;
    }

    const num = parseInt(val);
    if (!isNaN(num)) {
        const key = String(num);
        if (getPosition(key) !== -1 && !trackedDances.includes(key)) {
            trackDanceKey(key);
            return;
        }
    }

    // If there's exactly one search result, add it
    const results = searchDances(trackInput.value.trim());
    if (results.length === 1 && !trackedDances.includes(results[0])) {
        trackDanceKey(results[0]);
        return;
    }

    trackInput.classList.add('border-red-500');
    setTimeout(() => trackInput.classList.remove('border-red-500'), 1000);
}

function trackDanceKey(key) {
    trackedDances.push(key);
    sortTracked();
    saveTracked();
    trackInput.value = '';
    hideSearch();
}

function showSearchResults(query) {
    if (!query || query.length < 1) {
        hideSearch();
        return;
    }

    const results = searchDances(query).slice(0, 8);
    if (results.length === 0) {
        hideSearch();
        return;
    }

    searchResults.innerHTML = '';
    results.forEach(key => {
        const data = getDance(key);
        const row = document.createElement('button');
        row.type = 'button';
        const alreadyTracked = trackedDances.includes(key);
        row.className = `w-full text-left px-4 py-2.5 hover:bg-surface transition-colors flex items-center gap-3 ${alreadyTracked ? 'opacity-40' : ''}`;
        row.innerHTML = `
            <span class="text-electricBlue font-black text-sm w-8 shrink-0">${key}</span>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold truncate">${data ? data.routine_title : 'Unknown'}</p>
                <p class="text-[10px] text-gray-500 truncate">${data ? data.studio : ''}</p>
            </div>
            ${alreadyTracked ? '<span class="text-[10px] text-gray-600 shrink-0">ADDED</span>' : ''}
        `;
        if (!alreadyTracked) {
            row.addEventListener('mousedown', (e) => {
                e.preventDefault();
                trackDanceKey(key);
            });
        }
        searchResults.appendChild(row);
    });
    searchResults.classList.remove('hidden');
}

function hideSearch() {
    searchResults.classList.add('hidden');
    searchResults.innerHTML = '';
}

function sortTracked() {
    trackedDances.sort((a, b) => getPosition(a) - getPosition(b));
}

function removeTracked(key) {
    trackedDances = trackedDances.filter(d => d !== key);
    saveTracked();
}

window.removeTracked = removeTracked;

function renderTrackedList() {
    trackedCountDisplay.textContent = trackedDances.length;
    trackedContainer.innerHTML = '';

    if (trackedDances.length === 0) {
        trackedContainer.innerHTML = '<p class="text-gray-600 text-sm text-center py-8">Add a dance number above to start tracking</p>';
        return;
    }

    trackedDances.forEach(key => {
        const data = getDance(key);
        const away = currentDanceKey ? dancesAway(currentDanceKey, key) : null;

        let cardBorder = 'border-white/5';
        let cardBg = 'bg-surface/50';
        let statusText = '';
        let statusColor = 'text-gray-500';
        let pulseHtml = '';
        let numberBg = 'bg-dark';
        let numberBorder = 'border-gray-800';
        let numberColor = 'text-white';

        if (away === null) {
            statusText = 'WAITING...';
        } else if (away < 0) {
            statusText = 'COMPLETED';
            statusColor = 'text-gray-600';
            numberColor = 'text-gray-600';
        } else if (away === 0) {
            cardBorder = 'border-electricBlue/30';
            cardBg = 'card-glow-blue';
            statusText = 'ON STAGE NOW';
            statusColor = 'text-electricBlue';
            pulseHtml = '<div class="w-2 h-2 rounded-full animate-pulse bg-electricBlue"></div>';
            numberBg = 'bg-electricBlue/20';
            numberBorder = 'border-electricBlue/30';
            numberColor = 'text-electricBlue';
        } else if (away <= 2) {
            cardBorder = 'border-glowOrange/30';
            cardBg = 'card-glow-orange';
            statusText = away === 1 ? 'UP NEXT!' : '2 AWAY';
            statusColor = 'text-glowOrange';
            pulseHtml = '<div class="w-2 h-2 rounded-full animate-pulse bg-glowOrange"></div>';
            numberBg = 'bg-glowOrange/20';
            numberBorder = 'border-glowOrange/30';
            numberColor = 'text-glowOrange';
        } else if (away <= 5) {
            cardBorder = 'border-neonGreen/20';
            cardBg = 'card-glow-green';
            statusText = `${away} AWAY`;
            statusColor = 'text-neonGreen';
            numberBg = 'bg-neonGreen/10';
            numberBorder = 'border-neonGreen/20';
            numberColor = 'text-neonGreen';
        } else {
            statusText = `${away} AWAY`;
        }

        const title = data ? data.routine_title : 'Unknown Routine';
        const subtitle = data ? `${data.category} • ${data.time}` : '';

        const card = document.createElement('div');
        card.className = `rounded-2xl p-4 flex items-center gap-3 border ${cardBorder} ${cardBg} transition-all`;
        card.innerHTML = `
            <div class="w-12 h-12 rounded-xl ${numberBg} flex items-center justify-center border ${numberBorder} shrink-0">
                <span class="text-sm font-black ${numberColor}">${key}</span>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-sm truncate text-white">${title}</h4>
                <p class="text-xs text-gray-500 truncate">${subtitle}</p>
                <div class="flex items-center gap-2 mt-1">
                    ${pulseHtml}
                    <span class="text-[10px] uppercase font-black tracking-wider ${statusColor}">${statusText}</span>
                </div>
            </div>
            <button onclick="removeTracked('${key}')" class="w-8 h-8 rounded-full bg-dark/50 text-gray-600 hover:text-red-400 flex items-center justify-center active:scale-90 transition-all text-lg shrink-0">&times;</button>
        `;
        trackedContainer.appendChild(card);
    });
}

// --- Alerts ---

function checkAlerts() {
    if (!alertsEnabled || !currentDanceKey) return;
    if (lastAlertedKey === currentDanceKey) return;

    let highestIntensity = null;

    for (const key of trackedDances) {
        const away = dancesAway(currentDanceKey, key);
        if (away === null || away < 0) continue;

        if (away <= 1) {
            highestIntensity = 'high';
            break;
        } else if (away <= 3 && highestIntensity !== 'high') {
            highestIntensity = 'medium';
        } else if (away <= 5 && !highestIntensity) {
            highestIntensity = 'low';
        }
    }

    if (highestIntensity) {
        triggerAlert(highestIntensity);
        lastAlertedKey = currentDanceKey;
    }
}

// --- Current dance display ---

function updateCurrentDance(key) {
    key = String(key);
    currentDanceKey = key;
    localStorage.setItem('danceTrack_currentDance', key);

    currentDisplay.textContent = key;

    const data = getDance(key);
    if (data) {
        currentTitle.textContent = data.routine_title;
        currentStudio.textContent = `${data.studio} • ${data.category}`;
    } else {
        currentTitle.textContent = 'Unknown';
        currentStudio.textContent = '';
    }

    renderTrackedList();
    checkAlerts();
}

// --- Alert toggle ---

function updateAlertToggleUI() {
    if (alertsEnabled) {
        alertToggle.classList.remove('text-gray-600', 'border-gray-800');
        alertToggle.classList.add('text-neonGreen', 'border-neonGreen/30');
    } else {
        alertToggle.classList.remove('text-neonGreen', 'border-neonGreen/30');
        alertToggle.classList.add('text-gray-600', 'border-gray-800');
    }
}

// --- Init ---

async function init() {
    await loadSchedule();

    competitionNameEl.textContent = getCompetitionName();

    trackedDances = trackedDances.filter(k => getPosition(k) !== -1);
    sortTracked();
    saveTracked();

    // Set current dance
    updateBtn.addEventListener('click', pushUpdate);
    updateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') pushUpdate();
    });
    prevDanceBtn.addEventListener('click', goPrev);
    nextDanceBtn.addEventListener('click', goNext);

    // Track dances
    trackBtn.addEventListener('click', addDance);
    trackInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addDance();
        if (e.key === 'Escape') hideSearch();
    });
    trackInput.addEventListener('input', () => showSearchResults(trackInput.value.trim()));
    trackInput.addEventListener('blur', () => setTimeout(hideSearch, 150));

    // Alert toggle
    alertToggle.addEventListener('click', () => {
        alertsEnabled = !alertsEnabled;
        localStorage.setItem('danceTrack_alerts', alertsEnabled ? 'on' : 'off');
        updateAlertToggleUI();
    });
    updateAlertToggleUI();

    // Connect to Firebase or demo mode
    if (database) {
        const danceRef = ref(database, 'competitions/revel2026/currentDance');
        onValue(danceRef, (snapshot) => {
            const val = snapshot.val();
            if (val) updateCurrentDance(val);
        });
    } else {
        const saved = localStorage.getItem('danceTrack_currentDance');
        updateCurrentDance(saved && getPosition(saved) !== -1 ? saved : '1');
    }
}

init();
