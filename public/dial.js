/**
 * Project dial.
 *
 * Position is tracked as a float in steps, not an index, so a drag can sit
 * between two bars and the wheel follows the pointer continuously. The wheel
 * turns to put that position level at the crown; releasing a drag snaps to
 * the nearest bar.
 *
 * Only --turn (on the wheel) and --dist (per bar) are published to CSS; the
 * geometry lives in styles.css so it can be retuned independently. Position
 * is also broadcast as a 'railmove' event on the wheel.
 */

const WHEEL_THRESHOLD = 24;
const WHEEL_COOLDOWN = 320;
const DRAG_SLOP = 6;        // px of travel before a press counts as a drag

const dial = document.querySelector('.dial');
const wheel = document.querySelector('#track');
const ring = dial.querySelector('.dial__ring');
const label = document.querySelector('#focus-label');
const spokes = [...wheel.querySelectorAll('.spoke')];
const heroes = [...document.querySelectorAll('.hero')];

// Open on the middle bar, or the left of the middle pair when the count is
// even, so the dial never starts parked between two bars.
let position = Math.floor((spokes.length - 1) / 2);
let wheelLockedUntil = 0;

const clamp = (n) => Math.max(0, Math.min(spokes.length - 1, n));
const step = () => parseFloat(getComputedStyle(dial).getPropertyValue('--step'));

/** Pixels of horizontal drag per step: the arc length between bars at the rim. */
function stride() {
    const radius = ring.offsetWidth / 2;
    return radius * step() * Math.PI / 180;
}

function render() {
    wheel.style.setProperty('--turn', `${-position * step()}deg`);

    const nearest = Math.round(position);
    spokes.forEach((spoke, index) => {
        spoke.style.setProperty('--dist', Math.abs(index - position).toFixed(3));
        spoke.toggleAttribute('data-focused', index === nearest);

        // Only the selected bar is a tab stop, so Tab moves past the dial
        // instead of through every project.
        spoke.querySelector('.spoke__bar').tabIndex = index === nearest ? 0 : -1;
    });

    heroes.forEach((hero, index) => {
        hero.toggleAttribute('data-active', index === nearest);
        hero.inert = index !== nearest;
    });

    label.textContent = spokes[nearest].dataset.title;

    // For anything else that follows the dial, such as the backdrop.
    wheel.dispatchEvent(new CustomEvent('railmove', { detail: { position } }));
}

function goTo(index) {
    position = clamp(index);
    render();
}

/* ---- Drag -------------------------------------------------------------- */

let drag = null;

dial.addEventListener('pointerdown', (event) => {
    drag = { id: event.pointerId, x: event.clientX, from: position, moved: false };
});

dial.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;

    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > DRAG_SLOP) {
        drag.moved = true;
        dial.classList.add('is-dragging');
        // Captured only once it's a drag: capture retargets the click to the
        // dial, so capturing on press would stop taps reaching the bars.
        dial.setPointerCapture(event.pointerId);
    }
    if (!drag.moved) return;

    position = clamp(drag.from - dx / stride());
    render();
});

function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;

    dial.classList.remove('is-dragging');
    if (drag.moved) goTo(Math.round(position));
    // Let the click handler know this press was a drag, not a selection.
    dial.dataset.dragged = drag.moved ? 'true' : '';
    drag = null;
}

dial.addEventListener('pointerup', endDrag);
dial.addEventListener('pointercancel', endDrag);

/* ---- Click, keyboard, wheel -------------------------------------------- */

spokes.forEach((spoke, index) => {
    spoke.querySelector('.spoke__bar').addEventListener('click', () => {
        if (dial.dataset.dragged) return;       // released from a drag, not a tap

        // A side bar turns to the crown; the crowned bar opens its overview.
        if (index !== Math.round(position)) goTo(index);
        else document.getElementById(spoke.dataset.overview)?.showModal();
    });
});

wheel.addEventListener('keydown', (event) => {
    const delta = { ArrowLeft: -1, ArrowRight: 1, Home: -spokes.length, End: spokes.length }[event.key];
    if (delta === undefined) return;

    event.preventDefault();
    goTo(Math.round(position) + delta);
    spokes[Math.round(position)].querySelector('.spoke__bar').focus();
});

// Scrolling either way turns the dial. Throttled so one trackpad flick
// advances a single bar rather than spinning to the end.
dial.addEventListener('wheel', (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < WHEEL_THRESHOLD || event.timeStamp < wheelLockedUntil) return;

    wheelLockedUntil = event.timeStamp + WHEEL_COOLDOWN;
    goTo(Math.round(position) + Math.sign(delta));
}, { passive: true });

// Stride is measured from layout, so a resize that changes the radius needs
// the dial re-rendered.
addEventListener('resize', render);

render();
