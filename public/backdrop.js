/**
 * Project backdrops.
 *
 * One layer per project, stacked in the backdrop and crossfaded so the selected
 * project's art fills the page. A project's data-backdrop image is fetched
 * only once its bar is within one step of the crown, so the landing page loads
 * a single image. Projects without one get a tint of their palette instead.
 */

const wheel = document.querySelector('#dial-wheel');
const backdrop = document.querySelector('.backdrop');
const scrim = backdrop.querySelector('.backdrop__scrim');
const projects = [...wheel.querySelectorAll('.spoke')];

const layers = projects.map((project) => {
    const layer = document.createElement('div');
    layer.className = 'backdrop__layer';
    if (!project.dataset.backdrop) layer.dataset.art = project.dataset.art;
    backdrop.insertBefore(layer, scrim);
    return layer;
});

wheel.addEventListener('dialturn', ({ detail: { position } }) => {
    const nearest = Math.round(position);

    layers.forEach((layer, index) => {
        const src = projects[index].dataset.backdrop;
        if (src && !layer.style.backgroundImage && Math.abs(index - position) <= 1) {
            layer.style.backgroundImage = `url("${src}")`;
        }
        layer.toggleAttribute('data-active', index === nearest);
    });
});
