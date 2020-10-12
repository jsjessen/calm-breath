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
        lineWidth: 1 / Math.pow(2, 7),
    },
    color: {
        filling: 'cornflowerblue',
        empty: '#10101',
        hole: 'black',
        line: 'white',
    },
    center: {},
    radius: {}
};

const millisecondsPerSecond = 1000;
const circleArcRadians = 2 * Math.PI;

const input = {
    inhaleTime: 4,
    fullHoldTime: 1,
    exhaleTime: 2,
    emptyHoldTime: 1
}

const target = {
    inhaleTime: 4000,
    fullHoldTime: 3000,
    exhaleTime: 8000,
    emptyHoldTime: 1000
};

function onLoad() {
    setCanvasSize();
    window.requestAnimationFrame(draw);
}

let inhaleStartTime;
let exhaleStartTime;
let inhaleEndTime;
let exhaleEndTime;

let inhaleDuration;
let exhaleDuration;
let fullHoldDuration;
let emptyHoldDuration;

function onKeyDown(event) {
    if (!inhaleStartTime && inhaleKeys.includes(event.key)) {
        // Inhale Start
        inhaleEndTime = 0;
        inhaleStartTime = Date.now();
        emptyHoldDuration = inhaleStartTime - exhaleEndTime;
        console.log('Empty Hold: ' + emptyHoldDuration);
        console.log('Breathing In');
    } else if (!exhaleStartTime && exhaleKeys.includes(event.key)) {
        // Exhale Start
        exhaleEndTime = 0;
        exhaleStartTime = Date.now();
        fullHoldDuration = exhaleStartTime - inhaleEndTime;
        console.log('Full Hold: ' + fullHoldDuration);
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

    ctx.scale(scale, scale); // Normalize coordinate system to use css pixels.
    ctx.strokeStyle = donut.color.line;
    ctx.lineWidth = lineWidth;

    donut.center.x = canvas.width / 2;
    donut.center.y = canvas.height / 2;

    donut.radius.max = (size - padding) / 2 - lineWidth;
    donut.radius.min = donut.radius.max * donut.ratio.hole;
    donut.radius.range = donut.radius.max - donut.radius.min;

    donut.radius.outerLine = donut.radius.max + (lineWidth / 2);
    donut.radius.innerLine = donut.radius.min - (lineWidth / 2);
}

let startTime;
let isInhaling = true;

function draw(timeNow) {
    if (!startTime) startTime = timeNow;
    const timeElapsed = timeNow - startTime;
    const targetDuration = isInhaling ? target.inhaleTime : target.exhaleTime;
    const remainingTime = targetDuration - timeElapsed;

    const offset = donut.radius.range * Math.min(timeElapsed / targetDuration, 1);
    const radius = isInhaling ? (donut.radius.min + offset) : (donut.radius.max - offset);

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Outer
    ctx.beginPath();
    ctx.arc(donut.center.x, donut.center.y, donut.radius.outerLine, 0, circleArcRadians);
    ctx.fillStyle = donut.color.empty;
    ctx.fill();
    ctx.stroke();

    // Filling
    ctx.beginPath();
    ctx.arc(donut.center.x, donut.center.y, radius, 0, circleArcRadians);
    ctx.fillStyle = donut.color.filling;
    ctx.fill();

    // Inner
    ctx.beginPath();
    ctx.arc(donut.center.x, donut.center.y, donut.radius.innerLine, 0, circleArcRadians);
    ctx.fillStyle = donut.color.hole;
    ctx.fill();
    ctx.stroke();

    if (remainingTime > 0) {
        window.requestAnimationFrame(draw);
    } else {
        const holdTime = isInhaling ? target.fullHoldTime : target.emptyHoldTime;
        //! Fails to update drawing during resize.
        setTimeout(function () {
            window.requestAnimationFrame(draw);
        }, holdTime);
        isInhaling = !isInhaling;
        startTime = undefined;
    }
}