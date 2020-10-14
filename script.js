window.addEventListener('load', onLoad);
window.addEventListener('resize', setCanvasSize);

window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

const inhaleKeys = ['i', 'ArrowDown'];
const exhaleKeys = ['o', 'ArrowUp'];

const donut = {
    ratio: {
        hole: 1 / 3.5,
        padding: 1 / Math.pow(2, 4),
        lineWidth: 1 / Math.pow(2, 6),
    },
    color: {
        breath: 'cornflowerblue',
        empty: '#151515',
        hold: 'dodgerblue',
        hole: 'midnightblue',
        line: 'white'
    },
    center: {},
    radius: {}
};

let phaseIndex = 0;
const phases = ['inhale', 'holdInhale', 'exhale', 'holdExhale'];
let phase = phases[phaseIndex];

function getNextPhase() {
    phaseIndex++;
    if (phaseIndex > phases.length - 1) {
        phaseIndex = 0;
        updateTimings();
    }
    return phases[phaseIndex];
}

const millisecondsPerSecond = 1000;
const circleRadians = 2 * Math.PI;
const topRadians = 1.5 * Math.PI;

const input = {
    inhaleDuration: 4000,
    holdInhaleDuration: 3000,
    exhaleDuration: 8000,
    holdExhaleDuration: 1000
};

const target = {
    inhaleDuration: 4000,
    holdInhaleDuration: 3000,
    exhaleDuration: 8000,
    holdExhaleDuration: 1000
};

const current = {};
const transitionSpeed = 1000;

function initializeCurrentTimes() {
    for (const [key, value] of Object.entries(input)) {
        current[key] = value;
    }
    console.log(current);
}

let isTargetReached = false;

function updateTimings() {
    let diffs = {};
    let totalDeviation = 0;
    for (const key of Object.keys(input)) {
        const diff = target[key] - current[key];
        diffs[key] = diff;
        totalDeviation += Math.abs(diff);
    }

    if (totalDeviation === 0) {
        console.log('Reached target breathing pattern.');
        isTargetReached = true;
        return;
    }

    for (const key of Object.keys(input)) {
        const diff = diffs[key];
        const absDiff = Math.abs(diff);
        const maxChange = (absDiff / totalDeviation) * transitionSpeed;
        current[key] += Math.sign(diff) * Math.min(absDiff, maxChange);
    }
    console.log(current);
}


function onLoad() {
    initializeCurrentTimes();
    setCanvasSize();
    window.requestAnimationFrame(draw);
}

let inhaleStartTime;
let exhaleStartTime;
let inhaleEndTime;
let exhaleEndTime;

let inhaleDuration;
let exhaleDuration;
let holdInhaleDuration;
let holdExhaleDuration;

function onKeyDown(event) {
    if (!inhaleStartTime && inhaleKeys.includes(event.key)) {
        // Inhale Start
        inhaleEndTime = 0;
        inhaleStartTime = Date.now();
        holdExhaleDuration = inhaleStartTime - exhaleEndTime;
        console.log('Empty Hold: ' + holdExhaleDuration);
        console.log('Breathing In');
    } else if (!exhaleStartTime && exhaleKeys.includes(event.key)) {
        // Exhale Start
        exhaleEndTime = 0;
        exhaleStartTime = Date.now();
        holdInhaleDuration = exhaleStartTime - inhaleEndTime;
        console.log('Full Hold: ' + holdInhaleDuration);
        console.log('Breathing Out');
    }
}

function onKeyUp(event) {
    if (!inhaleEndTime && inhaleKeys.includes(event.key)) {
        // Inhale End
        inhaleEndTime = Date.now();
        inhaleDuration = inhaleEndTime - inhaleStartTime;
        inhaleStartTime = 0;
        console.log('Inhale: ' + inhaleDuration);
    } else if (!exhaleEndTime && exhaleKeys.includes(event.key)) {
        // Exhale End
        exhaleEndTime = Date.now();
        exhaleDuration = exhaleEndTime - exhaleStartTime;
        exhaleStartTime = 0;
        console.log('Exhale: ' + exhaleDuration);
    }
}


const container = document.getElementById('canvasContainer');
const canvas = document.getElementById('circleCanvas');
const ctx = canvas.getContext('2d');

function setCanvasSize() {
    // Set actual size in memory (scaled to account for extra pixel density).
    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(container.clientWidth * scale);
    canvas.height = Math.floor(container.clientHeight * scale);

    const size = Math.min(canvas.width, canvas.height);
    const padding = size * donut.ratio.padding;
    const lineWidth = size * donut.ratio.lineWidth;
    const halfLineWidth = lineWidth / 2;

    ctx.scale(scale, scale); // Normalize coordinate system to use css pixels.
    ctx.strokeStyle = donut.color.line;
    ctx.lineCap = 'round';

    donut.center.x = canvas.width / 2;
    donut.center.y = canvas.height / 2;

    donut.thickLineWidth = lineWidth;
    donut.thinLineWidth = halfLineWidth;

    donut.radius.max = (size - padding - lineWidth) / 2;
    donut.radius.min = donut.radius.max * donut.ratio.hole;
    donut.radius.range = donut.radius.max - donut.radius.min;

    donut.radius.outerLine = donut.radius.max + halfLineWidth;
    donut.radius.innerLine = donut.radius.min - halfLineWidth;
}

let startTime;

function draw(timeNow) {
    if (!startTime) startTime = timeNow;
    const timeElapsed = timeNow - startTime;

    switch (phase) {
        case 'inhale':
            var targetDuration = current.inhaleDuration;
            var breathFraction = Math.min(timeElapsed / targetDuration, 1);
            var holdFraction = 0;
            break;
        case 'holdInhale':
            var targetDuration = current.holdInhaleDuration;
            var holdFraction = Math.min(timeElapsed / targetDuration, 1);
            var breathFraction = 1;
            break;
        case 'exhale':
            var targetDuration = current.exhaleDuration;
            var breathFraction = 1 - Math.min(timeElapsed / targetDuration, 1);
            var holdFraction = 1;
            break;
        case 'holdExhale':
            var targetDuration = current.holdExhaleDuration;
            var holdFraction = 1 - Math.min(timeElapsed / targetDuration, 1);
            var breathFraction = 0;
            break;
        default:
            throw 'Alien breathing phase.'
    }

    const breathRadius = donut.radius.min + (donut.radius.range * breathFraction);
    const holdRadians = topRadians + (circleRadians * holdFraction);

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = donut.thickLineWidth;

    // Outer Circle
    ctx.beginPath();
    ctx.arc(donut.center.x, donut.center.y, donut.radius.outerLine, 0, circleRadians);
    ctx.fillStyle = donut.color.empty;
    ctx.fill();
    ctx.stroke();

    // Breath Fraction
    ctx.beginPath();
    ctx.arc(donut.center.x, donut.center.y, breathRadius, 0, circleRadians);
    ctx.fillStyle = donut.color.breath;
    ctx.fill();

    // Inner Circle - Fill
    ctx.beginPath();
    ctx.arc(donut.center.x, donut.center.y, donut.radius.innerLine, 0, circleRadians);
    ctx.fillStyle = donut.color.hole;
    ctx.fill();

    // Hold Fraction
    ctx.beginPath();
    ctx.moveTo(donut.center.x, donut.center.y - donut.radius.innerLine);
    ctx.lineTo(donut.center.x, donut.center.y);
    ctx.arc(donut.center.x, donut.center.y, donut.radius.innerLine, topRadians, holdRadians);
    ctx.lineTo(donut.center.x, donut.center.y);
    ctx.fillStyle = donut.color.hold;
    ctx.fill();
    ctx.lineWidth = donut.thinLineWidth;
    ctx.stroke();

    // Inner Circle - Line
    ctx.beginPath();
    ctx.arc(donut.center.x, donut.center.y, donut.radius.innerLine, 0, circleRadians);
    ctx.lineWidth = donut.thickLineWidth;
    ctx.stroke();

    if (targetDuration - timeElapsed <= 0) {
        startTime = undefined;
        phase = getNextPhase();
    }
    window.requestAnimationFrame(draw);
}