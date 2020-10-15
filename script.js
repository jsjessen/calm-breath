const container = document.getElementById('canvasContainer');
const canvas = document.getElementById('circleCanvas');
const ctx = canvas.getContext('2d');

container.addEventListener('click', scrollToCanvas);

function scrollToCanvas() {
    canvas.scrollIntoView();
}

const instructions = document.getElementById('instructions');

const breathButton = document.getElementById('breathButton');
breathButton.addEventListener('mousedown', onButtonPress);
breathButton.addEventListener('mouseup', onButtonRelease);
breathButton.addEventListener('touchstart', onButtonPress);
breathButton.addEventListener('touchend', onButtonRelease);
breathButton.addEventListener('touchcancel', onButtonRelease);

const sliderInputs = {
    inhaleDurationSlider: document.getElementById('inhaleDurationSlider'),
    holdInhaleDurationSlider: document.getElementById('holdInhaleDurationSlider'),
    exhaleDurationSlider: document.getElementById('exhaleDurationSlider'),
    holdExhaleDurationSlider: document.getElementById('holdExhaleDurationSlider'),
    transitionSpeedSlider: document.getElementById('transitionSpeedSlider')
};
const numberInputs = {
    inhaleDurationNumber: document.getElementById('inhaleDurationNumber'),
    holdInhaleDurationNumber: document.getElementById('holdInhaleDurationNumber'),
    exhaleDurationNumber: document.getElementById('exhaleDurationNumber'),
    holdExhaleDurationNumber: document.getElementById('holdExhaleDurationNumber'),
    transitionSpeedNumber: document.getElementById('transitionSpeedNumber')
};
const settingsContainer = document.getElementById('settings');
settingsContainer.addEventListener('input', onSettingInput);

window.addEventListener('load', onLoad);
window.addEventListener('resize', setCanvasSize);

const inhaleKeys = ['i', 'ArrowDown'];
const exhaleKeys = ['o', 'ArrowUp'];

const donut = {
    ratio: {
        hole: 1 / 3.5, // https://www.dailymail.co.uk/sciencetech/article-2868435/The-science-DONUTS-Mathematical-formulae-reveal-make-perfect-sugar-dusted-treat-time.html
        padding: 1 / Math.pow(2, 4),
        lineWidth: 1 / Math.pow(2, 6),
    },
    color: {
        breath: 'cornflowerblue', // Fight Club
        empty: '#202020', // 2020
        hold: 'dodgerblue', // lighter
        hole: 'midnightblue', // darker
        line: 'white' // contrasts background color
    },
    center: {},
    radius: {}
};

const millisecondsPerSecond = 1000;
const circleRadians = 2 * Math.PI;
const topRadians = 1.5 * Math.PI;

const target = {
    inhaleDuration: parseFloat(inhaleDurationNumber.value) * millisecondsPerSecond,
    holdInhaleDuration: parseFloat(holdInhaleDurationNumber.value) * millisecondsPerSecond,
    exhaleDuration: parseFloat(exhaleDurationNumber.value) * millisecondsPerSecond,
    holdExhaleDuration: parseFloat(holdExhaleDurationNumber.value) * millisecondsPerSecond,
    transitionSpeed: parseFloat(transitionSpeedNumber.value) * millisecondsPerSecond
};

const current = {};

const phaseNames = {
    inhale: 'inhale',
    holdInhale: 'holdInhale',
    exhale: 'exhale',
    holdExhale: 'holdExhale'
};

function* phaseGenerator() {
    while (true) {
        yield phaseNames.inhale;
        yield phaseNames.holdInhale;
        yield phaseNames.exhale;
        yield phaseNames.holdExhale;
        if (!isTargetReached) updateTimings();
    }
}
const phase = {
    next: function () {
        this.name = this.generator.next().value;
        this.startTime = undefined;
    }
};

let isTargetReached = false;

function updateTimings() {
    let diffs = {};
    let totalDeviation = 0;
    for (const key of Object.keys(current)) {
        const diff = target[key] - current[key];
        diffs[key] = diff;
        totalDeviation += Math.abs(diff);
    }

    if (totalDeviation === 0) {
        console.log('Reached target breathing pattern.');
        isTargetReached = true;
        return;
    }

    for (const key of Object.keys(current)) {
        const diff = diffs[key];
        const absDiff = Math.abs(diff);
        const maxChange = (absDiff / totalDeviation) * target.transitionSpeed;
        current[key] += Math.sign(diff) * Math.min(absDiff, maxChange);
    }
    console.log(current);
}

function onLoad() {
    loadSettings();
    setCanvasSize();
    phase.generator = phaseGenerator();
    phase.next();
    window.requestAnimationFrame(draw);
}

function start() {
    phase.generator = phaseGenerator();
    phase.next();
    phase.next();
    window.requestAnimationFrame(draw);
}

function onSettingInput(event) {
    const input = event.target;
    if(!input.checkValidity()) return;

    switch (input.type) {
        case 'range':
            input.previousElementSibling.value = input.value;
            break;
        case 'number':
            input.nextElementSibling.value = input.value;
            break;
        default:
            break;
    }
    target[input.className] = parseFloat(input.value) * millisecondsPerSecond;
    localStorage.setItem(input.className, input.value);
    isTargetReached = false;
}

function loadSettings() {
    for (const input of Object.values(numberInputs)) {
        const savedValue = localStorage.getItem(input.className);
        if (savedValue) input.value = savedValue;
        target[input.className] = parseFloat(input.value) * millisecondsPerSecond;
    }
    for (const input of Object.values(sliderInputs)) {
        const savedValue = localStorage.getItem(input.className);
        if (savedValue) input.value = savedValue;
    }
}

let inhaleStartTime;
let exhaleStartTime;
let inhaleEndTime;
let exhaleEndTime;

let inhaleDuration;
let exhaleDuration;
let holdInhaleDuration;
let holdExhaleDuration;

let isInhaling = true;
let isInputting = false;

function onButtonPress() {
    isInputting = true;
    isTargetReached = false;

    if (isInhaling) {
        breathButton.textContent = 'Inhaling';
        inhaleStartTime = Date.now();
        inhaleEndTime = undefined;
        current.holdExhaleDuration = inhaleStartTime - exhaleEndTime;
        if (current.holdExhaleDuration) {
            console.log('Hold Exhale Duration: ' + current.holdExhaleDuration + ' ms');
        }
    } else {
        breathButton.textContent = 'Exhaling';
        exhaleStartTime = Date.now();
        exhaleEndTime = undefined;
        current.holdInhaleDuration = exhaleStartTime - inhaleEndTime;
        console.log('Hold Inhale Duration: ' + current.holdInhaleDuration + ' ms');
    }
}

function onButtonRelease() {
    if (isInhaling) {
        breathButton.textContent = 'Holding Full';
        inhaleEndTime = Date.now();
        current.inhaleDuration = inhaleEndTime - inhaleStartTime;
        inhaleStartTime = undefined;
        console.log('Inhale Duration: ' + current.inhaleDuration + ' ms');
        isInhaling = false;
    } else {
        breathButton.textContent = 'Holding Empty';
        exhaleEndTime = Date.now();
        current.exhaleDuration = exhaleEndTime - exhaleStartTime;
        exhaleStartTime = undefined;
        console.log('Exhale duration: ' + current.exhaleDuration + ' ms');
        isInhaling = true;
    }

    if (current.inhaleDuration && current.holdInhaleDuration && current.exhaleDuration && current.holdExhaleDuration) {
        inhaleStartTime = undefined;
        exhaleStartTime = undefined;
        inhaleEndTime = undefined;
        exhaleEndTime = undefined;
        breathButton.textContent = 'Press Me';
        isInhaling = true;
        isInputting = false;
        scrollToCanvas();
        start();
    }
}

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

function draw(timeNow) {
    if (isInputting) return;
    if (!phase.startTime) phase.startTime = timeNow;
    const timeElapsed = timeNow - phase.startTime;

    switch (phase.name) {
        case phaseNames.inhale:
            var targetDuration = current.inhaleDuration || target.inhaleDuration;
            var breathFraction = Math.min(timeElapsed / targetDuration, 1);
            var holdFraction = 0;
            break;
        case phaseNames.holdInhale:
            var targetDuration = current.holdInhaleDuration || target.holdExhaleDuration;
            var holdFraction = Math.min(timeElapsed / targetDuration, 1);
            var breathFraction = 1;
            break;
        case phaseNames.exhale:
            var targetDuration = current.exhaleDuration || target.exhaleDuration;
            var breathFraction = 1 - Math.min(timeElapsed / targetDuration, 1);
            var holdFraction = 1;
            break;
        case phaseNames.holdExhale:
            var targetDuration = current.holdExhaleDuration || target.holdExhaleDuration;
            var holdFraction = 1 - Math.min(timeElapsed / targetDuration, 1);
            var breathFraction = 0;
            break;
        default:
            throw 'Alien breathing phase.'
    }

    const timeRemaining = targetDuration - timeElapsed;
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

    if (timeRemaining <= 0) phase.next();
    window.requestAnimationFrame(draw);
}