/**
 * Project backdrops.
 *
 * One layer per card, stacked in the backdrop and crossfaded so the focused
 * project's art fills the page. A card's data-backdrop image is fetched only
 * once that card is within one step of centre, so the landing page loads a
 * single image. Cards without one get a tint of their card art instead.
 */

const track = document.querySelector('#track');
const backdrop = document.querySelector('.backdrop');
const scrim = backdrop.querySelector('.backdrop__scrim');
const cards = [...track.querySelectorAll('.card')];

const layers = cards.map((card) => {
    const layer = document.createElement('div');
    layer.className = 'backdrop__layer';
    if (!card.dataset.backdrop) layer.dataset.art = card.querySelector('.card__art').dataset.art;
    backdrop.insertBefore(layer, scrim);
    return layer;
});

track.addEventListener('railmove', ({ detail: { position } }) => {
    const nearest = Math.round(position);

    layers.forEach((layer, index) => {
        const src = cards[index].dataset.backdrop;
        if (src && !layer.style.backgroundImage && Math.abs(index - position) <= 1) {
            layer.style.backgroundImage = `url("${src}")`;
        }
        layer.toggleAttribute('data-active', index === nearest);
    });
});
