// Alert System for DanceTrack
// intensity: 'high' (on stage or 1 away), 'medium' (2-3 away), 'low' (4-5 away)

let audioCtx = null;

export function triggerAlert(intensity) {
    playAlertSound(intensity);

    // Vibrate (mobile only, fails silently on desktop)
    if ('vibrate' in navigator) {
        if (intensity === 'high') {
            navigator.vibrate([200, 100, 200, 100, 200, 300, 400, 100, 400]);
        } else if (intensity === 'medium') {
            navigator.vibrate([300, 200, 300]);
        } else {
            navigator.vibrate([200]);
        }
    }

    // Visual flash
    if (intensity === 'high') {
        flashScreen('rgba(57, 255, 20, 0.4)');
    } else if (intensity === 'medium') {
        flashScreen('rgba(255, 77, 0, 0.3)');
    } else {
        flashScreen('rgba(0, 229, 255, 0.2)');
    }
}

function getAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playAlertSound(intensity) {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';

        if (intensity === 'high') {
            // Urgent two-tone chime
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } else if (intensity === 'medium') {
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } else {
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
    } catch (e) {
        // Audio not available — silent fallback
    }
}

function flashScreen(color) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `position:fixed;inset:0;background:${color};z-index:9999;pointer-events:none;transition:opacity 0.5s ease-out;`;
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        }, 150);
    });
}
