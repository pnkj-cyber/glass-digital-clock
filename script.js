const secRing = document.getElementById('sec-ring');
const minRing = document.getElementById('min-ring');
const hourRing = document.getElementById('hour-ring');

const labelTime = document.getElementById('label-time');
const labelDate = document.getElementById('label-date');
const labelAmpm = document.getElementById('label-ampm');
const labelSeconds = document.getElementById('label-seconds');

const clockContainer = document.getElementById('clock-container');
// UI Elements for mode toggle & actions
const btnModeClock = document.getElementById('btn-mode-clock');
const btnModeAlarm = document.getElementById('btn-mode-alarm');
const btnModeStopwatch = document.getElementById('btn-mode-stopwatch');
const centerBtn = document.getElementById('center-btn');
const btnReset = document.getElementById('btn-reset');

// Icons
const iconClock = document.getElementById('icon-clock');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const iconBell = document.getElementById('icon-bell');

// Alarm UI Setup
const alarmUi = document.getElementById('alarm-ui');
const alarmTimeInput = document.getElementById('alarm-time-input');
const btnSetAlarm = document.getElementById('btn-set-alarm');
const alarmMusicSelect = document.getElementById('alarm-music-select');
const btnPreviewSound = document.getElementById('btn-preview-sound');
const alarmsList = document.getElementById('alarms-list');
const alarmRingingOverlay = document.getElementById('alarm-ringing-overlay');
const btnStopAlarm = document.getElementById('btn-stop-alarm');
const alarmAudio = document.getElementById('alarm-audio');

// Calculate circumferences
const radiusSec = secRing.r.baseVal.value;
const circSec = 2 * Math.PI * radiusSec;
secRing.style.strokeDasharray = `${circSec} ${circSec}`;
secRing.style.strokeDashoffset = circSec;

const radiusMin = minRing.r.baseVal.value;
const circMin = 2 * Math.PI * radiusMin;
minRing.style.strokeDasharray = `${circMin} ${circMin}`;
minRing.style.strokeDashoffset = circMin;

const radiusHour = hourRing.r.baseVal.value;
const circHour = 2 * Math.PI * radiusHour;
hourRing.style.strokeDasharray = `${circHour} ${circHour}`;
hourRing.style.strokeDashoffset = circHour;

// State Variables
let appMode = 'clock'; // 'clock' | 'alarm' | 'stopwatch'
let isRunning = false;
let startTime = 0;
let elapsedTime = 0;

// Alarm State
let alarms = []; // Array of objects: { id, time, music, isActive, lastRungDate }
let isRinging = false;

function updateUI() {
    const now = new Date();

    // Background Alarm checking
    if (!isRinging) {
        const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDateStr = now.toDateString();
        
        alarms.forEach(alarm => {
            if (alarm.isActive && alarm.time === currentHHMM && alarm.lastRungDate !== currentDateStr) {
                isRinging = true;
                alarm.lastRungDate = currentDateStr;
                
                // Set the corresponding music
                alarmAudio.src = alarm.music;
                alarmRingingOverlay.classList.remove('hidden');
                
                // Play sound safely, catch if blocked
                alarmAudio.play().catch(e => console.log('Audio play requires user interaction first.'));
            }
        });
    }

    if (appMode === 'clock' || appMode === 'alarm') {
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const ms = now.getMilliseconds();
        
        const smoothSec = seconds + (ms / 1000);
        const smoothMin = minutes + (smoothSec / 60);
        const hour12 = hours % 12 || 12; 
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const smoothHour = (hours % 12) + (smoothMin / 60);

        const offsetSec = circSec - (smoothSec / 60) * circSec;
        const offsetMin = circMin - (smoothMin / 60) * circMin;
        const offsetHour = circHour - (smoothHour / 12) * circHour;

        secRing.style.strokeDashoffset = offsetSec;
        minRing.style.strokeDashoffset = offsetMin;
        hourRing.style.strokeDashoffset = offsetHour;

        const formatTime = (val) => val.toString().padStart(2, '0');
        labelTime.innerText = `${hour12}:${formatTime(minutes)}`;
        labelAmpm.innerText = ampm;
        labelSeconds.innerText = `${formatTime(seconds)}s`;

        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        labelDate.innerText = now.toLocaleDateString('en-US', options);

    } else if (appMode === 'stopwatch') {
        const timeToDisplay = isRunning ? Date.now() - startTime + elapsedTime : elapsedTime;
        
        const msText = parseInt((timeToDisplay % 1000) / 10);
        const s = parseInt((timeToDisplay / 1000) % 60);
        const m = parseInt((timeToDisplay / (1000 * 60)) % 60);
        
        const formatTime = (val) => val.toString().padStart(2, '0');
        
        labelTime.innerText = `${formatTime(m)}:${formatTime(s)}`;
        labelSeconds.innerText = `.${formatTime(msText)}`;
        
        const smoothMs = (timeToDisplay % 1000) / 1000;
        const smoothSec = s + smoothMs;
        const smoothMin = m + (smoothSec / 60);

        const offsetSecRing = circSec - smoothMs * circSec;
        const offsetMinRing = circMin - (smoothSec / 60) * circMin;
        const offsetHourRing = circHour - (smoothMin / 60) * circHour;

        secRing.style.strokeDashoffset = offsetSecRing;
        minRing.style.strokeDashoffset = offsetMinRing;
        hourRing.style.strokeDashoffset = offsetHourRing;
    }

    requestAnimationFrame(updateUI);
}

// Start update loop
updateUI();

// ---------------------------
// Helpers
// ---------------------------
function switchModeUI(mode) {
    // Reset buttons
    btnModeClock.classList.remove('active');
    btnModeAlarm.classList.remove('active');
    btnModeStopwatch.classList.remove('active');
    
    // Hide all context-specific UI initially
    btnReset.classList.remove('active');
    alarmUi.classList.add('hidden');
    
    // Reset all icons
    iconClock.classList.remove('active');
    iconBell.classList.remove('active');
    iconPlay.classList.remove('active');
    iconPause.classList.remove('active');

    if (mode === 'clock') {
        btnModeClock.classList.add('active');
        labelDate.classList.remove('hidden');
        labelAmpm.classList.remove('hidden');
        iconClock.classList.add('active');
        secRing.style.transition = 'stroke-dashoffset 0.5s linear';
    } 
    else if (mode === 'alarm') {
        btnModeAlarm.classList.add('active');
        labelDate.classList.remove('hidden');
        labelAmpm.classList.remove('hidden');
        iconBell.classList.add('active');
        alarmUi.classList.remove('hidden');
        secRing.style.transition = 'stroke-dashoffset 0.5s linear';
    } 
    else if (mode === 'stopwatch') {
        btnModeStopwatch.classList.add('active');
        labelDate.classList.add('hidden');
        labelAmpm.classList.add('hidden');
        btnReset.classList.add('active');
        iconPlay.classList.toggle('active', !isRunning);
        iconPause.classList.toggle('active', isRunning);
        secRing.style.transition = 'none';
        minRing.style.transition = 'none';
        hourRing.style.transition = 'none';
    }
}

// ---------------------------
// Event Listeners
// ---------------------------

btnModeClock.addEventListener('click', () => {
    if (appMode === 'clock') return;
    appMode = 'clock';
    switchModeUI('clock');
});

btnModeAlarm.addEventListener('click', () => {
    if (appMode === 'alarm') return;
    appMode = 'alarm';
    switchModeUI('alarm');
});

btnModeStopwatch.addEventListener('click', () => {
    if (appMode === 'stopwatch') return;
    appMode = 'stopwatch';
    switchModeUI('stopwatch');
});

// Stopwatch Controls
centerBtn.addEventListener('click', () => {
    if (appMode === 'stopwatch') {
        if (isRunning) {
            isRunning = false;
            elapsedTime += Date.now() - startTime;
            iconPause.classList.remove('active');
            iconPlay.classList.add('active');
        } else {
            isRunning = true;
            startTime = Date.now();
            iconPlay.classList.remove('active');
            iconPause.classList.add('active');
        }
    }
});

btnReset.addEventListener('click', () => {
    if (appMode === 'stopwatch') {
        isRunning = false;
        elapsedTime = 0;
        iconPause.classList.remove('active');
        iconPlay.classList.add('active');
    }
});

// Alarm Controls
btnSetAlarm.addEventListener('click', () => {
    if (alarmTimeInput.value) {
        const time = alarmTimeInput.value;
        const music = alarmMusicSelect.value;
        const id = Date.now();
        
        // Check if alarm already exists for this exact time
        const exists = alarms.find(a => a.time === time);
        if (!exists) {
            alarms.push({ id, time, music, isActive: true, lastRungDate: null });
            alarmTimeInput.value = ''; // Reset input
            renderAlarms();
        }
    }
});

function renderAlarms() {
    alarmsList.innerHTML = '';
    
    // Sort alarms by time ascending
    alarms.sort((a, b) => a.time.localeCompare(b.time));
    
    alarms.forEach(alarm => {
        const el = document.createElement('div');
        el.className = 'alarm-item';
        el.innerHTML = `
            <span>⏰ ${alarm.time}</span>
            <button class="alarm-item-remove" data-id="${alarm.id}">X</button>
        `;
        alarmsList.appendChild(el);
    });

    document.querySelectorAll('.alarm-item-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.getAttribute('data-id'));
            alarms = alarms.filter(a => a.id !== id);
            renderAlarms();
        });
    });
}

// Preview Sound Control
let isPreviewing = false;
btnPreviewSound.addEventListener('click', () => {
    if (isPreviewing) {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
        isPreviewing = false;
        btnPreviewSound.innerText = '▶';
    } else {
        alarmAudio.src = alarmMusicSelect.value;
        alarmAudio.play().catch(e => console.log('Audio play requires user interaction first.'));
        isPreviewing = true;
        btnPreviewSound.innerText = '⏹';
    }
});

alarmMusicSelect.addEventListener('change', () => {
    if (isPreviewing) {
        alarmAudio.src = alarmMusicSelect.value;
        alarmAudio.play().catch(e => console.log(e));
    }
});

btnStopAlarm.addEventListener('click', () => {
    isRinging = false;
    alarmRingingOverlay.classList.add('hidden');
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
});

// 3D Tilt Effect
document.addEventListener('mousemove', (e) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const x = (e.pageX - centerX) / centerX;
    const y = (e.pageY - centerY) / centerY;

    const maxRotate = 25;
    const rotateX = -y * maxRotate; 
    const rotateY = x * maxRotate;

    clockContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
});

document.addEventListener('mouseleave', () => {
    clockContainer.style.transform = `rotateX(0deg) rotateY(0deg)`;
    clockContainer.style.transition = `transform 0.5s ease-out`;
    
    setTimeout(() => {
        clockContainer.style.transition = `none`;
    }, 500);
});
