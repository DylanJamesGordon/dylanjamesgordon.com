/**
 * Murloc March.
 *
 * ASCII murlocs run left to right along a ground line while their project is
 * selected on the dial. Each step swaps the arms, (@) to )@(, and hops a
 * little. The loop only runs while the scene is showing; with reduced motion
 * the scene draws once and holds still.
 */

const FRAMES = ['(@)', ')@('];
const FONT_PX = 18;
const MAX_MURLOCS = 28;
const HOP_PX = 5;

const wheel = document.querySelector('#dial-wheel');
const canvas = document.querySelector('.march');
const ctx = canvas.getContext('2d');
const still = matchMedia('(prefers-reduced-motion: reduce)');
const index = [...wheel.querySelectorAll('.spoke')].findIndex((spoke) => spoke.dataset.scene === 'march');

let murlocs = [];
let width = 0;
let height = 0;
let running = false;
let last = 0;
let nextSpawn = 0;

function resize() {
    const dpr = devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Resizing the canvas resets its context state.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `700 ${FONT_PX}px ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.shadowColor = 'rgb(6 16 20 / 60%)';
    ctx.shadowBlur = 6;
}

function spawn(x) {
    murlocs.push({
        x,
        speed: 60 + Math.random() * 90,         // px per second
        hue: Math.random() * 360,
        phase: Math.random() * Math.PI * 2,     // stride cycle; one step per half turn
    });
}

/** Scatter a full line across the ground, so the scene never opens empty. */
function populate() {
    murlocs = [];
    for (let x = 20; x < width && murlocs.length < MAX_MURLOCS; x += 40 + Math.random() * 80) spawn(x);
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    const ground = height - 1.5;
    ctx.fillStyle = 'rgb(238 243 246 / 26%)';
    ctx.fillRect(0, ground, width, 1);

    for (const murloc of murlocs) {
        const hop = Math.abs(Math.sin(murloc.phase)) * HOP_PX;
        ctx.fillStyle = `hsl(${murloc.hue} 75% 65%)`;
        ctx.fillText(FRAMES[Math.floor(murloc.phase / Math.PI) % 2], murloc.x, ground - 2 - hop);
    }
}

function tick(now) {
    if (!running) return;

    // Clamped so a backgrounded tab doesn't teleport everyone on return.
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    for (const murloc of murlocs) {
        murloc.x += murloc.speed * dt;
        murloc.phase += murloc.speed * dt / 6;  // faster runners step faster
    }
    murlocs = murlocs.filter((murloc) => murloc.x < width + 30);

    if (now >= nextSpawn && murlocs.length < MAX_MURLOCS) {
        spawn(-30);
        nextSpawn = now + 300 + Math.random() * 700;
    }

    draw();
    requestAnimationFrame(tick);
}

wheel.addEventListener('dialturn', ({ detail: { position } }) => {
    const active = Math.round(position) === index;
    canvas.toggleAttribute('data-active', active);

    if (!active) {
        running = false;
        return;
    }
    if (!murlocs.length) populate();

    if (still.matches) {
        draw();
    } else if (!running) {
        running = true;
        last = performance.now();
        requestAnimationFrame(tick);
    }
});

// Sized now as well, since the observer's first report lands after the dial's
// first render.
resize();
new ResizeObserver(() => {
    resize();
    if (!running) draw();
}).observe(canvas);
