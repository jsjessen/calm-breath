//! Created by James Jessen

console.log('v1.54');

window.addEventListener('load', onLoad);
window.addEventListener('resize', setCanvasSize);
window.addEventListener('orientationchange', setCanvasSize);

const container = document.getElementById('canvasContainer');
const canvas = document.getElementById('circleCanvas');
const ctx = canvas.getContext('2d');
container.addEventListener('click', scrollToCanvas);

const panicButton = document.getElementById('panicButton');
panicButton.addEventListener('click', onPanicButtonPress);

const breathButton = document.getElementById('breathButton');
breathButton.addEventListener('mousedown', onButtonPress);
breathButton.addEventListener('touchstart', onButtonPress);
document.addEventListener('mouseup', onButtonRelease);
document.addEventListener('touchend', onButtonRelease);
document.addEventListener('touchcancel', onButtonRelease);

const numberInputs = {
    transitionSpeed: document.getElementById('transitionSpeedNumber'),
    holdDuration: document.getElementById('holdDurationNumber'),

    targetInhaleDuration: document.getElementById('targetInhaleDurationNumber'),
    targetHoldInhaleDuration: document.getElementById('targetHoldInhaleDurationNumber'),
    targetExhaleDuration: document.getElementById('targetExhaleDurationNumber'),
    targetHoldExhaleDuration: document.getElementById('targetHoldExhaleDurationNumber'),

    panicInhaleDuration: document.getElementById('panicInhaleDurationNumber'),
    panicHoldInhaleDuration: document.getElementById('panicHoldInhaleDurationNumber'),
    panicExhaleDuration: document.getElementById('panicExhaleDurationNumber'),
    panicHoldExhaleDuration: document.getElementById('panicHoldExhaleDurationNumber')
};
const sliderInputs = {
    transitionSpeed: document.getElementById('transitionSpeedSlider'),
    holdDuration: document.getElementById('holdDurationSlider'),

    targetInhaleDuration: document.getElementById('targetInhaleDurationSlider'),
    targetHoldInhaleDuration: document.getElementById('targetHoldInhaleDurationSlider'),
    targetExhaleDuration: document.getElementById('targetExhaleDurationSlider'),
    targetHoldExhaleDuration: document.getElementById('targetHoldExhaleDurationSlider'),

    panicInhaleDuration: document.getElementById('panicInhaleDurationSlider'),
    panicHoldInhaleDuration: document.getElementById('panicHoldInhaleDurationSlider'),
    panicExhaleDuration: document.getElementById('panicExhaleDurationSlider'),
    panicHoldExhaleDuration: document.getElementById('panicHoldExhaleDurationSlider')
};
const settingsContainer = document.getElementById('settings');
settingsContainer.addEventListener('input', onSettingInput);

const donut = {
    ratio: {
        hole: 1 / 3.5, // https://www.dailymail.co.uk/sciencetech/article-2868435/The-science-DONUTS-Mathematical-formulae-reveal-make-perfect-sugar-dusted-treat-time.html
        font: 1 / Math.pow(2, 4),
        padding: 1 / Math.pow(2, 4),
        lineWidth: 1 / Math.pow(2, 6),
    },
    color: {
        breath: 'cornflowerblue', // Fight Club
        empty: '#202020', // 2020
        hold: 'dodgerblue', // lighter
        hole: 'midnightblue', // darker
        line: 'white', // contrasts background color
        text: 'rgba(255, 255, 255, 0.8)'
    },
    center: {},
    radius: {},
    text: {}
};

const millisecondsPerSecond = 1000;
const circleRadians = 2 * Math.PI;
const topRadians = 1.5 * Math.PI;

let transitionSpeed;
let assumedHoldDuration;
const panicPattern = {};
const targetPattern = {};
const currentPattern = {};

const states = {
    inhale: 'inhale',
    holdInhale: 'holdInhale',
    exhale: 'exhale',
    holdExhale: 'holdExhale'
};

function* stateGenerator() {
    while (true) {
        yield states.inhale;
        yield states.holdInhale;
        yield states.exhale;
        yield states.holdExhale;
        if (!isTargetReached) updateTimings();
    }
}
const state = {
    next: function () {
        this.name = this.generator.next().value;
        this.startTime = undefined;
    }
};

function logPattern(pattern, name = '') {
    let str = name + ' Pattern\n';
    str += '-'.repeat(str.length - 1) + '\n';
    str += 'Inhale Duration: \t' + pattern.inhaleDuration + ' ms\n';
    str += 'Hold Inhale Duration: \t' + pattern.holdInhaleDuration + ' ms\n';
    str += 'Exhale Duration: \t' + pattern.exhaleDuration + ' ms\n';
    str += 'Hold Exhale Duration: \t' + pattern.holdExhaleDuration + ' ms';
    console.log(str);
}

let isTargetReached = false;

function scrollToCanvas() {
    setCanvasSize();
    container.scrollIntoView();
}

function copyObjectProperties(from, to) {
    Object.entries(from).forEach(([key, value]) => to[key] = value);
}

function setCurrentToTarget() {
    copyObjectProperties(targetPattern, currentPattern);
    isTargetReached = true;
    logPattern(currentPattern, 'Current');
}

function setCurrentToPanic() {
    copyObjectProperties(panicPattern, currentPattern);
    isTargetReached = false;
    logPattern(currentPattern, 'Current');
}

function updateTimings() {
    let diffs = {};
    let totalDeviation = 0;
    for (const key of Object.keys(currentPattern)) {
        const diff = targetPattern[key] - currentPattern[key];
        diffs[key] = diff;
        totalDeviation += Math.abs(diff);
    }

    if (totalDeviation === 0) {
        console.log('Reached target breathing pattern.');
        isTargetReached = true;
        return;
    }

    for (const key of Object.keys(currentPattern)) {
        const diff = diffs[key];
        const absDiff = Math.abs(diff);
        const maxChange = (absDiff / totalDeviation) * transitionSpeed;
        currentPattern[key] += Math.sign(diff) * Math.min(absDiff, maxChange);
    }
    logPattern(currentPattern, 'Current');
}

function onLoad() {
    loadSettings();
    setCanvasSize();
    setCurrentToTarget();

    state.generator = stateGenerator();
    state.next();
    window.requestAnimationFrame(draw);
}

function start() {
    state.generator = stateGenerator();
    state.next();
    state.next();
    window.requestAnimationFrame(draw);
}

function readSetting(input) {
    const name = input.className;
    const duration = parseFloat(input.value) * millisecondsPerSecond;
    if (name.startsWith('target')) {
        targetPattern[input.dataset.state] = duration;
        isTargetReached = false;
    } else if (name.startsWith('panic')) {
        panicPattern[input.dataset.state] = duration;
    } else if (name === 'transitionSpeed') {
        transitionSpeed = duration;
    } else if (name === 'holdDuration') {
        assumedHoldDuration = duration;
    }
}

function onSettingInput(event) {
    const input = event.target;
    if (!input.checkValidity()) return;

    switch (input.type) {
        case 'range':
            input.previousElementSibling.value = input.value;
            break;
        case 'number':
            input.nextElementSibling.value = input.value;
            break;
        default:
            throw 'Unexpected input type.';
    }
    readSetting(input);
    localStorage.setItem(input.className, input.value);
    console.log(input.className + ' => ' + input.value);
}

function loadSettings() {
    for (const input of Object.values(numberInputs)) {
        const savedValue = localStorage.getItem(input.className);
        if (savedValue) input.value = savedValue;
        readSetting(input);
    }
    for (const input of Object.values(sliderInputs)) {
        const savedValue = localStorage.getItem(input.className);
        if (savedValue) input.value = savedValue;
    }
    logPattern(targetPattern, 'Target');
    logPattern(panicPattern, 'Panic');
}

function onPanicButtonPress(event) {
    event.preventDefault();
    setCurrentToPanic();
    scrollToCanvas();
}

let inhaleStartTime;
let inhaleEndTime;
let nonInhaleStartTime;
let nonInhaleEndTime;

let isInputting = false;
const breathButtonText = breathButton.textContent;

function onButtonPress(event) {
    event.preventDefault();
    const now = Date.now();

    breathButton.style.color = 'black';
    breathButton.style.backgroundColor = 'white';
    breathButton.textContent = 'Inhaling';

    if (!isInputting) {
        isInputting = true;
        isTargetReached = false;
        inhaleStartTime = undefined;
    } else {
        inhaleStartTime = now;
        nonInhaleEndTime = now;
    }
}

function onButtonRelease(event) {
    if (!isInputting) return;
    event.preventDefault();
    const now = Date.now();

    breathButton.style.color = 'white';
    breathButton.style.backgroundColor = 'black';

    if (!inhaleStartTime) {
        breathButton.textContent = 'Exhaling';
        nonInhaleStartTime = now;
    } else {
        breathButton.textContent = breathButtonText;
        inhaleEndTime = now;
        isInputting = false;
        setCurrentFromInput();
        scrollToCanvas();
        start();
    }
}

function setCurrentFromInput() {
    const nonInhaleDuration = nonInhaleEndTime - nonInhaleStartTime;
    const totalHoldDuration = 2 * assumedHoldDuration;

    currentPattern.inhaleDuration = Math.max(inhaleEndTime - inhaleStartTime, 100);
    currentPattern.holdInhaleDuration = assumedHoldDuration;
    currentPattern.exhaleDuration = Math.max(nonInhaleDuration - totalHoldDuration, 100);
    currentPattern.holdExhaleDuration = assumedHoldDuration;

    logPattern(currentPattern, 'Current');
}

let savedWidth;
let savedHeight;

function setCanvasSize(flag) {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;

    if (!flag) {
        if (width === savedWidth && height === savedHeight){
            return;
        }
    } else {
        if (width === savedWidth && Math.abs(height - savedHeight) < 50) {
            return;
        }
    }

    // if (isFullscreenMode) {
    //     var height = window.innerHeight;
    // } else {
    //     var height = document.documentElement.clientHeight;
    // }

    // console.log(window.innerHeight - document.documentElement.clientHeight);


    savedWidth = width;
    savedHeight = height;

    // Set display size (css pixels).
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Set actual size in memory (scaled to account for extra pixel density).
    var scale = window.devicePixelRatio; // If default of 1, will be blurry on high resolution screens
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    // Normalize coordinate system to use css pixels.
    ctx.scale(scale, scale);

    const radius = Math.min(width, height);
    const fontSize = radius * donut.ratio.font;
    const padding = radius * donut.ratio.padding;
    const lineWidth = radius * donut.ratio.lineWidth;
    const halfLineWidth = lineWidth / 2;

    ctx.strokeStyle = donut.color.line;
    ctx.lineCap = 'round';
    ctx.textAlign = 'center';
    ctx.font = fontSize + 'px Arial';

    donut.center.x = width / 2;
    donut.center.y = height / 2;

    donut.thickLineWidth = lineWidth;
    donut.thinLineWidth = halfLineWidth;

    donut.radius.max = (radius - padding - lineWidth) / 2;
    donut.radius.min = donut.radius.max * donut.ratio.hole;
    donut.radius.range = donut.radius.max - donut.radius.min;
    const midRadius = (donut.radius.min + donut.radius.max) / 2;

    donut.text.x = donut.center.x;
    donut.text.y = donut.center.y + midRadius;

    donut.radius.outerLine = donut.radius.max + halfLineWidth;
    donut.radius.innerLine = donut.radius.min - halfLineWidth;
}

function draw(timeNow) {
    if (isInputting) return;
    if (!state.startTime) state.startTime = timeNow;
    const timeElapsed = timeNow - state.startTime;

    switch (state.name) {
        case states.inhale:
            var text = 'In';
            var targetDuration = currentPattern.inhaleDuration;
            var breathFraction = Math.min(timeElapsed / targetDuration, 1);
            var holdFraction = 0;
            break;
        case states.holdInhale:
            var text = 'Hold';
            var targetDuration = currentPattern.holdInhaleDuration;
            var holdFraction = Math.min(timeElapsed / targetDuration, 1);
            var breathFraction = 1;
            break;
        case states.exhale:
            var text = 'Out';
            var targetDuration = currentPattern.exhaleDuration;
            var breathFraction = 1 - Math.min(timeElapsed / targetDuration, 1);
            var holdFraction = 1;
            break;
        case states.holdExhale:
            var text = 'Hold';
            var targetDuration = currentPattern.holdExhaleDuration;
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

    // Text
    if (!isTargetReached) {
        ctx.fillStyle = donut.color.text;
        ctx.fillText(text, donut.text.x, donut.text.y);
    }

    if (timeRemaining <= 0) state.next();
    window.requestAnimationFrame(draw);
}