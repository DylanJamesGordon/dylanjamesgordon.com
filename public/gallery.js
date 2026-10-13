/**
 * Arc gallery.
 *
 * The arc itself is fixed: each card sits at a permanent --offset from the
 * centre of the fan, so the composition stays symmetric. Focusing a card lifts
 * it out of the arc rather than sliding the whole group, which keeps small sets
 * (two or three projects) from looking lopsided.
 *
 * Only --offset and --dist are published to CSS; the transform math lives in
 * styles.css so the arc can be retuned without touching this file.
 */

const WHEEL_THRESHOLD = 24;
const WHEEL_COOLDOWN = 320;

const gallery = document.querySelector('#gallery');
const label = document.querySelector('#focus-label');
const cards = [...gallery.querySelectorAll('.card')];

let focused = Math.floor(cards.length / 2);
let wheelLockedUntil = 0;

/** Clamps to the ends rather than wrapping; with few projects, wrapping disorients. */
function focus(index) {
    focused = Math.max(0, Math.min(cards.length - 1, index));
    render();
}

const arcCenter = (cards.length - 1) / 2;

function render() {
    cards.forEach((card, index) => {
        const offset = index - arcCenter;

        card.style.setProperty('--offset', offset);
        card.style.setProperty('--dist', Math.abs(offset));
        card.toggleAttribute('data-focused', index === focused);

        // Only the focused card is a tab stop, so Tab moves past the gallery
        // instead of through every project.
        card.querySelector('.card__face').tabIndex = index === focused ? 0 : -1;
    });

    label.textContent = cards[focused].dataset.title;
}

cards.forEach((card, index) => {
    card.querySelector('.card__face').addEventListener('click', () => focus(index));
});

gallery.addEventListener('keydown', (event) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, Home: -cards.length, End: cards.length }[event.key];
    if (step === undefined) return;

    event.preventDefault();
    focus(focused + step);
    cards[focused].querySelector('.card__face').focus();
});

// Vertical wheel reads as horizontal travel here. Throttled so one trackpad
// flick advances a single card rather than skidding to the end.
gallery.addEventListener('wheel', (event) => {
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < WHEEL_THRESHOLD || event.timeStamp < wheelLockedUntil) return;

    wheelLockedUntil = event.timeStamp + WHEEL_COOLDOWN;
    focus(focused + Math.sign(delta));
}, { passive: true });

render();
