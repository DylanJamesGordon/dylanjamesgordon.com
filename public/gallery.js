/**
 * Project carousel.
 *
 * Position is tracked as a float in card-widths, not an index, so a drag can
 * sit between two cards and the scaling follows the pointer continuously. The
 * track slides to put that position at the centre of the viewport; releasing a
 * drag snaps to the nearest card.
 *
 * Only --shift (on the track) and --dist (per card) are published to CSS; the
 * scaling curve lives in styles.css so it can be retuned independently.
 */

const WHEEL_THRESHOLD = 24;
const WHEEL_COOLDOWN = 320;
const DRAG_SLOP = 6;        // px of travel before a press counts as a drag

const track = document.querySelector('#track');
const label = document.querySelector('#focus-label');
const cards = [...track.querySelectorAll('.card')];
const centre = (cards.length - 1) / 2;

// Open on the middle card, or the left of the middle pair when the count is
// even, so the rail never starts parked between two cards.
let position = Math.floor(centre);
let wheelLockedUntil = 0;

const clamp = (n) => Math.max(0, Math.min(cards.length - 1, n));

/** Distance between card origins, measured from layout so it tracks the CSS. */
function stride() {
    if (cards.length < 2) return cards[0].offsetWidth;
    return cards[1].offsetLeft - cards[0].offsetLeft;
}

function render() {
    track.style.setProperty('--shift', `${(centre - position) * stride()}px`);

    const nearest = Math.round(position);
    cards.forEach((card, index) => {
        card.style.setProperty('--dist', Math.abs(index - position).toFixed(3));
        card.toggleAttribute('data-focused', index === nearest);

        // Only the selected card is a tab stop, so Tab moves past the carousel
        // instead of through every project.
        card.querySelector('.card__face').tabIndex = index === nearest ? 0 : -1;
    });

    label.textContent = cards[nearest].dataset.title;
}

function goTo(index) {
    position = clamp(index);
    render();
}

/* ---- Drag -------------------------------------------------------------- */

let drag = null;

track.addEventListener('pointerdown', (event) => {
    drag = { id: event.pointerId, x: event.clientX, from: position, moved: false };
});

track.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;

    const dx = event.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > DRAG_SLOP) {
        drag.moved = true;
        track.classList.add('is-dragging');
        // Captured only once it's a drag: capture retargets the click to the
        // track, so capturing on press would stop taps reaching the cards.
        track.setPointerCapture(event.pointerId);
    }
    if (!drag.moved) return;

    position = clamp(drag.from - dx / stride());
    render();
});

function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;

    track.classList.remove('is-dragging');
    if (drag.moved) goTo(Math.round(position));
    // Let the click handler know this press was a drag, not a selection.
    track.dataset.dragged = drag.moved ? 'true' : '';
    drag = null;
}

track.addEventListener('pointerup', endDrag);
track.addEventListener('pointercancel', endDrag);

/* ---- Click, keyboard, wheel -------------------------------------------- */

cards.forEach((card, index) => {
    card.querySelector('.card__face').addEventListener('click', () => {
        if (track.dataset.dragged) return;      // released from a drag, not a tap
        goTo(index);
    });
});

track.addEventListener('keydown', (event) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -cards.length, End: cards.length }[event.key];
    if (step === undefined) return;

    event.preventDefault();
    goTo(Math.round(position) + step);
    cards[Math.round(position)].querySelector('.card__face').focus();
});

// Vertical wheel reads as horizontal travel here. Throttled so one trackpad
// flick advances a single card rather than skidding to the end.
track.addEventListener('wheel', (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < WHEEL_THRESHOLD || event.timeStamp < wheelLockedUntil) return;

    wheelLockedUntil = event.timeStamp + WHEEL_COOLDOWN;
    goTo(Math.round(position) + Math.sign(delta));
}, { passive: true });

// Stride is measured from layout, so a resize that changes card width or gap
// needs the shift recomputed.
addEventListener('resize', render);

render();
